# Architecture & Tech Stack

## Current Web Application Stack
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Shadcn/UI
- **State Management**: React Context API, TanStack Query (React Query)
- **Backend-as-a-Service**: Supabase
  - **Database**: PostgreSQL
  - **Auth**: Supabase Auth (Email/Password, Social)
  - **Storage**: Supabase Storage (Images/Videos)
- **AI Integration**: Google Gemini AI (NLP for Search and Assistant)
- **Analytics**: Google Analytics (tracked in `src/utils/analytics.ts`)
- **PWA Support**: `vite-plugin-pwa` (service workers, manifest)

## Proposed Mobile Application Stack
### Option 1: React Native (Recommended)
- **Framework**: React Native (Expo recommended for faster development)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind for React Native) or Styled Components
- **Auth**: `supabase-js` with Secure Store for token management
- **Database**: `supabase-js` client
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)

### Option 2: Flutter
- **Language**: Dart
- **State Management**: Riverpod or Provider
- **Supabase Integration**: `supabase_flutter` package

## Frontend Structure (Web)
- `src/components`: UI components (Shadcn based)
- `src/pages`: Page-level components
- `src/contexts`: Application-level state (Theme, Auth, Notifications, Search, Settings)
- `src/hooks`: Custom React hooks (Device detection, PWA, etc.)
- `src/services`: External API services (Gemini AI, NLP)
- `src/integrations/supabase`: Supabase client and types
- `src/lib/utils.ts`: Utility functions (Tailwind merging, etc.)
