# API & External Integrations

Campus Deal relies on several external services to provide its core functionality.

## 1. Supabase (Backend-as-a-Service)
- **Database**: PostgreSQL (accessible via REST/Postgrest and WebSockets for real-time).
- **Authentication**: JWT-based auth. 
  - *Mobile Implementation*: Use `supabase-js` or `supabase_flutter`. Ensure secure storage of the refresh token.
- **Storage**: S3-compatible storage for binary files (images/videos).
- **Real-time**: Used for instant messaging and notifications.

## 2. Google Gemini AI
- **Model**: `gemini-1.5-flash`
- **Usage**:
  - **NLP Search**: Extracting structured parameters (keywords, category, price, condition) from natural language strings.
  - **AI Assistant**: Conversational helper for users.
- **Service File**: `src/services/nlpService.ts`
- **API Key**: Required via environment variable `VITE_GEMINI_API_KEY`.

## 3. EmailJS / Resend
- **Purpose**: Sending transactional emails (verification, notifications).
- **Implementation**: Used in auth and notification services.

## 4. Analytics
- **Google Analytics**: Track user behavior and page views.
- **Implementation**: `src/utils/analytics.ts`.

## 5. Paystack / Flutterwave (Planned/In-progress)
- **Purpose**: In-app payments for wallet funding and marketplace transactions.
- **Implementation**: Transaction logic resides in the `transactions` table and `initialize_transaction` RPC in Supabase.
