// /lib/email-reminders.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface VotingReminderData {
  parentName: string;
  parentEmail: string;
  children: Array<{
    name: string;
    score365: number;
  }>;
  voteUrl: string;
}

export async function sendVotingReminder(data: VotingReminderData) {
  try {
    const childList = data.children
      .map((child, index) => `${index + 1}. ${child.name} - ✨ ${child.score365} Magic Points`)
      .join('\n');

    const htmlChildList = data.children
      .map(child => `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #22c55e;">
          <strong style="color: #ea1938;">${child.name}</strong>
          <br>
          <span style="color: #22c55e; font-size: 14px;">✨ ${child.score365} Magic Points</span>
        </div>
      `)
      .join('');

    const subject = `🎅 Weekly Reminder: Vote for Your Children's Magic Points!`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { 
      background: linear-gradient(135deg, #ea1938, #22c55e); 
      color: white; 
      padding: 30px 20px; 
      border-radius: 8px 8px 0 0; 
      text-align: center; 
    }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .cta-button { 
      display: inline-block; 
      background: #ea1938; 
      color: white !important; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 20px 0;
      font-weight: bold;
      font-size: 16px;
    }
    .children-section { margin: 20px 0; }
    .info-box { 
      background: #fef3c7; 
      border-left: 4px solid #f59e0b; 
      padding: 15px; 
      border-radius: 6px; 
      margin: 20px 0; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎅 Spirit of Santa</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Weekly Voting Reminder</p>
    </div>
    <div class="content">
      <p>Hi ${data.parentName}! 👋</p>
      
      <p>Hope you're having a magical week! Just a friendly reminder that you can vote daily for your children's behavior to increase their Magic Points. ✨</p>
      
      <div class="info-box">
        <strong>📊 How Voting Works:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Vote once per day for each child</li>
          <li>Each vote increases their Magic Points by 1</li>
          <li>Higher scores = better gifts from Santa! 🎁</li>
          <li>Voting requires magic coins from your wallet</li>
        </ul>
      </div>

      <h3 style="color: #ea1938; margin-top: 25px;">Your Children:</h3>
      <div class="children-section">
        ${htmlChildList}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.voteUrl}" class="cta-button">
          🎯 Vote for Your Kids Now
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        <strong>💡 Quick Tip:</strong> Make voting part of your weekly routine! Many parents vote on Sunday evenings while planning the week ahead.
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #999;">
        You're receiving this email because you have "Reminder Emails" enabled in your Christmas Settings. 
        <br>
        To adjust your email preferences, visit your <a href="${process.env.NEXTAUTH_URL}/parent/dashboard" style="color: #ea1938;">Parent Dashboard</a>.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
🎅 SPIRIT OF SANTA - WEEKLY VOTING REMINDER 🎅

Hi ${data.parentName}!

Hope you're having a magical week! Just a friendly reminder that you can vote daily for your children's behavior to increase their Magic Points. ✨

📊 How Voting Works:
- Vote once per day for each child
- Each vote increases their Magic Points by 1
- Higher scores = better gifts from Santa! 🎁
- Voting requires magic coins from your wallet

Your Children:
${childList}

🎯 Vote for Your Kids Now:
${data.voteUrl}

💡 Quick Tip: Make voting part of your weekly routine! Many parents vote on Sunday evenings while planning the week ahead.

---
You're receiving this email because you have "Reminder Emails" enabled in your Christmas Settings.
To adjust your email preferences, visit: ${process.env.NEXTAUTH_URL}/parent/dashboard

🎅 Spirit of Santa Team
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [data.parentEmail],
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log('📧 Voting reminder sent:', {
      parentEmail: data.parentEmail,
      childrenCount: data.children.length,
      emailId: result.data?.id
    });

    return { success: true, emailId: result.data?.id };

  } catch (error) {
    console.error('❌ Failed to send voting reminder:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendWeeklyBudgetUpdate(parentEmail: string, parentName: string, data: {
  currentBalance: number;
  monthlyGoal: number;
  totalSpent: number;
  childrenCount: number;
  daysUntilChristmas: number;
}) {
  try {
    const balanceFormatted = (data.currentBalance / 100).toFixed(2);
    const goalFormatted = (data.monthlyGoal / 100).toFixed(2);
    const spentFormatted = (data.totalSpent / 100).toFixed(2);
    const percentOfGoal = ((data.currentBalance / data.monthlyGoal) * 100).toFixed(0);

    const subject = `💰 Weekly Budget Update - $${balanceFormatted} Balance`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { 
      background: linear-gradient(135deg, #22c55e, #ea1938); 
      color: white; 
      padding: 30px 20px; 
      border-radius: 8px 8px 0 0; 
      text-align: center; 
    }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .stat-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #22c55e;
    }
    .stat-value { font-size: 32px; font-weight: bold; color: #22c55e; margin: 5px 0; }
    .stat-label { font-size: 14px; color: #666; }
    .progress-bar {
      background: #e5e7eb;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      background: linear-gradient(90deg, #22c55e, #16a34a);
      height: 100%;
      transition: width 0.3s ease;
    }
    .cta-button { 
      display: inline-block; 
      background: #22c55e; 
      color: white !important; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💰 Weekly Budget Update</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.daysUntilChristmas} days until Christmas!</p>
    </div>
    <div class="content">
      <p>Hi ${parentName}! 👋</p>
      
      <p>Here's your weekly Christmas budget summary:</p>

      <div class="stat-box">
        <div class="stat-label">Current Wallet Balance</div>
        <div class="stat-value">$${balanceFormatted}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentOfGoal}%"></div>
        </div>
        <div class="stat-label">${percentOfGoal}% of monthly goal ($${goalFormatted})</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div class="stat-box" style="border-left-color: #ea1938;">
          <div class="stat-label">Total Spent</div>
          <div class="stat-value" style="color: #ea1938; font-size: 24px;">$${spentFormatted}</div>
        </div>
        <div class="stat-box" style="border-left-color: #3b82f6;">
          <div class="stat-label">Children</div>
          <div class="stat-value" style="color: #3b82f6; font-size: 24px;">${data.childrenCount}</div>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/parent/dashboard" class="cta-button">
          📊 View Full Dashboard
        </a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      
      <p style="font-size: 12px; color: #999;">
        You're receiving this email because you have "Weekly Budget Updates" enabled. 
        <br>
        Adjust preferences in your <a href="${process.env.NEXTAUTH_URL}/parent/dashboard" style="color: #22c55e;">Dashboard Settings</a>.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
💰 WEEKLY BUDGET UPDATE

Hi ${parentName}!

${data.daysUntilChristmas} days until Christmas! ⏰

Your Christmas Budget Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Current Wallet Balance: $${balanceFormatted}
🎯 Monthly Goal: $${goalFormatted}
📊 Progress: ${percentOfGoal}%
💸 Total Spent: $${spentFormatted}
👨‍👩‍👧‍👦 Children: ${data.childrenCount}

View Full Dashboard:
${process.env.NEXTAUTH_URL}/parent/dashboard

---
Adjust email preferences in your Dashboard Settings.

🎅 Spirit of Santa Team
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [parentEmail],
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log('📧 Budget update sent:', {
      parentEmail,
      balance: balanceFormatted,
      emailId: result.data?.id
    });

    return { success: true, emailId: result.data?.id };

  } catch (error) {
    console.error('❌ Failed to send budget update:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
