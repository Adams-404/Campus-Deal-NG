"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"

interface Item {
  id: string
  title: string
  price: number
  category: string
  images: string[]
  created_at: string
  seller?: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

const CategoryPage = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("items")
        .select(`
          *,
          item_images (
            image_url
          ),
          profiles:seller_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .ilike("category", `%${category}%`)
        .eq("status", "active")

      if (error) throw error

      const formattedItems =
        data?.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          category: item.category,
          images: item.item_images.map((img) => img.image_url),
          created_at: item.created_at,
          seller: item.profiles
            ? {
                id: item.profiles.id,
                full_name: `${item.profiles.first_name} ${item.profiles.last_name}`,
                first_name: item.profiles.first_name,
                last_name: item.profiles.last_name,
                avatar_url: item.profiles.avatar_url,
              }
            : undefined,
        })) || []

      setItems(formattedItems)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [category])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10 ml-0 lg:ml-[300px] transition-all duration-300">
        <div className="relative max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="w-10">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-primary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <h1 className="text-lg font-semibold absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 capitalize">
              {category}
            </h1>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="w-full max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-300">
        <div className="pt-24 pb-32">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full aspect-square animate-pulse bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No items found in this category</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Browse all items
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {items.map((item) => (
                <div key={item.id} className="w-full flex flex-col">
                  <ProductCard item={item} className="h-full flex-1 min-h-[260px] category-page-card" hideSellerName={window.innerWidth < 640} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>{`
        /* Hide only the seller's name on mobile */
        .category-page-card [class*='group/profile'] > span:not([class*='Avatar']) {
          display: none;
        }
        /* Show seller's name on larger screens */
        @media (min-width: 640px) {
          .category-page-card [class*='group/profile'] > span:not([class*='Avatar']) {
            display: inline;
          }
        }
        /* Ensure avatar is always visible */
        .category-page-card [class*='group/profile'] [class*='Avatar'] {
          display: flex !important;
        }
      `}</style>
    </div>
  )
}

export default CategoryPage
