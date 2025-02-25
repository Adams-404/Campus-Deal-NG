import { Heart, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";

interface SavedItem {
  id: number;
  title: string;
  price: number;
  image: string;
  seller: string;
  condition: string;
}

const SavedItems = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const savedItems: SavedItem[] = [
    {
      id: 1,
      title: "Calculus Textbook 3rd Edition",
      price: 45.99,
      image: "/placeholder.jpg",
      seller: "John Smith",
      condition: "Like New",
    },
    {
      id: 2,
      title: "Scientific Calculator",
      price: 29.99,
      image: "/placeholder.jpg",
      seller: "Alice Johnson",
      condition: "Good",
    },
    // Add more mock items as needed
  ];

  const handleRemove = (id: number) => {
    // Here you would typically remove the item from saved items in your backend
    console.log("Removing item:", id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-sm border-b border-white/10">
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-500 fill-blue-500" />
              <h1 className="text-lg font-semibold">Saved Items</h1>
            </div>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <PageTransition>
          <div className="pt-24 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedItems.map((item) => (
                <div key={item.id} className="bg-secondary/50 rounded-lg overflow-hidden border border-white/10">
                  <div className="aspect-video bg-primary/10 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-2">{item.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-primary">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.condition}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Seller: {item.seller}</p>
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost"
                        className="border-2 border-green-500 hover:border-green-600 bg-transparent hover:bg-green-500/10 text-green-500 hover:text-green-400"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id)}
                        className="border-2 border-red-500 hover:border-red-600 bg-transparent hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {savedItems.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-blue-500 fill-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-muted-foreground mb-2">
                  No saved items yet
                </h2>
                <p className="text-muted-foreground">
                  Items you save will appear here
                </p>
              </div>
            )}
          </div>
        </PageTransition>
      </main>
    </div>
  );
};

export default SavedItems; 