import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AudioPlayerProps = {
  url: string;
  size: number;
  variant?: 'inbound' | 'outbound';
};

export default function AudioPlayer({ url, size, variant = 'inbound' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const isOutbound = variant === 'outbound';

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg max-w-md w-full ${
      isOutbound 
        ? 'bg-white/10 border border-white/20' 
        : 'bg-muted/30 border border-border'
    }`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-10 rounded-full ${
          isOutbound
            ? 'bg-white/20 hover:bg-white/30'
            : 'bg-primary/10 hover:bg-primary/20'
        }`}
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className={`h-5 w-5 ${isOutbound ? 'text-white' : 'text-primary'}`} />
        ) : (
          <Play className={`h-5 w-5 ml-0.5 ${isOutbound ? 'text-white' : 'text-primary'}`} />
        )}
      </Button>

      <div className="flex-1 space-y-2">
        <div className={`relative h-1.5 rounded-full overflow-hidden ${
          isOutbound ? 'bg-white/20' : 'bg-muted'
        }`}>
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-100 ${
              isOutbound ? 'bg-white' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-between text-xs gap-4">
          <span className={isOutbound ? 'text-white/80' : 'text-muted-foreground'}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className={isOutbound ? 'text-white/60' : 'text-muted-foreground opacity-60'}>
            {formatSize(size)}
          </span>
        </div>
      </div>
    </div>
  );
}
