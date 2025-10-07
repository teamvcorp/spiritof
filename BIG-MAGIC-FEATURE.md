# Big Magic - Corporate Giving Feature

## Overview
Big Magic is a new corporate donation platform that allows companies to contribute to Spirit of Santa's mission. Donations support three key areas:
1. Matching magic points earned by children doing good deeds
2. Funding community programs with face-to-face Santa interactions
3. Supporting hardworking families who need extra help

## What We Built

### Pages
- **`/big-magic`** - Main corporate donation landing page
  - Hero section with clear value proposition
  - Three-card explanation of how donations are used
  - Donation form with company information
  - Multiple payment options (card, check, wire transfer)
  - Rotating sponsor banner
  - Impact metrics
  - Contact information

### Components
- **`BigMagicContent.tsx`** - Main client component with donation form
  - Suggested donation amounts ($250-$10,000)
  - Custom amount input (minimum $100)
  - Company name and email fields
  - Payment method selection:
    - **Card**: Best for under $1,000
    - **Check**: Mailed payment with instructions
    - **Wire/ACH**: For $1,000+ donations
  
- **`SponsorBanner.tsx`** - Rotating sponsor carousel
  - Auto-rotates every 5 seconds
  - Manual navigation dots
  - Ready for company logos (currently shows placeholder text)
  - Responsive design

### API Routes
- **`/api/big-magic/create-checkout`**
  - Creates Stripe checkout session for card payments
  - Sends admin notification when donation initiated
  - Minimum $100 validation
  
- **`/api/big-magic/request-invoice`**
  - Handles check/wire transfer requests
  - Sends admin notification to provide payment instructions
  - Returns success confirmation to company

### Database
- **`CorporateDonation` Model** - Tracks all corporate donations
  - Company name & email
  - Amount (in cents)
  - Payment method (card, check, wire)
  - Status (pending, completed, failed)
  - Stripe session & payment intent IDs
  - Receipt URL
  - Timestamps

### Webhook Integration
- Updated Stripe webhook handler to process `big_magic_donation` type
- Sends admin notification when card payment completes
- Ready for future automation (thank you emails, sponsor list updates, etc.)

### Navigation
- Added "✨ Big Magic" link to footer for easy access

## Payment Flow

### Card Payments (Under $1,000 recommended)
1. Company fills out form and selects amount
2. Clicks "Donate" button
3. Redirected to Stripe Checkout
4. Payment processed securely
5. Admin receives notification
6. Company receives receipt

### Check/Wire Payments ($1,000+ recommended)
1. Company fills out form and selects amount
2. Selects check or wire option
3. Clicks "Request Payment Instructions"
4. Admin receives notification with company details
5. Admin manually sends payment instructions to company
6. Company sends payment
7. Admin marks as completed

## Admin Notifications
All Big Magic activities trigger email notifications to `teamvcorp@thevacorp.com`:
- Donation initiated (card payment)
- Donation completed (card payment)
- Payment instructions requested (check/wire)

## Future Enhancements
1. **Automated Email System**
   - Thank you emails to donors
   - Payment instructions for check/wire
   - Tax receipt generation

2. **Sponsor Management**
   - Upload company logos via admin panel
   - Auto-add to sponsor carousel after donation threshold
   - Sponsor tiers (Bronze, Silver, Gold, Platinum)

3. **Impact Dashboard**
   - Track total donations
   - Show real-time impact metrics
   - Generate reports for donors

4. **Recognition Features**
   - Public sponsor page
   - Social media graphics
   - Certificate of appreciation

5. **Recurring Donations**
   - Monthly/quarterly giving options
   - Stripe subscription integration

## Testing
- Build: ✅ Successful
- Routes: ✅ Created
- API endpoints: ✅ Ready
- Webhook: ✅ Integrated
- Navigation: ✅ Added to footer

## Access
Visit: **`/big-magic`**

## Notes
- Minimum donation: $100
- Card payment recommended for amounts under $1,000
- Check/wire transfer available for larger donations
- All donations are tax-deductible (add tax ID in production)
- Sponsor banner currently shows placeholder text - add real logos in production
