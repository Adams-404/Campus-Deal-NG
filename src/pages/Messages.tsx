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
  MessageSquare, 
  Phone, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  image_url: string | null;
  item_id: string | null;
  items?: {
    id: string;
    title: string;
    price: number;
    item_images: { image_url: string }[];
  };
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string;
  last_message_at: string;
  buyer_profile: Profile;
  seller_profile: Profile;
  messages: Message[];
  other_user: Profile;
  item?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  item_title?: string;
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
  image_url: string | null;
  item_id?: string;
}

interface GroupedConversation {
  other_user: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    phone?: string;
  };
  items: {
    id: string;
    conversation_id: string;
    last_message?: string;
    last_message_at?: string;
    item_title?: string;
  }[];
}

interface QueryMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  item_id: string;
  image_url: string | null;
  items?: {
    id: string;
    title: string;
    price: number;
    item_images: { image_url: string }[];
  };
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
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/signin');
        return;
      }
      setCurrentUser(user);

      // Get the user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUserProfile(profileData);
      fetchConversations(user.id);
    };
    setup();
    
    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        
        // Get the user's profile on auth change
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setCurrentUserProfile(profileData);
        fetchConversations(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Cleanup previous subscription if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    if (conversationId && currentUser?.id) {
      fetchMessages(conversationId);
      
      // Create and subscribe to the channel
      const channel = supabase.channel(`room:${conversationId}`);
      
      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        }, () => {
          console.log('Conversation updated');
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
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          
          // Add message to state if it's not already there
          setMessages(current => {
            const messageExists = current.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              return current;
            }
            return [...current, newMessage];
          });
          
          // Automatically switch to the item being discussed
          if (newMessage.item_id && (!selectedItemId || selectedItemId !== newMessage.item_id)) {
            setSelectedItemId(newMessage.item_id);
          }
          
          scrollToBottom();
        })
        .subscribe(status => {
          console.log(`Subscription status for room:${conversationId}:`, status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
          }
        });

      // Store channel reference for cleanup
      channelRef.current = channel;
      
      // Scroll to bottom when entering chat
      setTimeout(scrollToBottom, 300);

      return () => {
        console.log('Cleaning up Supabase channel');
        supabase.removeChannel(channel);
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
  }, [filteredMessages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  };

  const fetchConversations = async (userId: string) => {
    try {
      console.log('Fetching conversations for user:', userId);
      
      // Get conversations where the user is either buyer or seller
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          buyer_id,
          seller_id,
          last_message,
          last_message_at,
          buyer_profile:profiles!buyer_id (
            id,
            first_name,
            last_name,
            avatar_url,
            phone
          ),
          seller_profile:profiles!seller_id (
            id,
            first_name,
            last_name,
            avatar_url,
            phone
          ),
          messages (
            id,
            content,
            created_at,
            sender_id,
            item_id,
            image_url,
            items (
              id,
              title,
              price,
              item_images (
                image_url
              )
            )
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Transform the data into the expected format
      const formattedConversations = (conversationsData || []).map(conv => {
        const otherUser = userId === conv.seller_id ? conv.buyer_profile : conv.seller_profile;
        
        // Get the first message that has an item (which should be the initial message)
        const messageWithItem = conv.messages?.find(msg => msg.items);
        const item = messageWithItem?.items;

        // Add conversation_id to each message and ensure all fields are properly typed
        const formattedMessages = (conv.messages as QueryMessage[] || []).map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          conversation_id: conv.id,
          created_at: msg.created_at,
          image_url: msg.image_url || null,
          item_id: msg.item_id || null,
          items: msg.items
        }));

        return {
          id: conv.id,
          buyer_id: conv.buyer_id,
          seller_id: conv.seller_id,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          buyer_profile: conv.buyer_profile,
          seller_profile: conv.seller_profile,
          messages: formattedMessages,
          other_user: {
            id: otherUser.id,
            first_name: otherUser.first_name ?? null,
            last_name: otherUser.last_name ?? null,
            avatar_url: otherUser.avatar_url ?? null,
            phone: otherUser.phone ?? null
          },
          item: item ? {
            id: item.id,
            title: item.title,
            price: item.price,
            images: item.item_images?.map(img => img.image_url) || []
          } : undefined,
          item_title: item?.title || 'Unknown Item'
        };
      });

      console.log('Formatted conversations:', formattedConversations);
      setConversations(formattedConversations);

      if (conversationId) {
        const selected = formattedConversations.find(c => c.id === conversationId);
        setSelectedConversation(selected || null);
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
          created_at,
          image_url,
          item_id,
          items (
            id,
            title,
            price,
            item_images (
              image_url
            )
          )
        `)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Add conversation_id to each message and ensure all fields are properly typed
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        conversation_id: convId,
        created_at: msg.created_at,
        image_url: msg.image_url || null,
        item_id: msg.item_id || null,
        items: msg.items
      }));
      
      setMessages(formattedMessages);
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

      // Clear input
      setNewMessage('');
      
      // Send message to server
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: cleanMessage,
          sender_id: currentUser.id,
          created_at: timestamp,
          item_id: itemId || null
        })
        .select();

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
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const markConversationAsRead = async (convId: string) => {
    // Remove this function since we're removing unread functionality
  };

  const markConversationAsUnread = async (convId: string) => {
    // Remove this function since we're removing unread functionality
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.other_user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.item_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupConversationsByUser = (conversations: Conversation[]): GroupedConversation[] => {
    const groupedMap = conversations.reduce((acc, conv) => {
      const userId = conv.other_user.id;
      if (!acc.has(userId)) {
        acc.set(userId, {
          other_user: conv.other_user,
          items: []
        });
      }
      
      // Only add unique items
      const existingItem = acc.get(userId)!.items.find(item => item.id === conv.id);
      if (!existingItem) {
        acc.get(userId)!.items.push({
          id: conv.id,
          conversation_id: conv.id,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          item_title: conv.item_title
        });
      }
      
      return acc;
    }, new Map<string, GroupedConversation>());

    return Array.from(groupedMap.values()).sort((a, b) => {
      const aLatest = Math.max(...a.items.map(i => i.last_message_at ? new Date(i.last_message_at).getTime() : 0));
      const bLatest = Math.max(...b.items.map(i => i.last_message_at ? new Date(i.last_message_at).getTime() : 0));
      return bLatest - aLatest;
    });
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleProfileClick = async (profileId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;
    if (profileId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/user-profile/${profileId}`);
    }
  };

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
        <div className={`w-full sm:w-[380px] border-r border-white/10 flex flex-col ${
          conversationId ? 'hidden sm:flex' : 'flex'
        }`}>
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
              {groupConversationsByUser(filteredConversations).length > 0 ? (
                groupConversationsByUser(filteredConversations).map((group) => (
                  <motion.div
                    key={group.other_user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-b border-white/10"
                  >
                    <div 
                      className="p-4 px-6 hover:bg-white/5 cursor-pointer transition-all"
                      onClick={() => toggleUserExpanded(group.other_user.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar 
                            className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${group.other_user.id}`);
                            }}
                          >
                            <AvatarImage src={group.other_user.avatar_url} />
                            <AvatarFallback>
                              <User className="h-5 w-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-lg">
                              {group.other_user.first_name && group.other_user.last_name 
                                ? `${group.other_user.first_name} ${group.other_user.last_name}`
                                : group.other_user.first_name || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2">
                              {group.other_user.phone && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`tel:${group.other_user.phone}`);
                                    }}
                                    className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    title="Call"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://wa.me/${group.other_user.phone?.replace(/\+/g, '')}`);
                                    }}
                                    className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    title="WhatsApp"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                  </Button>
                                </>
                              )}
                              <p className="text-sm text-muted-foreground/60">
                                {group.items.length} items
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedUsers.has(group.other_user.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => navigate(`/messages/${item.conversation_id}`)}
                              className={`p-4 pl-16 border-t border-white/10 hover:bg-white/5 cursor-pointer transition-all ${
                                conversationId === item.conversation_id ? 'bg-white/5' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-primary truncate">
                                    {item.item_title || 'Unknown Item'}
                                  </p>
                                  {item.last_message && (
                                    <p className="text-sm truncate mt-1 text-muted-foreground/60">
                                      {item.last_message}
                                    </p>
                                  )}
                                  {item.last_message_at && (
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                      {format(new Date(item.last_message_at), 'MMM d, HH:mm')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                >
                  <div className="w-24 h-24 mb-6 text-muted-foreground/40">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-full h-full"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 10h.01" />
                      <path d="M12 10h.01" />
                      <path d="M16 10h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                  <p className="text-sm text-muted-foreground/60 max-w-[250px]">
                    Start a conversation by browsing items and messaging sellers
                  </p>
                  <Button
                    onClick={() => navigate('/home')}
                    className="mt-6 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Browse Items
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat Area */}
        {conversationId && selectedConversation ? (
          <div className="flex-1 flex flex-col h-[100dvh] fixed inset-0 bg-background sm:relative sm:h-auto">
            {/* Chat Header */}
            <div className="h-16 sm:h-20 border-b border-white/10 flex items-center px-3 sm:px-6 flex-shrink-0 backdrop-blur-sm bg-secondary/20">
              <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/messages')}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:hidden hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Avatar 
                  className="h-9 w-9 sm:h-12 sm:w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/20 cursor-pointer"
                  onClick={() => navigate(`/user/${selectedConversation.other_user.id}`)}
                >
                  <AvatarImage src={selectedConversation.other_user.avatar_url} />
                  <AvatarFallback>
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-sm sm:text-lg font-medium truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/user/${selectedConversation.other_user.id}`)}
                      >
                        {selectedConversation.other_user.first_name && selectedConversation.other_user.last_name 
                          ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                          : selectedConversation.other_user.first_name || 'Anonymous'}
                      </p>
                      {selectedConversation.item && (
                        <p className="text-xs sm:text-sm text-primary truncate">
                          Discussing: {selectedConversation.item.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`tel:${selectedConversation.other_user.phone}`)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    title="Call"
                  >
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`https://wa.me/${selectedConversation.other_user.phone?.replace(/\+/g, '')}`)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    title="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto pb-safe" ref={messageContainerRef}>
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                {selectedConversation.item && (
                  <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="relative w-24 sm:w-32 h-24 sm:h-32 rounded-lg overflow-hidden ring-2 ring-primary/20">
                      <img 
                        src={selectedConversation.item.images[0]} 
                        alt={selectedConversation.item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center p-2">
                        <span className="text-xs text-muted-foreground">
                          ₦{selectedConversation.item.price}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-xs sm:text-sm">{selectedConversation.item.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-0.5 sm:mt-1">Started conversation about this item</p>
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {Object.entries(
                    messages.reduce((groups, message) => {
                      const date = format(new Date(message.created_at), 'yyyy-MM-dd');
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(message);
                      return groups;
                    }, {} as Record<string, Message[]>)
                  ).map(([date, dateMessages]) => (
                    <motion.div key={date}>
                      <div className="flex items-center justify-center my-4">
                        <div className="px-3 py-1.5 rounded-full bg-secondary/30 backdrop-blur-sm">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(date), "EEEE, MMMM d")}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dateMessages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex items-end gap-2 ${
                              message.sender_id === currentUser?.id ? 'flex-row-reverse' : 'flex-row'
                            } mb-2 last:mb-0`}
                          >
                            <Avatar 
                              className="h-6 w-6 sm:h-8 sm:w-8 ring-2 ring-offset-2 ring-offset-background ring-primary/20 flex-shrink-0 cursor-pointer"
                              onClick={() => navigate(`/user/${message.sender_id}`)}
                            >
                              <AvatarImage 
                                src={message.sender_id === currentUser?.id 
                                  ? currentUserProfile?.avatar_url
                                  : selectedConversation.other_user.avatar_url
                                } 
                              />
                              <AvatarFallback>
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "max-w-[85%] sm:max-w-[70%] rounded-2xl p-2.5 sm:p-4 shadow-sm transition-colors duration-200",
                                message.sender_id === currentUser?.id
                                  ? "border-2 border-primary/60 hover:border-primary/80 bg-primary/5 text-foreground rounded-br-sm"
                                  : "border-2 border-green-500/60 hover:border-green-500/80 bg-green-500/5 text-foreground rounded-bl-sm"
                              )}
                            >
                              {message.image_url && (
                                <img
                                  src={message.image_url}
                                  alt="Message attachment"
                                  className="rounded-lg mb-2 max-w-full"
                                />
                              )}
                              <p className="break-words text-[13px] sm:text-[15px] leading-relaxed">{message.content}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground text-right mt-1.5">
                                {format(new Date(message.created_at), 'HH:mm')}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 border-t border-white/10 bg-secondary/20 backdrop-blur-sm p-3 sm:p-6">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 sm:gap-3"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-white/10"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl hover:bg-white/10"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border-white/10 focus:border-primary/50 transition-colors rounded-xl text-sm sm:text-base h-8 sm:h-10 min-h-[32px] sm:min-h-[40px]"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
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
