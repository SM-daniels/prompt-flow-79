import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid } from "lucide-react";
import ContactsSidebar from "@/components/inbox/ContactsSidebar";
import MessagesThread from "@/components/inbox/MessagesThread";
import ContactInfoPanel from "@/components/inbox/ContactInfoPanel";
import starmetaLogo from "@/assets/starmeta-logo.png";

export default function InboxLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Handle navigation from CRM with pre-selected contact
  useEffect(() => {
    if (location.state?.selectedContactId) {
      setSelectedContactId(location.state.selectedContactId);
      // Clear the state to prevent re-selecting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="flex h-screen bg-bg0">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-bg1 via-bg1 to-bg2/80 border-b border-borderc/60 backdrop-blur-sm z-10 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={starmetaLogo} alt="Starmeta Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-textc">Starmeta Legacy</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app/crm')}
            className="text-textdim hover:text-textc"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            CRM
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-textdim">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-textdim hover:text-textc">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex w-full pt-16 h-screen overflow-hidden">
        {/* Column 1: Contacts with Preview */}
        <div className="flex-none w-80 min-w-[280px] max-w-[340px] bg-gradient-to-br from-bg1 via-bg1 to-bg2/50 border-r border-borderc/50 shadow-lg overflow-y-auto">
          <ContactsSidebar selectedContactId={selectedContactId} onSelectContact={setSelectedContactId} />
        </div>

        {/* Column 2: Messages Thread */}
        <div className="flex-1 min-w-0 bg-gradient-to-b from-bg0 to-bg1/30 overflow-auto relative border-r border-borderc/50">
          <MessagesThread contactId={selectedContactId} />
        </div>

        {/* Column 3: Contact Info */}
        <div className="flex-none w-72 min-w-[288px] bg-gradient-to-bl from-bg1 via-bg1 to-bg2/50 border-l border-borderc/50 shadow-lg overflow-y-auto relative z-[2]">
          <ContactInfoPanel contactId={selectedContactId} />
        </div>
      </div>
    </div>
  );
}
