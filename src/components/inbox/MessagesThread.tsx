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
  contactId: string | null;
};

export default function MessagesThread({ contactId }: MessagesThreadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch or create conversation for this contact
  const { data: conversation } = useQuery({
    queryKey: ['latest-conversation', contactId],
    queryFn: async () => {
      if (!contactId || !user) return null;

      // Try to find existing conversation
      const { data: existing, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contactId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[MessagesThread] existing conversation for contact', contactId, '=>', existing?.id, 'error:', error);
      
      if (existing) return existing;

      // Create new conversation if none exists
      const { data: userOrg } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fallback: get contact's organization_id if user has no org
      const { data: contact } = await supabase
        .from('contacts')
        .select('organization_id, owner_id')
        .eq('id', contactId)
        .single();

      const orgId = userOrg?.organization_id || contact?.organization_id;
      
      if (!orgId) {
        console.warn('[MessagesThread] No organization found, cannot create conversation');
        return null;
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          organization_id: orgId,
          contact_id: contactId,
          paused_ai: false
        })
        .select()
        .single();

      console.log('[MessagesThread] created new conversation:', newConv?.id, 'error:', createError);
      
      return newConv;
    },
    enabled: !!contactId && !!user
  });

  const conversationId = conversation?.id || null;
  const messagesKey = conversationId ? `conv-${conversationId}` : contactId ? `contact-${contactId}` : 'none';

  // Fetch messages (fallback to contact_id when no conversation)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', messagesKey, user?.id],
    queryFn: async () => {
      if (!user || (!conversationId && !contactId)) return [];

      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && (!!conversationId || !!contactId)
  });

  // Realtime subscription (supports conv or contact fallback)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | undefined;

    if (conversationId) {
      channel = supabase
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
            queryClient.invalidateQueries({ queryKey: ['messages', messagesKey] });
          }
        )
        .subscribe();
    } else if (contactId) {
      channel = supabase
        .channel(`contact-${contactId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `contact_id=eq.${contactId}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['messages', messagesKey] });
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, contactId, messagesKey, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!contactId) {
    return (
      <div className="h-full">
        <EmptyState
          icon={MessageSquare}
          title="Selecione um contato"
          description="Escolha um contato para ver as mensagens"
        />
      </div>
    );
  }

  const renderMessages = () => {
    return messages.flatMap((msg) => {
      // Check if message has chat field
      if (msg.chat) {
        const chatMessages = parseChat(msg.chat);
        // If chat parsing succeeded and returned messages, use those
        if (chatMessages.length > 0) {
          return chatMessages.map((chatMsg, idx) => (
            <MessageBubble
              key={`${msg.id}-${idx}`}
              message={{
                type: chatMsg.type,
                content: chatMsg.content,
                createdAt: chatMsg.createdAt,
                direction: msg.direction
              }}
            />
          ));
        }
        // If chat parsing failed, fall through to render regular message
      }

      // Regular message (or fallback when chat parsing fails)
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
        <MessageComposer conversationId={conversationId} contactId={contactId} conversation={conversation} />
      </div>
    </div>
  );
}
