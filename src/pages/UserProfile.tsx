"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { PageTransition } from "@/components/PageTransition"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Calendar,
  MapPin,
  Phone,
  User,
  Package,
  ChevronLeft,
  Clock,
  Tag,
  PhoneIcon as WhatsApp,
} from "lucide-react"
import { getKycStatusBadgeProps, type KycStatus } from "@/utils/kycUtils"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  id: string
  avatar_url: string | null
  first_name: string | null
  last_name: string | null
  address: string | null
  phone: string | null
  kyc_status: KycStatus | null
  created_at: string
  updated_at: string | null
}

interface Item {
  id: string
  title: string
  price: number
  category: string
  description: string | null
  condition: string
  status: string
  images: string[]
  created_at: string
  seller?: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

interface ProductGridProps {
  items: Item[]
  title?: string
  isLoading?: boolean
  navigate: (path: string) => void
}

// Color utility function to get a color based on index
const getColorByIndex = (index: number) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "text-red-500",
    "text-orange-500",
    "text-blue-500",
    "text-green-500",
    "text-yellow-500",
    "border-red-500",
    "border-orange-500",
    "border-blue-500",
    "border-green-500",
    "border-yellow-500",
  ]
  return colors[index % colors.length]
}

// Update the ProfileHeader component to make it fixed so that the content of the page can scroll over it
const ProfileHeader = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 py-2 px-4 transition-all duration-200">
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-colors mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-center flex-1">User Profile</h1>
        </div>
      </div>
    </div>
  )
}

