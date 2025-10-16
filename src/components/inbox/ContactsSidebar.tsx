import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, Contact } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import ContactCard from './ContactCard';
import { Skeleton } from '@/components/ui/skeleton';

type ContactsSidebarProps = {
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
};

export default function ContactsSidebar({ selectedContactId, onSelectContact }: ContactsSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user!.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user
  });

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone?.includes(searchQuery) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-borderc">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textdim" />
          <Input
            placeholder="Buscar contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-bg2 border-borderc text-textc focus:ring-primary"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full bg-bg2" />
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum contato encontrado"
            description={searchQuery ? 'Tente outra busca' : 'Seus contatos aparecerão aqui'}
          />
        ) : (
          <div className="p-2 space-y-1">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isSelected={contact.id === selectedContactId}
                onClick={() => onSelectContact(contact.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
