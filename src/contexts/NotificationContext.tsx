
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
// emailjs removed; using server-side Resend via API route

interface NotificationContextType {
  isEnabled: boolean;
  isPushSupported: boolean;
  isSubscribed: boolean;
  unreadCount: number;
  unreadMessagesByUser: Record<string, number>;
  toggleNotifications: () => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [unreadMessagesByUser, setUnreadMessagesByUser] = useState<Record<string, number>>({});
  const sentEmailIdsRef = useRef<Set<string>>(new Set());

  const emailEnabled = Boolean(import.meta.env.VITE_ENABLE_NOTIFICATION_EMAILS === 'true');

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsPushSupported(true);
      
      // Check if already subscribed
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
        setIsSubscribed(true);
      }
    }

    // Get the current user 
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
      }
    };

    getUserId();
  }, []);

  const sendNotificationEmail = async (notification: any) => {
    if (!emailEnabled || !userEmail) return;
    const id = notification?.id as string | undefined;
    if (!id || sentEmailIdsRef.current.has(id)) return;
    sentEmailIdsRef.current.add(id);

    try {
      await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: notification?.title ?? 'New notification',
          message: notification?.content ?? '',
          type: notification?.type ?? 'info',
          created_at: notification?.created_at ?? new Date().toISOString(),
        }),
      });
    } catch (e) {
      // Silently ignore email failures in client
    }
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        // Get count using select and filter
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up realtime subscription for notifications
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', {
        event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Refetch the count when notifications change
        fetchUnreadCount();
        // On INSERT, optionally send email with content
        if (payload.eventType === 'INSERT' && (payload.new as any)?.is_read === false) {
          sendNotificationEmail(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  
  // Fetch unread messages by sender
  useEffect(() => {
    if (!userId) return;
    
    const fetchUnreadMessages = async () => {
      try {
        // First get all unread messages
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', userId)
          .eq('is_read', false);
          
        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }
        
        // Count messages by sender
        const messagesByUser: Record<string, number> = {};
        if (data) {
          data.forEach(message => {
            const senderId = message.sender_id;
            messagesByUser[senderId] = (messagesByUser[senderId] || 0) + 1;
          });
        }
        
        setUnreadMessagesByUser(messagesByUser);
        console.log('Unread messages by sender:', messagesByUser);
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };
    
    fetchUnreadMessages();
    
    // Supabase native realtime subscription for messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          // Only update if the message is unread and for this user
          if (payload.new && payload.new.receiver_id === userId && !payload.new.is_read) {
            const senderId = payload.new.sender_id;
            setUnreadMessagesByUser(prev => ({
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1
            }));
          }
          // Optionally, refetch all unread messages for full sync:
          // fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markConversationAsRead = async (conversationId: string) => {
    if (!userId) return;
    
    try {
      // Update all messages in the conversation to be read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId);
        
      if (error) {
        console.error('Error marking conversation as read:', error);
        return;
      }
      
      // Update the local state
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .limit(1);
        
      if (data && data.length > 0) {
        const senderId = data[0].sender_id;
        setUnreadMessagesByUser(prev => {
          const updated = { ...prev };
          delete updated[senderId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const toggleNotifications = async () => {
    if (!isPushSupported) {
      toast.error("Push notifications are not supported in your browser");
      return;
    }

    try {
      if (!isEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register service worker
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          
          // Subscribe to push notifications
          const applicationServerKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
          
          if (!applicationServerKey) {
            console.error('VAPID public key is not defined');
            toast.error("Push notification setup is incomplete");
            return;
          }
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });

          // Send subscription to backend
          // await fetch('/api/notifications/subscribe', {
          //   method: 'POST',
          //   body: JSON.stringify(subscription),
          // });

          setIsEnabled(true);
          setIsSubscribed(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Permission denied for push notifications");
        }
      } else {
        // Unsubscribe from push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Notify backend
          // await fetch('/api/notifications/unsubscribe', {
          //   method: 'POST',
          //   body: JSON.stringify(subscription),
          // });
        }

        setIsEnabled(false);
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error("Failed to toggle notifications");
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        isEnabled, 
        isPushSupported, 
        isSubscribed, 
        unreadCount,
        unreadMessagesByUser,
        toggleNotifications,
        markConversationAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
