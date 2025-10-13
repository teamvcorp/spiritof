# Spirit of Santa - Complete Project Specification

*Last Updated: October 2, 2025*

## 🎄 Project Overview

Spirit of Santa is a comprehensive **Christmas gift management platform** that combines family gift tracking, financial management, and community sharing to create magical Christmas experiences for children and parents.

### Core Mission
Enable parents to manage children's Christmas lists while fostering community generosity through a "magic score" system that gamifies the Christmas spirit.

## 🏗️ Architecture & Technology Stack

### **Platform Foundation**
- **Framework**: Next.js 15.5.3 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x with custom Christmas theme
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth v5 with Google OAuth
- **Deployment**: Vercel (with Vercel Blob for images)

### **Key Dependencies**
- **Payments**: Stripe integration with webhooks
- **AI**: OpenAI for catalog generation
- **Images**: Vercel Blob storage with automatic upload
- **QR Codes**: qrcode for child sharing
- **Email**: Resend for notifications
- **Icons**: React Icons + Lucide React

## 🎨 Design System & Brand Identity

### **Winter/Northern Lights Theme**
- **Background Gradient**: Deep ocean colors transitioning from teal to dark blue
  - Primary: `#005574` (deep teal)
  - Mid: `#032255` (deep blue)
  - Dark: `#001a33` (darker blue)
- **Frosted Glass Containers**: `bg-white/95 backdrop-blur-sm rounded-lg`
- **Ice Sheet Effects**: White translucent containers with diagonal light reflection overlays
- **Depth Shadows**: Consistent `shadow-[0_4px_12px_rgba(0,0,0,0.15)]` across cards
- **Northern Lights**: Animated aurora borealis effects with pulse animations
- **Falling Snow**: Customizable snow intensity (light/heavy/blizzard) via draggable widget

### **Christmas Color Palette**
```css
--santa: #ea1938        /* Primary red for CTAs */
--berryPink: #ff6295    /* Warm accent pink */
--frostyBlue: #49c5fc   /* Light blue highlights */
--blueberry: #0084b5    /* Deep blue for depth */
--mint: #46d597         /* Success/positive actions */
--evergreen: #37776c    /* Primary text/navigation */
```

### **Typography System**
- **Headings**: Paytone One (Christmas display font)
- **Body**: Geist Sans (clean, readable)
- **Code**: Geist Mono (technical content)

### **Interactive Design Patterns**
- **Hover Effects**: `hover:scale-110` with smooth transitions
- **Active States**: `active:scale-95` for tactile feedback
- **Focus**: Ring-based focus indicators for accessibility
- **Responsive**: Mobile-first design with `sm:`, `md:` breakpoints
- **Fixed Header**: Header fixed to viewport top with centered navigation
- **Draggable Widgets**: Christmas countdown with integrated snow controls

### **Component Architecture**
- **Server Components**: Data fetching, authentication checks
- **Client Components**: Interactive elements, forms, modals
- **Shared UI**: Reusable Button, Card, Container components
- **Feature Components**: Domain-specific logic (child/, parents/, auth/)
- **Effect Components**: Northern lights, falling snow, fairy dust animations
- **Fixed Elements**: Header (z-50) with centered flex navigation layout

## 📊 Data Models & Business Logic

### **Core Entities**

#### **User (NextAuth)**
```typescript
{
  id: string;
  email: string;
  name?: string;
  image?: string;
  isParentOnboarded: boolean;
  parentId?: ObjectId;
}
```

