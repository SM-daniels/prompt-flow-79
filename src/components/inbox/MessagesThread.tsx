import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, Message } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import { Skeleton } from '@/components/ui/skeleton';
import { parseChat } from '@/lib/chatParser';

type MessagesThreadProps = {
  conversationId: string | null;
  contactId: string | null;
};

export default function MessagesThread({ conversationId, contactId }: MessagesThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId, user?.id],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!conversationId
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="h-full">
        <EmptyState
          icon={MessageSquare}
          title="Selecione uma conversa"
          description="Escolha uma conversa para ver as mensagens"
        />
      </div>
    );
  }

  const renderMessages = () => {
    return messages.flatMap((msg) => {
      // Check if message has chat field
      if (msg.chat) {
        const chatMessages = parseChat(msg.chat);
        return chatMessages.map((chatMsg, idx) => (
          <MessageBubble
            key={`${msg.id}-${idx}`}
            message={{
              type: chatMsg.type,
              content: chatMsg.content,
              createdAt: chatMsg.createdAt,
              direction: chatMsg.type === 'human' ? 'inbound' : 'outbound'
            }}
          />
        ));
      }

      // Regular message
      return (
        <MessageBubble
          key={msg.id}
          message={{
            type: msg.direction === 'inbound' ? 'human' : 'ai',
            content: msg.body || '',
            createdAt: msg.created_at,
            direction: msg.direction
          }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className={`h-16 bg-bg2 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma mensagem"
            description="Inicie a conversa abaixo"
          />
        ) : (
          <div className="space-y-4">
            {renderMessages()}
          </div>
        )}
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-borderc bg-bg1">
        <MessageComposer conversationId={conversationId} contactId={contactId} />
      </div>
    </div>
  );
}
