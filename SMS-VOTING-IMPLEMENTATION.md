# SMS Voting Implementation

## Overview
End-to-end SMS functionality for parents to receive voting links on their cell phone.

## Features Implemented

### 1. **Phone Number Collection**
- ✅ Added `phone` field to Parent model
- ✅ Updated TypeScript types
- ✅ Added phone input to onboarding form (required)
- ✅ Phone management component in parent dashboard

### 2. **SMS Service**
- ✅ Created Twilio SMS service (`/lib/sms.ts`)
- ✅ Phone number formatting to E.164 format
- ✅ Custom SMS message with voting link

### 3. **API Endpoints**
- ✅ `/api/parent/send-voting-sms` - Send SMS with voting link
- ✅ `/api/parent/update-phone` - Update phone number

### 4. **Mobile Voting Page**
- ✅ Enhanced `/mobile/vote` to accept `pid` query parameter
- ✅ Direct access via SMS link
- ✅ Security: Verifies parent ID belongs to authenticated user

### 5. **UI Components**
- ✅ `SendVotingSMSButton` - Button to trigger SMS send
- ✅ `PhoneManagement` - Manage phone number in dashboard
- ✅ Added SMS button to parent dashboard (only shows if phone is set)

## Installation Steps

### 1. Install Twilio SDK
```bash
npm install twilio
```

### 2. Add Environment Variables
Add to `.env` and Vercel:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 3. Get Twilio Credentials
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number or use trial number
4. Add credentials to environment variables

## User Flow

### First Time Setup (Onboarding)
1. User completes Stripe verification
2. **NEW:** User enters cell phone number (required)
3. User sets magic budget and gift settings
4. Phone number is saved to Parent record

### Daily Voting Flow
1. Parent clicks "Send Voting Link via SMS" button in dashboard
2. System sends SMS with personalized link: `https://yoursite.com/mobile/vote?pid=PARENT_ID`
3. Parent clicks link on phone
4. Opens mobile voting page with their account already loaded
5. Parent votes on each child's behavior
6. Votes update magic scores immediately

## SMS Message Format
```
Hi [Parent Name]! 🎅

Quick vote on your children's behavior today:
https://www.spiritofsanta.club/mobile/vote?pid=[PARENT_ID]

- Spirit of Santa
```

## Security Features
- ✅ Parent ID in URL is validated against authenticated user
- ✅ Unauthorized access redirects to error page
- ✅ Mobile device check required
- ✅ Authentication required before voting

## Database Changes
```typescript
// Parent model
interface IParent {
  // ... existing fields
  phone?: string; // NEW: Cell phone for SMS voting links
}
```

## Testing

### Local Development
1. Use Twilio test credentials
2. Test with your own phone number
3. Verify SMS delivery and link functionality

### Production
1. Add production Twilio credentials to Vercel
2. Verify SMS delivery
3. Test end-to-end flow with real users

## Cost Considerations
- Twilio SMS costs approximately $0.0075 per message (US)
- Consider implementing daily/weekly limits per parent
- Monitor usage via Twilio dashboard

## Future Enhancements
- [ ] Scheduled daily SMS reminders
- [ ] Batch SMS sending for multiple parents
- [ ] SMS reply functionality ("Reply Y for yes")
- [ ] Delivery status tracking
- [ ] SMS preferences (frequency, time of day)
- [ ] Support for international phone numbers
