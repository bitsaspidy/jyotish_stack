const nodemailer = require('nodemailer');
const db = require('../config/db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// HTML email templates
const templates = {
  welcome: (data) => ({
    subject: `Welcome to Jyotish Stack AI, ${data.name}!`,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h1 style="color:#D4AF37;text-align:center;letter-spacing:2px;">🪐 Jyotish Stack AI</h1>
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Welcome to <strong style="color:#D4AF37;">Jyotish Stack AI</strong> — where ancient Vedic wisdom meets modern intelligence.</p>
        <p>Your journey to discover cosmic insights begins now. Explore your Kundli, match horoscopes, and receive personalised Bhavishya Vani.</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you did not register, please ignore this email.</p>
        <hr style="border-color:#D4AF37;opacity:0.3;"/>
        <p style="text-align:center;font-size:12px;color:#888;">© ${new Date().getFullYear()} Jyotish Stack AI • jyotishstack.com</p>
      </div>`,
  }),

  verify_email: (data) => ({
    subject: 'Verify your Jyotish Stack AI email',
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h2 style="color:#D4AF37;">Email Verification</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">This link expires in 24 hours.</p>
      </div>`,
  }),

  reset_password: (data) => ({
    subject: 'Reset your Jyotish Stack AI password',
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h2 style="color:#D4AF37;">Password Reset</h2>
        <p>We received a request to reset your password. Click below to proceed:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
        <p style="font-size:12px;color:#888;">This link expires in 1 hour. If you did not request this, ignore the email.</p>
      </div>`,
  }),

  subscription_confirm: (data) => ({
    subject: `Subscription Confirmed — ${data.planName}`,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h2 style="color:#D4AF37;">Subscription Active</h2>
        <p>Namaste ${data.name},</p>
        <p>Your <strong style="color:#D4AF37;">${data.planName}</strong> subscription is now active.</p>
        <ul>
          <li>Amount Paid: ₹${data.amount}</li>
          <li>Valid Until: ${data.expiresAt}</li>
        </ul>
        <p>Thank you for choosing Jyotish Stack AI.</p>
      </div>`,
  }),

  newsletter: (data) => ({
    subject: data.subject,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h1 style="color:#D4AF37;text-align:center;">🪐 Jyotish Stack AI</h1>
        ${data.body}
        <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
        <p style="text-align:center;font-size:11px;color:#666;">
          <a href="${data.unsubscribeUrl}" style="color:#888;">Unsubscribe</a>
        </p>
      </div>`,
  }),

  custom: (data) => ({
    subject: data.subject,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h1 style="color:#D4AF37;text-align:center;">🪐 Jyotish Stack AI</h1>
        ${data.body}
        <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
        <p style="text-align:center;font-size:12px;color:#888;">© ${new Date().getFullYear()} Jyotish Stack AI</p>
      </div>`,
  }),
};

const sendEmail = async ({ to, template, data }) => {
  const tmpl = templates[template];
  if (!tmpl) throw new Error(`Unknown email template: ${template}`);
  const { subject, html } = tmpl(data);

  // Log to DB
  const [logId] = await db('email_logs').insert({ to_email: to, subject, template, status: 'queued' });

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    await db('email_logs').where({ id: logId }).update({ status: 'sent' });
  } catch (err) {
    await db('email_logs').where({ id: logId }).update({ status: 'failed', error_message: err.message });
    console.error('[Email]', err.message);
  }
};

module.exports = { sendEmail };
