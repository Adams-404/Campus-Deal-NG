
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationContextType {
  isEnabled: boolean;
  isPushSupported: boolean;
  isSubscribed: boolean;
  unreadCount: number;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

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
      }
    };

    getUserId();
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }

        setUnreadCount(count || 0);
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
      }, () => {
        // Refetch the count when notifications change
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
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
        toggleNotifications 
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
