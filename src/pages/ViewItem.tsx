import { useParams, useNavigate } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { ArrowLeft, Heart, MessageCircle, Share2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// This will be replaced with actual API types
interface Item {
  id: number;
  title: string;
  price: number;
  images: string[];
  condition: string;
  description: string;
  seller: {
    name: string;
    avatar: string;
    rating: number;
    joinedDate: string;
  };
  createdAt: string;
  category: string;
}

export default function ViewItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This will be replaced with actual API call
    const fetchItem = async () => {
      setIsLoading(true);
      try {
        // Simulated API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setItem({
          id: Number(id),
          title: "MacBook Pro 2019",
          price: 899,
          images: [
            "https://source.unsplash.com/photo-1488590528505-98d2b5aba04b",
            "https://source.unsplash.com/photo-1517336714731-489689fd1ca4",
            "https://source.unsplash.com/photo-1611186871348-b1ce696e52c9"
          ],
          condition: "Like New",
          description: "MacBook Pro 2019 model in excellent condition. 13-inch, 8GB RAM, 256GB SSD. Includes charger and original box. Battery cycle count under 100.",
          seller: {
            name: "John Doe",
            avatar: "/avatars/john.jpg",
            rating: 4.8,
            joinedDate: "Jan 2024"
          },
          createdAt: "2024-03-15T10:00:00Z",
          category: "Electronics"
        });
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Item not found</h2>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/share")}
                className="h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            {/* Image Carousel */}
            <div className="rounded-lg overflow-hidden border border-white/10">
              <ImageCarousel 
                images={item.images} 
                className="aspect-[4/3] sm:aspect-[16/9]" 
              />
            </div>

            {/* Item Details */}
            <div className="mt-8 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">{item.title}</h1>
                <p className="text-3xl font-bold text-primary">₦{item.price}</p>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.seller.name}</h3>
                    <p className="text-sm text-gray-400">Joined {item.seller.joinedDate}</p>
                  </div>
                </div>
                <Button className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Condition</p>
                      <p>{item.condition}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Category</p>
                      <p>{item.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400">Listed</p>
                      <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-300 whitespace-pre-line">{item.description}</p>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex gap-4">
          <Button variant="outline" className="flex-1">
            Make Offer
          </Button>
          <Button className="flex-1">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
} 