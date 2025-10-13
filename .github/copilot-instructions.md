# Spirit of Santa - AI Coding Assistant Instructions

## Architecture Overview

This is a **Christmas gift management platform** built with Next.js 15, TypeScript, MongoDB/Mongoose, NextAuth v5, and Tailwind CSS. The app manages a multi-role system where parents oversee children's Christmas lists and "naughty/nice" scores.

### Core Domain Models & Relationships

```
User (Auth) → Parent (Wallet/Settings) → Child[] (Lists/Scores)
                                      ↓
                                   Gift[] (Catalog Items)
```

- **User**: NextAuth user with `isParentOnboarded` flag and optional `parentId`
- **Parent**: Wallet system with Stripe integration, budget allocation, PIN protection
- **Child**: Individual gift lists with "magic score" (0-365), neighbor donations via `shareSlug`
- **CatalogItem**: OpenAI-generated gift catalog with gender/age targeting

## Key Patterns & Conventions

### File Organization
- **Routes**: Use Next.js 15 App Router with `(routes)` grouping for non-nested URLs
- **Models**: Mongoose schemas in `/models/` with TypeScript interfaces in `/types/`
- **Actions**: Server actions co-located with pages (e.g., `catalog/actions.ts`)
- **Components**: Organized by domain (`/child/`, `/parents/`) and shared UI in `/ui/`

### Database Patterns
- **Connection**: Always call `dbConnect()` before DB operations (cached singleton pattern)
- **Transactions**: Use Mongoose subdocuments for ledger entries (Parent.walletLedger, Child.neighborLedger)
- **Method Pattern**: Attach business logic as Mongoose instance methods (e.g., `parent.recomputeWalletBalance()`)

### Authentication Flow
- **Session Enhancement**: Custom JWT/session callbacks in `auth.config.ts` add `isParentOnboarded`, `parentId`
- **Route Protection**: Middleware redirects unauthenticated users, onboarding incomplete users go to `/onboarding`
- **PIN System**: Parent dashboard requires PIN setup/verification with cookie-based session

### Component Patterns
- **Server/Client Split**: Use `.server.tsx` and `.client.tsx` suffixes for clarity
- **Providers Pattern**: Wrap layout with `Providers.client.tsx` for client-side context
- **Custom UI**: Tailwind-based components with consistent scaling animations (`hover:scale-110`)
- **Fixed Positioning**: Header uses `fixed top-0 left-0 right-0 z-50`, main content has `pt-[72px]` to account for header height
- **Centered Navigation**: Header uses flex layout with `items-end justify-between` to center nav buttons between logo and auth controls
- **Draggable Widgets**: ChristmasCountdown component is draggable with integrated snow controls, initializes at position `{ x: 20, y: 150 }`

### Custom Styling System
- **Winter/Northern Lights Theme**: Deep ocean gradient background `bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33]` across all pages
- **Christmas Theme Colors**: Custom Tailwind colors include `santa` (red), `evergreen` (green), `blueberry` (blue), `berryPink` (pink)
- **Frosted Glass Effects**: Containers use `bg-white/95 backdrop-blur-sm rounded-lg` with `shadow-[0_4px_12px_rgba(0,0,0,0.15)]` for depth
- **Ice Sheet Aesthetic**: White/translucent containers with light reflection overlays (diagonal gradients)
- **Typography**: Uses Paytone One font (`font-paytone-one`) for headings, Geist for body text
- **Responsive Design**: Mobile-first approach with `sm:`, `md:` breakpoints for layout adjustments
- **Animation Pattern**: Consistent `hover:scale-110 active:scale-95` transforms across interactive elements
- **Fixed Header**: Header fixed to viewport top (`fixed top-0 z-50`) with centered navigation layout
- **Northern Lights Effects**: Animated aurora borealis overlays with pulse animations
- **Falling Snow**: Customizable snow effects with intensity controls (light/heavy/blizzard)

## Development Workflows

### Common Commands
```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

### Environment Variables Required
```
MONGODB_URI=           # MongoDB connection string
AUTH_SECRET=           # NextAuth secret
AUTH_GOOGLE_ID=        # Google OAuth client ID
AUTH_GOOGLE_SECRET=    # Google OAuth secret
OPENAI_API_KEY=        # For catalog generation
```

## Critical Integration Points

### Master Catalog Management (`/admin/catalog-builder`)
- Simplified gender-based toy browsing with manual catalog management
- Direct upload and curation of gift items with image management
- Toy request system allowing children to request new items for magic points

### Stripe Payment Integration
- Parent wallet system with ledger-based balance tracking
- Payment intents stored in `walletLedger` subdocuments
- Status transitions: `PENDING` → `SUCCEEDED`/`FAILED`

### Child Sharing System
- Each child has unique `shareSlug` for public donation pages
- Neighbor donations tracked separately from parent budget allocation
- QR code generation for sharing (implementation pending)

### Magic Score System
- **Score Range**: Children have `score365` field (0-365 points, representing days until Christmas)
- **Parent Voting**: Parents can vote once daily to increase child's magic score (requires wallet funds)
- **Community Donations**: External donations via `shareSlug` also boost magic scores
- **Public Display**: Magic points displayed publicly to encourage Christmas spirit
- **Backend Reality**: 1:1 relationship with USD (magic points = cents for budget calculations)
- **Vote Tracking**: Parent.voteLedger maps `childId → "YYYY-MM-DD"` to prevent multiple daily votes

## AI-Specific Guidance

When working on this codebase:

1. **Always use TypeScript interfaces** from `/types/` rather than inline types
2. **Follow the server action pattern** - co-locate with pages, use `"use server"` directive
3. **Respect the auth flow** - check session state and onboarding status in protected routes
4. **Use Mongoose methods** for business logic rather than raw queries
5. **Maintain ledger integrity** - never modify balances directly, always use ledger entries
6. **Consider PIN protection** for sensitive parent operations
7. **Magic Score Logic** - use Parent voting methods (`canVoteToday()`, `recordVote()`) and ensure wallet balance before allowing votes

### Example Patterns to Follow
- Route handler: See `/api/catalog/route.ts` for proper error handling and validation
- Server component: See `/children/page.tsx` for auth checking and data fetching
- Client component: See `Button.tsx` for async event handling and loading states
- Database model: See `Parent.ts` for method attachment and subdocument patterns
- Winter theme page: See `/children/[id]/childdash/page.tsx` for full winter aesthetic implementation with ice sheets and fairy dust
- Shelf system: See `/children/list/ui/StyledGiftBuilder.tsx` for multi-shelf layout with Christmas lights (5 items per shelf)
- Fixed header: See `Header.server.tsx` for centered navigation with flex layout and fixed positioning
- Draggable component: See `ChristmasCountdown.tsx` for draggable widget with integrated controls