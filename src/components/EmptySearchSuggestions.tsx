import React, { useEffect, useState, useCallback } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface EmptySearchSuggestionsProps {
  searchQuery: string;
  onSuggestionClick: (suggestion: string) => void;
}

export function EmptySearchSuggestions({
  searchQuery,
  onSuggestionClick
}: EmptySearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [relatedCategories, setRelatedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { searchParams } = useSearch();
  const { theme } = useTheme();

  // Generate suggestions locally without API
  const generateLocalSuggestions = useCallback(() => {
    if (!searchQuery?.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Extract keywords for suggestions
      const keywords = searchParams.keywords?.length 
        ? searchParams.keywords 
        : searchQuery.split(' ').filter(w => w.length > 2);
      
      // Generate basic suggestions
      const generatedSuggestions: string[] = [];
      const categories: string[] = [];
      
      // 1. Check for price range and suggest adjustments
      if (searchParams.priceRange?.min || searchParams.priceRange?.max) {
        generatedSuggestions.push(`Try a different price range`);
      }
      
      // 2. Generate keyword-based suggestions
      if (keywords.length > 0) {
        // Take the first keyword and suggest a broader category
        const mainKeyword = keywords[0];
        if (mainKeyword) {
          generatedSuggestions.push(`Browse all ${mainKeyword}s`);
          
          // Suggest removing specific terms if there are multiple keywords
          if (keywords.length > 1) {
            generatedSuggestions.push(`Search for ${mainKeyword} only`);
          }
        }
      }
      
      // 3. Add generic fallbacks
      generatedSuggestions.push('View popular items');
      generatedSuggestions.push('Browse recent listings');
      
      // 4. Generate related categories based on keywords
      const categoryMappings: Record<string, string[]> = {
        'phone': ['Electronics', 'Gadgets', 'Accessories'],
        'laptop': ['Electronics', 'Computers', 'Office'],
        'cloth': ['Fashion', 'Clothing', 'Accessories'],
        'shoe': ['Fashion', 'Footwear', 'Sports'],
        'book': ['Books', 'Education', 'Entertainment'],
        'food': ['Food', 'Groceries', 'Household', 'Restaurant', 'Cafe'],
        'electronic': ['Electronics', 'Gadgets', 'Accessories'],
        'furniture': ['Home', 'Furniture', 'Decor'],
        'bike': ['Vehicles', 'Bicycles', 'Sports'],
        'car': ['Vehicles', 'Cars', 'Automotive'],
      };
      
      // Match keywords to categories
      keywords.forEach(keyword => {
        Object.entries(categoryMappings).forEach(([key, relatedCats]) => {
          if (keyword.toLowerCase().includes(key.toLowerCase())) {
            relatedCats.forEach(cat => {
              if (!categories.includes(cat)) {
                categories.push(cat);
              }
            });
          }
        });
      });
      
      // Add some generic categories if none found
      if (categories.length === 0) {
        categories.push('Electronics', 'Fashion', 'Books', 'Home', 'Sports');
      }
      
      // Remove duplicates and limit to 5 categories
      const finalCategories = [...new Set(categories)].slice(0, 5);
      
      // Update state with generated suggestions and categories
      setSuggestions(generatedSuggestions);
      setRelatedCategories(finalCategories);
    } catch (error) {
      console.error('Error generating local suggestions:', error);
      setSuggestions(['Try a different search', 'Browse all categories']);
      setRelatedCategories(['Electronics', 'Fashion', 'Books', 'Home', 'Sports']);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, searchParams, setSuggestions, setRelatedCategories, setIsLoading]);

  // Generate suggestions when search query or params change
  useEffect(() => {
    generateLocalSuggestions();
  }, [generateLocalSuggestions]);

  if (!searchQuery.trim()) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col gap-4 p-6 rounded-lg", 
      theme === 'light' 
        ? "bg-white/90 border-2 border-blue-500 shadow-sm" 
        : "bg-neutral-900/80 border border-white/10"
    )}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">We couldn't find exactly what you're looking for</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Generating suggestions...</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Try one of these suggestions or modify your search:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className={cn(
                  "justify-start px-3 py-2 h-auto text-left",
                  theme === 'light' ? 'hover:bg-blue-50' : 'hover:bg-primary/10'
                )}
                onClick={() => onSuggestionClick(suggestion)}
              >
                <Search className="h-4 w-4 mr-2 text-primary" />
                {suggestion}
              </Button>
            ))}
          </div>

          {relatedCategories.length > 0 && (
            <>
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">Related Categories:</h4>
                <div className="flex flex-wrap gap-2">
                  {relatedCategories.map((category, index) => (
                    <Button 
                      key={index} 
                      variant="secondary" 
                      size="sm"
                      className={cn(
                        "text-xs", 
                        theme === 'light' ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : 'bg-primary/20'
                      )}
                      onClick={() => onSuggestionClick(`Category: ${category}`)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
