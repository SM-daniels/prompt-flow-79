import { useState, useRef, KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, PauseCircle, Loader2, Paperclip, X } from 'lucide-react';
import { sendMessageWebhook, pauseAIWebhook } from '@/lib/webhooks';
import { validateMediaFile } from '@/lib/mediaValidation';
import { uploadMedia, type MediaItem } from '@/lib/mediaUpload';

type MessageComposerProps = {
  conversationId: string | null;
  contactId: string | null;
  conversation?: any;
};

export default function MessageComposer({ conversationId, contactId, conversation }: MessageComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Arquivo inválido',
          description: validation.error,
        });
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!text.trim() && selectedFiles.length === 0) || !contactId || !user) return;

    setIsSending(true);
    setIsUploading(selectedFiles.length > 0);

    try {
      // Try to get user's organization (may not exist in legacy data)
      const { data: userOrg } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fallback: read contact to extract organization_id
      let orgId = userOrg?.organization_id as string | undefined;
      if (!orgId && contactId) {
        const { data: contactRow } = await supabase
          .from('contacts')
          .select('organization_id, owner_id')
          .eq('id', contactId)
          .maybeSingle();
        orgId = contactRow?.organization_id || undefined;
      }

      if (!orgId) throw new Error('Organização não encontrada para este contato');

      // Ensure conversation exists
      let convId = conversationId as string | null;
      if (!convId && contactId) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            organization_id: orgId,
            contact_id: contactId,
            paused_ai: false
          })
          .select()
          .single();
        if (createError) throw createError;
        convId = newConv.id;
      }

      if (!convId) throw new Error('Não foi possível criar a conversa');

      // Fetch highest sequence_id for this conversation
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('sequence_id')
        .eq('conversation_id', convId)
        .order('sequence_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      // Calculate next sequence_id
      const nextSequenceId = (lastMessage?.sequence_id ?? 0) + 1;

      // Upload media files if any
      let mediaItems: MediaItem[] = [];
      if (selectedFiles.length > 0) {
        // Create temporary message ID for folder organization
        const tempMessageId = crypto.randomUUID();
        
        const uploadPromises = selectedFiles.map((file) =>
          uploadMedia(file, orgId, tempMessageId)
        );
        
        mediaItems = await Promise.all(uploadPromises);
      }

      // Insert message with queued status, sequence_id, and media
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          owner_id: user.id,
          organization_id: orgId,
          conversation_id: convId,
          contact_id: contactId,
          direction: 'outbound',
          body: text.trim() || null,
          media: mediaItems.length > 0 ? mediaItems : null,
          status: 'queued',
          sequence_id: nextSequenceId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call webhook with message_id only
      const response = await sendMessageWebhook({
        message_id: newMessage.id
      });

      // Update status and MIG
      await supabase
        .from('messages')
        .update({
          status: response.status || 'sent',
          mig: response.mig || null
        })
        .eq('id', newMessage.id);

      // Invalidate queries to show new message immediately
      queryClient.invalidateQueries({ queryKey: ['messages', `conv-${convId}`] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      setText('');
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar a mensagem'
      });
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handlePauseAI = async () => {
    if (!conversationId || !user) return;

    setIsPausing(true);

    try {
      // 1) Resolver organization_id rapidamente (primeiro via conversation)
      let orgId: string | undefined = conversation?.organization_id as string | undefined;

      if (!orgId) {
        const { data: userOrg } = await supabase
          .from('users_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();
        orgId = userOrg?.organization_id || orgId;
      }

      if (!orgId && contactId) {
        const { data: contactRow } = await supabase
          .from('contacts')
          .select('organization_id')
          .eq('id', contactId)
          .maybeSingle();
        orgId = contactRow?.organization_id || orgId;
      }

      if (!orgId) throw new Error('Organização não encontrada');

      // 2) PRIMEIRA AÇÃO: disparar o webhook para pausar a IA
      await pauseAIWebhook(conversationId, orgId);

      // 3) Após sucesso do webhook, calcular tempos e atualizar DB
      const pausedAt = new Date();
      const pausedUntil = new Date(pausedAt.getTime() + 30 * 60 * 1000);

      await supabase
        .from('conversations')
        .update({ 
          paused_ai: true,
          paused_at: pausedAt.toISOString(),
          paused_until: pausedUntil.toISOString()
        })
        .eq('id', conversationId);

      toast({
        title: 'IA pausada por 30 minutos',
        description: `A IA retornará automaticamente às ${pausedUntil.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['latest-conversation'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao pausar',
        description: error.message || 'Não foi possível pausar a IA'
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 space-y-3">
      <Textarea
        ref={textareaRef}
        placeholder="Digite sua mensagem..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[80px] max-h-[200px] resize-none bg-bg2 border-borderc text-textc focus:ring-primary"
        disabled={!contactId || isSending}
      />

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-bg3 border border-borderc rounded-lg"
            >
              <span className="text-sm text-textc truncate max-w-[200px]">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-textdim hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePauseAI}
            disabled={isPausing}
            className={
              conversation?.paused_ai
                ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
            }
          >
            {isPausing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PauseCircle className="w-4 h-4 mr-2" />
            )}
            {conversation?.paused_ai ? 'IA Pausada' : 'Pausar IA'}
          </Button>
          {conversation?.paused_ai && conversation?.paused_until && (
            <span className="text-xs text-muted-foreground">
              Retorna às {new Date(conversation.paused_until).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !contactId}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={(!text.trim() && selectedFiles.length === 0) || !contactId || isSending}
            className="btn-primary"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploading ? 'Enviando...' : 'Enviando...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
