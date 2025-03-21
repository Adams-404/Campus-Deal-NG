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
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-semibold capitalize truncate">{category}</h1>
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 sm:pt-24 pb-20 sm:pb-32">
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
        .category-page-card [class*='group/profile'] span {
          display: none;
        }
        @media (min-width: 640px) {
          .category-page-card [class*='group/profile'] span {
            display: inline;
          }
        }
      `}</style>
    </div>
  )
}

export default CategoryPage
