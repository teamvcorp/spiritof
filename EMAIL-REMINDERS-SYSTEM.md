# Weekly Email Reminders System

## Overview
Automated weekly email reminders to parents for voting and budget updates.

## Email Types

### 1. Voting Reminders
**Frequency:** Weekly (Sundays at 9 AM UTC)  
**Sent to:** All parents with `reminderEmails: true`  
**Content:**
- List of all children with current magic points
- Link to mobile voting page
- Tips for making voting a routine

### 2. Budget Updates
**Frequency:** Weekly (Sundays at 9 AM UTC)  
**Sent to:** Parents with `weeklyBudgetUpdates: true`  
**Content:**
- Current wallet balance
- Progress toward monthly goal
- Total spent
- Days until Christmas countdown

## Cron Configuration

**Schedule:** `0 9 * * 0` (Every Sunday at 9:00 AM UTC)  
**Endpoint:** `/api/cron/send-weekly-reminders`  
**Authentication:** Bearer token using `CRON_SECRET` env variable

## Environment Variables Required

```env
RESEND_API_KEY=re_xxx               # Resend API key
RESEND_FROM_EMAIL=noreply@domain.com # Verified sender email
CRON_SECRET=your-secret-token        # For cron authentication
NEXTAUTH_URL=https://yourdomain.com  # For generating links
```

## Testing

### Manual Trigger (Development)
```bash
curl http://localhost:3000/api/cron/send-weekly-reminders
```

### Manual Trigger (Production)
```bash
curl -X POST https://yourdomain.com/api/cron/send-weekly-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Parent Settings

Parents can control email preferences in their Dashboard > Christmas Settings:

- **Reminder Emails** - Enable/disable voting reminders
- **Weekly Budget Updates** - Enable/disable budget summary emails
- **List Lock Reminders** - Enable/disable deadline notifications (coming soon)

## Response Format

Success response:
```json
{
  "success": true,
  "message": "Weekly reminders sent",
  "summary": {
    "totalParents": 45,
    "votingEmailsSent": 45,
    "budgetEmailsSent": 38,
    "errors": 0,
    "timestamp": "2025-12-15T09:00:00.000Z"
  }
}
```

## Features

✅ **Voting Reminders** - Weekly nudge to keep magic points updated  
✅ **Budget Updates** - Track spending progress toward goals  
✅ **Preference Controls** - Parents can opt in/out per email type  
✅ **Beautiful HTML Templates** - Christmas-themed responsive emails  
✅ **Rate Limiting** - 100ms delay between emails to avoid spam filters  
✅ **Error Handling** - Individual failures don't stop the batch  

## Implementation Files

- `/lib/email-reminders.ts` - Email templates and sending logic
- `/app/api/cron/send-weekly-reminders/route.ts` - Cron job handler
- `/vercel.json` - Cron schedule configuration
- `/models/Parent.ts` - Email preference fields in schema
- `/types/parentTypes.ts` - TypeScript interfaces

## Future Enhancements

- [ ] List lock deadline reminders (configurable days before)
- [ ] Final payment deadline reminders
- [ ] Monthly spending summary reports
- [ ] Custom reminder frequency options (weekly vs biweekly)
- [ ] Preview emails before sending (admin feature)
- [ ] A/B testing for email subject lines
- [ ] Open and click tracking via Resend
