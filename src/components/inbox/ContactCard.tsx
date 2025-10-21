import { Contact } from '@/lib/supabase';
import { formatRelative } from '@/lib/dateUtils';
import { Hash, Phone, Mail } from 'lucide-react';

type ContactCardProps = {
  contact: Contact & { lastMessage?: { body: string; created_at: string } | null };
  isSelected: boolean;
  onClick: () => void;
};

export default function ContactCard({ contact, isSelected, onClick }: ContactCardProps) {
  const getChannelIcon = () => {
    switch (contact.channel) {
      case 'whatsapp':
        return <Phone className="w-3 h-3" />;
      case 'instagram':
        return <Hash className="w-3 h-3" />;
      case 'site':
        return <Mail className="w-3 h-3" />;
      default:
        return <Hash className="w-3 h-3" />;
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

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all duration-200 overflow-hidden ${
        isSelected 
          ? 'bg-bg3 border border-primary shadow-glow' 
          : 'bg-bg1 border border-borderc hover:bg-bg2 hover:border-primary/50'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
          {getInitials()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h3 className="font-semibold text-textc truncate flex-1 min-w-0">{contact.name}</h3>
            <div className="text-textdim flex-shrink-0">
              {getChannelIcon()}
            </div>
          </div>
          
          {contact.lastMessage ? (
            <>
              <p className="text-sm text-textdim truncate mb-1 overflow-hidden">
                {contact.lastMessage.body || 'Mídia'}
              </p>
              <p className="text-xs text-textdim truncate overflow-hidden">
                {formatRelative(contact.lastMessage.created_at)}
              </p>
            </>
          ) : (
            <p className="text-xs text-textdim">
              Sem mensagens
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