// Update the ProductGrid component to add thin borders and black background
const ProductGrid: React.FC<ProductGridProps> = ({ items, title, isLoading = false, navigate }) => {
  if (isLoading) {
    return (
      <div>
        {title && <h2 className="text-xl font-medium mb-4">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden bg-black border border-blue-500/50">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3">
                  <Skeleton className="h-5 w-full mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-500" />
            {title}
          </h2>
          <Badge variant="outline" className="bg-black text-green-400 border-green-500/50">
            <Tag className="h-3.5 w-3.5 mr-1 text-yellow-400" />
            {items.length} Items
          </Badge>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6">
        {items.map((item, index) => (
          <a
            key={item.id}
            href={`/item/${item.id}`}
            className="group block rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 bg-black border border-blue-500/50"
          >
            <div className="aspect-square relative bg-muted overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0] || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/50">
                  <Package className="h-10 w-10 text-blue-400 opacity-50" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="bg-black/80 backdrop-blur-sm border border-green-500/50 text-white"
                >
                  {item.condition}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-black border border-red-500/50 text-white">
                  <Clock className="h-3 w-3 mr-1 text-red-400" />
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium truncate group-hover:text-green-400 transition-colors">{item.title}</h3>
              <div className="flex justify-between items-center mt-1">
                <p className="font-semibold text-green-400">₦{item.price.toLocaleString()}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userItems, setUserItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!userId) {
          setError("No user ID provided")
          navigate("/")
          return
        }

        // Get current user to check if viewing own profile
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setIsCurrentUser(user?.id === userId)

        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError) {
          if (profileError.code === "PGRST116") {
            setError("User not found")
          } else {
            setError("Failed to load user profile")
          }
          return
        }

        if (!profileData) {
          setError("User not found")
          return
        }

        // Update the profile fetching logic to avoid using bio, email, and website if they are not part of profileData
        const enhancedProfile = {
          ...profileData,
          bio: "Hi there! I'm a seller on this platform. I love finding new homes for items I no longer need.",
          email: "user@example.com",
          website: "www.example.com",
        }

        setProfile(enhancedProfile)

        // Fetch user's listings
        const { data: itemsData, error: itemsError } = await supabase
          .from("items")
          .select(`
            *,
            images:item_images(image_url)
          `)
          .eq("seller_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (itemsError) {
          toast.error("Failed to load user's listings")
          return
        }

        const formattedItems = itemsData.map((item: any) => ({
          ...item,
          images: item.images.map((img: any) => img.image_url),
        }))

        setUserItems(formattedItems)
      } catch (error: any) {
        setError(error.message || "An error occurred while loading user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, navigate])

  const fetchKycStatus = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("kyc_status").eq("id", userId).single()

      if (error) throw error

      if (data) {
        setProfile((prev) => ({ ...prev, kyc_status: data.kyc_status }))
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error)
      toast.error("Failed to fetch KYC status")
    }
  }

  useEffect(() => {
    fetchKycStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps

    // Subscribe to real-time KYC status updates
    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile((prev) => ({ ...prev, kyc_status: payload.new.kyc_status }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  if (loading) {
    return (
      <PageTransition>
        <ProfileHeader onBack={() => navigate(-1)} />
        <div className="container max-w-4xl mx-auto px-4 pb-32">
          <Card className="mb-8 border-none shadow-sm rounded-xl">
            <CardHeader className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-4 w-40 mx-auto sm:mx-0" />
                    <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                  </div>
                </div>
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="listings">
            <TabsList className="w-full sm:w-auto border-b rounded-none p-0 h-auto bg-transparent space-x-8">
              <TabsTrigger
                value="listings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent py-2 px-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Listings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="mt-6">
              <ProductGrid items={[]} isLoading={true} navigate={navigate} />
            </TabsContent>
          </Tabs>
        </div>
      </PageTransition>
    )
  }

  // Update the error state to match the new styling
  if (error || !profile) {
    return (
      <PageTransition>
        <ProfileHeader onBack={() => navigate(-1)} />
        <div className="min-h-[70vh] flex items-center justify-center px-4 bg-black text-white">
          <Card className="w-full max-w-md border border-red-500/50 shadow-sm bg-black">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-medium">User not found</CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                {error || "The user profile you're looking for doesn't exist."}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pb-6">
              <Button onClick={() => navigate("/")} className="bg-blue-500 hover:bg-blue-600 text-white">
                Return Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageTransition>
    )
  }

  const statusBadgeProps = getKycStatusBadgeProps(profile.kyc_status)
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  // Update the main component to apply black background, remove email/website, center KYC status, and update colors
  return (
    <PageTransition>
      <ProfileHeader onBack={() => navigate(-1)} />
      <div className="container max-w-4xl mx-auto px-4 pb-32 mt-20 bg-black text-white flex flex-col items-center">
        <Card className="mb-8 overflow-hidden border border-green-500/50 shadow-sm rounded-xl bg-black">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 ring-1 ring-green-500/50 ring-offset-1 ring-offset-black">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-green-500/10 text-green-400">
                  {profile.first_name?.[0] || ""}
                  {profile.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col items-center sm:items-start gap-2 mb-2">
                  <CardTitle className="text-2xl font-medium">{fullName || "Anonymous User"}</CardTitle>

                  <Badge
                    variant={statusBadgeProps.variant}
                    className={`${statusBadgeProps.className} px-2 py-0.5 mx-auto sm:mx-0`}
                  >
                    {statusBadgeProps.icon}
                    {statusBadgeProps.label}
                  </Badge>
                </div>

                <CardDescription className="text-gray-400">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                    <span>
                      Joined{" "}
                      {new Date(profile.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                </CardDescription>

                <div className="mt-4 flex flex-wrap gap-4 justify-center sm:justify-start">
                  {profile.address && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                      <span className="truncate">{profile.address}</span>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2 mt-4 sm:mt-0">
                {isCurrentUser ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/profile")}
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                  >
                    <User className="h-4 w-4 mr-2 text-yellow-400" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => window.open(`https://wa.me/${profile.phone?.replace(/\D/g, "")}`, "_blank")}
                  >
                    <WhatsApp className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="w-full sm:w-auto border-b border-blue-500/30 rounded-none p-0 h-auto bg-transparent space-x-8">
            <TabsTrigger
              value="listings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-400 data-[state=active]:bg-transparent py-2 px-1"
            >
              <Package className="h-4 w-4 mr-2 text-blue-400" />
              Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {userItems.length === 0 ? (
              <Card className="border border-yellow-500/50 bg-black rounded-xl">
                <CardContent className="pt-12 pb-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-yellow-400/50 mb-4" />
                  <h3 className="text-xl font-medium mb-2 text-white">No Listings Yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {isCurrentUser
                      ? "You haven't listed any items for sale yet. Create your first listing to start selling!"
                      : `${profile.first_name || "This user"} hasn't listed any items for sale yet.`}
                  </p>

                  {isCurrentUser && (
                    <Button
                      variant="default"
                      className="mt-6 bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => document.getElementById("sell-button")?.click()}
                    >
                      <Tag className="h-4 w-4 mr-2 text-white" />
                      Create Your First Listing
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ProductGrid items={userItems} title={`${profile.first_name || "User"}'s Listings`} navigate={navigate} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}

export default UserProfile

