# UI/UX Guidelines for Mobile

The mobile version should maintain the brand identity of Campus Deal while optimizing for touch interfaces and smaller screens.

## 1. Navigation
- **Bottom Navigation Bar**: Essential for mobile. Should include:
  - **Home** (Marketplace)
  - **Gigs**
  - **Messages** (with badge for unread)
  - **Wallet**
  - **Profile/Menu**
- **Search Bar**: Persistent or easily accessible at the top of the Home and Gigs screens.
- **Top Bar**: For secondary navigation like Notifications, Settings, or Back buttons.

## 2. Design System
- **Colors**: Maintain the primary/secondary color scheme from the web version (defined in `tailwind.config.ts` and `src/index.css`).
- **Typography**: Responsive font sizes. Avoid text smaller than 12px.
- **Icons**: Use Lucide React Native (or equivalent for the chosen stack) to match the web app's iconography.

## 3. Key Mobile Interactions
- **Pull-to-Refresh**: Mandatory for Marketplace and Messaging lists.
- **Infinite Scroll**: Implement for the Product Grid and Gig lists to improve performance over pagination.
- **Image Uploads**: Native camera and gallery access for creating listings.
- **Push Notifications**: Real-time alerts for messages, gig applications, and transactions.
- **Swipe Actions**: (Optional) Swipe to delete or archive messages.

## 4. Performance Optimization
- **Image Optimization**: Use Supabase storage transformations to request smaller images for mobile thumbnails.
- **Caching**: Utilize TanStack Query's persistent caching to allow for offline viewing of previously loaded content.
- **Lazy Loading**: Ensure screens are loaded on-demand.
