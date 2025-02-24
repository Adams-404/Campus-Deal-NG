import { Book, Pencil, ShirtIcon, Laptop, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Textbooks", icon: Book, color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", activeColor: "bg-red-500" },
  { name: "Electronics", icon: Laptop, color: "text-yellow-500", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20", activeColor: "bg-yellow-500" },
  { name: "Stationery", icon: Pencil, color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20", activeColor: "bg-orange-500" },
  { name: "Clothing", icon: ShirtIcon, color: "text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20", activeColor: "bg-green-500" },
];

export const Categories = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const handleAllClick = () => {
    setSelectedCategories(prev => 
      prev.length === categories.length ? [] : categories.map(cat => cat.name)
    );
  };

  const isAllSelected = selectedCategories.length === categories.length;

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Browse Categories</h2>
        <Link 
          to="/saved" 
          className="flex items-center gap-2 border-2 border-blue-500 hover:border-blue-600 bg-transparent hover:bg-transparent px-3 py-1.5 rounded-lg transition-colors"
        >
          <Heart className="w-5 h-5 text-blue-500 fill-blue-500" />
          <span className="text-white">Saved Items</span>
        </Link>
      </div>
      <div className="relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.name);
            return (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={cn(
                  "h-[100px] flex flex-col items-center justify-center rounded-lg border transition-all group",
                  isSelected ? [
                    category.bgColor,
                    category.borderColor,
                  ] : [
                    "bg-secondary",
                    "border-white/10",
                    "hover:bg-secondary/80"
                  ]
                )}
              >
                <category.icon 
                  className={cn(
                    "h-6 w-6 mb-2 transition-transform group-hover:scale-110",
                    category.color
                  )} 
                />
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-white" : "text-gray-300"
                )}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Centered All Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={handleAllClick}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-center transition-colors font-medium text-base shadow-lg",
              isAllSelected 
                ? "bg-primary text-white" 
                : "bg-secondary text-gray-300 hover:bg-primary/10 hover:text-primary border border-white/10"
            )}
          >
            All
          </button>
        </div>
      </div>
    </div>
  );
};
