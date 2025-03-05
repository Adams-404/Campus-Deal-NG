import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

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

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
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

    // Setup Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + (supabase.auth.user()?.id || '')
      }, (payload) => {
        // Optimistically update the notifications
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

    return () => {
      supabase.removeChannel(channel);
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

      // Optimistically update the local state
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
        return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 mr-2 text-blue-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 mr-2 text-gray-500" />;
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
    <div className="container max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
          <CardDescription>
            Here are all of your notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] w-full">
            <div className="divide-y divide-border">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getIcon(notification.type)}
                        <div className="flex flex-col">
                          <span className="font-medium">{notification.title}</span>
                          <p className="text-sm text-muted-foreground">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                      <div>
                        {!notification.is_read && (
                          <Badge
                            variant="secondary"
                            onClick={() => markAsRead(notification.id)}
                            className="cursor-pointer"
                          >
                            Mark as Read
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
