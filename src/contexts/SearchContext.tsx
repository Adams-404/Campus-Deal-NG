import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SearchParams, processNaturalLanguageQuery, extractSearchParamsWithoutAI } from '../services/nlpService';

interface SearchContextType {
  // Original search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  // NLP-enhanced search state
  searchParams: SearchParams;
  isProcessingNLP: boolean;
  useNLP: boolean;
  setUseNLP: (use: boolean) => void;
  priceRange: { min?: number; max?: number };
  setPriceRange: (range: { min?: number; max?: number }) => void;
  condition: string | undefined;
  setCondition: (condition: string | undefined) => void;
  
  // Search history feature
  searchHistory: string[];
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  
  // Did you mean feature
  spellingSuggestion: string | null;
  setSpellingSuggestion: (suggestion: string | null) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  // Original search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  
  // NLP-enhanced search state
  const [useNLP, setUseNLP] = useState(true); // Enable NLP by default
  const [isProcessingNLP, setIsProcessingNLP] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keywords: [],
  });
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [condition, setCondition] = useState<string | undefined>(undefined);
  
  // Search history feature
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    // Load search history from localStorage on initialization
    const savedHistory = localStorage.getItem('searchHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  // Did you mean feature
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);

  // Process search query with NLP when it changes
  useEffect(() => {
    const processQuery = async () => {
      if (!searchQuery.trim() || !useNLP) {
        // Reset search params if query is empty or NLP is disabled
        setSearchParams({ keywords: [] });
        return;
      }

      // Use fallback extraction if query is simple
      if (searchQuery.length < 5 || searchQuery.split(' ').length < 3) {
        const params = extractSearchParamsWithoutAI(searchQuery);
        setSearchParams(params);
        
        // Update UI state based on extracted params
        if (params.category && params.category.length > 0) {
          setSelectedCategories([params.category]);
        }
        if (params.priceRange) {
          setPriceRange(params.priceRange);
        }
        if (params.condition) {
          setCondition(params.condition);
        }
        if (params.sortBy) {
          setSortBy(params.sortBy);
        }
        return;
      }

      // Process with OpenAI if query is complex
      try {
        setIsProcessingNLP(true);
        const params = await processNaturalLanguageQuery(searchQuery);
        setSearchParams(params);
        
        // Update UI state based on extracted params
        if (params.category && params.category.length > 0) {
          setSelectedCategories([params.category]);
        }
        if (params.priceRange) {
          setPriceRange(params.priceRange);
        }
        if (params.condition) {
          setCondition(params.condition);
        }
        if (params.sortBy) {
          setSortBy(params.sortBy);
        }
      } catch (error) {
        console.error('Error processing query with NLP:', error);
        // Fall back to simple extraction on error
        const params = extractSearchParamsWithoutAI(searchQuery);
        setSearchParams(params);
      } finally {
        setIsProcessingNLP(false);
      }
    };

    // Debounce processing to avoid too many API calls
    const timer = setTimeout(() => {
      processQuery();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, useNLP]);

  // Add to search history when search query is submitted
  const addToSearchHistory = (query: string) => {
    if (!query.trim() || query.length < 3) return;
    
    // Don't add duplicate queries
    if (searchHistory.includes(query)) {
      // Move it to the top instead
      const newHistory = [
        query, 
        ...searchHistory.filter(item => item !== query)
      ].slice(0, 10); // Keep only 10 most recent searches
      
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return;
    }

    // Add new query to history
    const newHistory = [query, ...searchHistory].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <SearchContext.Provider
      value={{
        // Original search state
        searchQuery,
        setSearchQuery,
        selectedCategories,
        setSelectedCategories,
        sortBy,
        setSortBy,
        
        // NLP-enhanced search state
        searchParams,
        isProcessingNLP,
        useNLP,
        setUseNLP,
        priceRange,
        setPriceRange,
        condition,
        setCondition,
        
        // Search history feature
        searchHistory,
        addToSearchHistory,
        clearSearchHistory,
        
        // Did you mean feature
        spellingSuggestion,
        setSpellingSuggestion,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 