import React, { useState, useEffect } from 'react';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NLPSearchBarProps {
  className?: string;
}

export function NLPSearchBar({ className }: NLPSearchBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
    <div className={cn("relative", className)}>
      <div className={cn(
        "relative flex items-center",
        isSearchFocused ? "ring-2 ring-primary" : ""
      )}>
        {/* Search icon or loading indicator */}
        {isProcessingNLP ? (
          <Loader2 className="absolute left-3 h-4 w-4 animate-spin text-primary" />
        ) : (
          <Search className={cn(
            "absolute left-3 h-4 w-4",
            theme === 'light' ? "text-primary" : "text-muted-foreground"  
          )} />
        )}
        {/* Search input */}
        <input  
          type="text"  
          placeholder={useNLP ? "Ask naturally (e.g. 'phones under ₦50,000')..." : "Search for anything..."}  
          value={searchQuery}  
          onChange={handleSearch}  
          onKeyDown={handleKeyDown}  
          onFocus={() => setIsSearchFocused(true)}  
          onBlur={() => setIsSearchFocused(false)}  
          className={cn(
            "w-full h-8 pl-10 pr-16 rounded-full focus:outline-none",
            theme === 'light' 
              ? "bg-white/90 border-2 border-blue-500 text-black shadow-sm" 
              : "bg-background border border-white/10 text-white",
            "transition-colors placeholder:text-gray-500"
          )}  
        />
        {/* NLP toggle button */}
        <button
          onClick={() => setUseNLP(!useNLP)}
          className={cn(
            "absolute right-10 p-1 rounded-full",
            useNLP ? 
              (theme === 'light' ? "text-blue-600 hover:bg-blue-100" : "text-primary hover:bg-primary/20") : 
              "text-muted-foreground hover:text-primary"
          )}
          title={useNLP ? "Natural language search enabled" : "Natural language search disabled"}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        {/* Clear search button */}
        {searchQuery && (  
          <button  
            onClick={clearSearch}  
            className="absolute right-3 text-muted-foreground hover:text-primary"  
            title="Clear search"
          >  
            <X className="w-4 h-4" />
          </button>  
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
