import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Initialize the OpenAI client when API key is available
export const initializeOpenAI = (apiKey: string) => {
  openai = new OpenAI({
    apiKey: apiKey,
  });
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

  // If OpenAI isn't initialized or query is too short, return default
  if (!openai || query.length < 3) {
    return defaultResponse;
  }

  try {
    // Create a prompt for the OpenAI API
    const systemMessage = 'Extract search intent from e-commerce marketplace query. Respond with JSON only.';
    const userMessage = `Query: "${query}"

Provide a JSON response with these fields (leave blank if not mentioned):
- keywords: array of product keywords
- category: product category if mentioned
- priceRange: object with min and/or max price if mentioned (in numbers only)
- condition: condition of item (new, used, etc.)
- sortBy: sorting preference (price_asc, price_desc, newest, etc.)

JSON format only:`;

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Current model version
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    // Parse the response
    const content = response.choices[0]?.message.content?.trim() || '{}';
    
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
      console.error('Error parsing OpenAI response:', jsonError);
      return defaultResponse;
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return defaultResponse;
  }
};

// Fallback function for when OpenAI API is not available
export const extractSearchParamsWithoutAI = (query: string): SearchParams => {
  const params: SearchParams = {
    keywords: [],
  };

  // Extract keywords (removing common words)
  const commonWords = ['i', 'want', 'to', 'buy', 'show', 'me', 'the', 'a', 'an', 'and', 'or', 'for'];
  params.keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word));

  // Extract price range
  const pricePattern = /(under|below|above|over|less than|more than)\s*[₦$]?\s*(\d+[k]?|\d+([,.]\d+)?)/gi;
  const priceMatches = query.matchAll(pricePattern);
  
  for (const match of priceMatches) {
    const modifier = match[1].toLowerCase();
    let value = match[2];
    
    // Convert 'k' notation to actual number
    if (value.toLowerCase().endsWith('k')) {
      value = (parseFloat(value.slice(0, -1)) * 1000).toString();
    }
    
    const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
    
    if (!params.priceRange) params.priceRange = {};
    
    if (['under', 'below', 'less than'].includes(modifier)) {
      params.priceRange.max = numValue;
    } else if (['above', 'over', 'more than'].includes(modifier)) {
      params.priceRange.min = numValue;
    }
  }

  // Extract condition
  if (query.toLowerCase().includes('new')) {
    params.condition = 'new';
  } else if (query.toLowerCase().includes('used')) {
    params.condition = 'used';
  }

  // Extract category (simplified example - would need expansion)
  const categories = [
    { name: 'electronics', keywords: ['electronics', 'phone', 'phones', 'laptop', 'laptops', 'computer', 'gadget'] },
    { name: 'clothing', keywords: ['cloth', 'clothes', 'clothing', 'shirt', 'pants', 'dress', 'fashion'] },
    { name: 'food', keywords: ['food', 'meal', 'restaurant', 'eat', 'drink', 'grocery'] },
  ];

  for (const category of categories) {
    if (category.keywords.some(keyword => query.toLowerCase().includes(keyword))) {
      params.category = category.name;
      break;
    }
  }

  return params;
};
