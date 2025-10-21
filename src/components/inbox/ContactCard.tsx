import { Contact } from '@/lib/supabase';
import { formatRelative } from '@/lib/dateUtils';
import { Hash, Phone, Mail } from 'lucide-react';
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
    return contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
   return <button onClick={onClick} className={`block w-full box-border px-2 py-2.5 rounded-lg text-left transition-all duration-200 overflow-hidden ${isSelected ? 'bg-bg3 border border-primary shadow-glow' : 'bg-bg1 border border-borderc hover:bg-bg2 hover:border-primary/50'} ${className}`}>
      <div className="flex items-start gap-2 min-w-0 mx-0 px-0 py-px my-0">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
          {getInitials()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-sm text-textc truncate flex-1 min-w-0">{contact.name}</h3>
            <div className="text-textdim flex-shrink-0">
              {getChannelIcon()}
            </div>
          </div>
          
          {contact.lastMessage ? <>
              <p className="text-xs text-textdim truncate mb-0.5">
                {contact.lastMessage.body || 'Mídia'}
              </p>
              <p className="text-xs text-textdim/80 truncate">
                {formatRelative(contact.lastMessage.created_at)}
              </p>
            </> : <p className="text-xs text-textdim">
              Sem mensagens
            </p>}
        </div>
      </div>
    </button>;
}