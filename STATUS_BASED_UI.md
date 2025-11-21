# Application Status-Based UI Implementation

## Overview
Implemented dynamic UI that shows different buttons and status indicators based on the user's application status for each gig.

## Features Implemented

### 1. Gig Details Page Status Display

The gig details page now shows different UI based on application status:

**No Application (Not Applied Yet):**
- Shows "Apply Now" button
- Normal application flow

**Pending Status:**
- Shows disabled "Applied - Pending Review" button with clock icon
- Displays owner's response message if provided
- User can't take further action

**Accepted Status:**
- Shows green "Message Owner" button
- Displays "Application Accepted!" message with checkmark
- Shows owner's response message if provided
- Clicking button starts/opens conversation with gig owner

**Rejected Status:**
- Shows "Reapply" button (outline variant)
- Displays "Application Rejected" message
- Shows owner's response message explaining rejection
- User can delete old application and reapply

### 2. Gigs Listing Page Status Badges

The gigs listing page (`/gigs`) now shows status badges instead of action buttons:

**No Application:**
- Shows "Apply Now" button as before

**Pending:**
- Shows yellow/gray "Pending" badge with clock icon
- No click action

**Accepted:**
- Shows green "Accepted" badge with checkmark icon
- Clicking card opens gig details where they can message owner

**Rejected:**
- Shows red "Rejected" badge with X icon
- Clicking card opens gig details where they can reapply

### 3. Reapply Functionality

When a user's application is rejected:
1. Old application record is deleted from database
2. New application is created with pending status
3. Owner can review the new application fresh
4. Toast notification confirms reapplication

### 4. Message Owner Functionality

When application is accepted:
1. User can click "Message Owner" button
2. System checks if conversation exists
3. If exists, navigates to existing conversation
4. If not, creates new conversation and navigates to it
5. Owner and applicant can now discuss the gig details

## Technical Implementation

### Application Status Fetching

```typescript
const [applicationStatus, setApplicationStatus] = useState<{
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    response_message?: string;
} | null>(null);

const fetchApplicationStatus = async () => {
    const { data } = await supabase
        .from('gig_applications')
        .select('id, status, response_message')
        .eq('gig_id', gigId)
        .eq('applicant_id', currentUser.id)
        .maybeSingle();
    
    setApplicationStatus(data);
};
```

### Conditional Button Rendering

The UI adapts based on the status:
- Pending → Disabled button showing status
- Accepted → Green "Message" button
- Rejected → Outline "Reapply" button  
- No application → Primary "Apply Now" button

### Status Badges in Listing

Instead of always showing "Apply Now", the listing shows:
- Pending → Gray badge
- Accepted → Green badge
- Rejected → Red badge

## User Experience Flow

### Happy Path (Application Accepted):
1. User applies to gig → Sees "Pending" status
2. Owner accepts → Status changes to "Accepted"
3. User sees green "Message Owner" button
4. Clicks to start conversation
5. Can discuss project details

### Recovery Path (Application Rejected):
1. User applies to gig → Sees "Pending" status
2. Owner rejects with reason → Status changes to "Rejected"
3. User sees rejection message and reason
4. Clicks "Reapply" button
5. Old application deleted, new one created
6. Back to "Pending" status

### Browse Experience:
1. User browses gigs on `/gigs`
2. Sees status badges on gigs they've applied to
3. Can quickly identify which gigs are pending/accepted/rejected
4. Makes informed decisions about follow-up actions

## Files Modified

1. **src/pages/gigs/GigDetails.tsx**
   - Added application status fetching
   - Implemented conditional button rendering
   - Added handleReapply and handleMessage functions
   - Updated UI to show status-based states

2. **src/components/GigCard.tsx**
   - Added application status fetching per gig
   - Replaced Apply button with status badges
   - Added conditional rendering logic

## Benefits

1. **Clear Communication**: Users know exactly where their application stands
2. **Action-Oriented**: Each status has clear next steps
3. **Owner Messages**: Response messages provide context
4. **Second Chances**: Rejected users can improve and reapply
5. **Efficient Browsing**: Quick status overview in listing view
6. **Better UX**: No confusion about application state
