import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import ContactsSidebar from "@/components/inbox/ContactsSidebar";
import MessagesThread from "@/components/inbox/MessagesThread";
import ContactInfoPanel from "@/components/inbox/ContactInfoPanel";
import starmetaLogo from "@/assets/starmeta-logo.png";

export default function InboxLayout() {
  const { signOut, user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-bg0">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-bg1 border-b border-borderc z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src={starmetaLogo} alt="Starmeta Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-textc">Starmeta Legacy</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-textdim">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-textdim hover:text-textc">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex w-full pt-16">
        {/* Column 1: Contacts with Preview */}
        <div className="w-80 border-r border-borderc bg-bg1">
          <ContactsSidebar selectedContactId={selectedContactId} onSelectContact={setSelectedContactId} />
        </div>

        {/* Column 2: Messages Thread */}
        <div className="flex-1 bg-bg0">
          <MessagesThread contactId={selectedContactId} />
        </div>

        {/* Column 3: Contact Info */}
        <div className="w-80 border-l border-borderc bg-bg1">
          <ContactInfoPanel contactId={selectedContactId} />
        </div>
      </div>
    </div>
  );
}
