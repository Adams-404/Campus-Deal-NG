"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { PageTransition } from "@/components/PageTransition"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Phone,
  User,
  Package,
  ChevronLeft,
  Clock,
  Tag,
  MessageCircle,
  Star,
  ShieldCheck,
  Share2,
  Loader2,
} from "lucide-react"
import { getKycStatusBadgeProps, type KycStatus } from "@/utils/kycUtils"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Gig {
  id: string
  title: string
  price: number
  category: string
  description: string | null
  status: string
  images: string[]
  created_at: string
  rating: number
  reviews_count: number
  user_id: string
}

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

const ProfileHeader = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">Profile</span>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>
    </div>
  )
}

const ProductGrid = ({ items, navigate }: { items: Item[], navigate: (path: string) => void }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => navigate(`/item/${item.id}`)}
          className="group cursor-pointer bg-card hover:bg-accent/5 rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="aspect-square relative overflow-hidden bg-muted">
            {item.images?.[0] ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 opacity-20" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-white border-white/10 text-xs">
                {item.condition}
              </Badge>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <h3 className="font-medium line-clamp-1 text-sm sm:text-base group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center justify-between">
              <p className="font-bold text-primary text-sm sm:text-base">
                ₦{item.price.toLocaleString()}
              </p>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const GigGrid = ({ gigs, navigate }: { gigs: Gig[], navigate: (path: string) => void }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {gigs.map((gig, index) => (
        <motion.div
          key={gig.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => navigate(`/gigs/${gig.id}`)}
          className="group cursor-pointer bg-card hover:bg-accent/5 rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="aspect-video relative overflow-hidden bg-muted">
            {gig.images?.[0] ? (
              <img
                src={gig.images[0]}
                alt={gig.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Star className="h-12 w-12 opacity-20" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-black/40 text-white border-white/10 text-xs">
                {gig.category}
              </Badge>
            </div>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <h3 className="font-medium line-clamp-2 text-sm sm:text-base group-hover:text-primary transition-colors min-h-[2.5rem]">
              {gig.title}
            </h3>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                <span className="font-medium text-sm">{gig.rating}</span>
                <span className="text-muted-foreground text-xs">({gig.reviews_count})</span>
              </div>
              <p className="font-bold text-primary text-sm sm:text-base">
                From ₦{gig.price.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userItems, setUserItems] = useState<Item[]>([])
  const [userGigs, setUserGigs] = useState<Gig[]>([])
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

        const { data: { user } } = await supabase.auth.getUser()
        setIsCurrentUser(user?.id === userId)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError || !profileData) {
          setError("User not found")
          return
        }

        setProfile(profileData)

        // Fetch Listings
        const { data: itemsData } = await supabase
          .from("items")
          .select(`*, images:item_images(image_url)`)
          .eq("seller_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (itemsData) {
          setUserItems(itemsData.map((item: any) => ({
            ...item,
            images: item.images.map((img: any) => img.image_url),
          })))
        }

        // Fetch Gigs
        const { data: gigsData } = await (supabase as any)
          .from("gigs")
          .select(`*, images:gig_images(image_url)`)
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })

        if (gigsData) {
          setUserGigs(gigsData.map((gig: any) => ({
            ...gig,
            images: gig.images.map((img: any) => img.image_url),
          })))
        }

      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, navigate])

  const handleMessage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to message this user")
        return
      }
      if (user.id === profile?.id) {
        toast.error("You can't message yourself")
        return
      }

      const { data: existingConvs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .or(`buyer_id.eq.${profile?.id},seller_id.eq.${profile?.id}`)

      const conversation = existingConvs?.find(c =>
        (c.buyer_id === user.id && c.seller_id === profile?.id) ||
        (c.buyer_id === profile?.id && c.seller_id === user.id)
      )

      if (conversation) {
        navigate(`/messages/${conversation.id}`)
        return
      }

      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          buyer_id: user.id,
          seller_id: profile?.id,
          last_message: "Started a conversation",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      navigate(`/messages/${newConv.id}`)
    } catch (error) {
      toast.error("Failed to start conversation")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <User className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-6">The user you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    )
  }

  const statusBadgeProps = getKycStatusBadgeProps(profile.kyc_status)
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-20">
        <ProfileHeader onBack={() => navigate(-1)} />

        {/* Shapes Background Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-secondary/30 overflow-hidden border-b border-white/5">
          <svg
            className="absolute inset-0 h-full w-full opacity-40"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="shapes"
                x="0"
                y="0"
                width="25"
                height="25"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-blue-500" />
                <circle cx="20" cy="18" r="1.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-blue-500" />
                <rect x="15" y="2" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" transform="rotate(45, 17, 4)" className="text-orange-500" />
                <rect x="2" y="15" width="3" height="3" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" transform="rotate(30, 3.5, 16.5)" className="text-orange-500" />
                <path d="M 20 12 L 22 15 L 18 15 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-red-500" />
                <path d="M 8 8 L 10 11 L 6 11 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" transform="rotate(180, 8, 9.5)" className="text-red-500" />
                <path d="M 12 20 L 14 18 L 16 20 L 14 22 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-green-500" />
                <path d="M 22 8 L 24 6 L 26 8 L 24 10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-green-500" />
                <path d="M 6 22 L 7 20 L 8 22 L 6 21 L 8 21 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-purple-500" />
                <path d="M 16 7 L 17 5 L 18 7 L 16 6 L 18 6 Z" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-purple-500" />
                <path d="M 12 3 L 12 5 M 11 4 L 13 4" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-yellow-500" />
                <path d="M 3 12 L 3 14 M 2 13 L 4 13" stroke="currentColor" strokeWidth="0.5" opacity="0.5" className="text-yellow-500" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#shapes)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4">
              <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {profile.kyc_status === 'verified' && (
                <div className="absolute bottom-1 right-1 bg-background rounded-full p-1.5 shadow-sm ring-1 ring-border">
                  <ShieldCheck className="h-5 w-5 text-green-500 fill-green-500/10" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">{fullName || "Anonymous User"}</h1>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant={statusBadgeProps.variant} className="px-3 py-1">
                {statusBadgeProps.icon}
                <span className="ml-1.5">{statusBadgeProps.label}</span>
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
              {profile.address && (
                <div className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-full border border-white/5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{profile.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-full border border-white/5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full max-w-xs">
              {isCurrentUser ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleMessage}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}
              <Button variant="outline" size="icon" className="rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="listings" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-secondary/30 border border-white/5 p-1 h-auto rounded-full backdrop-blur-sm">
                <TabsTrigger
                  value="listings"
                  className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all min-w-[120px]"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Listings ({userItems.length})
                </TabsTrigger>
                <TabsTrigger
                  value="gigs"
                  className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all min-w-[120px]"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Gigs ({userGigs.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="listings" className="mt-0">
              {userItems.length > 0 ? (
                <ProductGrid items={userItems} navigate={navigate} />
              ) : (
                <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Listings Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    {isCurrentUser ? "Start selling your items today!" : "This user hasn't listed any items yet."}
                  </p>
                  {isCurrentUser && (
                    <Button onClick={() => document.getElementById("sell-button")?.click()}>
                      Create Listing
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="gigs" className="mt-0">
              {userGigs.length > 0 ? (
                <GigGrid gigs={userGigs} navigate={navigate} />
              ) : (
                <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border/50">
                  <Star className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Gigs Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    {isCurrentUser ? "Start offering your services to the community!" : "This user hasn't created any gigs yet."}
                  </p>
                  {isCurrentUser && (
                    <Button onClick={() => navigate("/gigs/create")}>
                      Create Gig
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  )
}

export default UserProfile
