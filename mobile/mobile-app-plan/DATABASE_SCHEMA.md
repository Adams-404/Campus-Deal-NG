# Database Schema (Supabase/PostgreSQL)

The following tables are central to the Campus Deal application:

## Tables

### 1. `profiles`
- `id`: User UUID (matches Supabase Auth ID)
- `first_name`, `last_name`, `email`, `phone`, `address`
- `avatar_url`: Storage link for profile picture
- `kyc_status`: `pending`, `verified`, `rejected`, `processing`
- `wallet_balance`: Current balance in NGN
- `onboarding_completed`: Boolean
- `referral_code`: Unique code for invitations

### 2. `items` (Marketplace)
- `id`, `title`, `description`, `price`, `category`, `location`, `seller_id`
- `condition`: `new`, `like_new`, `good`, `fair`, `poor`
- `status`: `active`, `sold`, `deleted`

### 3. `item_images` / `item_videos`
- `id`, `item_id`, `image_url` / `video_url`
- `is_primary`: Boolean for the main image

### 4. `conversations` / `messages`
- `conversations`: `id`, `buyer_id`, `seller_id`, `last_message`, `last_message_at`
- `messages`: `id`, `conversation_id`, `sender_id`, `content`, `image_url`, `is_read`

### 5. `notifications`
- `id`, `user_id`, `title`, `content`, `type`, `is_read`, `metadata` (JSON)

### 6. `transactions`
- `id`, `user_id`, `amount`, `type`, `status`, `reference`, `description`

### 7. `kyc_documents`
- `id`, `user_id`, `document_type`, `document_url`, `status`, `admin_notes`

## Enums
- `item_condition`
- `item_status`
- `kyc_status`
- `transaction_status`
- `user_role` (admin, user)
