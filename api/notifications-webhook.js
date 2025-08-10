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

    // Check for duplicate notifications to prevent spam
    const { data: existingNotifications, error: duplicateCheckError } = await supabaseAdmin
      .from('notifications')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('title', notification.title)
      .eq('type', notification.type)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .limit(1);

    if (duplicateCheckError) {
      console.error('Error checking for duplicates:', duplicateCheckError);
      return res.status(500).json({ error: 'Failed to check for duplicates' });
    }

    // If a similar notification was created in the last 5 minutes, skip sending email
    if (existingNotifications && existingNotifications.length > 0) {
      console.log('Duplicate notification detected, skipping email send');
      return res.status(200).json({ message: 'Duplicate notification, email skipped' });
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
        html: `<p>${notification.content}</p>`,
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  }

  return res.status(200).json({ message: 'No action taken' });
}
