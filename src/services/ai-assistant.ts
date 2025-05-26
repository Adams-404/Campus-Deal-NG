import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);  // Use VITE_ prefix

// Validate API key
if (!import.meta.env.VITE_GEMINI_API_KEY) {
  console.error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.');
}

// Interface for rich content items
export interface RichContentItem {
  type: 'item';
  id: string;
  title: string;
  price: number;
  image?: string;
  category: string;
  sellerName: string;
}

// Interface for search results
export interface SearchResult {
  id: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  seller: {
    first_name?: string;
    last_name?: string;
  };
  description?: string;
  condition?: string;
}

// Interface for formatted results
export interface FormattedResults {
  message: string;
  isRichContent: boolean;
  richContent?: RichContentItem[];
}

// Search for items in the database
async function searchItems(query: string): Promise<SearchResult[]> {
  console.log('Starting search with query:', query);
  
  try {
    // Clean and prepare search terms - remove common words and special characters
    const searchTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(' ')
      .filter(term => term.length > 2 && !['for', 'the', 'and', 'with', 'under', 'over'].includes(term));

    console.log('Processed search terms:', searchTerms);
    
    if (searchTerms.length === 0) {
      console.log('No valid search terms after processing');
      return [];
    }

    // Build the search query
    console.log('Building database query...');
    let queryBuilder = supabase
      .from('items')
      .select(`
        *,
        item_images (image_url),
        profiles:seller_id (first_name, last_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10); // Limit to 10 results for performance

    // Add search conditions for each term
    if (searchTerms.length > 0) {
      const orConditions = searchTerms
        .map(term => `title.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
        .join(',');
      
      console.log('Applying search conditions:', orConditions);
      queryBuilder = queryBuilder.or(orConditions);
    }

    console.log('Executing database query...');
    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error searching items:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} items`);

    // Transform the data to match our interface
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      category: item.category,
      images: item.item_images?.map(img => img.image_url) || [],
      seller: {
        first_name: item.profiles?.first_name,
        last_name: item.profiles?.last_name
      },
      description: item.description,
      condition: item.condition
    }));
  } catch (error) {
    console.error('Error in searchItems:', error);
    return [];
  }
}

// Format item results into a structured format
function formatItemResults(items: SearchResult[]): FormattedResults {
  if (items.length === 0) return { message: 'No items found', isRichContent: false };

  return {
    message: 'I found these items that match your search:',
    isRichContent: true,
    richContent: items.slice(0, 3).map(item => {
      const sellerName = [item.seller.first_name, item.seller.last_name]
        .filter(Boolean)
        .join(' ');

      return {
        type: 'item',
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.images[0],
        category: item.category,
        sellerName: sellerName || 'Anonymous'
      };
    })
  };
}

// App context that will be fed to the AI
const APP_CONTEXT = `You are an AI assistant for Tradezy, a GSU Market Hub, a marketplace app for Gombe State University.
The app has the following main features:

1. Marketplace Features:
- Browse and search items for sale
- List items for sale
- Save favorite items
- Categories include: Books, Electronics, Furniture, etc.
- View item details and seller information

2. User Features:
- User profiles with ratings and reviews
- Direct messaging between buyers and sellers
- Notifications for messages and item updates
- Personal listings management

3. Safety Features:
- In-app messaging system
- User verification
- Safety tips for meeting and transactions
- Report suspicious listings or users

4. Account Management:
- Profile settings
- Notification preferences
- Privacy settings
- Account security

Common tasks you can help with:
- How to list an item for sale
- How to contact a seller
- How to report issues
- Account settings and management
- Safety guidelines for transactions
- Using the messaging system
- Finding specific items
- Managing listings

Please provide helpful, friendly responses focused on the app's features and safety. 
If asked about meeting locations, always emphasize safety and recommend meeting in public places.

Important guidelines for your responses:
1. Keep responses concise but informative
2. Use bullet points for lists
3. Always prioritize user safety
4. Be friendly and encouraging
5. If you're not sure about something, say so
6. Suggest related features when relevant`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Check if the message is a shopping-related query
const isShoppingQuery = (message: string): boolean => {
  if (!message || typeof message !== 'string') {
    console.log('Invalid message in isShoppingQuery:', message);
    return false;
  }

  const shoppingKeywords = [
    // Shopping intent
    'buy', 'purchase', 'shop', 'order', 'get', 'find', 'looking for', 
    'search for', 'show me', 'i need', 'i want', 'i\'m looking for',
    // Price-related
    'price', 'cost', 'how much', 'under', 'below', 'less than', 'cheap',
    'affordable', 'discount', 'sale', 'deal', 'offer', 'cheaper', 'budget',
    // Item-specific
    'laptop', 'phone', 'textbook', 'book', 'bike', 'bicycle', 'furniture',
    'electronics', 'clothes', 'clothing', 'shoes', 'bag', 'accessory', 'item'
  ];
  
  const query = message.toLowerCase().trim();
  const isShopping = shoppingKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(query)
  );
  
  console.log(`isShoppingQuery for "${query}":`, isShopping);
  return isShopping;
};

export async function getAIResponse(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
  console.log('getAIResponse called with message:', userMessage);
  
  try {
    // First, check if this is a shopping query
    if (isShoppingQuery(userMessage)) {
      console.log('Detected shopping query, searching for items...');
      try {
        const items = await searchItems(userMessage);
        console.log(`Found ${items.length} items matching the query`);
        
        if (items.length > 0) {
          console.log('Formatting item results...');
          const formattedResults = formatItemResults(items);
          return JSON.stringify(formattedResults);
        } else {
          console.log('No items found for the query');
        }
      } catch (searchError) {
        console.error('Error during item search:', searchError);
        // Continue to AI response if search fails
      }
    }

    console.log('Using AI to generate response...');
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      });
      
      // Start a chat with enhanced context
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ 
              text: `You are an AI assistant for Tradezy. ${APP_CONTEXT}\n\n` +
                    'IMPORTANT: If the user is looking to buy something, try to understand their needs and search for relevant items. ' +
                    'For example, if they say "I want to buy a laptop under 100k", you should search for laptops in that price range.\n' +
                    'When showing items, include the title, price, and a brief description if available.'
            }]
          },
          {
            role: "model",
            parts: [{ 
              text: "I understand that I am an AI assistant for Tradezy. I will help users find items to buy, answer questions about the app, " +
                    "and provide helpful information while following all safety guidelines. I'll be friendly, concise, and focus on being helpful."
            }]
          },
          ...chatHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
        ]
      });

      console.log('Sending message to AI...');
      const result = await chat.sendMessage([
        { 
          text: `User question: ${userMessage}\n\n` +
                'Instructions: Provide a helpful response. ' +
                'If the user is looking to buy something, search our database for matching items. ' +
                'Be friendly, concise, and focus on being helpful.'
        }
      ]);
      
      const response = await result.response;
      let responseText = response.text();
      
      // If the response is short and we didn't find items initially, try a search
      if (responseText.length < 100 && isShoppingQuery(userMessage)) {
        console.log('AI response was short, trying item search again...');
        try {
          const items = await searchItems(userMessage);
          if (items.length > 0) {
            const formattedResults = formatItemResults(items);
            responseText = JSON.stringify({
              ...formattedResults,
              message: 'I found these items that might interest you:'
            });
          }
        } catch (fallbackError) {
          console.error('Error in fallback item search:', fallbackError);
        }
      }
      
      console.log('Returning AI response');
      return responseText;
    } catch (aiError) {
      console.error('Error in AI response generation:', aiError);
      throw aiError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error in getAIResponse:', error);
    // Enhanced error handling with more specific messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid or missing API key. Please check your configuration.');
      } else if (error.message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (error.message.includes('blocked')) {
        throw new Error('The request was blocked. Please try rephrasing your question.');
      } else if (error.message.includes('not found')) {
        throw new Error('Unable to connect to AI service. Please check your internet connection.');
      } else {
        throw new Error(`AI service error: ${error.message}`);
      }
    }
    throw error;
  }
}
