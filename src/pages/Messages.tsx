import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  User, 
  ArrowLeft, 
  Image as ImageIcon,
  Search,
  Smile,
  Paperclip,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  image_url?: string;
  read?: boolean;
  item_id?: string;
  item?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  item?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

interface DatabaseConversation {
  id: string;
  last_message: string | null;
  last_message_at: string | null;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  item: {
    id: string;
    title: string;
    price: number;
    item_images: Array<{
      image_url: string;
    }>;
  } | null;
  buyer_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  seller_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface DatabaseMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  image_url?: string;
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
        return;
      }
      setCurrentUser(user);
      fetchConversations(user.id);
    };
    setup();
  }, []);

  useEffect(() => {
    if (conversationId && currentUser?.id) {
      fetchMessages(conversationId);
      markConversationAsRead(conversationId);
      
      // Subscribe to both conversations and messages
      const channel = supabase.channel(`room:${conversationId}`);
      
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        }, () => {
          if (currentUser?.id) {
            fetchConversations(currentUser.id);
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, payload => {
          const newMessage = payload.new as Message;
          setMessages(current => [...current, newMessage]);
          
          // Automatically switch to the item being discussed
          if (newMessage.item_id && (!selectedItemId || selectedItemId !== newMessage.item_id)) {
            setSelectedItemId(newMessage.item_id);
          }
          
          // If the new message is not from current user, mark it as unread
          if (newMessage.sender_id !== currentUser.id) {
            markConversationAsUnread(conversationId);
          }
          scrollToBottom();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      let messagesToShow = messages;
      
      if (selectedItemId) {
        messagesToShow = messages.filter(msg => msg.item_id === selectedItemId);
      } else {
        // Show most recent item's messages by default if no item selected
        const mostRecentMessage = messages
          .slice()
          .reverse()
          .find(msg => msg.item_id);
        
        if (mostRecentMessage?.item_id && !selectedItemId) {
          setSelectedItemId(mostRecentMessage.item_id);
          messagesToShow = messages.filter(msg => msg.item_id === mostRecentMessage.item_id);
        }
      }

      // Sort messages by date for the selected item
      const sortedMessages = messagesToShow.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setFilteredMessages(sortedMessages);
      
      // Scroll to bottom after a short delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, selectedItemId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async (userId: string) => {
    try {
      console.log('Fetching conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message,
          last_message_at,
          buyer_id,
          seller_id,
          buyer_profile:profiles!buyer_id (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          seller_profile:profiles!seller_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      console.log('Conversations data:', data);
      console.log('Conversations error:', error);

      if (error) throw error;

      if (data) {
        const formattedConversations = (data as DatabaseConversation[]).map(conv => {
          const otherUser = userId === conv.seller_id ? conv.buyer_profile : conv.seller_profile;
          console.log('Formatting conversation:', conv.id);
          
          return {
            id: conv.id,
            other_user: {
              id: otherUser.id,
              first_name: otherUser.first_name ?? undefined,
              last_name: otherUser.last_name ?? undefined,
              avatar_url: otherUser.avatar_url ?? undefined
            },
            last_message: conv.last_message ?? undefined,
            last_message_at: conv.last_message_at ?? undefined,
            unread_count: 0
          };
        });

        console.log('Formatted conversations:', formattedConversations);
        setConversations(formattedConversations);

        if (conversationId) {
          const selected = formattedConversations.find(c => c.id === conversationId);
          setSelectedConversation(selected || null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error(error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          image_url
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(error.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !currentUser) return;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      const timestamp = new Date().toISOString();

      // Check if message starts with item tag (e.g., #itemId)
      const itemTagMatch = messageContent.match(/^#(\w+)/);
      const itemId = itemTagMatch?.[1];
      const cleanMessage = itemTagMatch ? messageContent.replace(/^#\w+\s*/, '').trim() : messageContent;

      if (cleanMessage.length === 0) {
        toast.error('Please enter a message');
        return;
      }

      // Clear input and add optimistic message immediately
      setNewMessage('');
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: cleanMessage,
        sender_id: currentUser.id,
        created_at: timestamp,
        item_id: itemId
      };
      setMessages(current => [...current, optimisticMessage]);
      scrollToBottom();

      // Send message to server
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: cleanMessage,
          sender_id: currentUser.id,
          created_at: timestamp,
          item_id: itemId
        });

      if (messageError) throw messageError;

      // Update conversation last message
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message: cleanMessage,
          last_message_at: timestamp
        })
        .eq('id', conversationId);

      if (conversationError) throw conversationError;

      // If this is a new item being discussed, fetch the updated messages to get item details
      if (itemId) {
        fetchMessages(conversationId);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const markConversationAsRead = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', convId)
        .eq(currentUser?.id === selectedConversation?.other_user.id ? 'seller_id' : 'buyer_id', currentUser?.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const markConversationAsUnread = async (convId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          unread_count: supabase.sql`unread_count + 1`
        })
        .eq('id', convId)
        .eq(currentUser?.id === selectedConversation?.other_user.id ? 'buyer_id' : 'seller_id', currentUser?.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking conversation as unread:', error);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.other_user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.item?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.item?.price.toString().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex">
        {/* Conversations Sidebar */}
        <div className={`w-full sm:w-[380px] border-r border-white/10 flex flex-col ${conversationId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="h-24 border-b border-white/10 flex flex-col justify-center px-6 gap-3 bg-secondary/20 backdrop-blur-sm">
            <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 transition-colors rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                  className={`p-4 px-6 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-all ${
                    conversationId === conversation.id ? 'bg-white/5' : ''
                  } ${conversation.unread_count ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                        <AvatarImage src={conversation.other_user.avatar_url} />
                        <AvatarFallback>
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[11px] font-medium text-primary-foreground">
                            {conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium truncate ${conversation.unread_count ? 'text-primary' : ''}`}>
                          {conversation.other_user.first_name || 'Anonymous'}
                        </p>
                        {conversation.last_message_at && (
                          <span className={`text-xs ${conversation.unread_count ? 'text-primary' : 'text-muted-foreground/60'}`}>
                            {format(new Date(conversation.last_message_at), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      {conversation.item && (
                        <div className="flex items-center gap-2 mt-2">
                          {conversation.item.images?.[0] && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                              <img 
                                src={conversation.item.images[0]} 
                                alt={conversation.item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-primary">
                              {conversation.item.title}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              ₦{conversation.item.price}
                            </p>
                          </div>
                        </div>
                      )}
                      {conversation.last_message && (
                        <p className={`text-sm truncate mt-2 ${
                          conversation.unread_count 
                            ? 'text-primary/90 font-medium' 
                            : 'text-muted-foreground/60'
                        }`}>
                          {conversation.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Area */}
        {conversationId && selectedConversation ? (
          <div className="flex-1 flex flex-col h-[100dvh] fixed inset-0 bg-background sm:relative sm:flex">
            {/* Chat Header */}
            <div className="h-24 border-b border-white/10 flex items-center px-6 flex-shrink-0 backdrop-blur-sm bg-secondary/20">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="h-10 w-10 rounded-xl sm:hidden hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                  <AvatarImage src={selectedConversation.other_user.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium">
                    {selectedConversation.other_user.first_name || 'Anonymous'}
                  </p>
                  {selectedConversation.item && (
                    <p className="text-sm text-primary truncate">
                      Discussing: {selectedConversation.item.title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto" ref={messageContainerRef}>
              <div className="p-6 space-y-6">
                {selectedConversation.item && (
                  <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden ring-2 ring-primary/20">
                      <img 
                        src={selectedConversation.item.images[0]} 
                        alt={selectedConversation.item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-2">
                        <span className="text-xs font-medium text-white">₦{selectedConversation.item.price}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{selectedConversation.item.title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Started conversation about this item</p>
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${
                        message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl p-4 shadow-lg",
                          message.sender_id === currentUser?.id
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-white/5 rounded-bl-sm"
                        )}
                      >
                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Message attachment"
                            className="rounded-lg mb-2 max-w-full"
                          />
                        )}
                        <p className="break-words text-[15px]">{message.content}</p>
                        <p className="text-xs opacity-60 text-right mt-1.5">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 border-t border-white/10 bg-secondary/20 backdrop-blur-sm p-6">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-white/10"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-white/10"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border-white/10 focus:border-primary/50 transition-colors rounded-xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-secondary/10">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h2 className="mt-4 text-xl font-medium">Select a conversation</h2>
              <p className="mt-2 text-sm text-muted-foreground/60">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
