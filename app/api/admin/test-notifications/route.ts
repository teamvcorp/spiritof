import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendAdminNotification, notifyToyRequest, notifySpecialRequest, notifyAdminAction, notifyNewUser } from '@/lib/admin-notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { type, testData } = await request.json();

    let result;
    
    switch (type) {
      case 'toy_request':
        result = await notifyToyRequest(
          testData?.childName || 'Test Child',
          testData?.itemTitle || 'Test Toy Request',
          testData?.parentEmail || 'test@example.com',
          'test_request_id_123'
        );
        break;

      case 'early_gift':
        result = await notifySpecialRequest(
          'early_gift',
          testData?.childName || 'Test Child',
          testData?.giftTitle || 'Test Early Gift',
          testData?.parentEmail || 'test@example.com'
        );
        break;

      case 'friend_gift':
        result = await notifySpecialRequest(
          'friend_gift',
          testData?.childName || 'Test Child',
          testData?.giftTitle || 'Test Friend Gift',
          testData?.parentEmail || 'test@example.com'
        );
        break;

      case 'admin_action':
        result = await notifyAdminAction(
          testData?.title || 'Test Admin Action',
          testData?.description || 'This is a test admin notification to verify the email system is working.',
          testData?.priority || 'medium',
          {
            'Test Data': 'This is a test notification',
            'Triggered By': session.user?.email || 'Test Admin',
            'Environment': process.env.NODE_ENV || 'development'
          }
        );
        break;

      case 'new_user':
        result = await notifyNewUser(
          testData?.userName || 'Test User',
          testData?.userEmail || 'testuser@example.com',
          testData?.registrationMethod || 'google'
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} notification sent successfully`,
      result
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin notification test endpoint',
    availableTypes: [
      'toy_request',
      'early_gift', 
      'friend_gift',
      'admin_action',
      'new_user'
    ],
    usage: 'POST with { type: "notification_type", testData: {...} }'
  });
}