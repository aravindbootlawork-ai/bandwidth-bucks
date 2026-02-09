'use server';

/**
 * Email service for sending payout notifications to users
 */

export async function sendPayoutNotification(
  userEmail: string,
  payoutData: {
    amount: number;
    currency: string;
    method: string;
    status: 'approved' | 'rejected';
    reason?: string;
  }
) {
  try {
    // Using basic email service - replace with SendGrid/Resend in production
    const emailContent = generateEmailContent(payoutData);
    
    // For now, log to console (In production, use SendGrid, Resend, or Firebase email)
    console.log(`📧 Sending email to ${userEmail}:`, emailContent);
    
    // In production, use this:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: userEmail }] }],
    //     from: { email: 'noreply@bandwidthbucks.com' },
    //     subject: emailContent.subject,
    //     content: [{ type: 'text/html', value: emailContent.html }]
    //   })
    // });
    
    return { success: true, message: 'Email notification queued' };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

function generateEmailContent(payoutData: any) {
  const isApproved = payoutData.status === 'approved';
  const amount = `${payoutData.currency === 'INR' ? '₹' : '$'}${payoutData.amount}`;
  
  const subject = isApproved 
    ? `Your Payout of ${amount} Has Been Approved ✅`
    : `Your Payout Request Was Rejected ❌`;
  
  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9400D3;">🎉 Payout Approved!</h2>
        <p>Good news! Your payout request has been approved.</p>
        <div style="background: #f0e6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Method:</strong> ${payoutData.method}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        <p>The funds will be transferred to your ${payoutData.method} account shortly.</p>
        <p>Visit your wallet to track the status: <a href="http://localhost:9002/wallet">View Wallet</a></p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">❌ Payout Request Rejected</h2>
        <p>Your payout request could not be processed.</p>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Method:</strong> ${payoutData.method}</p>
          <p><strong>Status:</strong> Rejected</p>
          <p style="margin-top: 10px;"><strong>Reason:</strong></p>
          <p style="color: #d32f2f;">${payoutData.reason || 'No reason provided'}</p>
        </div>
        <p>The amount (${amount}) has been returned to your wallet balance.</p>
        <p>Visit your wallet to retry: <a href="http://localhost:9002/wallet">View Wallet</a></p>
      </div>
    `;
  
  return { subject, html };
}
