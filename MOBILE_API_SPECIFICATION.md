# Mobile API Endpoints Reference
# File: MOBILE_API_SPECIFICATION.md  
# Date: December 2024
# Status: ✅ IMPLEMENTED - All core endpoints are complete
# Purpose: Complete specification for mobile API endpoints in spiritof.vercel.app

## Implementation Status ✅

**COMPLETED ENDPOINTS:**
- ✅ JWT Authentication System (`/lib/mobile-auth.ts`)
- ✅ Mobile Login (`/api/mobile/auth/login`)
- ✅ Token Refresh (`/api/mobile/auth/refresh`)
- ✅ Parent Profile (`/api/mobile/parent/profile`)
- ✅ Parent Voting (`/api/mobile/parent/vote`)
- ✅ Wallet Top-up (`/api/mobile/parent/wallet/topup`)
- ✅ Child Sharing (`/api/mobile/child/share`)
- ✅ Child Donations (`/api/mobile/child/donate`)
- ✅ QR Code Generation (`/api/mobile/qr`)

**NEXT STEPS:**
1. Configure Vercel deployment with JWT environment variables
2. Test endpoints with actual Flutter app
3. Deploy to production domain

## Overview
This document provides complete specifications for adding mobile API endpoints to the existing Next.js web application. The mobile app expects JWT-based authentication and specific response formats.

## Authentication System

### Mobile vs Web Authentication
- **Web**: Uses NextAuth.js with session cookies
- **Mobile**: Requires JWT tokens for stateless authentication
- **Solution**: Create mobile-specific auth endpoints that return JWT tokens

### Required Mobile Auth Endpoints

#### 1. Mobile Login
```
POST /api/mobile/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123",     // Optional for OAuth
  "provider": "google"           // Optional: "google", "email"
}

Response (Success):
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "isParentOnboarded": true,
    "parentId": "parent_456",
    "createdAt": "2025-09-30T10:00:00Z",
    "updatedAt": "2025-09-30T10:00:00Z"
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}

Response (Error):
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 2. Token Refresh
```
POST /api/mobile/auth/refresh
Authorization: Bearer <refresh_token>

