import { Contact } from '@/lib/supabase';
import { formatRelative } from '@/lib/dateUtils';
import { MessageCircle, Instagram, Globe, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ContactCardProps = {
  contact: Contact & {
    lastMessage?: {
      body: string;
      created_at: string;
    } | null;
  };
  isSelected: boolean;
  onClick: () => void;
  className?: string;
};

export default function ContactCard({
  contact,
  isSelected,
  onClick,
  className = ''
}: ContactCardProps) {
  const getChannelBadge = () => {
    switch (contact.channel) {
      case 'whatsapp':
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <MessageCircle className="w-2.5 h-2.5" />
            WhatsApp
          </Badge>
        );
      case 'instagram':
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5 bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
            <Instagram className="w-2.5 h-2.5" />
            Instagram
          </Badge>
        );
      case 'site':
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Globe className="w-2.5 h-2.5" />
            Site
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5">
            <Hash className="w-2.5 h-2.5" />
            Outro
          </Badge>
        );
    }
  };

  const getInitials = () => {
    return contact.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = () => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
    ];
    const index = contact.name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <button
      onClick={onClick}
      className={`group w-full p-3 rounded-xl text-left transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[0.98]'
          : 'bg-bg1/50 border-2 border-transparent hover:bg-bg2 hover:border-primary/30 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex gap-3 min-w-0">
        {/* Avatar */}
        <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>
          {getInitials()}
          {/* Online indicator (can be dynamic based on status) */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-bg1 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Header: Name + Timestamp */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-textc truncate">
              {contact.name}
            </h3>
            {contact.lastMessage && (
              <span className="text-[10px] text-textdim/70 flex-shrink-0 font-medium">
                {formatRelative(contact.lastMessage.created_at)}
              </span>
            )}
          </div>

          {/* Channel Badge */}
          <div className="mb-1.5">
            {getChannelBadge()}
          </div>

          {/* Message Preview */}
          {contact.lastMessage ? (
            <p className="text-xs text-textdim line-clamp-2 leading-relaxed">
              {contact.lastMessage.body || '📎 Mídia'}
            </p>
          ) : (
            <p className="text-xs text-textdim/60 italic">Sem mensagens ainda</p>
          )}
        </div>
      </div>
    </button>
  );
}
