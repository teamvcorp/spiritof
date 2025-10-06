# Admin Email Notification System

## Overview
The Spirit of Santa platform now automatically sends email notifications to the team at `team@teamvcorp.com` whenever admin actions are needed or taken.

## What Triggers Notifications

### 👋 New User Registration
- **When**: Someone creates a new account (Google OAuth or email/password)
- **Priority**: Low
- **Email Contains**: User name, email, registration method
- **Action URL**: `/admin`

### 🎁 Toy Requests
- **When**: Child requests a new toy item (costs 5 magic points)
- **Priority**: Medium
- **Email Contains**: Child name, item title, parent email, request ID
- **Action URL**: `/admin/toy-requests`

### ⭐ Early Gift Requests
- **When**: Child requests early delivery of a gift (auto-approved)
- **Priority**: Medium
- **Email Contains**: Child name, gift title, parent email
- **Action URL**: `/admin/logistics`

### 💝 Friend Gift Requests
- **When**: Child requests to send a gift to a friend (auto-approved)
- **Priority**: Medium
- **Email Contains**: Child name, gift title, parent email
- **Action URL**: `/admin/logistics`

### ⚙️ Admin Actions
- **When**: Admin approves/denies requests or takes other actions
- **Priority**: Medium (High for denials)
- **Email Contains**: Action taken, admin email, affected child/request
- **Action URL**: `/admin`

## Email Format

Each notification email includes:
- **Priority badge** with color coding
- **Type emoji** and description
- **Child/parent information** when applicable
- **Action button** linking to relevant admin page
- **Metadata section** with additional details
- **Timestamp** and environment information

## Priority Levels

- 🔵 **Low**: Informational updates
- 🟡 **Medium**: Standard admin actions needed
- 🟠 **High**: Important actions or denials
- 🔴 **Urgent**: Critical issues requiring immediate attention

## Testing the System

### Test Endpoint: `/api/admin/test-notifications`

Send a POST request with:
```json
{
  "type": "toy_request|early_gift|friend_gift|admin_action",
  "testData": {
    "childName": "Test Child",
    "itemTitle": "Test Item",
    "parentEmail": "test@example.com",
    "title": "Test Title",
    "description": "Test Description",
    "priority": "medium"
  }
}
```

### Example Test Commands

```bash
# Test new user notification
curl -X POST /api/admin/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "new_user", "testData": {"userName": "John Doe", "userEmail": "john@example.com", "registrationMethod": "google"}}'

# Test toy request notification
curl -X POST /api/admin/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "toy_request", "testData": {"childName": "Emma", "itemTitle": "Magic Wand"}}'

# Test admin action notification
curl -X POST /api/admin/test-notifications \
  -H "Content-Type: application/json" \
  -d '{"type": "admin_action", "testData": {"title": "System Test", "priority": "high"}}'
```

## Configuration

### Environment Variables Required
- `RESEND_API_KEY`: Your Resend API key
- `RESEND_FROM_EMAIL`: The "from" email address (e.g., noreply@fyht4.com)
- `NEXTAUTH_URL`: Base URL for action links

### Team Email Address
Update the `TEAM_EMAIL` constant in `/lib/admin-notifications.ts` to your actual team email.

## Implementation Details

### Files Modified
1. **`/lib/admin-notifications.ts`** - Core notification service
2. **`/app/api/catalog/request-item/route.ts`** - Toy requests
3. **`/app/api/children/early-gift-request/route.ts`** - Early gifts
4. **`/app/api/children/friend-gift-request/route.ts`** - Friend gifts
5. **`/app/api/admin/special-requests/route.ts`** - Admin actions
6. **`/app/api/admin/toy-requests/route.ts`** - Toy request admin actions
7. **`/app/api/admin/test-notifications/route.ts`** - Testing endpoint

### Error Handling
- Email failures **do not** break the main functionality
- All email errors are logged but don't affect user experience
- Failed notifications are logged with detailed error information

## Monitoring

Check server logs for:
- `📧 Admin notification sent:` - Successful emails
- `❌ Failed to send admin notification:` - Email failures
- Email IDs from Resend for tracking

## Future Enhancements

1. **Email Templates**: Custom HTML templates for different notification types
2. **Slack Integration**: Optional Slack notifications for urgent items
3. **Digest Emails**: Daily/weekly summary of all admin actions
4. **User Preferences**: Allow admins to customize notification preferences
5. **SMS Alerts**: Critical notifications via SMS for urgent items

## Usage Examples

The system automatically triggers when:
1. A child submits a toy request → Email to team
2. A child requests an early gift → Email to team  
3. A child sends a friend gift → Email to team
4. An admin approves/denies a request → Email to team
5. Any admin action occurs → Email to team

No manual intervention required - all emails are triggered automatically based on user and admin actions!