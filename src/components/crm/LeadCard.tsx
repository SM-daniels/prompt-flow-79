import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Contact } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Label } from "./LabelManager";
import { LabelSelector } from "./LabelSelector";

interface LeadCardProps {
  contact: Contact;
  availableLabels: Label[];
  onLabelsChange: (contactId: string, labelIds: string[]) => void;
}

export function LeadCard({ contact, availableLabels, onLabelsChange }: LeadCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/app', { state: { selectedContactId: contact.id } });
  };

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

  const contactLabels = (contact.metadata?.labels as string[]) || [];
  const selectedLabels = availableLabels.filter(l => contactLabels.includes(l.id));

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 bg-bg2 border-borderc group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-semibold text-textc truncate">{contact.name}</h3>
            <p className="text-xs text-textdim">
              {formatDistanceToNow(new Date(contact.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-1">
            {contact.phone && (
              <div className="flex items-center gap-2 text-xs text-textdim">
                <Phone className="w-3 h-3" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-xs text-textdim">
                <Mail className="w-3 h-3" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>

          {/* Labels */}
          {selectedLabels.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedLabels.map(label => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5 border-none"
                  style={{ backgroundColor: label.color.replace('bg-', 'hsl(var(--') + ')' }}
                >
                  <div className={`w-2 h-2 rounded-full ${label.color} mr-1`} />
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Channel Badge and Actions */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs ${getChannelColor(contact.channel)}`}
            >
              {contact.channel}
            </Badge>
            <div className="flex items-center gap-1">
              <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                <LabelSelector
                  availableLabels={availableLabels}
                  selectedLabelIds={contactLabels}
                  onLabelsChange={(labelIds) => onLabelsChange(contact.id, labelIds)}
                />
              </div>
              <button
                onClick={handleChatClick}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary2 transition-colors p-1.5 rounded hover:bg-primary/10 cursor-pointer z-10"
                title="Abrir conversa"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
