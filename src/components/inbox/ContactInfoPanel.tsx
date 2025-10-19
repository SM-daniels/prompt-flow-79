import { useQuery } from '@tanstack/react-query';
import { supabase, Contact } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Phone, Mail, Calendar, Hash } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { formatRelative } from '@/lib/dateUtils';

type ContactInfoPanelProps = {
  contactId: string | null;
};

export default function ContactInfoPanel({ contactId }: ContactInfoPanelProps) {
  const { user } = useAuth();

  const { data: contact } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId!)
        .single();

      if (error) throw error;
      return data as Contact;
    },
    enabled: !!contactId && !!user
  });

  if (!contactId) {
    return (
      <div className="h-full">
        <EmptyState
          icon={User}
          title="Selecione um contato"
          description="As informações do contato aparecerão aqui"
        />
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      site: 'Site',
      outro: 'Outro'
    };
    return labels[channel] || channel;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-borderc">
        <h2 className="text-lg font-semibold text-textc">Informações do Contato</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl mb-3">
              {contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h3 className="text-xl font-semibold text-textc">{contact.name}</h3>
          </div>

          {/* Info Fields */}
          <div className="space-y-4">
            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-textdim mb-1">Telefone</p>
                  <p className="text-sm text-textc">{contact.phone}</p>
                </div>
              </div>
            )}


            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-textdim mb-1">Canal</p>
                <p className="text-sm text-textc">{getChannelLabel(contact.channel)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-textdim mb-1">Criado</p>
                <p className="text-sm text-textc">{formatRelative(contact.created_at)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-textdim mb-1">Última atualização</p>
                <p className="text-sm text-textc">{formatRelative(contact.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {contact.metadata && Object.keys(contact.metadata).length > 0 && (
            <div className="pt-4 border-t border-borderc">
              <h4 className="text-sm font-semibold text-textc mb-3">Informações Adicionais</h4>
              <div className="space-y-2">
                {Object.entries(contact.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-xs text-textdim">{key}:</span>
                    <span className="text-xs text-textc text-right ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
