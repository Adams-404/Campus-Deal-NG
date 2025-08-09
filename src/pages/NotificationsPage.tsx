import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle, Info, XCircle, ArrowLeft, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '@/components/PageTransition';

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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
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
    <div className="bg-background min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="text-primary lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">Notifications</h1>
            <div className="w-10 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/support')}
                className="text-[#1078a7] hover:text-[#1078a7]/80 bg-white/90 dark:bg-transparent shadow-sm"
              >
                <Headset className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <PageTransition>
          <div className="pt-24 pb-24 space-y-6">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg p-4 lg:bg-background/5 lg:border lg:border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 break-words leading-relaxed">
                              {notification.content}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-1">You're all caught up</h3>
                <p className="text-sm text-muted-foreground">No notifications at the moment</p>
              </div>
            )}
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default NotificationsPage;
