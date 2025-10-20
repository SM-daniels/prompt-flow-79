import { FileText, Download } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
  mime_type: string;
}

type MediaPreviewProps = {
  media: MediaItem[];
  variant?: 'inbound' | 'outbound';
};

export default function MediaPreview({ media, variant = 'inbound' }: MediaPreviewProps) {
  if (!media || media.length === 0) {
    console.log('[MediaPreview] No media to display');
    return null;
  }

  console.log('[MediaPreview] Rendering', media.length, 'items:', media.map(m => m.type));

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {media.map((item) => {
        switch (item.type) {
          case 'image':
            return (
              <div key={item.id} className="rounded-lg overflow-hidden max-w-sm">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(item.url, '_blank')}
                  loading="lazy"
                />
              </div>
            );

          case 'audio':
            return <AudioPlayer key={item.id} url={item.url} size={item.size} variant={variant} />;

          case 'video':
            return (
              <div key={item.id} className="rounded-lg overflow-hidden max-w-md space-y-1">
                <video
                  controls
                  className="w-full h-auto rounded"
                  style={{ maxHeight: '400px' }}
                  preload="metadata"
                >
                  <source src={item.url} type={item.mime_type} />
                  Seu navegador não suporta vídeo.
                </video>
                <p className="text-xs opacity-60">
                  {formatSize(item.size)}
                </p>
              </div>
            );

          case 'document':
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer max-w-sm border border-border"
                onClick={() => window.open(item.url, '_blank')}
              >
                <FileText className="w-8 h-8 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs opacity-60">{formatSize(item.size)}</p>
                </div>
                <Download className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
