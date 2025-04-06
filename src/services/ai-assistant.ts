import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

// Validate API key
if (!import.meta.env.GEMINI_API_KEY) {
  console.error('Gemini API key is missing. Please add GEMINI_API_KEY to your .env file.');
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

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getAIResponse(userMessage: string, chatHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Get the chat model (using the correct model version)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",  // Updated to use the flash model
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });
    
    // Start a chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are an AI assistant for Tradezy. Please acknowledge and confirm you'll follow the guidelines." }]
        },
        {
          role: "model",
          parts: [{ text: "I understand that I am an AI assistant for Tradezy. I will provide helpful, friendly responses focused on the app's features and safety, following all the guidelines provided." }]
        },
        ...chatHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    // Send the message with context
    const result = await chat.sendMessage([
      { text: `${APP_CONTEXT}\n\nUser question: ${userMessage}\n\nProvide a helpful response following the guidelines above.` }
    ]);
    const response = await result.response;
    
    return response.text();
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