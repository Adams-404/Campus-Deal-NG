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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  image_url?: string;
}

interface Conversation {
  id: string;
  item: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  other_user: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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
    if (conversationId) {
      fetchMessages(conversationId);
      
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
          setMessages(current => [...current, payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message,
          last_message_at,
          buyer_id,
          seller_id,
          items!inner (
            id,
            title,
            price,
            item_images (
              image_url
            )
          ),
          buyer_profile:profiles!buyer_id(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          seller_profile:profiles!seller_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedConversations = data.map(conv => ({
          id: conv.id,
          item: {
            id: conv.items.id,
            title: conv.items.title,
            price: conv.items.price,
            images: conv.items.item_images?.map((img: any) => img.image_url) || []
          },
          other_user: userId === conv.seller_id 
            ? conv.buyer_profile 
            : conv.seller_profile,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at
        }));
        setConversations(formattedConversations);

        if (conversationId) {
          const selected = formattedConversations.find(c => c.id === conversationId);
          setSelectedConversation(selected || null);
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
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

      // Clear input and add optimistic message immediately
      setNewMessage('');
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: currentUser.id,
        created_at: timestamp
      };
      setMessages(current => [...current, optimisticMessage]);
      scrollToBottom();

      // Send message to server
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          sender_id: currentUser.id,
          created_at: timestamp
        });

      if (messageError) throw messageError;

      // Update conversation last message
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_at: timestamp
        })
        .eq('id', conversationId);

      if (conversationError) throw conversationError;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.other_user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.item.title.toLowerCase().includes(searchQuery.toLowerCase())
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
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                      <AvatarImage src={conversation.other_user.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conversation.other_user.first_name || 'Anonymous'}
                        </p>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground/60">
                            {format(new Date(conversation.last_message_at), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        <p className="text-xs text-muted-foreground/80 truncate">
                          {conversation.item.title}
                        </p>
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground/60 truncate mt-1">
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
                <div>
                  <p className="text-lg font-medium">
                    {selectedConversation.other_user.first_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-muted-foreground/80">
                    {selectedConversation.item.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto" ref={messageContainerRef}>
              <div className="p-6 space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="bg-white/5 rounded-full px-4 py-2 text-xs text-muted-foreground/60 backdrop-blur-sm">
                    Conversation started about {selectedConversation.item.title}
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
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
                        className={`max-w-[70%] rounded-2xl p-4 shadow-lg ${
                          message.sender_id === currentUser?.id
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-white/5 rounded-bl-sm'
                        }`}
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
