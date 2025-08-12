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

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // KYC-specific coalescing: if this is a KYC notification, group by document/status regardless of title
    const isKyc = notification?.type === 'admin_action' && (
      notification?.metadata?.category === 'kyc'
    );
    const docId = notification?.metadata?.document_id || null;
    const kycStatus = notification?.metadata?.status || null;

    if (isKyc && docId && kycStatus) {
      const { data: kycGroup, error: kycGroupErr } = await supabaseAdmin
        .from('notifications')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .eq('type', notification.type)
        .filter('metadata->>document_id', 'eq', docId)
        .filter('metadata->>status', 'eq', String(kycStatus))
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (kycGroupErr) {
        console.error('Error checking KYC group duplicates:', kycGroupErr);
        return res.status(500).json({ error: 'Failed to check for KYC duplicates' });
      }

      if (kycGroup && kycGroup.length > 0) {
        // For verified, prefer the message WITHOUT a Reason. For others, prefer WITH a Reason.
        let preferred;
        if (String(kycStatus) === 'verified') {
          preferred = kycGroup.find(n => !n.content || !n.content.includes('Reason:')) || kycGroup[0];
        } else {
          preferred = kycGroup.find(n => n.content && n.content.includes('Reason:')) || kycGroup[0];
        }

        // If this insert is not the preferred one, skip sending email
        if (preferred.id !== notification.id) {
          // Optionally clean up older non-preferred duplicates to keep inbox clean
          const toDelete = kycGroup
            .filter(n => n.id !== preferred.id)
            .map(n => n.id);
          if (toDelete.length > 0) {
            const { error: delErr } = await supabaseAdmin
              .from('notifications')
              .delete()
              .in('id', toDelete);
            if (delErr) console.error('Error removing duplicate KYC notifications:', delErr);
          }
          return res.status(200).json({ message: 'Non-preferred KYC duplicate skipped' });
        }
      }
    } else {
      // Default duplicate handling (non-KYC): check same title+type within a short window
      const { data: existingNotifications, error: duplicateCheckError } = await supabaseAdmin
        .from('notifications')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .eq('title', notification.title)
        .eq('type', notification.type)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (duplicateCheckError) {
        console.error('Error checking for duplicates:', duplicateCheckError);
        return res.status(500).json({ error: 'Failed to check for duplicates' });
      }

      if (existingNotifications && existingNotifications.length > 1) {
        const duplicatesWithoutReason = existingNotifications.filter(n => 
          !n.content || !n.content.includes('Reason:')
        );
        if (duplicatesWithoutReason.length > 0) {
          const duplicateIds = duplicatesWithoutReason.map(n => n.id);
          const { error: deleteError } = await supabaseAdmin
            .from('notifications')
            .delete()
            .in('id', duplicateIds);
          if (deleteError) console.error('Error removing duplicate notifications:', deleteError);
        }
        if (!notification.content.includes('Reason:')) {
          return res.status(200).json({ message: 'Duplicate notification without reason, email skipped' });
        }
      }
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error('Error fetching user email:', userError?.message || 'Email not found');
      return res.status(500).json({ error: 'Failed to get user email' });
    }
    const toEmail = userData.user.email;

    try {
      await resend.emails.send({
        from: process.env.NOTIFICATIONS_FROM_EMAIL,
        to: toEmail,
        subject: notification.title || 'New Notification from Campus Deal',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Campus Deal Notification</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
              }
              
              .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                overflow: hidden;
                border: 1px solid rgba(30, 174, 219, 0.1);
              }
              
              .header {
                background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1e40af 100%);
                padding: 40px 32px;
                text-align: center;
                color: white;
                position: relative;
                overflow: hidden;
              }
              
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
              }
              
              .logo-container {
                position: relative;
                z-index: 1;
                margin-bottom: 16px;
              }
              
              .logo {
                width: 80px;
                height: 80px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 16px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
              }
              
              .brand-name {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: -0.025em;
                background: linear-gradient(135deg, #ffffff, #e0f2fe);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              
              .tagline {
                font-size: 16px;
                font-weight: 400;
                opacity: 0.9;
                color: #e0f2fe;
              }
              
              .content {
                padding: 40px 32px;
                background: #ffffff;
              }
              
              .notification-title {
                font-size: 24px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 24px;
                text-align: center;
                line-height: 1.3;
              }
              
              .notification-message {
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                border-left: 4px solid #1e40af;
                padding: 24px;
                border-radius: 12px;
                margin: 24px 0;
                font-size: 16px;
                line-height: 1.7;
                color: #374151;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              
              .reason {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border: 1px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 24px 0;
                color: #92400e;
                box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.1);
              }
              
              .reason-label {
                font-weight: 600;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #d97706;
              }
              
              .cta-section {
                text-align: center;
                margin: 32px 0;
              }
              
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 10px 25px -5px rgba(30, 64, 175, 0.3);
                border: none;
                cursor: pointer;
                position: relative;
                overflow: hidden;
              }
              
              .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 40px -10px rgba(30, 64, 175, 0.4);
              }
              
              .cta-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
              }
              
              .cta-button:hover::before {
                left: 100%;
              }
              
              .timestamp {
                text-align: center;
                font-size: 14px;
                color: #6b7280;
                margin-top: 24px;
                font-style: italic;
                padding: 16px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
              }
              
              .footer {
                background: linear-gradient(135deg, #f8fafc, #f1f5f9);
                padding: 32px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              
              .footer-text {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 20px;
                line-height: 1.6;
              }
              
              .social-links {
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 24px;
                flex-wrap: wrap;
              }
              
              .social-links a {
                color: #1e40af;
                text-decoration: none;
                font-weight: 500;
                font-size: 14px;
                padding: 8px 16px;
                border-radius: 8px;
                transition: all 0.2s ease;
                background: rgba(30, 64, 175, 0.05);
                border: 1px solid rgba(30, 64, 175, 0.1);
              }
              
              .social-links a:hover {
                background: rgba(30, 64, 175, 0.1);
                border-color: rgba(30, 64, 175, 0.2);
                transform: translateY(-1px);
              }
              
              .divider {
                width: 1px;
                height: 20px;
                background: #d1d5db;
                margin: 0 12px;
              }
              
              @media (max-width: 600px) {
                body {
                  padding: 10px;
                }
                
                .email-container {
                  border-radius: 12px;
                }
                
                .header {
                  padding: 32px 24px;
                }
                
                .content {
                  padding: 32px 24px;
                }
                
                .brand-name {
                  font-size: 24px;
                }
                
                .notification-title {
                  font-size: 20px;
                }
                
                .social-links {
                  flex-direction: column;
                  gap: 12px;
                }
                
                .divider {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <div class="logo-container">
                  <div class="logo">🏪</div>
                  <div class="brand-name">Campus Deal</div>
                  <div class="tagline">Your Campus Marketplace</div>
                </div>
              </div>
              
              <div class="content">
                <div class="notification-title">${notification.title}</div>
                
                <div class="notification-message">
                  ${notification.content.replace(/Reason:.*/i, '').trim()}
                </div>
                
                ${notification.content.includes('Reason:') ? `
                  <div class="reason">
                    <div class="reason-label">Reason for deletion:</div>
                    <div>${notification.content.split('Reason:')[1].trim()}</div>
                  </div>
                ` : ''}
                
                <div class="cta-section">
                  <a href="https://campusdeal.ng" class="cta-button">
                    🏠 Visit Campus Deal
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
                  This is an automated notification from Campus Deal.<br>
                  Please do not reply to this email. For support, visit our help center.
                </div>
                <div class="social-links">
                  <a href="https://campusdeal.ng">Website</a>
                  <div class="divider"></div>
                  <a href="mailto:support@campusdeal.ng">Support</a>
                  <div class="divider"></div>
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
