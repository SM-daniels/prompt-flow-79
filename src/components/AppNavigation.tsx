import { useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, LayoutGrid, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import starmetaLogo from "@/assets/starmeta-logo.png";
import { useAuth } from "@/hooks/useAuth";

export default function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isInbox = location.pathname === "/app" || location.pathname === "/app/";
  const isCRM = location.pathname === "/app/crm";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-bg1 via-bg1 to-bg2/80 border-b border-borderc/60 backdrop-blur-sm z-50 flex items-center justify-between px-6 shadow-lg">
      {/* Logo and Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src={starmetaLogo} alt="Starmeta Logo" className="h-9 w-9" />
          <h1 className="text-xl font-bold text-textc hidden sm:block">Starmeta Legacy</h1>
        </div>

        {/* Navigation Icons */}
        <nav className="flex items-center gap-1 ml-4 border-l border-borderc/50 pl-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isInbox ? "default" : "ghost"}
                onClick={() => navigate("/app")}
                className={`group h-10 transition-all duration-300 ease-out overflow-hidden rounded-full hover:rounded-md ${
                  isInbox
                    ? "bg-primary text-primary-foreground shadow-md w-10 hover:w-auto hover:px-4"
                    : "text-textdim hover:text-textc hover:bg-accent w-10 hover:w-auto hover:px-4"
                }`}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <span className="overflow-hidden transition-all duration-300 ease-out max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100">
                    Inbox
                  </span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Inbox</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCRM ? "default" : "ghost"}
                onClick={() => navigate("/app/crm")}
                className={`group h-10 transition-all duration-300 ease-out overflow-hidden rounded-full hover:rounded-md ${
                  isCRM
                    ? "bg-primary text-primary-foreground shadow-md w-10 hover:w-auto hover:px-4"
                    : "text-textdim hover:text-textc hover:bg-accent w-10 hover:w-auto hover:px-4"
                }`}
              >
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                  <LayoutGrid className="w-5 h-5 flex-shrink-0" />
                  <span className="overflow-hidden transition-all duration-300 ease-out max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100">
                    CRM
                  </span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>CRM</p>
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>

      {/* User Info and Logout */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-textdim hidden sm:block">{user?.email}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-textdim hover:text-textc hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Sair</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
