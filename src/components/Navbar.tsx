"use client"

import type React from "react"

import { Search, User, ChevronDown, Bell } from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSearch } from "@/contexts/SearchContext"

export const Navbar = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const { searchQuery, setSearchQuery, selectedCategories, setSelectedCategories, sortBy, setSortBy } = useSearch()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Sample notifications - in a real app, you would fetch these from your backend
  const notifications = [
    { id: 1, message: "Your item has been sold!", time: "5 min ago", read: false },
    { id: 2, message: "New message from buyer", time: "1 hour ago", read: false },
    { id: 3, message: "Price drop alert on your wishlist item", time: "3 hours ago", read: true },
  ]

  useEffect(() => {
    // Get the current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Get the user's profile
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
          })
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    // Add click outside listener for notification dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value
    if (category === "") {
      setSelectedCategories([])
    } else {
      setSelectedCategories([category])
    }
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
  }

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen)
  }

  return (
    <nav className="fixed top-0 w-full bg-secondary/80 backdrop-blur-md z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/home" className="text-xl font-semibold text-white">
            GSU Market
          </Link>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out",
              isSearchFocused ? "flex-1 max-w-2xl mx-8" : "w-48 mx-4",
            )}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for anything..."
                className="w-full py-2 pl-10 pr-4 text-white bg-background rounded-full border border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-500"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          <Link to="/profile">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 hover:bg-primary/20"
            >
              {profile?.avatar_url ? (
                <Avatar>
                  <AvatarImage src={profile.avatar_url} alt="Profile" />
                  <AvatarFallback>
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5 text-primary" />
              )}
            </Button>
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-background text-white text-sm rounded-lg pl-3 pr-10 py-1.5 border border-white/10 focus:outline-none focus:border-primary"
                  value={selectedCategories[0] || ""}
                  onChange={handleCategoryChange}
                >
                  <option value="">All Categories</option>
                  <option value="textbooks">Textbooks</option>
                  <option value="electronics">Electronics</option>
                  <option value="stationery">Stationery</option>
                  <option value="others">Others</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="appearance-none bg-background text-white text-sm rounded-lg pl-3 pr-10 py-1.5 border border-white/10 focus:outline-none focus:border-primary"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 hover:bg-primary/20 relative"
                  onClick={toggleNotification}
                >
                  <Bell className="h-5 w-5 text-primary" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
                  )}
                </Button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-background rounded-lg shadow-lg border border-white/10 overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-medium text-white">Notifications</h3>
                      <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                        Mark all as read
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-3 border-b border-white/5 hover:bg-primary/5 transition-colors cursor-pointer",
                              !notification.read && "bg-primary/10",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={cn(
                                  "h-2 w-2 rounded-full mt-1.5",
                                  notification.read ? "bg-gray-500" : "bg-primary",
                                )}
                              />
                              <div className="flex-1">
                                <p className="text-sm text-white">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-400">
                          <p>No notifications yet</p>
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-white/10">
                      <Link to="/notifications" className="block text-center text-xs text-primary hover:underline p-2">
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

