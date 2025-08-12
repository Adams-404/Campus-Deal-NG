
"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminStats, AdminCharts } from "@/components/admin/AdminDashboard"
import type {
  UserProfile,
  KYCDocument,
  ItemType,
  DashboardStats,
  ChartData,
  TimeSeriesData,
} from "@/components/admin/types"
import { Button } from "@/components/ui/button"
import { PageTransition } from "@/components/PageTransition"
import { supabase } from "@/integrations/supabase/client"
import { UserDetailsModal } from "@/components/admin/UserDetailsModal"
import { AdminActionModal } from "@/components/AdminActionModal"
import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { UsersTab } from "@/components/admin/UsersTab"
import { KYCTab } from "@/components/admin/KYCTab"
import { PostsTab } from "@/components/admin/PostsTab"
import { AdminsTab } from "@/components/admin/AdminsTab"
import { AdminGuide } from "@/components/admin/AdminGuide"
import AdminMessagesTab from "@/components/admin/AdminMessagesTab"
import ReferralsTab from "@/components/admin/ReferralsTab"
import { ArrowLeft, Menu, X, LayoutDashboard, Users, FileCheck, ShoppingBag, Shield, HelpCircle, UserPlus, Mail } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([])
  const [items, setItems] = useState<ItemType[]>([])
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalItems: 0,
    pendingKyc: 0,
    activeSellers: 0,
  })
  const [userStats, setUserStats] = useState<ChartData[]>([])
  const [itemStats, setItemStats] = useState<ChartData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<"add" | "remove">("add")
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("users")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  // Fix the excessive type instantiation by memoizing the admin users filter
  const adminUsers = React.useMemo(() => {
    return users.filter(user => {
      if (!user.roles) return false;
      return user.roles.some(role => role.role === "admin");
    });
  }, [users]);

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        navigate("/sign-in")
        return
      }

      const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin", {
        user_id: userData.user.id,
      })

      if (isAdminError) {
        console.error("Error checking admin status:", isAdminError)
        toast.error("Error checking admin permission")
        navigate("/")
        return
      }

      if (!isAdminData) {
        toast.error("You do not have admin permissions")
        navigate("/")
        return
      }

      setIsAdmin(true)

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          address,
          phone,
          kyc_status,
          created_at,
          updated_at,
          roles:user_roles(role)
        `)
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError
      setUsers(profilesData || [])

      const { data: kycDocumentsData, error: kycDocumentsError } = await supabase
        .from("kyc_documents")
        .select(`
          id,
          user_id,
          document_type,
          document_url,
          status,
          created_at,
          admin_notes,
          updated_at,
          profile:profiles(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })

      if (kycDocumentsError) throw kycDocumentsError
      setKycDocuments(kycDocumentsData || [])

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(`
          id,
          title,
          price,
          status,
          created_at,
          description,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          images:item_images(image_url)
        `)
        .order("created_at", { ascending: false })

      if (itemsError) throw itemsError

      const formattedItems = itemsData.map((item) => ({
        ...item,
        seller: item.seller,
        images: item.images.map((img: { image_url: string }) => img.image_url),
      }))

      setItems(formattedItems || [])

      setStats({
        totalUsers: profilesData?.length || 0,
        totalItems: formattedItems?.length || 0,
        pendingKyc:
          kycDocumentsData?.filter((doc) => doc.status === "pending" || doc.status === "processing").length || 0,
        activeSellers: new Set(formattedItems?.map((item) => item.seller.id)).size || 0,
      })

      // Initialize with all possible statuses in the desired order
      const kycStatusCounts = {
        verified: 0,
        pending: 0,
        processing: 0,
        rejected: 0,
        // Add any other possible statuses
      }
      
      // Count the actual statuses
      profilesData?.forEach((user) => {
        const status = user.kyc_status || "pending"
        if (status in kycStatusCounts) {
          kycStatusCounts[status as keyof typeof kycStatusCounts]++
        }
      })

      // Convert to array in the desired order
      setUserStats(
        Object.entries(kycStatusCounts)
          .filter(([_, value]) => value > 0) // Only include statuses with count > 0
          .map(([name, value]) => ({ name, value }))
      )

      const itemStatusCounts: Record<string, number> = {}
      formattedItems?.forEach((item) => {
        const status = item.status || "active"
        itemStatusCounts[status] = (itemStatusCounts[status] || 0) + 1
      })

      setItemStats(Object.entries(itemStatusCounts).map(([name, value]) => ({ name, value })))

      const timeSeriesPoints: TimeSeriesData[] = []
      const now = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split("T")[0]

        const usersCountBeforeDate = profilesData?.filter((user) => new Date(user.created_at) <= date).length || 0

        const itemsCountBeforeDate = formattedItems?.filter((item) => new Date(item.created_at) <= date).length || 0

        timeSeriesPoints.push({
          date: dateString,
          users: usersCountBeforeDate,
          items: itemsCountBeforeDate,
        })
      }

      setTimeSeriesData(timeSeriesPoints)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to fetch admin data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const profilesChannel = supabase
      .channel("admin-profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    const kycDocumentsChannel = supabase
      .channel("admin-kyc-documents-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kyc_documents",
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    const itemsChannel = supabase
      .channel("admin-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(kycDocumentsChannel)
      supabase.removeChannel(itemsChannel)
    }
  }, [navigate])

  const handleViewUserProfile = (userId: string) => {
    console.log('Navigating to UserProfile with ID:', userId);
    navigate(`/user/${userId}`);
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("items").delete().eq("id", itemId)

      if (error) throw error

      toast.success("Item deleted successfully")

      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const handleAdminAction = (user: UserProfile | null, action: "add" | "remove") => {
    setTargetUser(user)
    setModalAction(action)
    setIsModalOpen(true)
  }

  const handleCompleteAdminAction = async (success: boolean) => {
    setIsModalOpen(false)
    if (success) {
      fetchData()
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setIsMobileMenuOpen(false)
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  }

  const tabItems = [
    { id: "users", label: "Users", icon: <Users className="h-4 w-4 mr-2" /> },
    { id: "kyc", label: "KYC Verification", icon: <FileCheck className="h-4 w-4 mr-2" /> },
    { id: "posts", label: "Listings", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { id: "referrals", label: "Referrals", icon: <UserPlus className="h-4 w-4 mr-2" /> },
    { id: "messages", label: "Messages", icon: <Mail className="h-4 w-4 mr-2" /> },
    { id: "admins", label: "Administrators", icon: <Shield className="h-4 w-4 mr-2" /> },
    { id: "guide", label: "Admin Guide", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
  ]

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="bg-background min-h-screen">
        <header className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <div className="border-b border-border p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Admin Dashboard</h2>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </div>
                    <ScrollArea className="h-[calc(100vh-65px)]">
                      <div className="py-2">
                        {tabItems.map((item) => (
                          <Button
                            key={item.id}
                            variant={activeTab === item.id ? "secondary" : "ghost"}
                            className="w-full justify-start px-4 py-2 h-10 rounded-none"
                            onClick={() => handleTabChange(item.id)}
                          >
                            {item.icon}
                            {item.label}
                          </Button>
                        ))}
                        <div className="border-t border-border mt-2 pt-2 px-4">
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-0 py-2 h-10"
                            onClick={() => navigate("/profile")}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Profile
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate("/profile")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Profile
                  </Button>
                </div>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="w-24 sm:w-32 flex justify-end">
                {/* Placeholder to maintain spacing */}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {isAdmin ? (
            <>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Dashboard Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminStats
                        totalUsers={stats.totalUsers}
                        pendingKYC={stats.pendingKyc}
                        processingKYC={kycDocuments.filter((doc) => doc.status === "processing").length}
                        verifiedUsers={users.filter((user) => user.kyc_status === "verified").length}
                      />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminCharts userGrowthData={timeSeriesData} kycStatusData={userStats} />
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <div className="border-b border-border">
                        <div className="overflow-x-auto">
                          <TabsList className="h-14 rounded-none justify-start px-4 bg-transparent border-b-0">
                            {tabItems.map((item) => (
                              <TabsTrigger
                                key={item.id}
                                value={item.id}
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full"
                              >
                                <span className="hidden sm:flex items-center">
                                  {item.icon}
                                  {item.label}
                                </span>
                                <span className="sm:hidden flex items-center">
                                  {item.icon}
                                  <span className="sr-only">{item.label}</span>
                                </span>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6">
                        <TabsContent value="users" className="m-0 mt-2">
                          <UsersTab
                            users={users}
                            onViewUserProfile={handleViewUserProfile}
                            onAdminAction={handleAdminAction}
                          />
                        </TabsContent>

                        <TabsContent value="kyc" className="m-0 mt-2">
                          <KYCTab />
                        </TabsContent>

                        <TabsContent value="posts" className="m-0 mt-2">
                          <PostsTab
                            items={items}
                            onViewUserProfile={handleViewUserProfile}
                            onDeleteItem={handleDeleteItem}
                            onRefresh={fetchData}
                          />
                        </TabsContent>

                        <TabsContent value="referrals" className="m-0 mt-2">
                          <ReferralsTab />
                        </TabsContent>

                        <TabsContent value="messages" className="m-0 mt-2">
                          <AdminMessagesTab users={users} />
                        </TabsContent>

                        <TabsContent value="admins" className="m-0 mt-2">
                          <AdminsTab
                            users={adminUsers}
                            onViewUserProfile={handleViewUserProfile}
                            onAdminAction={handleAdminAction}
                          />
                        </TabsContent>

                        <TabsContent value="guide" className="m-0 mt-2">
                          <AdminGuide />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <UserDetailsModal
                open={isUserDetailsOpen}
                onOpenChange={setIsUserDetailsOpen}
                user={users.find((u) => u.id === selectedUserId) || null}
                userItems={items.filter((item) => item.seller?.id === selectedUserId)}
              />

              <AdminActionModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                action={modalAction}
                onConfirm={async (email) => {
                  try {
                    if (modalAction === "add") {
                      const { data: userData } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("email", email)
                        .single()

                      if (!userData) {
                        throw new Error("User not found")
                      }

                      const { error } = await supabase.from("user_roles").insert({
                        user_id: userData.id,
                        role: "admin",
                      })

                      if (error) throw error
                      toast.success("User has been made an admin")
                    } else {
                      if (!targetUser) return

                      const { error } = await supabase
                        .from("user_roles")
                        .delete()
                        .eq("user_id", targetUser.id)
                        .eq("role", "admin")

                      if (error) throw error
                      toast.success("Admin privileges removed")
                    }
                    handleCompleteAdminAction(true)
                  } catch (error) {
                    console.error("Error updating admin status:", error)
                    toast.error("Failed to update admin status")
                    handleCompleteAdminAction(false)
                  }
                }}
              />
            </>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-center">Access Denied</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Shield className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You do not have permission to access the admin dashboard.
                  </p>
                  <Button onClick={() => navigate("/")} className="mt-2">
                    Return to Homepage
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </PageTransition>
  )
}

export default Admin
