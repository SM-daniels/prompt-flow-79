import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import ContactsSidebar from '@/components/inbox/ContactsSidebar';
import ConversationsList from '@/components/inbox/ConversationsList';
import MessagesThread from '@/components/inbox/MessagesThread';

export default function InboxLayout() {
  const { signOut, user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-bg0">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-bg1 border-b border-borderc z-10 flex items-center justify-between px-6">
        <h1 className="text-xl font-bold text-textc">Inbox</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-textdim">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-textdim hover:text-textc">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex w-full pt-16">
        {/* Column 1: Contacts Sidebar */}
        <div className="w-80 border-r border-borderc bg-bg1">
          <ContactsSidebar 
            selectedContactId={selectedContactId}
            onSelectContact={(id) => {
              setSelectedContactId(id);
              setSelectedConversationId(null);
            }}
          />
        </div>

        {/* Column 2: Conversations List */}
        <div className="w-96 border-r border-borderc bg-bg1">
          <ConversationsList
            contactId={selectedContactId}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>

        {/* Column 3: Messages Thread */}
        <div className="flex-1 bg-bg0">
          <MessagesThread
            conversationId={selectedConversationId}
            contactId={selectedContactId}
          />
        </div>
      </div>
    </div>
  );
}