Response:
{
  "success": true,
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

## Parent Endpoints

#### 1. Get Parent Profile
```
GET /api/mobile/parent/profile
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "parent": {
    "id": "parent_123",
    "userId": "user_456",
    "name": "John Doe",
    "walletBalance": 25.50,
    "walletLedger": [
      {
        "id": "wallet_entry_1",
        "type": "deposit",        // "deposit", "vote", "refund"
        "amount": 50.0,
        "description": "Initial wallet setup",
        "timestamp": "2025-09-25T10:00:00Z"
      }
    ],
    "hasVotedToday": false,
    "todaysVotes": {},           // Object mapping childId to vote count
    "pin": "1234",               // Encrypted/hashed PIN
    "createdAt": "2025-09-01T10:00:00Z",
    "updatedAt": "2025-09-30T10:00:00Z"
  },
  "children": [
    {
      "id": "child_789",
      "parentId": "parent_123",
      "name": "Emma",
      "age": 8,
      "gender": "girl",
      "score365": 285,           // Magic score 0-365
      "shareSlug": "emma-christmas-2025",
      "avatar": "👧",
      "wishList": [
        {
          "id": "gift_1",
          "name": "LEGO Friends Art Studio",
          "description": "Creative building set",
          "category": "Toys & Games",
          "priority": 1,
          "createdAt": "2025-09-20T10:00:00Z",
          "updatedAt": "2025-09-20T10:00:00Z"
        }
      ],
      "neighborLedger": [
        {
          "id": "neighbor_1",
          "donorName": "Mrs. Johnson",
          "amount": 15.0,
          "message": "Emma is such a sweet girl!",
          "timestamp": "2025-09-27T10:00:00Z"
        }
      ],
      "createdAt": "2025-09-01T10:00:00Z",
      "updatedAt": "2025-09-30T10:00:00Z"
    }
  ]
}
```

#### 2. Cast Vote
```
POST /api/mobile/parent/vote
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "childId": "child_789",
  "reason": "Helped with dishes",
  "pin": "1234"
}

Response:
{
  "success": true,
  "message": "Vote cast successfully!",
  "childId": "child_789",
  "newMagicScore": 286,
  "pointsAwarded": 1
}
```

#### 3. Get Wallet
```
GET /api/mobile/parent/wallet
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "balance": 25.50,
  "currency": "USD"
}
```

#### 4. Top Up Wallet
```
POST /api/mobile/parent/wallet/topup
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "amount": 20.0,
  "paymentMethod": "stripe_pm_123"
}

Response:
{
  "success": true,
  "message": "Wallet topped up successfully!",
  "newBalance": 45.50,
  "transactionId": "txn_456"
}
```

## Child Endpoints

#### 1. Get Child Share Data
```
GET /api/mobile/child/{shareSlug}

Response:
{
  "success": true,
  "child": {
    "id": "child_789",
    "name": "Emma",
    "age": 8,
    "score365": 285,
    "wishList": [
      {
        "id": "gift_1",
        "name": "LEGO Friends Art Studio",
        "priority": 1
      }
    ]
  },
  "canDonate": true
}
```

#### 2. Donate to Child
```
POST /api/mobile/child/{shareSlug}/donate
Content-Type: application/json

Request Body:
{
  "amount": 15.0,
  "donorName": "Mrs. Johnson",
  "message": "Keep being awesome!"
}

Response:
{
  "success": true,
  "message": "Thank you for spreading Christmas magic!",
  "donationId": "donation_123",
  "amount": 15.0
}
```

#### 3. Generate QR Code
```
POST /api/mobile/child/{childId}/qr
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "childId": "child_789"
}

Response:
{
  "success": true,
  "shareUrl": "https://spiritof.vercel.app/share/emma-christmas-2025",
  "qrCodeData": "base64_qr_code_data"
}
```

## Data Sync Endpoint

#### Sync All Data
```
POST /api/mobile/sync
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Data synced successfully!",
  "lastSyncTime": "2025-09-30T15:30:00Z"
}
```

## Implementation Guidelines

### 1. CORS Configuration
Add CORS headers for mobile development:
```javascript
// In API route handlers
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

### 2. JWT Token Generation
```javascript
import jwt from 'jsonwebtoken';

const generateTokens = (user) => {
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { token, refreshToken };
};
```

### 3. JWT Middleware
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

### 4. Database Integration
Use your existing database models but adapt queries for mobile responses:

```javascript
// Example: Get parent profile
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Use your existing User/Parent models
    const parent = await Parent.findOne({ userId: req.user.userId })
      .populate('children');
    
    // Format for mobile response
    const response = {
      success: true,
      parent: {
        id: parent._id,
        userId: parent.userId,
        name: parent.name,
        walletBalance: parent.walletBalance,
        // ... other fields
      },
      children: parent.children.map(child => ({
        id: child._id,
        parentId: child.parentId,
        name: child.name,
        // ... other fields
      }))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

### 5. Environment Variables
Add to your `.env.local`:
```
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

## File Structure to Create

Create these files in your Next.js project:

```
pages/api/mobile/
├── auth/
│   ├── login.js
│   └── refresh.js
├── parent/
│   ├── profile.js
│   ├── vote.js
│   ├── wallet.js
│   └── wallet/
│       └── topup.js
├── child/
│   ├── [shareSlug].js
│   ├── [shareSlug]/
│   │   └── donate.js
│   └── [childId]/
│       └── qr.js
└── sync.js
```

## Testing the Mobile Endpoints

Once implemented, you can test with:

```bash
# Test login
curl -X POST https://spiritof.vercel.app/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test profile (with token from login)
curl -X GET https://spiritof.vercel.app/api/mobile/parent/profile \
  -H "Authorization: Bearer your_jwt_token_here"
```

## Mobile App Configuration

Once mobile endpoints are live, update the mobile app:

```dart
// In demo_data_service.dart
static bool _isDemoMode = false; // Disable demo mode

// In api_service.dart - remove try/catch demo fallbacks
// Let real API calls go through
```

## Security Considerations

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Input Validation**: Validate all request bodies
3. **PIN Encryption**: Hash/encrypt PIN storage
4. **HTTPS Only**: Ensure all endpoints use HTTPS
5. **Token Expiry**: Implement proper token refresh logic

## Error Handling

Consistent error response format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional context
}
```

This specification provides everything needed to create mobile API endpoints that will work seamlessly with the Spirit of Santa mobile app!