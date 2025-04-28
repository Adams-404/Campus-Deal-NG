import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { CircleDot } from "lucide-react"; // Added for unread message indicator
import { useNotifications } from "@/contexts/NotificationContext"; // Import to use for marking messages as read
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const Messages = () => {
  const { toast } = useToast();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { unreadMessagesByUser, markConversationAsRead } = useNotifications();
  const { theme } = useSettings();

  useEffect(() => {
    // Check for existing user session
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchConversations = async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversations_participants (
            user_id,
            user:profiles (*)
          ),
          last_message:messages (*)
        `)
        .contains('participants', [{ user_id: user.id }])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error!",
          description: "Failed to fetch conversations. Please try again.",
          variant: "destructive",
        });
        return [];
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching conversations:", error);
      toast({
        title: "Error!",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const { data: fetchedConversations, isLoading: isConversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: fetchConversations,
    enabled: !!user,
  });

  useEffect(() => {
    if (fetchedConversations) {
      setConversations(fetchedConversations);
    }
  }, [fetchedConversations]);

  useEffect(() => {
    if (conversationsError) {
      toast({
        title: "Error!",
        description: "Failed to fetch conversations. Please try again.",
        variant: "destructive",
      });
    }
  }, [conversationsError, toast]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error!",
          description: "Failed to fetch messages. Please try again.",
          variant: "destructive",
        });
        return [];
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching messages:", error);
      toast({
        title: "Error!",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const { data: fetchedMessages, isLoading: isMessagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId as string),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    if (messagesError) {
      toast({
        title: "Error!",
        description: "Failed to fetch messages. Please try again.",
        variant: "destructive",
      });
    }
  }, [messagesError, toast]);

  useEffect(() => {
    if (conversationId && user) {
      // Mark messages as read when viewing a conversation
      markConversationAsRead(conversationId);
      
      // Find the selected conversation
      const selected = conversations.find(convo => convo.id === conversationId);
      if (selected) {
        setCurrentConversation(selected);
      }
    }
  }, [conversationId, conversations, user, markConversationAsRead]);

  const createMessage = async (message: { content: string; conversation_id: string; sender_id: string; receiver_id: string }) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select('*');

    if (error) {
      console.error("Error creating message:", error);
      toast({
        title: "Error!",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      throw new Error("Failed to create message");
    }

    return data ? data[0] : null;
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(createMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations', user?.id]);
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Error!",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !user) return;

    const receiver = currentConversation.participants.find((p: any) => p.user_id !== user.id);

    if (!receiver) {
      toast({
        title: "Error!",
        description: "Could not determine the receiver for this message.",
        variant: "destructive",
      });
      return;
    }

    const message = {
      content: newMessage,
      conversation_id: currentConversation.id,
      sender_id: user.id,
      receiver_id: receiver.user_id,
    };

    mutation.mutate(message);
  };

  const renderConversationList = () => {
    return conversations.map((convo) => {
      const otherUser = convo.participants.find((p: any) => p.user_id !== user?.id)?.user;
      const unreadCount = otherUser ? unreadMessagesByUser[otherUser.id] || 0 : 0;
      
      return (
        <div
          key={convo.id}
          className={`p-4 border-b flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            convo.id === conversationId ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
          onClick={() => navigate(`/messages/${convo.id}`)}
        >
          <div className="relative">
            <Avatar className="h-12 w-12">
              <img
                src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser?.name || "User"}`}
                alt={otherUser?.name || "User"}
              />
            </Avatar>
            
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                {unreadCount}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{otherUser?.name || "User"}</h3>
              {convo.last_message && (
                <span className="text-xs text-gray-500">
                  {new Date(convo.last_message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {convo.last_message?.content || "No messages yet"}
            </p>
          </div>
        </div>
      );
    });
  };

  const renderMessageBubbles = () => {
    return messages.map((msg) => {
      const isCurrentUser = msg.sender_id === user?.id;
      const messageDate = new Date(msg.created_at);
      const formattedTime = format(messageDate, 'h:mm a');

      return (
        <div
          key={msg.id}
          className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`rounded-xl px-4 py-2 my-1 text-sm ${isCurrentUser
              ? 'bg-primary text-secondary'
              : theme === 'dark'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <p>{msg.content}</p>
            <div className="text-xs text-gray-500 mt-1 text-right">{formattedTime}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 h-screen flex flex-col">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 justify-start">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex h-full">
        {/* Conversation List */}
        <div className="w-1/3 border-r overflow-y-auto">
          <h2 className="sticky top-0 bg-background z-10 p-4 font-semibold text-lg border-b">Conversations</h2>
          {isConversationsLoading ? (
            <div className="p-4">Loading conversations...</div>
          ) : (
            <div>{renderConversationList()}</div>
          )}
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">
                  {currentConversation.participants.find((p: any) => p.user_id !== user?.id)?.user?.name || "Chat"}
                </h2>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 p-4 overflow-y-auto">
                <ScrollArea className="h-full">
                  {isMessagesLoading ? (
                    <div>Loading messages...</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {renderMessageBubbles()}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={mutation.isLoading}>
                    {mutation.isLoading ? "Sending..." : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {isConversationsLoading ? (
                <div>Loading...</div>
              ) : (
                <div>Select a conversation to start messaging.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
