import { formatRelative } from '@/lib/dateUtils';
import MediaPreview, { type MediaItem } from './MediaPreview';

type MessageBubbleProps = {
  message: {
    type: 'human' | 'ai';
    content: string;
    createdAt: string;
    direction: 'inbound' | 'outbound';
    media?: MediaItem[];
  };
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isFromUser = message.direction === 'inbound';

  return (
    <div className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isFromUser
            ? 'bg-bg2 text-textc border border-borderc'
            : 'bg-primary text-white shadow-glow'
        }`}
      >
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words mb-2">{message.content}</p>
        )}
        {message.media && message.media.length > 0 && (
          <div className={message.content ? 'mt-2' : ''}>
            <MediaPreview media={message.media} />
          </div>
        )}
        <p className={`text-xs mt-2 ${isFromUser ? 'text-textdim' : 'text-white/70'}`}>
          {formatRelative(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
