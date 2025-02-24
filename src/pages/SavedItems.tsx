import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

interface SavedItem {
  id: number;
  title: string;
  price: number;
  image: string;
  seller: string;
  condition: string;
}

const SavedItems = () => {
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
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Saved Items</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedItems.map((item) => (
            <div key={item.id} className="bg-secondary rounded-lg overflow-hidden">
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
                  <span className="text-sm text-gray-500">{item.condition}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Seller: {item.seller}</p>
                <div className="flex items-center justify-between">
                  <Button variant="default">View Details</Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {savedItems.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              No saved items yet
            </h2>
            <p className="text-gray-500">
              Items you save will appear here
            </p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default SavedItems; 