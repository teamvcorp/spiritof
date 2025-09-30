# Production Webhook Setup Guide

## 1. Environment Variables to Update

```bash
# Update these in Vercel environment variables:
NEXTAUTH_URL=https://www.spiritofsanta.club
AUTH_URL=https://www.spiritofsanta.club

# Get new webhook secret from Stripe Dashboard:
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Replace with production secret
```

## 2. Stripe Dashboard Configuration

### Create Production Webhook Endpoint:
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://www.spiritofsanta.club/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret

### Switch to Live Mode:
- Update `STRIPE_SECRET_KEY` to live key (starts with `sk_live_`)
- Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live key (starts with `pk_live_`)

## 3. Test Production Webhooks

### Method 1: Stripe Dashboard Test
1. Go to Webhooks > Your endpoint > Send test webhook
2. Select `checkout.session.completed`
3. Check Vercel logs for processing

### Method 2: Real Payment Test
1. Make a small test payment ($0.50)
2. Monitor Vercel function logs
3. Check database for wallet update

## 4. Monitoring & Debugging

### Vercel Function Logs:
```bash
vercel logs --follow
```

### Stripe Webhook Logs:
- Dashboard > Webhooks > Your endpoint > Attempts tab
- Look for failed deliveries or errors

## 5. Common Production Issues

### Issue: Webhook timeouts
**Solution**: Optimize database operations, add retry logic

### Issue: Webhook signature verification fails
**Solution**: Verify webhook secret matches Stripe dashboard

### Issue: SSL/HTTPS problems
**Solution**: Ensure Vercel deployment uses HTTPS

## 6. Security Considerations

### Rate Limiting:
- Consider adding rate limiting to webhook endpoint
- Stripe has built-in retry logic

### Webhook Security:
- Always verify webhook signatures
- Log webhook attempts for audit trail
- Monitor for suspicious activity

## 7. Backup Plan

If webhooks fail in production:
1. Use Stripe Dashboard to manually verify payments
2. Run database reconciliation script
3. Set up webhook endpoint monitoring/alerts