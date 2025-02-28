"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { PageTransition } from "@/components/PageTransition"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Loader2, MessageCircle, ShoppingBag, User, Shield, AlertTriangle, Phone } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

// Define the KYC status type to match the database enum
type KycStatus = "pending" | "processing" | "verified" | "rejected"

interface SimpleUserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  kyc_status: KycStatus
  phone: string | null
}

interface SimpleItem {
  id: string
  title: string
  price: number
  images: string[]
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<SimpleUserProfile | null>(null)
  const [items, setItems] = useState<SimpleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, kyc_status, phone")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        throw profileError
      }

      setProfile(profileData)

      // Get user items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(`
          id,
          title,
          price,
          item_images (
            image_url
          )
        `)
        .eq("seller_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (itemsError) {
        console.error("Items fetch error:", itemsError)
        throw itemsError
      }

      // Process items to extract images
      const processedItems: SimpleItem[] = (itemsData || []).map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        images: item.item_images?.map((img: any) => img.image_url) || [],
      }))

      setItems(processedItems)
    } catch (error: any) {
      console.error("Error fetching user profile:", error)
      toast.error("Failed to load user profile.")
      navigate("/home")
    } finally {
      setLoading(false)
    }
  }

  // Render verification badge based on KYC status
  const renderVerificationBadge = (status: KycStatus) => {
    switch (status) {
      case "verified":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1 px-3 py-1"
          >
            <Shield className="w-3.5 h-3.5" />
            Verified Seller
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="destructive"
            className="bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1 px-3 py-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Unverified
          </Badge>
        )
      case "processing":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-500/10 text-orange-500 border-orange-500/20 flex items-center gap-1 px-3 py-1"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verification in Progress
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1 px-3 py-1"
          >
            <User className="w-3.5 h-3.5" />
            Verification Pending
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
              <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
              <div className="flex flex-col items-center sm:items-start gap-2 w-full max-w-md">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Skeleton className="h-8 w-64 mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!profile) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
          <div className="bg-secondary/30 rounded-full p-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">User not found</h1>
          <p className="text-muted-foreground text-center max-w-md">
            The user profile you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate("/home")} className="mt-2" size="lg">
            Go Home
          </Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-32 pt-16">
        {/* Header with gradient background */}
        <header className="fixed top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/20 flex justify-center items-center py-4 w-full">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="sm"
            className="mr-auto border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-500 ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="font-medium text-center flex-1">User Profile</h2>
          <div className="w-16"></div> {/* Spacer for centering */}
        </header>

        {/* Profile content */}
        <div className="bg-background pt-8 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">{/* Empty space where the back button used to be */}</div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16">
          <Card className="border border-green-500/50 shadow-md bg-green-500/5 rounded-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl ring-2 ring-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || "User"} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile.first_name?.[0] || "?"}
                    {profile.last_name?.[0] || ""}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-center sm:items-start">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    <a href={`https://wa.me/${profile.phone}`} className="text-blue-500 hover:underline">
                      <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5 inline-block mr-1" />
                    </a>
                  </p>
                  <div className="flex items-center gap-2 mt-2">{renderVerificationBadge(profile.kyc_status)}</div>

                  <div className="mt-6 flex gap-3 w-full">
                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                      className="border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-500 flex-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Browse Items
                    </Button>
                    <Button
                      onClick={() => {
                        // Start a conversation
                        navigate(`/messages?seller=${userId}`)
                      }}
                      className="border border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Seller
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 text-primary" />
                Listings by {profile.first_name}
              </h2>
              <Badge variant="outline" className="px-3 border-blue-500/50 text-blue-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </Badge>
            </div>

            {items.length === 0 ? (
              <Card className="border border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-primary/10 rounded-full p-4 mb-4">
                    <ShoppingBag className="w-8 h-8 text-primary/70" />
                  </div>
                  <p className="text-lg font-medium mb-1">No active listings</p>
                  <p className="text-muted-foreground max-w-md">
                    This seller doesn't have any active items for sale at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="group overflow-hidden border border-green-500/50 hover:border-green-500/50 transition-all duration-200 hover:shadow-md"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-sm font-medium leading-none mt-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} ₹</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}