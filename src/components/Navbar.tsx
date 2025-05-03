"use client"

import type React from "react"

import {
  Search,
  User,
  Bell,
  Utensils,
  Shirt,
  Heart,
  Gem,
  Palette,
  Baby,
  ShoppingBag,
  Footprints,
  SprayCan,
  Wrench,
  Book,
  Monitor,
  Pen,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useSearch } from "@/contexts/SearchContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Skeleton } from './ui/skeleton'

const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 w-full bg-secondary/80 backdrop-blur-md z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/home" className="text-xl font-semibold text-white">
            Tradezy
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <input
                type="text"
                placeholder="Search for anything..."
                className="w-full py-2 pl-10 pr-10 text-white bg-background rounded-full border border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export const Navbar = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const { searchQuery, setSearchQuery, selectedCategories, setSelectedCategories, sortBy, setSortBy } = useSearch()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (!error) {
        setUnreadNotificationsCount(count || 0)
      }
    }

    fetchUnreadCount()
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Trigger search
      e.currentTarget.blur()
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handleCategoryChange = (values: string[]) => {
    if (values.includes("all")) {
      setSelectedCategories([])
      setSortBy("random")
    } else {
      setSelectedCategories(values)
      setSortBy("created_at")
    }
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
  }

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen)
  }

  const categories = [
    { value: "Food", label: "Food", icon: Utensils },
    { value: "Clothing", label: "Clothing", icon: Shirt },
    { value: "Beauty", label: "Beauty", icon: Heart },
    { value: "Jewelry", label: "Jewelry", icon: Gem },
    { value: "Art", label: "Art", icon: Palette },
    { value: "Baby", label: "Baby", icon: Baby },
    { value: "Bags", label: "Bags", icon: ShoppingBag },
    { value: "Shoes", label: "Shoes", icon: Footprints },
    { value: "Perfumes", label: "Perfumes", icon: SprayCan },
    { value: "Tools", label: "Tools", icon: Wrench },
    { value: "Books", label: "Books", icon: Book },
    { value: "Electronics", label: "Electronics", icon: Monitor },
    { value: "Stationary", label: "Stationary", icon: Pen },
    { value: "Others", label: "Others", icon: MoreHorizontal },
  ]

  return (
    isLoading ? <NavbarSkeleton /> : (
      <nav className="fixed top-0 w-full bg-secondary/80 backdrop-blur-md z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* First Row */}
          <div className="flex justify-between items-center h-16">
            <Link to="/home" className="text-xl font-semibold text-white">
              Tradezy
            </Link>

            {/* Search and User Icons */}
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div
                className={cn("transition-all duration-300 ease-in-out", isSearchFocused ? "flex-1 max-w-2xl" : "w-48")}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for anything..."
                    className="w-full py-2 pl-10 pr-10 text-white bg-background rounded-full border border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-500"
                    value={searchQuery}
                    onChange={handleSearch}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 hover:text-primary transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* User Icon or Auth Buttons */}
              <div className="flex items-center gap-2">
                {user ? (
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
                ) : (
                  <Link to="/auth/SignIn">
                    <Button variant="ghost" className="text-primary hover:bg-primary/10 text-sm md:text-base">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Second Row - Compact Controls */}
          <div className="flex items-center justify-between pb-2 gap-2">
            {/* Category Selector */}
            <div className="flex-1">
              <Select
                value={selectedCategories.length > 0 ? selectedCategories[0] : undefined}
                onValueChange={(value) => handleCategoryChange([value])}
                placeholder="Select category..."
                className="w-full"
              >
                <SelectTrigger className="bg-background border-white/10 hover:bg-primary/10">
                  <SelectValue placeholder="Categories" />
                </SelectTrigger>
                <SelectContent
                  className="bg-background border-white/10 w-[400px]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2 p-2">
                    <SelectItem value="all" className="hover:bg-primary/10 col-span-2">
                      All Categories
                    </SelectItem>
                    {categories.map((category, index) => (
                      <SelectItem key={category.value} value={category.value} className="hover:bg-primary/10">
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4 text-primary" />
                          <span className="truncate">{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Signup Button */}
            {!user && (
              <Link to="/auth/SignUp">
                <Button className="bg-primary hover:bg-primary/90 text-sm md:text-base">Sign Up</Button>
              </Link>
            )}

            {/* Notification Icon */}
            {user && (
              <Link to="/notifications">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 hover:bg-primary/20"
                  >
                    <Bell className="h-5 w-5 text-primary" />
                  </Button>
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
    )
  )
}
