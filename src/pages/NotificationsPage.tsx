
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'sonner';
import { PageTransition } from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Badge, ShoppingBag, AlertTriangle, Shield, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  is_read: boolean;
  metadata: any;
}

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (notification: Notification) => void;
}

const NotificationCard = ({ notification, onRead, onNavigate }: NotificationCardProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'admin_action':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'verification':
        return <Badge className="h-5 w-5 text-green-500" />;
      case 'listing':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card 
      className={`mb-3 ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''} cursor-pointer hover:bg-secondary/50 transition-colors`} 
      onClick={() => {
        if (!notification.is_read) {
          onRead(notification.id);
        }
        onNavigate(notification);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-full bg-background flex items-center justify-center">
            {getIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{notification.title}</h3>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-1 text-muted-foreground whitespace-pre-line">{notification.content}</p>
            
            {notification.metadata?.item_id && (
              <div className="mt-2 flex items-center text-xs text-blue-500 hover:underline">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Item
              </div>
            )}
            
            {!notification.is_read && (
              <div className="mt-2 flex justify-end">
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">New</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/sign-in');
        return;
      }

      // Fetch notifications for the user
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      // Update the local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNavigate = (notification: Notification) => {
    // Handle navigation based on notification type and metadata
    if (notification.metadata?.item_id) {
      navigate(`/item/${notification.metadata.item_id}`);
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
      <div className="container max-w-xl mx-auto px-4 py-4 pb-32">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              When you receive notifications, they'll appear here.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onRead={markAsRead}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default NotificationsPage;
