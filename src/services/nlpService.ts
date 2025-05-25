import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

// Initialize the Google Generative AI client when API key is available
export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

// Interface for structured search parameters
export interface SearchParams {
  keywords: string[];
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  condition?: string; // new, used, etc.
  sortBy?: string;
}

// Process natural language query to extract structured search parameters
export const processNaturalLanguageQuery = async (
  query: string
): Promise<SearchParams> => {
  // Default response if OpenAI isn't configured or for fallback
  const defaultResponse: SearchParams = {
    keywords: query.split(' ').filter(word => word.length > 2),
  };

  // If Gemini isn't initialized or query is too short, return default
  if (!genAI || query.length < 3) {
    return defaultResponse;
  }

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Create a prompt for the Gemini API
    const prompt = `Extract search intent from this e-commerce marketplace query and respond with only a valid JSON object.

Query: "${query}"

Provide a JSON response with these fields (leave blank if not mentioned):
- keywords: array of product keywords
- category: product category if mentioned
- priceRange: object with min and/or max price if mentioned (in numbers only)
- condition: condition of item (new, used, etc.)
- sortBy: sorting preference (price_asc, price_desc, newest, etc.)

Respond with only the JSON object, no other text.`;

    // Make API call to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    
    // Try to extract valid JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
    
    try {
      const parsedResponse = JSON.parse(jsonStr) as SearchParams;
      
      // Ensure we have at least the keywords field
      if (!parsedResponse.keywords || !Array.isArray(parsedResponse.keywords) || parsedResponse.keywords.length === 0) {
        parsedResponse.keywords = defaultResponse.keywords;
      }
      
      return parsedResponse;
    } catch (jsonError) {
      console.error('Error parsing Gemini response:', jsonError);
      return defaultResponse;
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return defaultResponse;
  }
};

