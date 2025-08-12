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
              .title { font-size:18px; font-weight:600; margin:0 0 12px 0; color:#111827; }
              .message { font-size:14px; line-height:1.6; color:#374151; white-space:pre-wrap; }
              .reason { margin-top:12px; padding:12px; border:1px solid #e5e7eb; border-radius:8px; background:#fafafa; }
              .reason-label { font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; font-weight:600; }
              .signature { margin-top:16px; padding-top:12px; border-top:1px solid #f3f4f6; display:flex; align-items:center; gap:10px; }
              .avatar { width:28px; height:28px; border-radius:9999px; overflow:hidden; background:#f3f4f6; border:1px solid #e5e7eb; }
              .avatar img { width:100%; height:100%; object-fit:cover; display:block; }
              .admin-name { font-size:13px; font-weight:600; color:#111827; }
              .badge { font-size:11px; padding:2px 6px; border:1px solid #d1d5db; border-radius:9999px; color:#374151; background:#ffffff; }
              .actions { margin-top:16px; }
              .actions a { font-size:13px; color:#111827; text-decoration:none; border-bottom:1px solid #e5e7eb; padding-bottom:1px; }
              .footer { padding:16px; border-top:1px solid #f3f4f6; text-align:center; color:#6b7280; font-size:12px; }
              .footer a { color:#6b7280; text-decoration:none; }
              .sep { margin:0 8px; color:#d1d5db; }
              a { color:#111827; }
              @media (max-width:640px){ body{ padding:12px } .content{ padding:16px } }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <span class="logo"><img src="https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/public/logo/logo_no_background.png" alt="Logo" /></span>
                <div class="brand">Campus Deal</div>
              </div>
              <div class="content">
                <h1 class="title">${notification.title}</h1>
                <div class="message">${notification.content.replace(/Reason:.*/i, '').trim()}</div>
                ${notification.content.includes('Reason:') ? `
                  <div class="reason">
                    <div class="reason-label">Reason</div>
                    <div>${notification.content.split('Reason:')[1].trim()}</div>
                  </div>
                ` : ''}
                ${notification.metadata && notification.metadata.category === 'admin_message' ? `
                  <div class="signature">
                    <span class="avatar">${notification.metadata.admin_avatar_url ? `<img src="${notification.metadata.admin_avatar_url}" alt="Admin" />` : ''}</span>
                    <span class="admin-name">${notification.metadata.admin_name || 'Admin Team'}</span>
                    <span class="badge">Admin</span>
                  </div>
                ` : ''}
                <div class="actions">
                  <a href="https://campusdeal.ng">Open Campus Deal</a>
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