#### **Parent (Financial Core)**
```typescript
{
  _id: ObjectId;
  userId: string; // NextAuth user reference
  
  // Stripe Integration
  stripeCustomerId?: string;
  isStripeVerified: boolean;
  
  // Financial System
  walletBalance: number; // Computed from ledger
  walletLedger: WalletEntry[]; // All transactions
  
  // Child Management
  children: ObjectId[]; // Child references
  
  // Security & Settings
  pin?: string; // Hashed PIN for dashboard access
  pinSetAt?: Date;
  
  // Magic Score Voting System
  voteLedger: Map<string, string>; // childId -> "YYYY-MM-DD"
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Child (Gift Management)**
```typescript
{
  _id: ObjectId;
  parentId: ObjectId;
  
  // Identity
  displayName: string;
  age: number;
  gender: "boy" | "girl" | "neutral";
  
  // Gift System
  giftList: ObjectId[]; // MasterCatalog references
  maxGifts: number; // Parent-set limit
  
  // Magic Score System (0-365 points)
  score365: number; // Days until Christmas equivalent
  
  // Community Sharing
  shareSlug: string; // Unique URL identifier
  donationsEnabled: boolean;
  neighborLedger: DonationEntry[]; // External donations
  
  // Budget Allocation
  percentAllocation: number; // % of parent wallet
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### **MasterCatalog (Product Database)**
```typescript
{
  _id: ObjectId;
  
  // Product Information
  title: string;
  brand?: string;
  category?: string;
  price?: number;
  retailer?: string;
  productUrl: string; // Unique identifier
  
  // Image Management
  imageUrl?: string; // Original source
  blobUrl?: string; // Vercel Blob storage
  imageStoredAt?: Date;
  
  // Categorization
  gender: "boy" | "girl" | "neutral";
  ageMin?: number;
  ageMax?: number;
  tags?: string[];
  
  // Metadata
  sourceType: "live_search" | "manual" | "curated" | "trending";
  popularity?: number;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### **Financial System Architecture**

#### **Wallet System**
- **Ledger-Based**: All transactions stored as immutable entries
- **Balance Computation**: Real-time calculation from ledger history
- **Transaction Types**: `STRIPE_PAYMENT`, `CHILD_VOTE`, `REFUND`
- **Status Tracking**: `PENDING` → `SUCCEEDED` / `FAILED`

#### **Magic Score Economy**
- **1:1 Currency**: 1 magic point = 1 cent USD (hidden from users)
- **Daily Voting**: Parents can vote once per day per child (costs money)
- **Community Donations**: External supporters can boost scores via Stripe
- **Score Display**: Shows as "days until Christmas" (365 max)

## 🔐 Authentication & Security

### **Multi-Layer Auth System**
1. **NextAuth Session**: Google OAuth with custom session enhancement
2. **Parent Onboarding**: Stripe verification required
3. **PIN Protection**: Dashboard access requires 4-digit PIN
4. **Admin Protection**: Environment-based password for admin tools

### **Route Protection Middleware**
```typescript
// Redirect patterns:
// Unauthenticated → /auth
// No parent profile → /onboarding  
// Missing PIN → PIN setup flow
// Admin routes → Password challenge
```

### **Security Features**
- **CSRF Protection**: NextAuth built-in
- **Rate Limiting**: Stripe webhook validation
- **Data Validation**: Zod schemas for all inputs
- **PIN Hashing**: bcryptjs for PIN storage

## 🎁 Feature Specifications

### **1. Parent Dashboard**
- **Wallet Management**: Balance display, Stripe top-up, transaction history
- **Child Oversight**: Score voting, budget allocation, gift approval
- **Settings Management**: PIN updates, child limits, donation controls
- **Winter Theme**: Ice sheet containers with frosted glass effects

### **2. Child Interface**
- **Gift Discovery**: AI-powered catalog search with filters on winter-themed pages
- **List Management**: Add/remove gifts with parent-set limits
- **Shelf Display**: Toys organized on virtual shelves (5 per shelf) with Christmas lights
- **Magic Tracking**: Score display with Christmas countdown and fairy dust animation
- **Sharing**: QR code generation for community support
- **Winter Aesthetic**: Deep ocean gradients with ice sheet effect containers

### **3. Community Sharing**
- **Public Pages**: `/share/[slug]` for external donations
- **Anonymous Donations**: Stripe-powered with magic score rewards
- **Social Features**: QR codes, shareable links, progress visualization

### **4. Admin Tools**
- **Catalog Management**: Search, edit, and image URL updates
- **Local Development**: Password-protected admin interface
- **Data Integrity**: Real-time validation and error handling

### **5. AI-Powered Catalog**
- **Multi-Source Search**: Walmart, Target, Amazon integration
- **Smart Categorization**: Age, gender, category auto-detection
- **Image Processing**: Automatic Vercel Blob upload and optimization
- **Deduplication**: URL-based uniqueness with popularity scoring

## 🚀 Development Workflow

### **Environment Setup**
```env
MONGODB_URI=mongodb://...
AUTH_SECRET=nextauth-secret
AUTH_GOOGLE_ID=google-oauth-id
AUTH_GOOGLE_SECRET=google-oauth-secret
OPENAI_API_KEY=openai-key
STRIPE_SECRET_KEY=stripe-secret
STRIPE_PUBLISHABLE_KEY=stripe-publishable
STRIPE_WEBHOOK_SECRET=webhook-secret
BLOB_READ_WRITE_TOKEN=vercel-blob-token
ADMIN_PASSWORD=local-admin-password
```

### **Development Commands**
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint validation
npm run dev:stripe   # Stripe webhook listener
```

### **Code Quality Standards**
- **TypeScript Strict**: No `any` types, proper null checking
- **Component Patterns**: Clear server/client separation
- **Performance**: Image optimization, lazy loading, efficient queries
- **Accessibility**: Semantic HTML, keyboard navigation, screen reader support

## 🎯 Current Status & Roadmap

### **✅ Completed Features**
- [x] Complete authentication system with Google OAuth
- [x] Parent onboarding with Stripe verification
- [x] Master catalog system with AI generation
- [x] Child gift list management
- [x] Magic score voting and tracking
- [x] Community sharing with donations
- [x] QR code generation for sharing
- [x] Admin catalog management tools
- [x] Responsive UI with Christmas theming
- [x] Vercel Blob image storage integration
- [x] Winter/Northern Lights theme with deep ocean gradients
- [x] Frosted glass containers with ice sheet effects
- [x] Fixed header with centered navigation layout
- [x] Draggable Christmas countdown widget with integrated snow controls
- [x] Shelf system for toy display (5 items per shelf with Christmas lights)
- [x] Fairy dust animation effects on magic score displays
- [x] Northern lights and falling snow background effects

### **🔄 Active Development**
- Mobile API for Flutter companion app
- Enhanced search and filtering
- Gift fulfillment workflow
- Advanced analytics dashboard

### **📋 Future Enhancements**
- Multi-language support
- Advanced gift recommendations
- Parent collaboration features
- Enhanced community features
- Seasonal theme variations

## 📱 Mobile Strategy

### **Current Approach**
- **Web-First**: Responsive design optimized for mobile browsers
- **API Foundation**: RESTful endpoints ready for mobile app integration
- **PWA Capabilities**: Service worker support for offline functionality

### **Future Mobile App**
- **Flutter Framework**: Cross-platform iOS/Android app
- **Shared Backend**: Same API endpoints and data models
- **Enhanced UX**: Native notifications, camera integration, offline mode

## 🎄 Christmas Spirit Integration

### **Thematic Elements**
- **Visual Design**: Christmas colors, festive icons, seasonal imagery
- **Language**: "Magic points" instead of "money", Christmas terminology
- **User Experience**: Gamified interactions, countdown timers, progress visualization
- **Community**: Encouraging generosity through shared child pages

### **Seasonal Adaptability**
- **Core Platform**: Year-round gift tracking and family management
- **Christmas Mode**: Enhanced theming and magic score emphasis
- **Future Seasons**: Adaptable for birthdays, holidays, special occasions

## 🛡️ Production Considerations

### **Scalability**
- **Database**: MongoDB with proper indexing for performance
- **Images**: Vercel Blob with CDN distribution
- **Payments**: Stripe with webhook reliability
- **Caching**: Next.js static generation where applicable

### **Monitoring & Maintenance**
- **Error Tracking**: Comprehensive error handling and logging
- **Performance**: Core Web Vitals optimization
- **Security**: Regular dependency updates and security audits
- **Backup**: Automated database backups and recovery procedures

---

*This specification serves as the definitive guide for Spirit of Santa development, ensuring consistency across all features and maintaining the magical Christmas experience that defines our platform.*