// Fallback function for when OpenAI API is not available
export const extractSearchParamsWithoutAI = (query: string): SearchParams => {
  const params: SearchParams = {
    keywords: [],
  };

  // Convert query to lowercase for case-insensitive matching
  const queryLower = query.toLowerCase();

  // Extract keywords (removing common words and numbers)
  const commonWords = ['i', 'want', 'to', 'buy', 'show', 'me', 'the', 'a', 'an', 'and', 'or', 'for', 'under', 'over', 'below', 'above'];
  params.keywords = queryLower
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word) && !/^\d+$/.test(word));

  // Extract price range - handle formats like "under 3000", "below ₦3k", "less than 3,000"
  const pricePatterns = [
    { regex: /(under|below|less than|max|maximum|up to|under ₦|below ₦|less than ₦)\s*[₦$]?\s*(\d+[kK]?|\d+([,.]\d+)?)/, type: 'max' },
    { regex: /(above|over|more than|min|minimum|from|above ₦|over ₦|more than ₦)\s*[₦$]?\s*(\d+[kK]?|\d+([,.]\d+)?)/, type: 'min' },
    { regex: /[₦$]?\s*(\d+[kK]?|\d+([,.]\d+)?)\s*(and\s*)?(under|below|less than|max|maximum|up to)/, type: 'max', group: 1 },
    { regex: /[₦$]?\s*(\d+[kK]?|\d+([,.]\d+)?)\s*(and\s*)?(above|over|more than|min|minimum|from)/, type: 'min', group: 1 },
  ];

  // First check for exact price range patterns
  const exactPriceMatch = queryLower.match(/(\d+)\s*(?:-|to|and)\s*(\d+)/);
  if (exactPriceMatch) {
    const min = parseFloat(exactPriceMatch[1].replace(/[^\d.]/g, ''));
    const max = parseFloat(exactPriceMatch[2].replace(/[^\d.]/g, ''));
    if (!isNaN(min) && !isNaN(max)) {
      params.priceRange = { min, max };
    }
  } else {
    // If no exact range, check for individual min/max patterns
    for (const pattern of pricePatterns) {
      const match = queryLower.match(pattern.regex);
      if (match) {
        let value = match[pattern.group || 2] || match[1];
        
        // Convert 'k' notation to actual number (e.g., 3k -> 3000)
        if (value && value.toLowerCase().endsWith('k')) {
          value = (parseFloat(value.slice(0, -1).replace(/[^\d.]/g, '')) * 1000).toString();
        }
        
        const numValue = parseFloat((value || '').replace(/[^\d.]/g, ''));
        if (!isNaN(numValue)) {
          if (!params.priceRange) params.priceRange = {};
          if (pattern.type === 'max') {
            // For max price, ensure it's not less than existing min
            if (!params.priceRange.min || numValue >= params.priceRange.min) {
              params.priceRange.max = numValue;
            }
          } else {
            // For min price, ensure it's not more than existing max
            if (!params.priceRange.max || numValue <= params.priceRange.max) {
              params.priceRange.min = numValue;
            }
          }
        }
      }
    }
  }

  // Extract condition
  const conditionMap: Record<string, string> = {
    'new': 'new',
    'like new': 'like_new',
    'used': 'good',
    'good': 'good',
    'fair': 'fair',
    'poor': 'poor'
  };

  for (const [term, condition] of Object.entries(conditionMap)) {
    if (queryLower.includes(term)) {
      params.condition = condition;
      break;
    }
  }

  // Extract category with more comprehensive matching
  const categories = [
    { 
      name: 'electronics', 
      keywords: ['electronics', 'electronic', 'phone', 'phones', 'smartphone', 'laptop', 'laptops', 'computer', 'pc', 'desktop', 'gadget', 'tablet', 'ipad', 'iphone', 'android', 'camera', 'headphones', 'earbuds', 'speaker'] 
    },
    { 
      name: 'clothing', 
      keywords: ['clothing', 'clothes', 'shirt', 'tshirt', 't-shirt', 'pants', 'jeans', 'dress', 'skirt', 'fashion', 'outfit', 'jacket', 'hoodie', 'sweater', 'shoes', 'sneakers', 'footwear'] 
    },
    { 
      name: 'food', 
      keywords: ['food', 'meal', 'snack', 'restaurant', 'cafe', 'coffee', 'eat', 'drink', 'beverage', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'pasta', 'rice', 'noodles'] 
    },
    { 
      name: 'books', 
      keywords: ['book', 'textbook', 'novel', 'magazine', 'textbooks', 'reading', 'academic', 'course material', 'study material'] 
    },
    { 
      name: 'furniture', 
      keywords: ['furniture', 'chair', 'table', 'desk', 'bed', 'sofa', 'couch', 'wardrobe', 'shelf', 'shelves', 'cabinet'] 
    },
  ];

  // First, check if any keyword is an exact match to a category name
  for (const keyword of params.keywords) {
    const exactMatch = categories.find(cat => cat.name.toLowerCase() === keyword.toLowerCase());
    if (exactMatch) {
      console.log(`Exact category match found: ${exactMatch.name}`);
      params.category = exactMatch.name;
      return params;
    }
  }

  // If no exact match, check for keyword matches
  for (const category of categories) {
    const hasMatchingKeyword = params.keywords.some(keyword => 
      category.keywords.some(kw => kw.toLowerCase() === keyword.toLowerCase())
    );
    
    if (hasMatchingKeyword) {
      console.log(`Keyword match found for category: ${category.name}`);
      params.category = category.name;
      // Add the category as a keyword if it's not already there
      if (!params.keywords.includes(category.name)) {
        params.keywords.unshift(category.name);
      }
      break;
    }
  }

  // If still no match, try partial matching
  if (!params.category) {
    for (const category of categories) {
      const hasPartialMatch = queryLower.split(/\s+/).some(term => 
        category.keywords.some(kw => kw.toLowerCase().includes(term) || term.includes(kw.toLowerCase()))
      );
      
      if (hasPartialMatch) {
        console.log(`Partial match found for category: ${category.name}`);
        params.category = category.name;
        if (!params.keywords.includes(category.name)) {
          params.keywords.unshift(category.name);
        }
        break;
      }
    }
  }

  console.log('Extracted search params:', params);
  return params;
};
