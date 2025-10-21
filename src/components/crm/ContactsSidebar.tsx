import { Contact } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ContactsSidebarProps {
  contacts: Contact[];
  selectedContactId?: string;
  onSelectContact?: (contactId: string) => void;
}

export function ContactsSidebar({ contacts, selectedContactId, onSelectContact }: ContactsSidebarProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      whatsapp: "bg-green-500/10 text-green-500 border-green-500/20",
      instagram: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      site: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      outro: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[channel] || colors.outro;
  };

  const handleContactClick = (contactId: string) => {
    if (onSelectContact) {
      onSelectContact(contactId);
    }
  };

  const handleChatClick = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    navigate('/app', { state: { selectedContactId: contactId } });
  };

  return (
    <div className="w-80 bg-bg1 border-r border-borderc flex flex-col h-full">
      <div className="p-4 border-b border-borderc">
        <h3 className="font-semibold text-textc">Contatos ({contacts.length})</h3>
        <p className="text-xs text-textdim">Lista de todos os contatos</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-textdim text-sm">
              Nenhum contato encontrado
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => handleContactClick(contact.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-bg2 ${
                  selectedContactId === contact.id
                    ? "bg-bg2 border-primary"
                    : "bg-bg1 border-borderc"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-textc text-sm truncate">
                        {contact.name}
                      </h4>
                      <button
                        onClick={(e) => handleChatClick(e, contact.id)}
                        className="text-primary hover:text-primary2 transition-colors p-1 rounded hover:bg-primary/10 shrink-0"
                        title="Abrir conversa"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-textdim mb-2">
                      {formatDistanceToNow(new Date(contact.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-textdim mb-1">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1.5 text-xs text-textdim mb-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${getChannelColor(contact.channel)}`}
                    >
                      {contact.channel}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
