import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
} else {
  console.warn('⚠️ Twilio credentials not configured. SMS functionality will be disabled.');
}

export interface SendVotingSMSParams {
  to: string;
  parentId: string;
  parentName: string;
}

/**
 * Send an SMS with a voting link to the parent
 */
export async function sendVotingSMS({ to, parentId, parentName }: SendVotingSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioClient || !fromNumber) {
    console.error('❌ Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  // Generate secure voting link with parent ID
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.spiritofsanta.club';
  const votingLink = `${baseUrl}/mobile/vote?pid=${parentId}`;

  const message = `Hi ${parentName}! 🎅\n\nQuick vote on your children's behavior today:\n${votingLink}\n\n- Spirit of Santa`;

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });

    console.log(`✅ SMS sent to ${to}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

/**
 * Format phone number to E.164 format (required by Twilio)
 * Example: (555) 123-4567 -> +15551234567
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has country code, add + if missing
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it has + already, just clean it
  if (phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  // Default: assume it's already formatted or return as-is with +
  return `+${digits}`;
}
