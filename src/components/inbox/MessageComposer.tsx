import { useState, useRef, KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, PauseCircle, Loader2 } from 'lucide-react';
import { sendMessageWebhook, pauseAIWebhook } from '@/lib/webhooks';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || !contactId || !user) return;

    setIsSending(true);

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

      // Insert message with queued status
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          organization_id: orgId,
          conversation_id: convId,
          contact_id: contactId,
          direction: 'outbound',
          body: text.trim(),
          status: 'queued'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call webhook (best-effort)
      const response = await sendMessageWebhook({
        organization_id: orgId,
        contact_id: contactId,
        conversation_id: convId,
        text: text.trim(),
        metadata: { channel: 'site' }
      });

      // Update status and MIG
      await supabase
        .from('messages')
        .update({
          status: response.status || 'sent',
          mig: response.mig || null
        })
        .eq('id', newMessage.id);

      setText('');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['latest-conversation', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts-with-preview'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar a mensagem'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePauseAI = async () => {
    if (!conversationId || !user) return;

    setIsPausing(true);

    try {
      // Get user's organization
      const { data: userOrg } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!userOrg) throw new Error('Organização não encontrada');

      // Calculate pause until (30 minutes from now)
      const pausedAt = new Date();
      const pausedUntil = new Date(pausedAt.getTime() + 30 * 60 * 1000);

      await pauseAIWebhook(conversationId, userOrg.organization_id);

      // Update conversation with pause timestamps
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

        <Button
          onClick={handleSend}
          disabled={!text.trim() || !contactId || isSending}
          className="btn-primary"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Enviar
        </Button>
      </div>
    </div>
  );
}
