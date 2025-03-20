import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle, Info, XCircle, ArrowLeft } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        
        const user = await fetchCurrentUser();
        if (!user) {
          toast.error("Failed to get user information");
          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching notifications:", error);
          toast.error("Failed to load notifications");
          return;
        }

        setNotifications(data || []);
      } catch (error) {
        console.error("Error loading notifications:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    const setupRealtimeSubscription = async () => {
      const user = await fetchCurrentUser();
      if (!user) return;
      
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(notification =>
                notification.id === (payload.new as Notification).id ? (payload.new as Notification) : notification
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(notification => notification.id !== (payload.old as Notification).id));
          }
        })
        .subscribe();

      return channel;
    };
    
    const channelPromise = setupRealtimeSubscription();
    
    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
        return;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-blue-700" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-700" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-blue-700" />;
      default:
        return <Bell className="h-5 w-5 text-blue-700" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-center relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="absolute left-0 h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Notifications</h1>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="pt-24 pb-32">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="divide-y divide-gray-800">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-gray-300 mt-1">
                              {notification.content}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-400 hover:underline focus:outline-none"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
