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
};

export default function MessageComposer({ conversationId, contactId }: MessageComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim() || !conversationId || !contactId || !user) return;

    setIsSending(true);

    try {
      // Get user's organization
      const { data: userOrg } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!userOrg) throw new Error('Organização não encontrada');

      // Insert message with queued status
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          organization_id: userOrg.organization_id,
          conversation_id: conversationId,
          contact_id: contactId,
          direction: 'outbound',
          body: text.trim(),
          status: 'queued'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call webhook
      const response = await sendMessageWebhook({
        organization_id: userOrg.organization_id,
        contact_id: contactId,
        conversation_id: conversationId,
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
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
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
        disabled={!conversationId || isSending}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePauseAI}
          disabled={!conversationId || isPausing}
          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
        >
          {isPausing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <PauseCircle className="w-4 h-4 mr-2" />
          )}
          Pausar IA
        </Button>

        <Button
          onClick={handleSend}
          disabled={!text.trim() || !conversationId || isSending}
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
