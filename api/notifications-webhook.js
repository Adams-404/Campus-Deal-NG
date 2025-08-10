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
