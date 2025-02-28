"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { PageTransition } from "@/components/PageTransition"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  ShoppingBag,
  User,
  Shield,
  AlertTriangle,
  Phone,
  Star,
  MapPin,
  Calendar,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons"
import { motion } from "framer-motion"

// Define the KYC status type to match the database enum
type KycStatus = "pending" | "processing" | "verified" | "rejected"

interface SimpleUserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  kyc_status: KycStatus
  phone: string | null
  joined_date?: string // Added for UI enhancement
  location?: string // Added for UI enhancement
  rating?: number // Added for UI enhancement
  address?: string // Added for UI enhancement
  created_at?: string // Ensure this is defined
}

interface SimpleItem {
  id: string
  title: string
  price: number
  images: string[]
  description: string
  created_at?: string // Added for UI enhancement
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<SimpleUserProfile | null>(null)
  const [items, setItems] = useState<SimpleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"listings" | "about">("listings")

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
        .select("*")
        .eq("id", userId)
        .single() as { data: SimpleUserProfile | null; error: any; }

      if (profileError || !profileData || typeof profileData !== 'object') {
        console.error("Profile fetch error:", profileError)
        toast.error(`Failed to load user profile: ${profileError.message}`);
        throw new Error("Profile data is not available.")
      }

      // Type assertion to SimpleUserProfile
      const typedProfileData = profileData as SimpleUserProfile;

      if (typedProfileData) {
        setProfile({
          ...typedProfileData,
          joined_date: new Date(typedProfileData.created_at || Date.now()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
          }),
          rating: 4.8, // Mock data for UI enhancement
        })
      }

      // Get user items
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(`
          id,
          title,
          price,
          item_images (
            image_url
          ),
          description,
          created_at
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
        description: item.description || "",
        created_at: new Date(item.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
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

  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20">
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background flex flex-col items-center justify-center gap-4 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-secondary/30 rounded-full p-6"
          >
            <User className="h-12 w-12 text-muted-foreground" />
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-2xl font-semibold"
          >
            User not found
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-muted-foreground text-center max-w-md"
          >
            The user profile you're looking for doesn't exist or may have been removed.
          </motion.p>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button onClick={() => navigate("/home")} className="mt-2" size="lg">
              Go Home
            </Button>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background pb-32">
        {/* Header with gradient background */}
        <header className="fixed top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/20 w-full">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex justify-between items-center py-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="sm"
              className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="font-medium text-center">User Profile</h2>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Profile content */}
        <div className="pt-20 pb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
              <Card className="border border-green-500/30 shadow-lg bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-500 relative">
                  {profile.kyc_status === "verified" && (
                    <div className="absolute top-4 right-4">{renderVerificationBadge(profile.kyc_status)}</div>
                  )}
                </div>
                <CardContent className="p-6 sm:p-8 relative">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white dark:border-gray-900 shadow-xl absolute -top-16 left-6">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || "User"} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profile.first_name?.[0] || "?"}
                      {profile.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-0 sm:ml-40 mt-12 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                          {profile.first_name} {profile.last_name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {profile.kyc_status !== "verified" && renderVerificationBadge(profile.kyc_status)}

                          {profile.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 mr-1" />
                              {profile.location}
                            </div>
                          )}

                          {profile.joined_date && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              Joined {profile.joined_date}
                            </div>
                          )}

                          {profile.rating && (
                            <div className="flex items-center text-sm text-amber-500">
                              <Star className="w-3.5 h-3.5 mr-1 fill-amber-500" />
                              {profile.rating} rating
                            </div>
                          )}
                        </div>
                      </div>

                      {profile.phone && (
                        <a
                          href={`https://wa.me/${profile.phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3 w-full">
                      <Button
                        onClick={() => navigate("/")}
                        variant="outline"
                        className="border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-500 flex-1"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Browse Items
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <div className="mt-8 border-b border-border">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("listings")}
                  className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
                    activeTab === "listings" ? "text-green-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Listings
                    <Badge variant="secondary" className="ml-1">
                      {items.length}
                    </Badge>
                  </div>
                  {activeTab === "listings" && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
                    activeTab === "about" ? "text-green-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    About
                  </div>
                  {activeTab === "about" && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-6">
              {activeTab === "listings" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                          <Card
                            className="group overflow-hidden border hover:border-green-500/50 transition-all duration-200 hover:shadow-md h-full flex flex-col"
                            onClick={() => navigate(`/item/${item.id}`)}
                          >
                            <div className="aspect-[4/3] overflow-hidden relative">
                              <img
                                src={item.images[0] || "/placeholder.svg?height=300&width=400"}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {item.created_at && (
                                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                                  {item.created_at}
                                </Badge>
                              )}
                            </div>
                            <CardContent className="p-4 flex-grow">
                              <h3 className="font-medium line-clamp-1 group-hover:text-green-500 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                {formatPrice(item.price)}
                              </p>
                              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{item.description}</p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                              <Button
                                variant="outline"
                                className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10"
                              >
                                View Details
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4">About the Seller</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Verification Status</h4>
                            <p className="text-muted-foreground text-sm">
                              {profile.kyc_status === "verified"
                                ? "This seller has completed identity verification and is trusted on our platform."
                                : "This seller has not completed the verification process yet."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Member Since</h4>
                            <p className="text-muted-foreground text-sm">{profile.joined_date || "Unknown"}</p>
                          </div>
                        </div>

                        {profile.location && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Location</h4>
                              <p className="text-muted-foreground text-sm">{profile.location}</p>
                            </div>
                          </div>
                        )}

                        {profile.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Address</h4>
                              <p className="text-muted-foreground text-sm">{profile.address}</p>
                            </div>
                          </div>
                        )}

                        {profile.rating && (
                          <div className="flex items-start gap-3">
                            <Star className="w-5 h-5 text-amber-500 mt-0.5 fill-amber-500" />
                            <div>
                              <h4 className="font-medium">Seller Rating</h4>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(profile.rating || 0)
                                        ? "text-amber-500 fill-amber-500"
                                        : "text-gray-300 fill-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-sm ml-1">{profile.rating} out of 5</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                      {profile.phone ? (
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-green-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">WhatsApp</h4>
                            <p className="text-muted-foreground text-sm mb-2">
                              Contact this seller directly via WhatsApp
                            </p>
                            <a
                              href={`https://wa.me/${profile.phone}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                              <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                              <span>Message on WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium">In-App Messaging</h4>
                            <p className="text-muted-foreground text-sm mb-2">
                              Contact this seller through our messaging system
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

