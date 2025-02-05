import { Globe, Lightbulb, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActionButton } from "@/components/ActionButton";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Conversation {
  id: string;
  title: string;
  messages: Array<{ text: string; isUser: boolean }>;
}

const Index = () => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState<
    Array<{ text: string; isUser: boolean }>
  >([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const { toast } = useToast();

  const saveConversation = (
    messages: Array<{ text: string; isUser: boolean }>
  ) => {
    const conversations = JSON.parse(
      localStorage.getItem("conversations") || "[]"
    );
    const firstUserMessage =
      messages.find((m) => m.isUser)?.text || "New Conversation";

    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: firstUserMessage,
        messages,
      };
      localStorage.setItem(
        "conversations",
        JSON.stringify([newConversation, ...conversations])
      );
      setCurrentConversationId(newConversation.id);
    } else {
      const updatedConversations = conversations.map((conv: Conversation) =>
        conv.id === currentConversationId ? { ...conv, messages } : conv
      );
      localStorage.setItem(
        "conversations",
        JSON.stringify(updatedConversations)
      );
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowSuggestions(true);
    toast({
      title: "New Conversation Started",
      description: "You can now start a new chat.",
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessages = [...messages, { text: message, isUser: true }];
    setMessages(newMessages);
    setShowSuggestions(false);
    setMessage("");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const updatedMessages = [
        ...newMessages,
        {
          text: "This is a sample response. In a real application, this would be the AI's response.",
          isUser: false,
        },
      ];
      setMessages(updatedMessages);
      saveConversation(updatedMessages);
    }, 2000);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setShowSuggestions(false);
    toast({
      title: "Conversation loaded",
      description: "You can now continue your conversation.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
        <main className="flex-1 p-6 flex flex-col">
          <div className="flex justify-end mb-6">
            <UserAvatar />
          </div>

          <div className="flex-1 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <h1 className="text-4xl font-bold mb-8 animate-fade-in text-[#0f172a]">
                  What can I help with?
                </h1>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-6">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg max-w-[80%] animate-fade-in",
                      msg.isUser
                        ? "ml-auto bg-[#0f172a] text-white w-fit animate-slide-in-right"
                        : "bg-muted w-fit"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-animation p-4 rounded-lg bg-muted inline-block">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Message B.O.T"
                  className="w-full h-12 text-lg outline-none ring-0"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  onClick={handleSendMessage}
                  className="h-12 px-4 bg-[#0f172a] text-white"
                  disabled={!message.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              {showSuggestions && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                  <ActionButton label="Analyze my Market" />
                  <ActionButton label="Review Business Plan" />
                  <ActionButton label="Financial Insights" />
                  <ActionButton label="Risk Assesment" />
                  <ActionButton label="Growth Startegy" />
                  <ActionButton label="Competitor Analysis" />
                </div>
              )}
            </div>
          </div>

          <footer className="text-center text-sm text-muted-foreground mt-6">
            B.O.T can make mistakes. Check important info.
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
