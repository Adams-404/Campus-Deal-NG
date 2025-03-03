
// Fix issue with the notification types and metadata typing

import React, { useState, useEffect } from 'react';
import { PageTransition } from "@/components/PageTransition";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Info,
  MessageSquare,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Star,
  Trash,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Json } from "@/integrations/supabase/types";

// Define valid notification types to match the expected union type
type NotificationType = "system" | "message" | "admin_action" | "sale" | "purchase" | "wishlist";

// Define metadata type with optional properties
interface NotificationMetadata {
  [key: string]: any;
  item_id?: string;
  item_title?: string;
  admin_reason?: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
  title: string;
  content: string;
  metadata: NotificationMetadata;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/sign-in');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform and validate the notification types
      const formattedNotifications = data.map(item => {
        // Ensure the type is one of the allowed values, defaulting to "system" if it's not
        const validatedType: NotificationType = isValidNotificationType(item.type) 
          ? item.type as NotificationType 
          : "system";
        
        // Parse metadata to ensure it matches the expected format
        let parsedMetadata: NotificationMetadata = {};
        if (item.metadata) {
          if (typeof item.metadata === 'object') {
            parsedMetadata = item.metadata as NotificationMetadata;
          }
        }
          
        return {
          id: item.id,
          message: item.content,
          time: new Date(item.created_at).toISOString(),
          read: item.is_read,
          type: validatedType,
          title: item.title,
          content: item.content,
          metadata: parsedMetadata
        };
      });

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate notification types
  const isValidNotificationType = (type: string): type is NotificationType => {
    return ['system', 'message', 'admin_action', 'sale', 'purchase', 'wishlist'].includes(type);
  }

  // Subscribe to real-time notifications
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser();
    
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new;
          const validatedType: NotificationType = isValidNotificationType(newNotification.type) 
            ? newNotification.type as NotificationType 
            : "system";
            
          // Parse metadata
          let parsedMetadata: NotificationMetadata = {};
          if (newNotification.metadata) {
            if (typeof newNotification.metadata === 'object') {
              parsedMetadata = newNotification.metadata as NotificationMetadata;
            }
          }
            
          setNotifications(prev => [
            {
              id: newNotification.id,
              message: newNotification.content,
              time: new Date(newNotification.created_at).toISOString(),
              read: newNotification.is_read,
              type: validatedType,
              title: newNotification.title,
              content: newNotification.content,
              metadata: parsedMetadata
            },
            ...prev
          ]);
          
          toast.info(newNotification.title, {
            description: newNotification.content,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mark a notification as read and navigate if needed
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      
      // Navigate based on notification type
      if (notification.type === 'message') {
        if (notification.metadata && notification.metadata.conversation_id) {
          navigate(`/messages/${notification.metadata.conversation_id}`);
        } else {
          navigate('/messages');
        }
      } else if (notification.type === 'admin_action') {
        // If it's an admin action about deleted item, show the details
        if (notification.metadata && notification.metadata.item_id) {
          navigate(`/item/${notification.metadata.item_id}`);
        }
      } else if (['sale', 'purchase'].includes(notification.type)) {
        if (notification.metadata && notification.metadata.item_id) {
          navigate(`/item/${notification.metadata.item_id}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'sale':
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case 'purchase':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'wishlist':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'admin_action':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'system':
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="pb-24">
      <PageTransition>
        <div className="container max-w-xl mx-auto px-4 pt-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.read)}
                className="h-8 px-2"
              >
                <Check className="h-4 w-4 mr-1" />
                Read All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteAllNotifications}
                disabled={notifications.length === 0}
                className="h-8 px-2 text-red-500 hover:text-red-600"
              >
                <Trash className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-colors",
                    !notification.read
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-background border-muted hover:bg-secondary/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-medium",
                          !notification.read ? "text-primary" : "text-foreground"
                        )}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                        
                        {/* Special display for admin actions about deleted items */}
                        {notification.type === 'admin_action' && notification.metadata?.admin_reason && (
                          <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-500">
                              <strong>Reason:</strong> {notification.metadata.admin_reason}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Badge variant="outline" className="bg-primary text-white border-primary">
                          New
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex rounded-full bg-muted p-4 mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up! We'll notify you when there's something new.
              </p>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
