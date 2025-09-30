# Stripe Development Setup Guide

## Local Development Setup

### 1. Install Stripe CLI
Download from: https://github.com/stripe/stripe-cli/releases/latest
- Download `stripe_X.X.X_windows_x86_64.zip`
- Extract and add to PATH or run from extracted folder

### 2. Login to Stripe CLI
```bash
stripe login
```
This will open your browser to authenticate with your Stripe account.

### 3. Start Local Development
Run these commands in separate terminals:

**Terminal 1: Start Next.js development server**
```bash
npm run dev
```

**Terminal 2: Start Stripe webhook forwarding**
```bash
npm run dev:stripe
# OR manually:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The Stripe CLI will output a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

### 4. Update Local Environment
Copy the webhook secret from Terminal 2 and add it to your `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 5. Test Local URLs
Your local application will use these URLs:
- App: http://localhost:3000
- Onboarding: http://localhost:3000/onboarding
- Stripe Success: http://localhost:3000/onboarding/verify-success
- Webhook: http://localhost:3000/api/stripe/webhook (forwarded by CLI)

## Production Setup

### Stripe Dashboard Configuration

**1. Webhook Endpoints**
- URL: `https://spiritofsanta.club/api/stripe/webhook`
- Events: `checkout.session.completed`, `setup_intent.succeeded`, `payment_intent.succeeded`

**2. Checkout Settings > Allowed Redirect URLs**
- `https://spiritofsanta.club/onboarding/verify-success`
- `https://spiritofsanta.club/onboarding`
- `https://spiritofsanta.club/parent/dashboard`

**3. Production Environment Variables (Vercel)**
```env
NEXTAUTH_URL=https://spiritofsanta.club
STRIPE_WEBHOOK_SECRET=whsec_production_secret_from_dashboard
```

## Testing Flow

### Local Testing
1. Start both dev server and Stripe webhook forwarding
2. Go to http://localhost:3000/onboarding
3. Click "Verify with Stripe"
4. Complete payment method verification
5. Should redirect back to onboarding with verification complete

### Production Testing  
1. Deploy to production with correct environment variables
2. Test the same flow on https://spiritofsanta.club

## Troubleshooting

### Common Issues
- **403 CloudFront Error**: Fixed by using GET instead of POST requests
- **Webhook not receiving events**: Check Stripe CLI is running and secret is correct
- **Redirect URL mismatch**: Ensure URLs match exactly in Stripe Dashboard
- **Environment variable issues**: Check NEXTAUTH_URL matches your domain

### Debug Commands
```bash
# Check webhook events
stripe logs tail

# Test webhook endpoint
stripe events resend evt_test_webhook

# Verify environment
echo $NEXTAUTH_URL
```