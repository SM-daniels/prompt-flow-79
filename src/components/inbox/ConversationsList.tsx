import { useQuery } from '@tanstack/react-query';
import { supabase, Message } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import ConversationCard from './ConversationCard';
import { Skeleton } from '@/components/ui/skeleton';

type ConversationsListProps = {
  contactId: string | null;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
};

type Conversation = {
  conversation_id: string;
  lastMessage: Message;
  paused_ai: boolean;
};

export default function ConversationsList({ 
  contactId, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationsListProps) {
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', contactId, user?.id],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation_id
      const grouped = (data as Message[]).reduce((acc, msg) => {
        if (!acc[msg.conversation_id]) {
          acc[msg.conversation_id] = {
            conversation_id: msg.conversation_id,
            lastMessage: msg,
            paused_ai: msg.paused_ai
          };
        }
        return acc;
      }, {} as Record<string, Conversation>);

      return Object.values(grouped);
    },
    enabled: !!user && !!contactId
  });

  if (!contactId) {
    return (
      <div className="h-full">
        <EmptyState
          icon={MessageSquare}
          title="Selecione um contato"
          description="Escolha um contato para ver as conversas"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-borderc">
        <h2 className="text-lg font-semibold text-textc">Conversas</h2>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-bg2" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma conversa"
            description="Inicie uma conversa enviando uma mensagem"
          />
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <ConversationCard
                key={conv.conversation_id}
                conversation={conv}
                isSelected={conv.conversation_id === selectedConversationId}
                onClick={() => onSelectConversation(conv.conversation_id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
