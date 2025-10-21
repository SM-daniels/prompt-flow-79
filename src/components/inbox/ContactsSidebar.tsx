import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, Contact, Message } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import ContactCard from './ContactCard';
import { Skeleton } from '@/components/ui/skeleton';
import { parseChat } from '@/lib/chatParser';
import { Button } from '@/components/ui/button';

type ContactsSidebarProps = {
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
};

export default function ContactsSidebar({
  selectedContactId,
  onSelectContact
}: ContactsSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts-with-preview', user?.id],
    queryFn: async () => {
      // Get user's organization first
      const { data: userOrg, error: userOrgError } = await supabase
        .from('users_organizations')
        .select('organization_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      console.log('[ContactsSidebar] user:', user?.id, 'org:', userOrg?.organization_id, 'err:', userOrgError);

      // Helper to enrich contacts with last message and all messages for search
      const withPreview = async (list: any[]) => {
        return Promise.all(
          (list as Contact[]).map(async contact => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('body, created_at')
              .eq('contact_id', contact.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Fetch all messages for search purposes
            const { data: allMessages } = await supabase
              .from('messages')
              .select('body, chat')
              .eq('contact_id', contact.id);

            return {
              ...contact,
              lastMessage: lastMsg || null,
              messages: allMessages || []
            };
          })
        );
      };

      if (!userOrg) {
        // Fallback for legacy data: try owner_id
        try {
          const { data: contactsByOwner, error: ownerErr } = await supabase
            .from('contacts')
            .select('*')
            .eq('owner_id', user!.id)
            .order('updated_at', { ascending: false });

          console.log('[ContactsSidebar] fallback owner_id results:', contactsByOwner?.length, 'error:', ownerErr);

          if (ownerErr || !contactsByOwner) return [];
          return await withPreview(contactsByOwner);
        } catch (e) {
          console.warn('[ContactsSidebar] fallback query failed', e);
          return [];
        }
      }

      // Get contacts by organization
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', userOrg.organization_id)
        .order('updated_at', { ascending: false });

      console.log('[ContactsSidebar] org contacts results:', contactsData?.length, 'error:', contactsError);

      if (contactsError || !contactsData) throw contactsError || new Error('No contacts');
      return await withPreview(contactsData || []);
    },
    enabled: !!user
  });

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();

    // Search in contact info
    const matchesContact =
      contact.name.toLowerCase().includes(query) ||
      contact.phone?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(query);

    if (matchesContact) return true;

    // Search in messages
    const messages = (contact as any).messages || [];
    const matchesMessages = messages.some((msg: Message) => {
      // Search in body
      if (msg.body?.toLowerCase().includes(query)) return true;

      // Search in chat (parsed AI conversations)
      if (msg.chat) {
        try {
          const parsedChat = parseChat(msg.chat);
          return parsedChat.some(chatMsg => chatMsg.content.toLowerCase().includes(query));
        } catch {
          return false;
        }
      }
      return false;
    });

    return matchesMessages;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-bg0 to-bg1">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-borderc/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-textc">Conversas</h2>
            <p className="text-xs text-textdim">{filteredContacts.length} {filteredContacts.length === 1 ? 'contato' : 'contatos'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textdim pointer-events-none" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-bg2/50 border-borderc/50 text-textc placeholder:text-textdim/50 focus:bg-bg2 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-bg2/50 rounded-xl" />
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="Nenhum contato encontrado"
              description={searchQuery ? 'Tente outra busca' : 'Seus contatos aparecerão aqui'}
            />
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredContacts.map(contact => (
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
