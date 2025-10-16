import { formatRelative } from '@/lib/dateUtils';
import { PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Conversation = {
  conversation_id: string;
  lastMessage: any;
  paused_ai: boolean;
};

type ConversationCardProps = {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
};

export default function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const preview = conversation.lastMessage.body?.slice(0, 100) || 'Sem mensagens';

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
        isSelected 
          ? 'bg-bg3 border border-primary shadow-glow' 
          : 'bg-bg2 border border-borderc hover:bg-bg3 hover:border-primary/50'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-textc font-medium line-clamp-2">
            {preview}
          </p>
          {conversation.paused_ai && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <PauseCircle className="w-3 h-3" />
              IA Pausada
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-textdim">
            {formatRelative(conversation.lastMessage.created_at)}
          </span>
          <span className="text-xs font-mono text-textdim">
            #{conversation.conversation_id.slice(0, 8)}
          </span>
        </div>
      </div>
    </button>
  );
}
