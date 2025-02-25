import { Search, User, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-secondary/80 backdrop-blur-md z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="text-xl font-semibold text-white">
            GSU Market
          </a>

          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isSearchFocused ? "flex-1 max-w-2xl mx-8" : "w-48 mx-4"
          )}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for anything..."
                className="w-full py-2 pl-10 pr-4 text-white bg-background rounded-full border border-white/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-500"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </div>

          <Link to="/profile">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 hover:bg-primary/20"
            >
              <User className="h-5 w-5 text-primary" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="relative">
                <select className="appearance-none bg-background text-white text-sm rounded-lg pl-3 pr-10 py-1.5 border border-white/10 focus:outline-none focus:border-primary">
                  <option value="">All Categories</option>
                  <option value="textbooks">Textbooks</option>
                  <option value="electronics">Electronics</option>
                  <option value="stationery">Stationery</option>
                  <option value="others">Others</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select className="appearance-none bg-background text-white text-sm rounded-lg pl-3 pr-10 py-1.5 border border-white/10 focus:outline-none focus:border-primary">
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
