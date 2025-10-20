import { FileText, Download } from 'lucide-react';

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
};

export default function MediaPreview({ media }: MediaPreviewProps) {
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
            return (
              <div key={item.id} className="w-full max-w-sm space-y-1">
                <audio
                  controls
                  className="w-full rounded"
                  preload="metadata"
                >
                  <source src={item.url} type={item.mime_type} />
                  Seu navegador não suporta áudio.
                </audio>
                <p className="text-xs opacity-70">
                  {item.name} • {formatSize(item.size)}
                </p>
              </div>
            );

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
                <p className="text-xs opacity-70">
                  {item.name} • {formatSize(item.size)}
                </p>
              </div>
            );

          case 'document':
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer max-w-sm"
                onClick={() => window.open(item.url, '_blank')}
              >
                <FileText className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.name}
                  </p>
                  <p className="text-xs opacity-70">{formatSize(item.size)}</p>
                </div>
                <Download className="w-4 h-4 flex-shrink-0" />
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
