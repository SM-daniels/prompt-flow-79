import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  if (!media || media.length === 0) return null;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2 mt-2">
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
                />
              </div>
            );

          case 'audio':
            return (
              <div key={item.id} className="w-full max-w-sm">
                <audio
                  controls
                  className="w-full"
                  style={{ height: '40px' }}
                >
                  <source src={item.url} type={item.mime_type} />
                  Seu navegador não suporta áudio.
                </audio>
                <p className="text-xs text-textdim mt-1">
                  {item.name} • {formatSize(item.size)}
                </p>
              </div>
            );

          case 'video':
            return (
              <div key={item.id} className="rounded-lg overflow-hidden max-w-md">
                <video
                  controls
                  className="w-full h-auto"
                  style={{ maxHeight: '400px' }}
                >
                  <source src={item.url} type={item.mime_type} />
                  Seu navegador não suporta vídeo.
                </video>
                <p className="text-xs text-textdim mt-1">
                  {item.name} • {formatSize(item.size)}
                </p>
              </div>
            );

          case 'document':
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg3 border border-borderc max-w-sm"
              >
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textc truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-textdim">{formatSize(item.size)}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
