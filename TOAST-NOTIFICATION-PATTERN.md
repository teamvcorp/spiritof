# Toast Notification Pattern 🎄

## Overview
We use a centralized toast notification system instead of `alert()` boxes for all user feedback. This provides a better UX with styled, non-blocking notifications.

## Setup (Already Done ✅)
- **Toast Component**: `/components/ui/Toast.tsx`
- **Toast Provider**: Wrapped in `/components/Providers.client.tsx`
- **Animations**: Defined in `/app/globals.css`

## Usage Pattern

### 1. Import the Hook
```tsx
import { useToast } from "@/components/ui/Toast";
```

### 2. Use in Component
```tsx
function MyComponent() {
  const { showToast } = useToast();
  
  // Success notification
  showToast('success', 'Operation completed successfully! 🎅');
  
  // Error notification
  showToast('error', 'Something went wrong. Please try again.');
  
  // Info notification
  showToast('info', 'Did you know Santa is watching? 👀');
  
  // Warning notification
  showToast('warning', 'Please review before submitting.');
  
  // Custom duration (default is 5000ms)
  showToast('success', 'Quick message!', 2000);
}
```

## Toast Types

| Type | Use Case | Visual Style |
|------|----------|--------------|
| `success` | Successful operations, confirmations | Green gradient with checkmark ✅ |
| `error` | Errors, failures, validation issues | Red gradient with warning icon ⚠️ |
| `info` | Informational messages, tips | Blue gradient with info icon ℹ️ |
| `warning` | Warnings, cautions, important notices | Orange gradient with warning icon ⚠️ |

## When to Use Toast vs Other Feedback

### ✅ Use Toast For:
- Form submission success/failure
- API call results
- Approval/denial confirmations
- Save/update confirmations
- Delete confirmations
- Validation errors
- General user feedback

### ❌ Don't Use Toast For:
- Critical actions requiring confirmation (use modal dialogs)
- Very long messages (use modal dialogs)
- Multi-step wizards (use progress indicators)
- Persistent errors (use inline error messages)

## Examples from Codebase

### Example 1: Form Submission (SpecialRequestApprovals.tsx)
```tsx
const { showToast } = useToast();

const handleApproval = async (requestId: string, action: 'approve' | 'deny') => {
  try {
    const response = await fetch('/api/parent/special-requests', {
      method: 'POST',
      body: JSON.stringify({ action, requestId })
    });

    if (!response.ok) throw new Error('Failed to process request');
    
    const result = await response.json();
    showToast('success', result.message || `Request ${action}d successfully! 🎅`);
    
    // Refresh data...
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Operation failed';
    showToast('error', errorMsg);
  }
};
```

### Example 2: Early Gift Request (EarlyGiftRequestForm.tsx)
```tsx
const { showToast } = useToast();

const handleSubmit = async () => {
  try {
    const response = await fetch('/api/children/early-gift-request', {
      method: 'POST',
      body: JSON.stringify({ childId, giftId, reason })
    });

    if (response.ok) {
      const data = await response.json();
      showToast('success', data.message || 'Early gift request submitted! 🎁');
    } else {
      const data = await response.json();
      showToast('error', data.error || 'Failed to submit request');
    }
  } catch (error) {
    showToast('error', 'Failed to submit request. Please try again.');
  }
};
```

### Example 3: Admin Actions (SpecialRequestsManager.tsx)
```tsx
const { showToast } = useToast();

const handleRequestAction = async (requestId: string, action: 'approve' | 'deny') => {
  try {
    const response = await fetch('/api/admin/special-requests', {
      method: 'POST',
      body: JSON.stringify({ action, requestId })
    });

    if (!response.ok) throw new Error(`Failed to ${action} request`);

    const result = await response.json();
    showToast('success', result.message || `Request ${action}d successfully! 🎅`);
    
    await fetchSpecialRequests(); // Refresh list
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : `Failed to ${action} request`;
    showToast('error', errorMsg);
  }
};
```

## Best Practices

### ✅ DO:
- Use emoji to add personality to success messages 🎅🎁✨
- Keep messages concise (one sentence)
- Use action-specific messages ("Gift approved!" not "Success")
- Show toast immediately after operation completes
- Let toasts auto-dismiss after 5 seconds
- Use appropriate toast type for the situation

### ❌ DON'T:
- Use `alert()` - always use toast instead
- Write very long messages
- Show multiple toasts for the same action
- Use technical error messages (translate for users)
- Block user interaction (toasts are non-blocking)

## Message Writing Guidelines

### Success Messages
- Be celebratory and positive
- Include action confirmation
- Add festive emoji when appropriate
- Examples:
  - ✅ "Gift request submitted! Santa is reviewing your list 🎅"
  - ✅ "Child added successfully! Time to spread Christmas joy! 🎄"
  - ✅ "Request approved! The elves are getting to work! 🎁"

### Error Messages
- Be clear about what went wrong
- Suggest next steps when possible
- Keep tone helpful, not accusatory
- Examples:
  - ✅ "Failed to save changes. Please check your connection and try again."
  - ✅ "Not enough magic points. Earn more by being good! ⭐"
  - ❌ "Error 500: Internal server error" (too technical)

### Warning Messages
- Clearly state the concern
- Explain implications
- Examples:
  - ✅ "This gift exceeds your budget limit."
  - ✅ "Please fill in all required fields before submitting."

### Info Messages
- Provide helpful context
- Be concise and relevant
- Examples:
  - ✅ "Tip: You can request up to 10 gifts on your list! 📝"
  - ✅ "Magic points refresh daily when parents vote! ✨"

## Migration Guide

### Replacing Existing `alert()` Calls

**Before:**
```tsx
alert('Gift added to list!');
```

**After:**
```tsx
const { showToast } = useToast();
showToast('success', 'Gift added to list! 🎁');
```

**Before:**
```tsx
alert(data.error || 'Failed to submit');
```

**After:**
```tsx
const { showToast } = useToast();
showToast('error', data.error || 'Failed to submit request');
```

## Components Already Using Toast ✅

- ✅ `SpecialRequestApprovals.tsx` (Parent dashboard)
- ✅ `EarlyGiftRequestForm.tsx` (Child request form)
- ✅ `FriendGiftForm.tsx` (Child friend gift form)
- ✅ `SpecialRequestsManager.tsx` (Admin logistics)
- ✅ `RequestNewItemButton.tsx` (Catalog item request)

## Components Still Using `alert()` ⚠️

Run this to find remaining alerts:
```bash
grep -r "alert(" --include="*.tsx" --include="*.ts" components/
```

Replace them using the pattern above!

## Technical Details

### Toast Configuration
- **Auto-dismiss**: 5 seconds (configurable per toast)
- **Position**: Top-right corner
- **Max visible**: Unlimited (stacks vertically)
- **Animation**: Slide in from right
- **Close button**: Always visible
- **Z-index**: 9999 (above all content)

### Accessibility
- Uses `role="alert"` for screen readers
- Keyboard accessible close button
- High contrast colors for readability
- Auto-dismiss doesn't require interaction

---

**Remember:** When making ANY user-facing changes, always use toast notifications for feedback! 🎄✨
