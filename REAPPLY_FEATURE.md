# Reapply After Withdrawal Feature

## Overview
Users can now reapply to gigs after withdrawing their application. The system updates the existing application record instead of creating a new one.

## How It Works

### Withdrawal → Reapply Flow

1. **User applies** → Status: `pending`
2. **User withdraws** → Status: `withdrawn` (with reason)
3. **User reapplies** → Status: `pending` (reason cleared)
4. **Owner sees** → Same application, now pending again (not a new one!)

## Key Implementation Details

### Database Approach
Instead of deleting and recreating applications, we **UPDATE** the existing record:

```sql
-- When reapplying
UPDATE gig_applications
SET 
  status = 'pending',
  withdrawal_reason = NULL,  -- Clear the reason
  message = 'I'm interested in working on: [Gig Title]',
  updated_at = NOW()
WHERE id = [application_id]
```

### Why This Approach?

1. **Maintains History**: The same application record is reused
2. **Respects Unique Constraint**: `UNIQUE(gig_id, applicant_id)` still works
3. **Clean Data**: No duplicate applications
4. **Owner Perspective**: Sees status change, not new application

## User Interface

### Gig Details Page (`/gigs/:id`)

**Withdrawn Status Display:**
```
┌─────────────────────────────┐
│ [Reapply] (Primary Button)  │
│                              │
│ 🟠 Application Withdrawn     │
│ Reason: Found better offer   │
└─────────────────────────────┘
```

**After Clicking Reapply:**
```
┌─────────────────────────────┐
│ [Applied - Pending] (Disabled)
│ [Withdraw Application]       │
└─────────────────────────────┘
```

### Gigs Listing Page (`/gigs`)

**Withdrawn Gig Card:**
Shows orange "Withdrawn" badge with X icon

**After Reapplying:**
Badge changes to yellow "Pending"

## Owner Experience

**Before Reapply:**
```
Application Status: Withdrawn
🟠 Applicant Withdrew Application
Reason: Found better opportunity
```

**After Applicant Reapplies:**
```
Application Status: Pending
[Accept] [Reject] buttons appear
(Withdrawal reason is cleared)
```

The owner sees the **same application** with updated status, not a new application in their list!

## Technical Flow

### handleReapply Function (GigDetails.tsx)
```typescript
const handleReapply = async () => {
    // Update the withdrawn application back to pending
    await supabase
        .from('gig_applications')
        .update({
            status: 'pending',
            withdrawal_reason: null,  // Clear reason
            message: `I'm interested in working on: ${gig.title}`,
            updated_at: new Date().toISOString()
        })
        .eq('id', applicationStatus.id);
    
    // Status refreshes automatically
    await fetchApplicationStatus();
};
```

### Status Type Updates
```typescript
type ApplicationStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'withdrawn';  // ✅ Added
```

## Benefits

1. **Second Chances**: Users can change their mind
2. **Clean History**: No duplicate applications
3. **Simple Tracking**: One application per user per gig
4. **Owner Clarity**: Sees status change, not new application
5. **Data Integrity**: Unique constraint maintained

## Complete Status Cycle

A single application can go through this lifecycle:

```
pending → withdrawn → pending → accepted
   ↓                     ↑
   ↓──────────────────────  (Reapply updates same record)
```

Or:

```
pending → withdrawn → pending → rejected → pending (reapply)
```

## Example Scenario

**Day 1:** User applies to "Laundry Service"
- Application ID: `abc-123`
- Status: `pending`

**Day 2:** User withdraws
- Application ID: `abc-123` (same)
- Status: `withdrawn`
- Reason: "Found better opportunity"

**Day 3:** User changes mind and reapplies
- Application ID: `abc-123` (still same!)
- Status: `pending`
- Reason: `null` (cleared)

**Owner sees:** Same application changed from withdrawn → pending

## Files Modified

1. **src/pages/gigs/GigDetails.tsx**
   - Updated `handleReapply()` to UPDATE instead of DELETE+CREATE
   - Added `withdrawn` status UI with reapply button
   - Shows withdrawal reason in orange box
   - Added `withdrawal_reason` to applicationStatus type

2. **src/components/GigCard.tsx**
   - Added `withdrawn` to status type
   - Shows orange "Withdrawn" badge in gig listing

3. **src/pages/gigs/Applications.tsx**
   - Already handles withdrawn status (from previous feature)

## No Migration Needed

The `withdrawal_reason` column was already added in the previous feature!

## Summary

Users can now freely withdraw and reapply to gigs. The system updates the existing application record, keeping data clean and maintaining the unique constraint. Owners see the same application with updated status, not a new application. This creates a seamless experience for both parties! 🎉
