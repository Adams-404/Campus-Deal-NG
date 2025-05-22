import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  X, 
  Loader2, 
  Filter, 
  ChevronDown,
  Utensils,
  Shirt,
  Heart,
  Gem,
  Palette,
  Baby,
  ShoppingBag,
  Footprints,
  SprayCan,
  Wrench,
  Book,
  Monitor,
  Pen,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NLPSearchBarProps {
  className?: string;
}

export function NLPSearchBar({ className }: NLPSearchBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const { 
    selectedCategories, 
    setSelectedCategories, 
    setSortBy 
  } = useSearch();
  
  const categories = [
    { value: "Food", label: "Food", icon: Utensils },
    { value: "Clothing", label: "Clothing", icon: Shirt },
    { value: "Beauty", label: "Beauty", icon: Heart },
    { value: "Jewelry", label: "Jewelry", icon: Gem },
    { value: "Art", label: "Art", icon: Palette },
    { value: "Baby", label: "Baby", icon: Baby },
    { value: "Bags", label: "Bags", icon: ShoppingBag },
    { value: "Shoes", label: "Shoes", icon: Footprints },
    { value: "Perfumes", label: "Perfumes", icon: SprayCan },
    { value: "Tools", label: "Tools", icon: Wrench },
    { value: "Books", label: "Books", icon: Book },
    { value: "Electronics", label: "Electronics", icon: Monitor },
    { value: "Stationary", label: "Stationary", icon: Pen },
    { value: "Others", label: "Others", icon: MoreHorizontal },
  ];
  
  const handleCategorySelect = (category: string) => {
    if (category === '') {
      setSelectedCategories([]);
      setSortBy("random");
    } else {
      setSelectedCategories([category]);
      setSortBy("created_at");
    }
    setIsCategoryOpen(false);
  };

  const { 
    searchQuery, 
    setSearchQuery, 
    useNLP, 
    setUseNLP, 
    isProcessingNLP, 
    searchParams,
    priceRange,
    condition
  } = useSearch();
  const { theme } = useTheme();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // NLP processing is handled automatically in the SearchContext
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-center w-full">
        {/* Search icon or loading indicator */}
        {isProcessingNLP ? (
          <Loader2 className="absolute left-3 h-4 w-4 animate-spin text-primary z-10" />
        ) : (
          <Search className={cn(
            "absolute left-3 h-4 w-4 z-10",
            theme === 'light' ? "text-primary" : "text-muted-foreground"  
          )} />
        )}
        
        {/* Search input */}
        <div className="relative flex-1">
          <input  
            type="text"  
            placeholder={useNLP ? "Ask naturally (e.g. 'phones under ₦50,000')..." : "Search for anything..."}  
            value={searchQuery}  
            onChange={handleSearch}  
            onKeyDown={handleKeyDown}  
            onFocus={() => setIsSearchFocused(true)}  
            onBlur={() => setIsSearchFocused(false)}  
            className={cn(
              "w-full h-8 pl-10 pr-24 rounded-full focus:outline-none transition-all duration-200 border-2 text-sm",
              theme === 'light' 
                ? "bg-white/90 border-[#1a7fba] text-black shadow-sm focus:border-[#1a7fba] focus:ring-0" 
                : "bg-background border-white/10 text-white focus:border-[#1a7fba] focus:ring-0",
              "placeholder:text-gray-500 truncate pr-2"
            )}
            style={{
              paddingRight: selectedCategories.length > 0 ? '100px' : '80px',
              textOverflow: 'ellipsis'
            }}
          />
          
          {/* Category filter button - mobile */}
          {typeof window !== 'undefined' && window.innerWidth < 768 && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryOpen(!isCategoryOpen);
                }}
                className={cn(
                  "flex items-center gap-1 h-6 px-2 rounded-full mr-1",
                  theme === 'light' 
                    ? "text-[#1a7fba] hover:bg-blue-100" 
                    : "text-[#1a7fba] hover:bg-primary/20",
                  selectedCategories.length > 0 && "font-medium"
                )}
                title="Filter by category"
              >
                {selectedCategories.length > 0 ? (
                  <span className="text-xs max-w-[60px] truncate">
                    {categories.find(c => c.value === selectedCategories[0])?.label}
                  </span>
                ) : (
                  <Filter className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <ChevronDown className={cn("w-3 h-3 transition-transform flex-shrink-0", isCategoryOpen ? "rotate-180" : "")} />
              </button>

              {/* NLP toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUseNLP(!useNLP);
                }}
                className={cn(
                  "p-1 rounded-full mr-1",
                  useNLP ? 
                    (theme === 'light' ? "text-[#1a7fba] hover:bg-blue-100" : "text-[#1a7fba] hover:bg-primary/20") : 
                    "text-muted-foreground hover:text-[#1a7fba]"
                )}
                title={useNLP ? "Natural language search enabled" : "Natural language search disabled"}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              {/* Clear search button */}
              {searchQuery && (  
                <button  
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSearch();
                  }}
                  className="text-muted-foreground hover:text-primary p-1"  
                  title="Clear search"
                >  
                  <X className="w-3.5 h-3.5" />
                </button>  
              )}
            </div>
          )}
        </div>
            
        {/* Category dropdown */}
        {isCategoryOpen && (
          <div 
            className={cn(
              "absolute right-0 top-10 w-48 rounded-md shadow-lg z-50 py-1 mt-1",
              theme === 'light' 
                ? "bg-white border border-gray-200" 
                : "bg-gray-900 border border-gray-700"
            )}
          >
            <div 
              className={cn(
                "px-4 py-2 text-sm cursor-pointer hover:bg-opacity-10 hover:bg-primary",
                selectedCategories.length === 0 ? "bg-blue-100 text-blue-800" : ""
              )}
              onClick={() => handleCategorySelect('')}
            >
              All Categories
            </div>
            {categories.map((category) => (
              <div 
                key={category.value}
                className={cn(
                  "px-4 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-opacity-10 hover:bg-primary",
                  selectedCategories.includes(category.value) ? "bg-blue-100 text-blue-800" : ""
                )}
                onClick={() => handleCategorySelect(category.value)}
              >
                <category.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{category.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Click outside to close */}
        {isCategoryOpen && (
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsCategoryOpen(false)}
          />
        )}
      </div>

      {/* Display extracted search parameters when NLP is active and we have results */}
      {useNLP && searchQuery && searchParams.keywords.length > 0 && (
        <div className={cn(
          "mt-1 text-xs px-3 py-1 rounded-md absolute w-full z-10",
          theme === 'light' ? "bg-blue-50 text-blue-800" : "bg-primary/10 text-primary"
        )}>
          {priceRange.min && priceRange.max && (
            <span className="mr-2">₦{priceRange.min.toLocaleString()} - ₦{priceRange.max.toLocaleString()}</span>
          )}
          {priceRange.min && !priceRange.max && (
            <span className="mr-2">Above ₦{priceRange.min.toLocaleString()}</span>
          )}
          {!priceRange.min && priceRange.max && (
            <span className="mr-2">Under ₦{priceRange.max.toLocaleString()}</span>
          )}
          {condition && (
            <span className="mr-2 capitalize">{condition}</span>
          )}
          {searchParams.keywords.slice(0, 3).map((keyword, i) => (
            <span key={i} className="mr-1.5 italic">#{keyword}</span>
          ))}
        </div>
      )}
    </div>
  );
}
