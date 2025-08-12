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
            <title>Notification</title>
            <style>
              body { margin:0; padding:24px; background:#f6f7f9; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Helvetica,Arial,sans-serif; color:#111827; }
              .container { max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
              .header { padding:20px; text-align:center; border-bottom:1px solid #f0f0f0; }
              .logo { width:64px; height:64px; border-radius:12px; overflow:hidden; display:inline-block; background:#ffffff; border:1px solid #e5e7eb; }
              .logo img { width:100%; height:100%; object-fit:contain; display:block; }
              .brand { margin-top:8px; font-weight:700; font-size:16px; color:#111827; }
              .content { padding:20px; }
              .greeting { font-size: 15px; color: #4b5563; margin-bottom: 12px; }
              .title { font-size:20px; font-weight:600; margin:0 0 16px 0; color:#111827; }
              .message { font-size:15px; line-height:1.6; color:#374151; white-space:pre-wrap; }
              .reason { margin-top:16px; padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#fafafa; }
              .reason-label { font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; font-weight:600; }
              .signature { margin-top:20px; display:flex; align-items:center; gap:12px; }
              .avatar { width:40px; height:40px; border-radius:9999px; overflow:hidden; background:#f3f4f6; border:1px solid #e5e7eb; }
              .avatar img { width:100%; height:100%; object-fit:cover; display:block; }
              .admin-info { line-height:1.4; }
              .admin-name { font-size:15px; font-weight:600; color:#111827; }
              .admin-role { font-size:13px; color:#6b7280; }
              .actions { margin-top:24px; }
              .actions a { font-size:14px; color:#1078a7; text-decoration:none; font-weight:500; }
              .footer { padding:20px; border-top:1px solid #f3f4f6; text-align:center; color:#6b7280; font-size:12px; }
              .footer a { color:#6b7280; text-decoration:none; }
              .sep { margin:0 8px; color:#d1d5db; }
              a { color:#111827; transition:color 0.15s; }
              a:hover { color:#0d5d82; }
              @media (max-width:640px){ body{ padding:12px } .content{ padding:16px } }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <img src="https://campusdeal.ng/logo.png" alt="Campus Deal Logo" />
                </div>
                <div class="brand">Campus Deal</div>
              </div>
              <div class="content">
                ${(() => {
                  const now = new Date();
                  const hour = now.getHours();
                  let greeting = 'Hello';
                  if (hour < 12) greeting = 'Good morning';
                  else if (hour < 18) greeting = 'Good afternoon';
                  else greeting = 'Good evening';
                  return `<div class="greeting">${greeting},</div>`;
                })()}
                <h1 class="title">${notification.title}</h1>
                <div class="message">${notification.content.replace(/\n/g, '<br>')}</div>
                ${notification.content.includes('Reason:') ? `
                  <div class="reason">
                    <div class="reason-label">Note</div>
                    <div class="message">${notification.content.split('Reason:')[1].trim()}</div>
                  </div>
                ` : ''}
                ${notification.metadata && notification.metadata.category === 'admin_message' ? `
                  <div class="signature">
                    <div class="avatar">
                      ${notification.metadata.admin_avatar_url ? 
                        `<img src="${notification.metadata.admin_avatar_url}" alt="${notification.metadata.admin_name || 'Admin'}" />` : 
                        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#9CA3AF"/><path d="M12 14.5C6.99 14.5 3 18.49 3 23.5C3 23.78 3.22 24 3.5 24H20.5C20.78 24 21 23.78 21 23.5C21 18.49 17.01 14.5 12 14.5Z" fill="#9CA3AF"/></svg>'
                      }
                    </div>
                    <div class="admin-info">
                      <div class="admin-name">${notification.metadata.admin_name || 'Admin Team'}</div>
                      <div class="admin-role">Campus Deal Support</div>
                    </div>
                  </div>
                ` : ''}
                <div class="actions">
                  <a href="https://campusdeal.ng">Open in App →</a>
                </div>
              </div>
              <div class="footer">
                <div>This is an automated notification from Campus Deal.</div>
                <div style="margin-top:8px;">
                  <a href="https://campusdeal.ng">Website</a>
                  <span class="sep">•</span>
                  <a href="mailto:support@campusdeal.ng">Support</a>
                  <span class="sep">•</span>
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
