const nodemailer = require('nodemailer');
const db = require('../config/db');

// ─── Department mailboxes ─────────────────────────────────────────────────────
// Each department is a real mailbox on the domain. We authenticate per-mailbox so
// the "From" address always matches an authenticated account (best deliverability).
// If a department's own creds are not set, it falls back to the default SMTP_* account.
const boolEnv = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const buildSharedConfig = (env = process.env) => {
  const port = Number(env.SMTP_PORT) || 587;
  return {
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ? boolEnv(env.SMTP_SECURE) : port === 465,
    requireTLS: boolEnv(env.SMTP_REQUIRE_TLS, false),
    tls: {
      rejectUnauthorized: boolEnv(env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
      servername: env.SMTP_TLS_SERVERNAME || env.SMTP_HOST,
    },
  };
};
const SHARED = buildSharedConfig();

const DEFAULT_ACCOUNT = {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
};

const DEPARTMENTS = {
  sales: {
    user: process.env.MAIL_SALES_USER   || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_SALES_PASS   || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_SALES_FROM   || 'Jyotish Stack Sales <sales@jyotishstack.com>',
    address: process.env.MAIL_SALES_USER || 'sales@jyotishstack.com',
  },
  team: {
    user: process.env.MAIL_TEAM_USER    || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_TEAM_PASS    || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_TEAM_FROM    || 'Jyotish Stack Support <team@jyotishstack.com>',
    address: process.env.MAIL_TEAM_USER  || 'team@jyotishstack.com',
  },
  account: {
    user: process.env.MAIL_ACCOUNT_USER || DEFAULT_ACCOUNT.user,
    pass: process.env.MAIL_ACCOUNT_PASS || DEFAULT_ACCOUNT.pass,
    from: process.env.MAIL_ACCOUNT_FROM || 'Jyotish Stack <account@jyotishstack.com>',
    address: process.env.MAIL_ACCOUNT_USER || 'account@jyotishstack.com',
  },
};

// 'general' inquiries are handled by the support team mailbox
const INBOX_FOR = { sales: 'sales', team: 'team', account: 'account', general: 'team' };

// Which mailbox sends each transactional template (callers may override via `from`)
const TEMPLATE_DEPARTMENT = {
  welcome:              'account',
  verify_email:         'account',
  reset_password:       'account',
  subscription_confirm: 'account',
  newsletter:           'team',
  custom:               'team',
  contact_ack:          'team',   // overridden per-submission via `from`
  contact_notify:       'team',   // overridden per-submission via `from`
};

// Lazily-built, cached transports keyed by department
const _transports = {};
const getTransport = (deptKey) => {
  const dept = DEPARTMENTS[deptKey] ? deptKey : 'account';
  if (!_transports[dept]) {
    const { user, pass } = DEPARTMENTS[dept];
    _transports[dept] = nodemailer.createTransport({
      host: SHARED.host, port: SHARED.port, secure: SHARED.secure,
      requireTLS: SHARED.requireTLS, tls: SHARED.tls,
      auth: user ? { user, pass } : undefined,
    });
  }
  return { transport: _transports[dept], cfg: DEPARTMENTS[dept] };
};

// Resolve a contact department ('sales'|'team'|'account'|'general') to its mailbox key
const departmentInbox = (department) => INBOX_FOR[department] || 'team';

const BRAND_SHELL = (inner) => `
  <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
    <h1 style="color:#D4AF37;text-align:center;letter-spacing:2px;margin-top:0;">🪐 Jyotish Stack AI</h1>
    ${inner}
    <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
    <p style="text-align:center;font-size:12px;color:#888;">© ${new Date().getFullYear()} Jyotish Stack AI • jyotishstack.com</p>
  </div>`;

// HTML email templates
const templates = {
  welcome: (data) => ({
    subject: `Welcome to Jyotish Stack AI, ${data.name}!`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Welcome to <strong style="color:#D4AF37;">Jyotish Stack AI</strong> — where ancient Vedic wisdom meets modern intelligence.</p>
        <p>Your journey to discover cosmic insights begins now. Explore your Kundli, match horoscopes, and receive personalised Bhavishya Vani.</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you did not register, please ignore this email.</p>`),
  }),

  verify_email: (data) => ({
    subject: 'Verify your Jyotish Stack AI email',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Email Verification</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">This link expires in 24 hours.</p>`),
  }),

  reset_password: (data) => ({
    subject: 'Reset your Jyotish Stack AI password',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Password Reset</h2>
        <p>We received a request to reset your password. Click below to proceed:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
        <p style="font-size:12px;color:#888;">This link expires in 1 hour. If you did not request this, ignore the email.</p>`),
  }),

  subscription_confirm: (data) => ({
    subject: `Subscription Confirmed — ${data.planName}`,
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Subscription Active</h2>
        <p>Namaste ${data.name},</p>
        <p>Your <strong style="color:#D4AF37;">${data.planName}</strong> subscription is now active.</p>
        <ul>
          <li>Amount Paid: ₹${data.amount}</li>
          <li>Valid Until: ${data.expiresAt}</li>
        </ul>
        <p>Thank you for choosing Jyotish Stack AI. For billing questions, reply to this email (account@jyotishstack.com).</p>`),
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
    html: BRAND_SHELL(data.body),
  }),

  // Sent to the customer confirming we received their message
  contact_ack: (data) => ({
    subject: `We received your message — Jyotish Stack AI`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Thank you for reaching out to our <strong style="color:#D4AF37;">${data.departmentLabel}</strong> team.
           We've received your message and will reply to this email address shortly.</p>
        <blockquote style="border-left:3px solid #D4AF37;margin:18px 0;padding:6px 16px;color:#cfc8bb;">
          ${(data.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}
        </blockquote>
        <p style="font-size:12px;color:#888;">This is an automated acknowledgement — no need to reply.</p>`),
  }),

  // Sent to the internal department inbox with the inquiry details
  contact_notify: (data) => ({
    subject: `[${data.departmentLabel}] ${data.subject || 'New inquiry'} — ${data.name}`,
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">New ${data.departmentLabel} inquiry</h2>
        <table style="font-size:14px;color:#F5F0E8;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Name</td><td>${data.name}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Email</td><td>${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#888;">Phone</td><td>${data.phone}</td></tr>` : ''}
          <tr><td style="padding:4px 12px 4px 0;color:#888;">Subject</td><td>${data.subject || '—'}</td></tr>
        </table>
        <p style="margin-top:16px;color:#888;font-size:12px;">Message:</p>
        <blockquote style="border-left:3px solid #D4AF37;margin:6px 0;padding:6px 16px;color:#cfc8bb;">
          ${(data.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}
        </blockquote>
        <p style="font-size:12px;color:#888;">Reply directly to this email to respond to ${data.name}.</p>`),
  }),
};

const DEPT_LABELS = { sales: 'Sales', team: 'Support', account: 'Accounts', general: 'Support' };

/**
 * Send an email.
 * @param {string}  to        recipient address
 * @param {string}  template  template key
 * @param {object}  data      template data
 * @param {string} [from]     department key ('sales'|'team'|'account') — overrides the
 *                            template default sender
 * @param {string} [replyTo]  optional Reply-To (e.g. the customer's email on notifications)
 */
const sendEmail = async ({ to, template, data = {}, from, replyTo }) => {
  const tmpl = templates[template];
  if (!tmpl) throw new Error(`Unknown email template: ${template}`);
  const { subject, html } = tmpl(data);

  const deptKey = from && DEPARTMENTS[from] ? from : (TEMPLATE_DEPARTMENT[template] || 'account');
  const { transport, cfg } = getTransport(deptKey);

  // Log to DB
  const [logId] = await db('email_logs').insert({ to_email: to, subject, template, status: 'queued' });

  try {
    await transport.sendMail({ from: cfg.from, to, subject, html, replyTo: replyTo || undefined });
    await db('email_logs').where({ id: logId }).update({ status: 'sent' });
  } catch (err) {
    await db('email_logs').where({ id: logId }).update({ status: 'failed', error_message: err.message });
    console.error('[Email]', err.message);
  }
};

module.exports = {
  sendEmail,
  departmentInbox,   // 'sales'|'team'|'account'|'general' -> mailbox key
  DEPARTMENTS,
  DEPT_LABELS,
  buildSharedConfig,
  boolEnv,
};
