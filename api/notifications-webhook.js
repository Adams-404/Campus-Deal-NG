import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Notifications webhook is up' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug logging
  console.log('Received headers:', req.headers);
  console.log('Expected secret:', process.env.NOTIFICATIONS_WEBHOOK_SECRET);
  console.log('Received secret:', req.headers['x-webhook-secret']);

  // Verify webhook secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.NOTIFICATIONS_WEBHOOK_SECRET) {
    console.log('Secret mismatch!');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body;
  
  // Check if this is a new notification insert
  if (payload.type === 'INSERT' && payload.table === 'notifications' && !payload.record.is_read) {
    const notification = payload.record;
    const userId = notification.user_id;

    // Initialize Supabase with service role key
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Smart deduplication: Keep notifications WITH reason, remove duplicates WITHOUT reason
    const { data: existingNotifications, error: duplicateCheckError } = await supabaseAdmin
      .from('notifications')
      .select('id, content, created_at')
      .eq('user_id', userId)
      .eq('title', notification.title)
      .eq('type', notification.type)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false });

    if (duplicateCheckError) {
      console.error('Error checking for duplicates:', duplicateCheckError);
      return res.status(500).json({ error: 'Failed to check for duplicates' });
    }

    // If we have multiple notifications, keep the one WITH reason and remove duplicates WITHOUT reason
    if (existingNotifications && existingNotifications.length > 1) {
      console.log('Multiple notifications detected, cleaning up duplicates...');
      
      // Find the notification WITH reason
      const notificationWithReason = existingNotifications.find(n => 
        n.content && n.content.includes('Reason:')
      );
      
      // Find notifications WITHOUT reason (duplicates to remove)
      const duplicatesWithoutReason = existingNotifications.filter(n => 
        !n.content || !n.content.includes('Reason:')
      );
      
      // Remove duplicate notifications WITHOUT reason
      if (duplicatesWithoutReason.length > 0) {
        const duplicateIds = duplicatesWithoutReason.map(n => n.id);
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .in('id', duplicateIds);
          
        if (deleteError) {
          console.error('Error removing duplicate notifications:', deleteError);
        } else {
          console.log(`Removed ${duplicatesWithoutReason.length} duplicate notifications`);
        }
      }
      
      // Only send email if this is the notification WITH reason
      if (notification.content && notification.content.includes('Reason:')) {
        console.log('Sending email for notification WITH reason');
      } else {
        console.log('Skipping email for notification WITHOUT reason');
        return res.status(200).json({ message: 'Duplicate notification without reason, email skipped' });
      }
    }

    // Fetch user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error('Error fetching user email:', userError?.message || 'Email not found');
      return res.status(500).json({ error: 'Failed to get user email' });
    }
    const toEmail = userData.user.email;

    // Send email via Resend
    try {
      await resend.emails.send({
        from: process.env.NOTIFICATIONS_FROM_EMAIL,
        to: toEmail,
        subject: notification.title || 'New Notification',
        html: `
          <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusDeal Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f7;
      margin: 0;
      padding: 0;
      color: #1d1d1f;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: #ffffff;
      padding: 24px;
      text-align: center;
      border-bottom: 1px solid #e5e5ea;
    }
    .logo-img {
      max-width: 140px;
      height: auto;
    }
    .tagline {
      font-size: 14px;
      color: #6e6e73;
      margin-top: 8px;
    }
    .content {
      padding: 24px;
    }
    .notification-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      text-align: center;
    }
    .notification-message {
      background-color: #f5f5f7;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .reason {
      background-color: #fff9e6;
      border-radius: 12px;
      padding: 14px;
      margin-top: 20px;
      font-size: 15px;
      color: #9d6700;
    }
    .reason-label {
      font-weight: 600;
      margin-bottom: 6px;
    }
    .cta-button {
      display: inline-block;
      background-color: #0071e3;
      color: white;
      padding: 12px 24px;
      border-radius: 9999px;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      margin-top: 24px;
    }
    .cta-button:hover {
      background-color: #005bb5;
    }
    .timestamp {
      font-size: 12px;
      color: #86868b;
      margin-top: 16px;
      text-align: center;
    }
    .footer {
      padding: 16px;
      text-align: center;
      font-size: 14px;
      color: #86868b;
      border-top: 1px solid #e5e5ea;
    }
    .social-links a {
      color: #0071e3;
      text-decoration: none;
      margin: 0 6px;
    }
    @media (max-width: 600px) {
      .content { padding: 16px; }
      .notification-title { font-size: 18px; }
      .notification-message { font-size: 15px; }
      .cta-button { padding: 10px 20px; font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/public/logo/logo_no_background.png" alt="CampusDeal Logo" class="logo-img" />
      <div class="tagline">Your Campus Marketplace</div>
    </div>
    <div class="content">
      <div class="notification-title">${notification.title}</div>
      <div class="notification-message">
        ${notification.content}
      </div>
      ${notification.content.includes('Reason:') ? `
        <div class="reason">
          <div class="reason-label">📝 Admin Note:</div>
          <div>${notification.content.split('Reason:')[1]}</div>
        </div>
      ` : ''}
      <div style="text-align: center;">
        <a href="https://campusdeal.ng" class="cta-button">🏠 Visit CampusDeal</a>
      </div>
      <div class="timestamp">
        Sent on ${new Date().toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}
      </div>
    </div>
    <div class="footer">
      This is an automated notification from CampusDeal.<br>Please do not reply to this email.<br>
      <div class="social-links">
        <a href="https://campusdeal.ng">Website</a> |
        <a href="mailto:support@campusdeal.ng">Support</a> |
        <a href="https://campusdeal.ng/help">Help Center</a>
      </div>
    </div>
  </div>
</body>
</html>

        `,
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  }

  return res.status(200).json({ message: 'No action taken' });
}
