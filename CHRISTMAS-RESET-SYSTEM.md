# Christmas Reset System - Implementation Guide

## 🎄 Problem Identified

**CRITICAL ISSUE**: The current system has NO reset mechanism after Christmas Day!

### What Happens During Finalization:
1. Parent clicks "Finalize Christmas Lists" 
2. System charges any remaining balance via Stripe
3. All children's gift lists get LOCKED (`giftListLocked: true`)
4. Parent settings marked as finalized (`listsFinalized: true`)
5. Order sent to logistics for shipment

### The Problem:
❌ After Christmas Day (Dec 25), everything stays LOCKED forever
❌ Parents can't add new children or build new lists for next year
❌ Children's lists remain locked
❌ No way to start fresh for next Christmas

---

## ✅ Solution Implemented

Created a **Christmas Reset System** that activates after December 25th.

### Files Created:

#### 1. `/app/api/parent/reset-christmas/route.ts` ✅ DONE
- **GET**: Check if reset is available (is it after Christmas + is family finalized?)
- **POST**: Reset all Christmas data for new year

### What Gets Reset (Cleared):
- ✅ Finalization status (`listsFinalized: false`)
- ✅ All children's gift lists (cleared)
- ✅ Gift list locks (unlocked)
- ✅ Magic scores (reset to 0 for new year)
- ✅ Shipment tracking data
- ✅ Early gift and friend gift requests

### What Gets PRESERVED (Kept):
- ✅ Parent & child accounts
- ✅ Payment method (for convenience)
- ✅ Shipping address (for convenience)
- ✅ Parent wallet balance (money rolls over)
- ✅ Neighbor donations (preserved)
- ✅ Budget settings & preferences
- ✅ Notification preferences

---

## 📋 Still Need To Build

### 2. Automatic Cron Job (TODO)
**File**: `/app/api/cron/reset-christmas/route.ts`
- Runs automatically on December 26th
- Resets ALL families in the database
- Sends notification emails to parents

### 3. Parent Dashboard UI (TODO)
**Component**: Add to parent dashboard
- Show "Reset for Next Year" button after Dec 25
- Display current status (finalized/reset)
- Confirmation dialog before reset
- Success message after reset

### 4. Vercel Cron Configuration (TODO)
**File**: `vercel.json`
- Add cron schedule for Dec 26 @ 12:00 AM
- Schedule: `"0 0 26 12 *"` (runs Dec 26 at midnight)

---

## 🔧 How It Works

### Manual Reset Flow:
```
1. Parent visits dashboard after Dec 25
2. Sees "Start Fresh for Next Year" button
3. Clicks button → calls POST /api/parent/reset-christmas
4. System checks date (must be after Dec 25)
5. Clears all finalization data
6. Unlocks all gift lists
7. Resets children's magic scores to 0
8. Returns success message
```

### Automatic Reset Flow (When Built):
```
1. Dec 26 @ midnight UTC
2. Vercel triggers /api/cron/reset-christmas
3. Finds all finalized families
4. Resets each family (same process as manual)
5. Sends email: "Your account is ready for next Christmas!"
6. Logs results for admin review
```

---

## 🎯 Next Steps

1. **Build the cron job** (`/api/cron/reset-christmas/route.ts`)
2. **Add UI to parent dashboard** (reset button component)
3. **Configure Vercel cron** (update `vercel.json`)
4. **Test with dummy data** (manually set date past Dec 25)
5. **Email templates** for reset notifications

---

## 📝 Code Example - How Parents Will Use It

```typescript
// In Parent Dashboard
const handleResetForNextYear = async () => {
  const confirmed = confirm(
    "This will clear all gift lists and reset for next Christmas. " +
    "Your payment info and wallet balance will be preserved. Continue?"
  );
  
  if (!confirmed) return;
  
  const response = await fetch('/api/parent/reset-christmas', {
    method: 'POST'
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('🎄 Your account is ready for next Christmas!');
    window.location.reload();
  }
};
```

---

## 🔒 Safety Features

- ✅ Only works AFTER December 25th
- ✅ Requires authentication
- ✅ Only resets finalized families
- ✅ Preserves critical data (payment, addresses, funds)
- ✅ Detailed logging for audit trail
- ✅ Returns detailed reset report

---

## 📊 Reset Report Example

```json
{
  "success": true,
  "message": "Christmas data has been reset for the new year! 🎄",
  "resetDetails": {
    "parentReset": true,
    "childrenReset": 3,
    "preservedData": [
      "Payment method",
      "Shipping address", 
      "Parent wallet balance",
      "Neighbor donations",
      "Budget settings"
    ],
    "clearedData": [
      "Finalization status",
      "Gift lists",
      "Shipment tracking",
      "Magic scores (reset to 0)"
    ],
    "resetDate": "2025-12-26T00:00:00.000Z"
  }
}
```

---

## Questions?

- Want me to build the cron job next?
- Want me to add the UI to parent dashboard?
- Want to test the reset endpoint manually?

