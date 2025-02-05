import { Globe, Lightbulb, Send, Bot, User, Edit2, FileUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActionButton } from "@/components/ActionButton";
import { UserAvatar } from "@/components/UserAvatar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatModelResponse } from "@/lib/TextFormatting";

interface Message {
  text: string;
  isUser: boolean;
  pdfName?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Array<Message>;
}

interface BusinessFields {
  product: string;
  targetCustomer: string;
  geographicMarket: string;
  pricingStrategy: string;
  mainChannels: string;
}

const Index = () => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [businessFields, setBusinessFields] = useState<BusinessFields>({
    product: "",
    targetCustomer: "",
    geographicMarket: "",
    pricingStrategy: "",
    mainChannels: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load business fields from localStorage
    const storedFields = localStorage.getItem("businessFields");
    if (storedFields) {
      setBusinessFields(JSON.parse(storedFields));
      setFormSubmitted(true);
      setShowForm(false);
    }

    // Load the last conversation
    const conversations = JSON.parse(localStorage.getItem("conversations") || "[]");
    if (conversations.length > 0) {
      const lastConversation = conversations[0];
      setMessages(lastConversation.messages);
      setCurrentConversationId(lastConversation.id);
      setShowSuggestions(false);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setPdfName(file.name);
    setPdfUploaded(true);
    
    // Add a message to show the PDF was uploaded
    const newMessage = {
      text: "PDF uploaded",
      isUser: true,
      pdfName: file.name
    };
    setMessages([...messages, newMessage]);
    saveConversation([...messages, newMessage]);
    setMessage("Summarize it");
  };

  const saveConversation = (messages: Array<{ text: string; isUser: boolean }>) => {
    const conversations = JSON.parse(localStorage.getItem("conversations") || "[]");
    const firstUserMessage = messages.find((m) => m.isUser)?.text || "New Conversation";

    if (!currentConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: firstUserMessage,
        messages,
      };
      localStorage.setItem("conversations", JSON.stringify([newConversation, ...conversations]));
      setCurrentConversationId(newConversation.id);
      window.dispatchEvent(new Event('conversationsUpdated'));
    } else {
      const updatedConversations = conversations.map((conv: Conversation) =>
        conv.id === currentConversationId ? { ...conv, messages } : conv
      );
      localStorage.setItem("conversations", JSON.stringify(updatedConversations));
      window.dispatchEvent(new Event('conversationsUpdated'));
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowSuggestions(true);
    setPdfUploaded(false);
    setPdfName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({
      title: "New Conversation Started",
      description: "You can now start a new chat.",
    });
  };

  const handleSubmitBusinessFields = () => {
    localStorage.setItem("businessFields", JSON.stringify(businessFields));
    setFormSubmitted(true);
    setShowForm(false);
    toast({
      title: "Business Details Saved",
      description: "Your business information has been saved successfully.",
    });
  };

  const handleEditBusinessFields = () => {
    setShowForm(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage = {
      text: message,
      isUser: true,
      ...(pdfUploaded ? { pdfName } : {})
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setShowSuggestions(false);
    setMessage("");
    setIsTyping(true);

    try {
      let fileContent = null;
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const reader = new FileReader();
        fileContent = await new Promise((resolve) => {
          reader.onload = () => {
            const base64Content = reader.result?.toString().split(',')[1];
            resolve(base64Content);
          };
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch("https://bizi-rgdl.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          history: messages.map(msg => ({
            role: msg.isUser ? "user" : "model",
            text: msg.text
          })),
          fileContent,
          ...businessFields
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const updatedMessages = [
        ...newMessages,
        { text: data.response, isUser: false },
      ];
      setMessages(updatedMessages);
      saveConversation(updatedMessages);

      // Clear PDF state after sending
      if (fileContent) {
        setPdfUploaded(false);
        setPdfName("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      const errorMessage = { 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.", 
        isUser: false 
      };
      setMessages([...newMessages, errorMessage]);
      saveConversation([...newMessages, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to connect to the AI service.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setShowSuggestions(false);
    setPdfUploaded(false);
    setPdfName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          <div className="flex justify-between mb-6">
            <UserAvatar />
            {formSubmitted && !showForm && (
              <Button
                onClick={handleEditBusinessFields}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Business Details
              </Button>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {showForm ? (
              <div className="mb-6 space-y-4">
                <h3 className="text-xl font-semibold">Tell us about your business</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product or service</label>
                    <Input
                      value={businessFields.product}
                      onChange={(e) =>
                        setBusinessFields({ ...businessFields, product: e.target.value })
                      }
                      placeholder="What do you offer?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target customer</label>
                    <Input
                      value={businessFields.targetCustomer}
                      onChange={(e) =>
                        setBusinessFields({ ...businessFields, targetCustomer: e.target.value })
                      }
                      placeholder="Who are your customers?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Geographic market</label>
                    <Input
                      value={businessFields.geographicMarket}
                      onChange={(e) =>
                        setBusinessFields({ ...businessFields, geographicMarket: e.target.value })
                      }
                      placeholder="Where do you operate?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pricing strategy</label>
                    <Input
                      value={businessFields.pricingStrategy}
                      onChange={(e) =>
                        setBusinessFields({ ...businessFields, pricingStrategy: e.target.value })
                      }
                      placeholder="How do you price your offerings?"
                    />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <label className="text-sm font-medium">Main channels</label>
                    <Input
                      value={businessFields.mainChannels}
                      onChange={(e) =>
                        setBusinessFields({ ...businessFields, mainChannels: e.target.value })
                      }
                      placeholder="How do you reach customers?"
                    />
                  </div>
                </div>
                <Button onClick={handleSubmitBusinessFields} className="w-full md:w-auto">
                  Submit Business Details
                </Button>
              </div>
            ) : (
              <>
                {pdfUploaded && (
                  <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2">
                    <FileUp className="w-5 h-5" />
                    <span>{pdfName}</span>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <h1 className="text-4xl font-bold mb-8 animate-fade-in text-[#0f172a]">
                      What can I help with?
                    </h1>
                  </div>
                ) : (
                  <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
                    {(message || pdfUploaded) && (
                      <div className="p-4 rounded-lg bg-[#0f172a] text-white w-fit ml-auto animate-fade-in opacity-50">
                        {pdfUploaded && (
                          <div className="text-xs text-muted-foreground mb-1">
                            <FileUp className="w-3 h-3 inline mr-1" />
                            {pdfName}
                          </div>
                        )}
                        {message}
                      </div>
                    )}
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
                        <div>
                          {msg.pdfName && (
                            <div className="text-xs text-muted-foreground mb-1">
                              <FileUp className="w-3 h-3 inline mr-1" />
                              {msg.pdfName}
                            </div>
                          )}
                          {msg.isUser ? (
                            msg.text
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: formatModelResponse(msg.text),
                              }}
                            />
                          )}
                        </div>
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
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-12 px-4"
                    >
                      <FileUp className="w-5 h-5" />
                    </Button>
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
                      <ActionButton
                        label="Analyze my Market"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                      <ActionButton
                        label="Review Business Plan"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                      <ActionButton
                        label="Financial Insights"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                      <ActionButton
                        label="Risk Assessment"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                      <ActionButton
                        label="Growth Strategy"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                      <ActionButton
                        label="Competitor Analysis"
                        onClick={(text) => setMessage(message => message ? `${message} ${text}` : text)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
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
