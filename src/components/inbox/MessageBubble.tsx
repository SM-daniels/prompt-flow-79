import { formatRelative } from '@/lib/dateUtils';

type MessageBubbleProps = {
  message: {
    type: 'human' | 'ai';
    content: string;
    createdAt: string;
    direction: 'inbound' | 'outbound';
  };
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isFromUser = message.type === 'human' || message.direction === 'inbound';

  return (
    <div className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isFromUser
            ? 'bg-bg2 text-textc border border-borderc'
            : 'bg-primary text-white shadow-glow'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-xs mt-2 ${isFromUser ? 'text-textdim' : 'text-white/70'}`}>
          {formatRelative(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
