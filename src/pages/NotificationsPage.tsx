
"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Clock, Trash2, MailOpen, TagIcon, FileWarning, ShieldAlert, MessagesSquare } from "lucide-react"
import { differenceInDays, format, formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageTransition } from "@/components/PageTransition"
import { supabase } from "@/integrations/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: "message" | "sale" | "purchase" | "system" | "wishlist" | "admin_action";
  title: string;
  content: string;
  metadata: {
    item_id?: string;
    item_title?: string;
    admin_reason?: string;
    [key: string]: any;
  };
}

interface NotificationProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setCurrentUserId(user.id)
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        const formattedNotifications = data.map(notification => {
          return {
            id: notification.id,
            message: notification.content,
            time: formatTimestamp(notification.created_at),
            read: notification.is_read,
            // Ensure the type is one of the allowed values in the Notification interface
            type: validateNotificationType(notification.type),
            title: notification.title,
            content: notification.content,
            metadata: notification.metadata || {}
          }
        })
        
        setNotifications(formattedNotifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        toast.error('Failed to load notifications')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchNotifications()
  }, [])

  // Set up realtime subscription to notifications
  useEffect(() => {
    if (!currentUserId) return
    
    const channel = supabase
      .channel('notification-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, (payload) => {
        // Handle new notification
        const newNotification = payload.new
        
        // Show a toast notification
        toast(newNotification.title, {
          description: newNotification.content,
          action: {
            label: 'View',
            onClick: () => {
              // Mark as read and navigate if needed
              markAsRead(newNotification.id)
              
              // Redirect based on notification type
              if (newNotification.type === 'message' && newNotification.metadata?.conversation_id) {
                navigate(`/messages/${newNotification.metadata.conversation_id}`)
              } else if (['purchase', 'sale'].includes(newNotification.type) && newNotification.metadata?.item_id) {
                navigate(`/item/${newNotification.metadata.item_id}`)
              }
            }
          }
        })
        
        // Add to notifications state
        setNotifications(prev => [{
          id: newNotification.id,
          message: newNotification.content,
          time: formatTimestamp(newNotification.created_at),
          read: newNotification.is_read,
          type: validateNotificationType(newNotification.type),
          title: newNotification.title,
          content: newNotification.content,
          metadata: newNotification.metadata || {}
        }, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, (payload) => {
        // Update the notification in the state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === payload.new.id
              ? {
                  ...notification,
                  read: payload.new.is_read
                }
              : notification
          )
        )
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, navigate])
  
  // Helper function to validate notification type
  const validateNotificationType = (type: string): Notification['type'] => {
    const validTypes: Notification['type'][] = ["message", "sale", "purchase", "system", "wishlist", "admin_action"];
    return validTypes.includes(type as Notification['type']) 
      ? (type as Notification['type']) 
      : "system"; // Default to system if not a valid type
  }
  
  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = differenceInDays(now, date)
    
    if (diffInDays < 1) {
      return formatDistanceToNow(date, { addSuffix: true })
    } else if (diffInDays < 7) {
      return format(date, 'EEEE') + ' at ' + format(date, 'h:mm a')
    } else {
      return format(date, 'MMM d, yyyy')
    }
  }

  const markAllAsRead = async () => {
    if (!currentUserId) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false)
      
      if (error) throw error
      
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>(
    (groups, notification) => {
      const date = notification.time.includes('ago')
        ? 'Today'
        : notification.time.includes('Yesterday')
        ? 'Yesterday'
        : notification.time.split(' at ')[0]
      
      if (!groups[date]) {
        groups[date] = []
      }
      
      groups[date].push(notification)
      return groups
    },
    {} as Record<string, Notification[]>,
  )

  const markAsRead = async (id: string | number) => {
    if (currentUserId) {
      try {
        // Convert id to string if it's a number
        const idStr = id.toString();
        
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', idStr)
        
        if (error) throw error
        
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === idStr
              ? { ...notification, read: true }
              : notification
          )
        )
      } catch (error) {
        console.error('Error marking notification as read:', error)
        toast.error('Failed to mark notification as read')
      }
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessagesSquare className="h-5 w-5 text-blue-500" />
      case 'sale':
        return <TagIcon className="h-5 w-5 text-green-500" />
      case 'purchase':
        return <TagIcon className="h-5 w-5 text-indigo-500" />
      case 'wishlist':
        return <Check className="h-5 w-5 text-pink-500" />
      case 'admin_action':
        return <ShieldAlert className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-yellow-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.metadata?.conversation_id) {
      navigate(`/messages/${notification.metadata.conversation_id}`)
    } else if (['purchase', 'sale'].includes(notification.type) && notification.metadata?.item_id) {
      navigate(`/item/${notification.metadata.item_id}`)
    } else if (notification.type === 'admin_action' && notification.metadata?.item_id) {
      navigate(`/home`) // Redirect to home since item might be deleted
    }
  }

  return (
    <PageTransition>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <MailOpen className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
            <TabsTrigger value="messages" className="flex-1">Messages</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Bell className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No notifications yet</h3>
                <p className="text-sm text-gray-500 mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([date, notifications]) => (
                <div key={date}>
                  <h3 className="font-medium text-sm text-gray-500 uppercase mb-3">{date}</h3>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onRead={markAsRead}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.filter(n => !n.read).length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Check className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You've read all your notifications
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(notification => !notification.read)
                  .map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onRead={markAsRead}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.filter(n => n.type === 'message').length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <MessagesSquare className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No messages</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You have no message notifications
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(notification => notification.type === 'message')
                  .map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onRead={markAsRead}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.filter(n => ['sale', 'purchase'].includes(n.type)).length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <TagIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No transactions</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You haven't made any transactions yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(notification => ['sale', 'purchase'].includes(notification.type))
                  .map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onRead={markAsRead}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}

const NotificationItem = ({ notification, onRead }: NotificationProps) => {
  const navigate = useNavigate()
  
  // Special styling for admin actions (like deletion)
  const isAdminAction = notification.type === 'admin_action'
  
  const handleClick = () => {
    onRead(notification.id)
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.metadata?.conversation_id) {
      navigate(`/messages/${notification.metadata.conversation_id}`)
    } else if (['purchase', 'sale'].includes(notification.type) && notification.metadata?.item_id) {
      navigate(`/item/${notification.metadata.item_id}`)
    } else if (notification.type === 'admin_action' && notification.metadata?.item_id) {
      navigate(`/home`) // Redirect to home since item might be deleted
    }
  }
  
  return (
    <Card 
      className={cn(
        "p-4 transition-colors hover:bg-accent/50 cursor-pointer",
        !notification.read && "border-l-4 border-l-primary",
        isAdminAction && "border-l-4 border-l-red-500 bg-red-500/5 hover:bg-red-500/10"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center",
          !notification.read ? "bg-primary/10" : "bg-muted",
          isAdminAction && "bg-red-500/10"
        )}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={cn(
              "font-medium line-clamp-1",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2">
              {!notification.read && (
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  New
                </Badge>
              )}
              <span className="text-xs text-gray-500 whitespace-nowrap">{notification.time}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2">
            {notification.message}
          </p>
          
          {isAdminAction && notification.metadata?.admin_reason && (
            <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-sm">
              <p className="font-medium text-red-500">Reason: {notification.metadata.admin_reason}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default NotificationsPage
