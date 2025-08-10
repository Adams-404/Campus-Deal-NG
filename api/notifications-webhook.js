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
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CampusDeal Notification</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f8fafc;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 32px 24px;
                text-align: center;
                color: white;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
              }
              .tagline {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 300;
              }
              .content {
                padding: 32px 24px;
              }
              .notification-title {
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 16px;
                text-align: center;
              }
              .notification-message {
                background-color: #f8fafc;
                border-left: 4px solid #667eea;
                padding: 20px;
                border-radius: 8px;
                margin: 24px 0;
                font-size: 16px;
                line-height: 1.7;
                color: #374151;
              }
              .item-details {
                background-color: #f0f9ff;
                border: 1px solid #e0f2fe;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
              }
              .item-title {
                font-weight: 600;
                color: #0369a1;
                margin-bottom: 8px;
              }
              .reason {
                background-color: #fef3c7;
                border: 1px solid #fde68a;
                border-radius: 6px;
                padding: 12px;
                margin: 16px 0;
                color: #92400e;
              }
              .reason-label {
                font-weight: 600;
                margin-bottom: 4px;
              }
              .footer {
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              .footer-text {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 16px;
              }
              .social-links {
                margin-top: 16px;
              }
              .social-links a {
                display: inline-block;
                margin: 0 8px;
                color: #667eea;
                text-decoration: none;
                font-weight: 500;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                transition: transform 0.2s ease;
              }
              .cta-button:hover {
                transform: translateY(-1px);
              }
              .timestamp {
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                margin-top: 16px;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏪 CampusDeal</div>
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
                  <a href="https://campusdeal.ng" class="cta-button">
                    🏠 Visit CampusDeal
                  </a>
                </div>
                
                <div class="timestamp">
                  Sent on ${new Date().toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              
              <div class="footer">
                <div class="footer-text">
                  This is an automated notification from CampusDeal.<br>
                  Please do not reply to this email.
                </div>
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
