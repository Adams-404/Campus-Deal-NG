import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, message, type, created_at } = req.body || {};

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    if (!to || !subject) {
      return res.status(400).json({ error: 'Missing to or subject' });
    }

    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.5; color: #0A0A0A;">
        <h2 style="margin: 0 0 12px;">You have a new notification</h2>
        <p style="margin: 0 0 4px;"><strong>Subject:</strong> ${subject}</p>
        ${type ? `<p style="margin: 0 0 4px;"><strong>Type:</strong> ${type}</p>` : ''}
        ${created_at ? `<p style="margin: 0 0 12px;"><strong>Time:</strong> ${new Date(created_at).toLocaleString()}</p>` : ''}
        <div style="padding: 12px; background: #F6F9FC; border-radius: 8px;">
          ${message ? message.replace(/\n/g, '<br/>') : ''}
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.NOTIFICATIONS_FROM_EMAIL || 'GSU Market <no-reply@gsu-market.app>',
      to,
      subject,
      html,
    });

    if (error) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true, id: data?.id });
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error' });
  }
}


