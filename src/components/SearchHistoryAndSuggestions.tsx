import React, { useState } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { Button } from './ui/button';
import { Search, Clock, X, SpellCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchHistoryAndSuggestionsProps {
  onSelectQuery: (query: string) => void;
}

export function SearchHistoryAndSuggestions({ onSelectQuery }: SearchHistoryAndSuggestionsProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { 
    searchHistory, 
    clearSearchHistory, 
    spellingSuggestion,
    searchQuery
  } = useSearch();
  const { theme } = useTheme();

  const handleSelectHistory = (query: string) => {
    onSelectQuery(query);
    setShowHistory(false);
  };

  const handleSelectSpellingSuggestion = () => {
    if (spellingSuggestion) {
      onSelectQuery(spellingSuggestion);
    }
  };

  // Only show when there's an active search query or spelling suggestion
  if (!searchQuery && !spellingSuggestion) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Did you mean suggestion */}
      {spellingSuggestion && (
        <div className={cn(
          "p-2 my-2 rounded-md flex items-center justify-between gap-2",
          theme === 'light' 
            ? "bg-white/90 border-2 border-blue-500 text-black shadow-sm" 
            : "bg-neutral-900/80 border border-white/10 text-white"
        )}>
          <div className="flex items-center gap-2">
            <SpellCheck className="h-4 w-4 text-primary" />
            <span className="text-sm">Did you mean: </span>
            <button
              onClick={handleSelectSpellingSuggestion}
              className={cn(
                "text-sm font-medium underline underline-offset-4",
                theme === 'light' ? "text-blue-600" : "text-primary"
              )}
            >
              {spellingSuggestion}
            </button>
          </div>
        </div>
      )}

      {/* Search history toggle - only show when actively searching */}
      {searchHistory.length > 0 && searchQuery && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "text-xs flex items-center gap-1 mt-1",
              theme === 'light' 
                ? "text-blue-600 hover:bg-blue-100" 
                : "text-primary hover:bg-primary/10"
            )}
          >
            <Clock className="h-3 w-3" />
            {showHistory ? "Hide search history" : "Show search history"}
          </Button>

          {showHistory && (
            <div className={cn(
              "p-3 my-2 rounded-md",
              theme === 'light' 
                ? "bg-white/90 border-2 border-blue-500 text-black shadow-sm" 
                : "bg-neutral-900/80 border border-white/10 text-white"
            )}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Recent searches</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className={theme === 'light' ? "text-red-600 hover:bg-red-50" : "text-red-400 hover:bg-red-900/20"}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectHistory(query)}
                    className={cn(
                      "text-xs py-1 h-auto",
                      theme === 'light' 
                        ? "bg-white hover:bg-blue-50 border-blue-500" 
                        : "bg-neutral-900 hover:bg-primary/10"
                    )}
                  >
                    <Search className="h-3 w-3 mr-1 text-primary" />
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
