
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

// Define proper types for our notifications and messages
interface NotificationType {
  id: string;
  type: string;
  title: string;
  content: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface MessageType {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  is_read: boolean;
  created_at: string;
  item_id?: string | null;
  image_url?: string | null;
}

// Define context type
interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationType[];
  messages: MessageType[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  markMessageAsRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      // Get notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (notificationError) throw notificationError;

      // Get recent unread messages
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (messageError) throw messageError;

      setNotifications(notificationData as NotificationType[]);
      setMessages(messageData as MessageType[]);
      setUnreadCount(
        (notificationData?.filter((n: NotificationType) => !n.is_read).length || 0) +
        (messageData?.length || 0)
      );

      // Track analytics
      trackEvent('notifications_loaded', {
        notificationCount: notificationData?.length || 0,
        unreadMessageCount: messageData?.length || 0
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Check authentication and setup realtime subscription
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };

    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  // Fetch notifications when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setMessages([]);
      setUnreadCount(0);
    }
  }, [userId]);

  // Setup realtime subscriptions for notifications and messages
  useEffect(() => {
    if (!userId) return;

    // Subscribe to notifications
    const notificationSubscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to messages
    const messageSubscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const message = payload.new as MessageType;
          if (message && !message.is_read && message.receiver_id === userId) {
            fetchNotifications();
            showMessageToast(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(messageSubscription);
    };
  }, [userId]);

  // Mark a notification as read
  const markNotificationAsRead = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      fetchNotifications();
      
      // Track analytics
      trackEvent('notification_marked_read');
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      fetchNotifications();
      
      // Track analytics
      trackEvent('all_notifications_marked_read');
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  // Mark a message as read
  const markMessageAsRead = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      fetchNotifications();
      
      // Track analytics
      trackEvent('message_marked_read');
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast.error("Failed to update message");
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
      setNotifications([]);
      fetchNotifications();
      
      // Track analytics
      trackEvent('notifications_cleared');
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  // Show a toast for new messages
  const showMessageToast = (messageData: MessageType) => {
    toast(
      "New message",
      {
        description: messageData.content.substring(0, 60) + (messageData.content.length > 60 ? "..." : ""),
        action: {
          label: "View",
          onClick: () => navigate(`/messages?conversation=${messageData.conversation_id}`),
        },
      }
    );
    
    // Track analytics
    trackEvent('message_notification_shown');
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
    
    // Track analytics
    trackEvent('notifications_refreshed');
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        messages,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        markMessageAsRead,
        clearNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
