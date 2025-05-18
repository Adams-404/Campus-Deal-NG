import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './UserContext';

interface Notification {
  id: string;
  created_at: string;
  type: string;
  data: any;
  user_id: string;
}

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  realtimeNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      setUnreadCount(data?.filter((notif) => !notif.is_read).length || 0);
    } catch (error: any) {
      console.error('Unexpected error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
      }
    } catch (error: any) {
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
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error: any) {
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
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notif) => notif.id !== notificationId)
        );
        setUnreadCount((prevCount) => {
          const deletedNotification = notifications.find(
            (notif) => notif.id === notificationId
          );
          if (deletedNotification && !deletedNotification.is_read) {
            return Math.max(0, prevCount - 1);
          }
          return prevCount;
        });
      }
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Unexpected error deleting all notifications:', error);
    }
  };

  const realtimeNotifications = () => {
    if (!user) return;

    supabase
      .channel('public:notifications:user_id=eq.' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async (payload) => {
          console.log('Change received!', payload);
          await fetchNotifications();

          if (payload.new) {
            // Add this near line 143 to fix the type errors
            interface NotificationData {
              receiver_id?: string;
              is_read?: boolean;
              sender_id?: string;
              [key: string]: any;
            }

            const notification = payload.new;
            const newNotif = {
              ...notification,
              data: notification.data as NotificationData
            };

            if (newNotif.data && typeof newNotif.data === 'object' && 'receiver_id' in newNotif.data) {
              // Now you can use newNotif.data.receiver_id safely
              if (newNotif.data.receiver_id === user.id) {
                setUnreadCount((prevCount) => prevCount + 1);
              }
            }
          }
        }
      )
      .subscribe();
  };

  useEffect(() => {
    if (user) {
      realtimeNotifications();
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    realtimeNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
