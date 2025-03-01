"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, ChevronLeft, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Type definition for notifications
interface Notification {
  id: number
  message: string
  time: string // In a real app, this would be a Date
  read: boolean
  type: "message" | "sale" | "purchase" | "system" | "wishlist"
  relatedItemId?: string
  relatedUserId?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // In a real app, you would fetch notifications from your backend
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          message: "Your item 'MacBook Pro 2019' has been sold!",
          time: "Today, 10:30 AM",
          read: false,
          type: "sale",
        },
        {
          id: 2,
          message: "New message from John regarding 'iPhone 12'",
          time: "Today, 9:15 AM",
          read: false,
          type: "message",
        },
        {
          id: 3,
          message: "Price drop alert on your wishlist item 'Sony Headphones'",
          time: "Yesterday, 3:45 PM",
          read: true,
          type: "wishlist",
        },
        {
          id: 4,
          message: "Your purchase of 'Calculus Textbook' has been confirmed",
          time: "Yesterday, 11:20 AM",
          read: true,
          type: "purchase",
        },
        {
          id: 5,
          message: "Welcome to GSU Market! Complete your profile to get started.",
          time: "3 days ago",
          read: true,
          type: "system",
        },
        {
          id: 6,
          message: "Your listing 'Study Desk' has received 5 new views",
          time: "4 days ago",
          read: true,
          type: "sale",
        },
        {
          id: 7,
          message: "Sarah has sent you a message about 'Gaming Mouse'",
          time: "5 days ago",
          read: true,
          type: "message",
        },
        {
          id: 8,
          message: "Your item 'Chemistry Notes' has been added to 3 wishlists",
          time: "1 week ago",
          read: true,
          type: "sale",
        },
        {
          id: 9,
          message: "Limited time offer: Boost your listings for free this weekend!",
          time: "1 week ago",
          read: true,
          type: "system",
        },
        {
          id: 10,
          message: "Your feedback has been received. Thank you!",
          time: "2 weeks ago",
          read: true,
          type: "system",
        },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.read
    if (activeTab === "read") return notification.read
    return true
  })

  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      let group = "Today"

      if (notification.time.includes("Yesterday")) {
        group = "Yesterday"
      } else if (!notification.time.includes("Today")) {
        group = "Earlier"
      }

      if (!groups[group]) {
        groups[group] = []
      }

      groups[group].push(notification)
      return groups
    },
    {} as Record<string, Notification[]>,
  )

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
        )
      case "sale":
        return (
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-green-500" />
          </div>
        )
      case "purchase":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-purple-500" />
          </div>
        )
      case "wishlist":
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-yellow-500" />
          </div>
        )
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mt-20 sm:px-2">
      <div className="flex flex-col sm:flex-row items-center mb-6">
        <Link to="/home" className="mr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-xl">Notifications</h1>
      </div>

      <div className="bg-secondary/30 rounded-lg border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <TabsList className="bg-background/50">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={markAllAsRead}
                  disabled={!notifications.some((n) => !n.read)}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length > 0 ? (
                Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{date}</h3>
                    <div className="space-y-2">
                      {items.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 rounded-lg border border-white/5 hover:bg-primary/5 transition-colors",
                            !notification.read && "bg-primary/10",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <p className="text-sm text-white">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-full"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white">No notifications</h3>
                  <p className="text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="unread" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length > 0 ? (
                Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{date}</h3>
                    <div className="space-y-2">
                      {items.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 rounded-lg border border-white/5 bg-primary/10 hover:bg-primary/15 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <p className="text-sm text-white">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <CheckCheck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white">No unread notifications</h3>
                  <p className="text-gray-400 mt-1">You've read all your notifications!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="read" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length > 0 ? (
                Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">{date}</h3>
                    <div className="space-y-2">
                      {items.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 rounded-lg border border-white/5 hover:bg-primary/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <p className="text-sm text-white">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white">No read notifications</h3>
                  <p className="text-gray-400 mt-1">You have no read notifications yet!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

