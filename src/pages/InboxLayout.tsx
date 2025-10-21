import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ContactsSidebar from "@/components/inbox/ContactsSidebar";
import MessagesThread from "@/components/inbox/MessagesThread";
import ContactInfoPanel from "@/components/inbox/ContactInfoPanel";
import AppNavigation from "@/components/AppNavigation";

export default function InboxLayout() {
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
      <AppNavigation />

      {/* Main Content - 3 Columns */}
      <div className="flex w-full pt-16 h-screen overflow-hidden">
        {/* Column 1: Contacts with Preview */}
        <div className="flex-none w-96 min-w-[320px] max-w-[400px] bg-gradient-to-br from-bg1 via-bg1 to-bg2/50 border-r border-borderc/50 shadow-lg overflow-y-auto">
          <ContactsSidebar selectedContactId={selectedContactId} onSelectContact={setSelectedContactId} />
        </div>

        {/* Column 2: Messages Thread */}
        <div className="flex-1 min-w-0 bg-gradient-to-b from-bg0 to-bg1/30 overflow-auto relative">
          <MessagesThread contactId={selectedContactId} />
        </div>

        {/* Column 3: Contact Info */}
        <div className="flex-none w-80 min-w-[320px] bg-gradient-to-bl from-bg1 via-bg1 to-bg2/50 border-l border-borderc/50 shadow-lg overflow-y-auto">
          <ContactInfoPanel contactId={selectedContactId} />
        </div>
      </div>
    </div>
  );
}
