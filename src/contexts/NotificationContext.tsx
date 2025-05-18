
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

interface NotificationContextType {
  notifications: any[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  realtimeNotifications: () => void;
  unreadCount: number;
  isEnabled?: boolean;
  isPushSupported?: boolean;
  toggleNotifications?: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const { user } = useUser();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(notif => !notif.is_read).length || 0);
    } catch (error) {
      console.error('Unexpected error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Check if push notifications are supported and enabled
      const checkPushSupport = async () => {
        const supported = 'Notification' in window;
        setIsPushSupported(supported);
        
        if (supported) {
          const permission = Notification.permission;
          setIsEnabled(permission === 'granted');
        }
      };
      
      checkPushSupport();
    }
  }, [user, fetchNotifications]);

  const toggleNotifications = async () => {
    if (!isPushSupported) return;
    
    if (Notification.permission === 'granted') {
      // We can't revoke permissions once granted, so just update UI state
      setIsEnabled(false);
      // Save user preference in database
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_enabled: false })
          .eq('id', user.id);
      }
    } else {
      try {
        const permission = await Notification.requestPermission();
        setIsEnabled(permission === 'granted');
        // Save user preference in database
        if (user && permission === 'granted') {
          await supabase
            .from('profiles')
            .update({ push_enabled: true })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications(prevNotifications =>
          prevNotifications.map(notif =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Unexpected error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        setNotifications(prevNotifications =>
          prevNotifications.map(notif => ({
            ...notif,
            is_read: true
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Unexpected error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
      } else {
        setNotifications(prevNotifications =>
          prevNotifications.filter(notif => notif.id !== notificationId)
        );
        setUnreadCount(prevCount => {
          const deletedNotification = notifications.find(notif => notif.id === notificationId);
          if (deletedNotification && !deletedNotification.is_read) {
            return Math.max(0, prevCount - 1);
          }
          return prevCount;
        });
      }
    } catch (error) {
      console.error('Unexpected error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting all notifications:', error);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Unexpected error deleting all notifications:', error);
    }
  };

  const realtimeNotifications = () => {
    if (!user) return;

    supabase
      .channel('public:notifications:user_id=eq.' + user.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, async (payload) => {
        console.log('Change received!', payload);
        await fetchNotifications();
        
        if (payload.new) {
          const notification = payload.new;
          const newNotif = {
            ...notification,
            data: notification.data
          };
          
          if (newNotif.data && typeof newNotif.data === 'object' && 'receiver_id' in newNotif.data) {
            // Now you can use newNotif.data.receiver_id safely
            if (newNotif.data.receiver_id === user.id) {
              setUnreadCount(prevCount => prevCount + 1);
            }
          }
        }
      })
      .subscribe();
  };

  useEffect(() => {
    if (user) {
      realtimeNotifications();
    }
  }, [user]);

  const value = {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    realtimeNotifications,
    unreadCount,
    isEnabled,
    isPushSupported,
    toggleNotifications
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
