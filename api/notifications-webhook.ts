// Minimal types to avoid @vercel/node types dependency during lint
type VercelRequest = {
  method?: string;
  headers: Record<string, any>;
  body?: any;
};
type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
};
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Environment
const FROM_EMAIL = process.env.NOTIFICATIONS_FROM_EMAIL || 'GSU Market <no-reply@example.com>';
const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook secret
    const provided = req.headers['x-webhook-secret'];
    if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body || {};
    // Supabase DB webhook payloads usually expose `type` and `record` (new row)
    const eventType: string | undefined = payload.type || payload.eventType;
    const record = payload.record || payload.new || payload.data || {};

    if (!record || !record.user_id) {
      return res.status(400).json({ error: 'Invalid payload: missing record.user_id' });
    }

    // Only act on INSERT (new notification) and only if unread
    if ((eventType || '').toUpperCase() !== 'INSERT') {
      return res.status(200).json({ ok: true, skipped: 'Not an INSERT' });
    }
    if (record.is_read === true) {
      return res.status(200).json({ ok: true, skipped: 'Already read' });
    }

    // Initialize clients lazily (prevents crashes on misconfigured GET checks)
    const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const resend = new Resend(RESEND_API_KEY);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Fetch user email via Admin API
    const userId: string = record.user_id;
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !userRes?.user?.email) {
      return res.status(200).json({ ok: true, skipped: 'User email not found' });
    }
    const to = userRes.user.email as string;

    // Compose email
    const subject = record.title || 'New notification';
    const message = record.content || '';
    const type = record.type || 'info';
    const created_at = record.created_at || new Date().toISOString();

    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #0A0A0A;">
        <h2 style="margin: 0 0 12px;">You have a new notification</h2>
        <p style="margin: 0 0 6px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        ${type ? `<p style=\"margin: 0 0 6px;\"><strong>Type:</strong> ${escapeHtml(type)}</p>` : ''}
        ${created_at ? `<p style=\"margin: 0 0 12px;\"><strong>Time:</strong> ${new Date(created_at).toLocaleString()}</p>` : ''}
        <div style="padding: 12px; background: #F6F9FC; border-radius: 8px; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error' });
  }
}

function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


