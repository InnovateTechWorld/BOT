
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronDown, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Conversation {
  id: string;
  title: string;
  messages: Array<{ text: string; isUser: boolean }>;
}

interface AppSidebarProps {
  onConversationSelect?: (conversation: Conversation) => void;
  onNewConversation?: () => void;
}

export function AppSidebar({ onConversationSelect, onNewConversation }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Initial load of conversations
    const loadConversations = () => {
      const savedConversations = localStorage.getItem("conversations");
      if (savedConversations) {
        setConversations(JSON.parse(savedConversations));
      }
    };

    loadConversations();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "conversations") {
        loadConversations();
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    // Custom event for immediate updates within the same window
    const handleLocalUpdate = () => loadConversations();
    window.addEventListener("conversationsUpdated", handleLocalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("conversationsUpdated", handleLocalUpdate);
    };
  }, []);

  const toggleGroup = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onNewConversation}
                className="w-10 h-10 flex items-center justify-center bg-[#0f172a] text-white rounded-md hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Conversation</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel
            onClick={toggleGroup}
            className="cursor-pointer flex items-center justify-between bg-[#0f172a] text-white p-2 rounded-md"
          >
            {isExpanded ? "History" : ""}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </SidebarGroupLabel>
          {isExpanded && (
            <SidebarGroupContent className="animate-accordion-down overflow-y-auto max-h-[calc(100vh-150px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <SidebarMenu>
                {conversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <SidebarMenuButton
                      asChild
                      onClick={() => onConversationSelect?.(conv)}
                    >
                      <button className="text-sm w-full text-left">
                        {conv.title}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
