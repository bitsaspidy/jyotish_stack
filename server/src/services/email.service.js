const nodemailer = require('nodemailer');
const db = require('../config/db');

// ─── Department mailboxes ─────────────────────────────────────────────────────
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

// When a department-specific MAIL_*_USER is not configured, fall back to the
// shared SMTP_USER for both auth AND the From address — SMTP servers reject mail
// where the authenticated user does not match the envelope sender.
const DEPARTMENTS = {
  sales: {
    user:    process.env.MAIL_SALES_USER   || DEFAULT_ACCOUNT.user,
    pass:    process.env.MAIL_SALES_PASS   || DEFAULT_ACCOUNT.pass,
    from:    process.env.MAIL_SALES_FROM
             || (process.env.MAIL_SALES_USER
                  ? `Jyotish Stack Sales <${process.env.MAIL_SALES_USER}>`
                  : DEFAULT_ACCOUNT.from),
    address: process.env.MAIL_SALES_USER   || DEFAULT_ACCOUNT.user,
    label:   'Sales',
  },
  team: {
    user:    process.env.MAIL_TEAM_USER    || DEFAULT_ACCOUNT.user,
    pass:    process.env.MAIL_TEAM_PASS    || DEFAULT_ACCOUNT.pass,
    from:    process.env.MAIL_TEAM_FROM
             || (process.env.MAIL_TEAM_USER
                  ? `Jyotish Stack Support <${process.env.MAIL_TEAM_USER}>`
                  : DEFAULT_ACCOUNT.from),
    address: process.env.MAIL_TEAM_USER    || DEFAULT_ACCOUNT.user,
    label:   'Support',
  },
  account: {
    user:    process.env.MAIL_ACCOUNT_USER || DEFAULT_ACCOUNT.user,
    pass:    process.env.MAIL_ACCOUNT_PASS || DEFAULT_ACCOUNT.pass,
    from:    process.env.MAIL_ACCOUNT_FROM
             || (process.env.MAIL_ACCOUNT_USER
                  ? `Jyotish Stack <${process.env.MAIL_ACCOUNT_USER}>`
                  : DEFAULT_ACCOUNT.from),
    address: process.env.MAIL_ACCOUNT_USER || DEFAULT_ACCOUNT.user,
    label:   'Accounts',
  },
  // legal@ — the Grievance Officer address named in the Terms. Kept as its own
  // mailbox rather than an alias to team@ so statutory grievances (48h ack / 30d
  // resolution under the Consumer Protection (E-Commerce) Rules 2020) do not mix
  // with general support mail. Falls back to the shared account like every other
  // department, so an unset MAIL_LEGAL_* cannot break sending.
  legal: {
    user:    process.env.MAIL_LEGAL_USER   || DEFAULT_ACCOUNT.user,
    pass:    process.env.MAIL_LEGAL_PASS   || DEFAULT_ACCOUNT.pass,
    from:    process.env.MAIL_LEGAL_FROM
             || (process.env.MAIL_LEGAL_USER
                  ? `Jyotish Stack Legal <${process.env.MAIL_LEGAL_USER}>`
                  : DEFAULT_ACCOUNT.from),
    address: process.env.MAIL_LEGAL_USER   || DEFAULT_ACCOUNT.user,
    label:   'Legal',
  },
};

const INBOX_FOR = { sales: 'sales', team: 'team', account: 'account', legal: 'legal', general: 'team' };

const TEMPLATE_DEPARTMENT = {
  welcome:              'account',
  verify_email:         'account',
  reset_password:       'account',
  subscription_confirm: 'account',
  payment_success:      'account',
  remedy_report:        'account',
  remedy_resubmit:      'account',
  account_setup:        'account',
  newsletter:           'team',
  free_kundli:          'sales',
  custom:               'team',
  daily_digest:         'team',
  contact_ack:          'team',
  contact_notify:       'team',
};

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

const departmentInbox = (department) => INBOX_FOR[department] || 'team';

// ─── Email Signatures ─────────────────────────────────────────────────────────
// 5-minute in-memory cache per department
const _sigCache = {};
const SIG_CACHE_TTL = 5 * 60 * 1000;

async function getSignatureHtml(deptKey) {
  const hit = _sigCache[deptKey];
  if (hit && Date.now() - hit.ts < SIG_CACHE_TTL) return hit.html;

  try {
    const row = await db('email_signatures').where({ department: deptKey, is_active: true }).first();
    if (!row || !row.signature_html) {
      _sigCache[deptKey] = { ts: Date.now(), html: '' };
      return '';
    }

    const appUrl = process.env.APP_URL || 'https://jyotishstack.com';
    const logoHtml = row.include_logo
      ? `<img src="${appUrl}/logo-icon.svg" alt="Jyotish Stack AI" style="height:36px;margin-bottom:10px;display:block;" />`
      : '';

    const html = `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(212,175,55,0.25);">
        ${logoHtml}
        <div style="font-size:13px;color:#c8c0b0;line-height:1.6;">${row.signature_html}</div>
      </div>`;

    _sigCache[deptKey] = { ts: Date.now(), html };
    return html;
  } catch (_) {
    return '';
  }
}

/** Call after saving a signature to flush the cache for that dept */
function invalidateSignatureCache(deptKey) {
  delete _sigCache[deptKey];
}

// ─── Brand Shell ──────────────────────────────────────────────────────────────
const BRAND_SHELL = (inner, signatureHtml = '') => `
  <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
    <h1 style="color:#D4AF37;text-align:center;letter-spacing:2px;margin-top:0;">🪐 Jyotish Stack AI</h1>
    ${inner}
    ${signatureHtml}
    <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
    <p style="text-align:center;font-size:12px;color:#888;">© ${new Date().getFullYear()} Jyotish Stack AI • jyotishstack.com</p>
  </div>`;

// ─── Templates ────────────────────────────────────────────────────────────────
const templates = {
  welcome: (data, sig) => ({
    subject: `Welcome to Jyotish Stack AI, ${data.name}!`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Welcome to <strong style="color:#D4AF37;">Jyotish Stack AI</strong> — where ancient Vedic wisdom meets modern intelligence.</p>
        <p>Your journey to discover cosmic insights begins now. Explore your Kundli, match horoscopes, and receive personalised Bhavishya Vani.</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you did not register, please ignore this email.</p>`, sig),
  }),

  verify_email: (data, sig) => ({
    subject: 'Verify your Jyotish Stack AI email',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Email Verification</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${data.verifyUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">This link expires in 24 hours.</p>`, sig),
  }),

  reset_password: (data, sig) => ({
    subject: 'Reset your Jyotish Stack AI password',
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Password Reset</h2>
        <p>We received a request to reset your password. Click below to proceed:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:12px 28px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
        <p style="font-size:12px;color:#888;">This link expires in 1 hour. If you did not request this, ignore the email.</p>`, sig),
  }),

  subscription_confirm: (data, sig) => ({
    subject: `Subscription Confirmed — ${data.planName}`,
    html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;">Subscription Active</h2>
        <p>Namaste ${data.name},</p>
        <p>Your <strong style="color:#D4AF37;">${data.planName}</strong> subscription is now active.</p>
        <ul>
          <li>Amount Paid: ₹${data.amount}</li>
          <li>Valid Until: ${data.expiresAt}</li>
        </ul>
        <p>Thank you for choosing Jyotish Stack AI. For billing questions, reply to this email (account@jyotishstack.com).</p>`, sig),
  }),

  payment_success: (data, sig) => {
    const taxRows = data.isTax
      ? (data.interstate
          ? `<tr><td style="padding:4px 0;color:#bdb6a6;">IGST @ ${data.gstRate}%</td><td style="padding:4px 0;text-align:right;">₹${data.igst}</td></tr>`
          : `<tr><td style="padding:4px 0;color:#bdb6a6;">CGST @ ${data.gstRate / 2}%</td><td style="padding:4px 0;text-align:right;">₹${data.cgst}</td></tr>
             <tr><td style="padding:4px 0;color:#bdb6a6;">SGST @ ${data.gstRate / 2}%</td><td style="padding:4px 0;text-align:right;">₹${data.sgst}</td></tr>`)
      : '';
    return {
      subject: `Payment Received — Invoice ${data.invoiceNumber}`,
      html: BRAND_SHELL(`
        <h2 style="color:#D4AF37;margin-bottom:4px;">Payment Successful ✓</h2>
        <p style="font-size:15px;">Namaste ${data.name},</p>
        <p>Thank you! We've received your payment and your <strong style="color:#D4AF37;">${data.planName}</strong> plan is now active${data.expiresAt ? ` until <strong>${data.expiresAt}</strong>` : ''}.</p>
        <div style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.25);border-radius:8px;padding:16px 18px;margin:20px 0;">
          <p style="margin:0 0 10px;color:#D4AF37;font-size:13px;letter-spacing:0.04em;"><strong>${data.isTax ? 'TAX INVOICE' : 'BILL OF SUPPLY'} · ${data.invoiceNumber}</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#F5F0E8;">
            <tr><td style="padding:4px 0;color:#bdb6a6;">Plan</td><td style="padding:4px 0;text-align:right;">${data.planName}</td></tr>
            <tr><td style="padding:4px 0;color:#bdb6a6;">Taxable Value</td><td style="padding:4px 0;text-align:right;">₹${data.taxableValue}</td></tr>
            ${taxRows}
            <tr><td style="padding:8px 0 0;border-top:1px solid rgba(212,175,55,0.25);color:#D4AF37;font-weight:bold;">Total Paid</td><td style="padding:8px 0 0;border-top:1px solid rgba(212,175,55,0.25);text-align:right;color:#D4AF37;font-weight:bold;">₹${data.total}</td></tr>
          </table>
        </div>
        <p style="font-size:13px;color:#bdb6a6;">📎 Your invoice PDF is attached to this email.</p>
        ${data.dashboardUrl ? `<a href="${data.dashboardUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:11px 26px;text-decoration:none;font-weight:bold;margin:14px 0;border-radius:4px;">Go to Dashboard</a>` : ''}
        <p style="font-size:12px;color:#888;">For any billing questions, reply to this email (account@jyotishstack.com).</p>`, sig),
    };
  },

  newsletter: (data, sig) => ({
    subject: data.subject,
    html: `
      <div style="font-family:Georgia,serif;background:#0B0D1A;color:#F5F0E8;padding:40px;max-width:600px;margin:auto;border:1px solid #D4AF37;">
        <h1 style="color:#D4AF37;text-align:center;">🪐 Jyotish Stack AI</h1>
        ${data.body}
        ${sig}
        <hr style="border-color:#D4AF37;opacity:0.3;margin-top:30px;"/>
        <p style="text-align:center;font-size:11px;color:#666;">
          <a href="${data.unsubscribeUrl}" style="color:#888;">Unsubscribe</a>
        </p>
      </div>`,
  }),

  custom: (data, sig) => ({
    subject: data.subject,
    html: BRAND_SHELL(data.body, sig),
  }),

  daily_digest: (data) => ({
    subject: data.subject,
    html: data.html,
  }),

  contact_ack: (data, sig) => ({
    subject: `We received your message — Jyotish Stack AI`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Thank you for reaching out to our <strong style="color:#D4AF37;">${data.departmentLabel}</strong> team.
           We've received your message and will reply to this email address shortly.</p>
        <blockquote style="border-left:3px solid #D4AF37;margin:18px 0;padding:6px 16px;color:#cfc8bb;">
          ${(data.message || '').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}
        </blockquote>
        <p style="font-size:12px;color:#888;">This is an automated acknowledgement — no need to reply.</p>`, sig),
  }),

  contact_notify: (data, sig) => ({
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
        <p style="font-size:12px;color:#888;">Reply directly to this email to respond to ${data.name}.</p>`, sig),
  }),

  remedy_report: (data, sig) => ({
    subject: data.lang === 'hi'
      ? `${data.name} जी — आपकी वैदिक उपाय रिपोर्ट संलग्न है`
      : `Your Vedic Remedy Report is Attached — ${data.name}`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Your personalised <strong style="color:#D4AF37;">Vedic Remedy Report</strong> has been generated from your birth chart and is attached to this email as a PDF.</p>
        <div style="background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 8px;color:#D4AF37;font-weight:bold;">What's inside your report:</p>
          <ul style="margin:0;padding-left:20px;color:#c8c0b0;line-height:1.8;">
            <li>Your Lagna Lord &amp; current Mahadasha analysis</li>
            <li>Top 3 priority planets needing attention</li>
            <li>Daily mantras, gemstone &amp; ritual guidance</li>
            <li>Personalised sadhana duration (21 / 43 / 90 days)</li>
            <li>Daily Puja sequence for consistent practice</li>
          </ul>
        </div>
        <p>Your <strong style="color:#D4AF37;">Basic plan</strong> is now active. Check for a separate email with your account activation link — set your password to log in and explore your full Kundli &amp; predictions.</p>
        <p style="font-size:12px;color:#888;">The remedies in this report are for spiritual guidance only and are not a substitute for professional advice.</p>`, sig),
  }),

  remedy_resubmit: (data, sig) => ({
    subject: `Action needed — Re-submit your birth details for your Remedy PDF`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>We noticed that your birth details are not on file with us. To regenerate your personalised <strong style="color:#D4AF37;">Vedic Remedy Report</strong>, please re-submit your birth information using the link below.</p>
        <div style="background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:18px 22px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 14px;color:#D4AF37;font-weight:bold;">It only takes 30 seconds</p>
          <a href="${data.resubmitUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:13px 32px;text-decoration:none;font-weight:bold;border-radius:4px;font-size:15px;">Submit My Birth Details →</a>
          <p style="margin:14px 0 0;font-size:12px;color:#888;">This link expires in 72 hours.</p>
        </div>
        <p style="color:#c8c0b0;">Once submitted, your remedy PDF will be generated and emailed to you instantly.</p>
        <p style="font-size:12px;color:#888;">If you did not request this, you can safely ignore this email.</p>`, sig),
  }),

  free_kundli: (data, sig) => ({
    subject: data.lang === 'hi'
      ? `${data.name} जी — आपकी निःशुल्क कुंडली सारांश 🔯`
      : `${data.name}, your free Kundli summary 🔯`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Here is your <strong style="color:#D4AF37;">free Vedic birth chart summary</strong>, calculated from your birth details using accurate Lahiri ayanamsa.</p>
        <table style="font-size:14px;color:#F5F0E8;border-collapse:collapse;margin:18px 0;">
          <tr><td style="padding:5px 16px 5px 0;color:#888;">Lagna (Ascendant)</td><td><strong style="color:#D4AF37;">${data.lagna || '—'}</strong></td></tr>
          <tr><td style="padding:5px 16px 5px 0;color:#888;">Moon Sign (Rashi)</td><td><strong style="color:#D4AF37;">${data.moonSign || '—'}</strong></td></tr>
          <tr><td style="padding:5px 16px 5px 0;color:#888;">Sun Sign</td><td>${data.sunSign || '—'}</td></tr>
          <tr><td style="padding:5px 16px 5px 0;color:#888;">Nakshatra</td><td>${data.nakshatra || '—'}</td></tr>
          <tr><td style="padding:5px 16px 5px 0;color:#888;">Current Mahadasha</td><td>${data.dasha || '—'}</td></tr>
        </table>
        ${data.doshaCount > 0 ? `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:14px 18px;margin:18px 0;">
          <p style="margin:0;color:#EF4444;font-weight:bold;">⚠️ ${data.doshaCount} dosha${data.doshaCount > 1 ? 's' : ''} detected in your chart</p>
          <p style="margin:6px 0 0;color:#c8c0b0;font-size:13px;">Which doshas they are, how severe, whether cancellations exist, and the exact remedies — all wait in your full report.</p>
        </div>` : `
        <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:14px 18px;margin:18px 0;">
          <p style="margin:0;color:#22C55E;font-weight:bold;">✅ No major doshas detected — a fortunate chart!</p>
        </div>`}
        <div style="text-align:center;margin:24px 0;">
          <a href="${data.registerUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:13px 34px;text-decoration:none;font-weight:bold;border-radius:4px;font-size:15px;">Unlock My Full Kundli — Free →</a>
          <p style="margin:12px 0 0;font-size:12px;color:#888;">Full chart analysis, dosha details, dasha timeline, yogas &amp; personalised remedies.</p>
        </div>
        <p style="font-size:11px;color:#777;">You're receiving this because you generated a free Kundli on jyotishstack.com.
          ${data.unsubscribeUrl ? `<a href="${data.unsubscribeUrl}" style="color:#888;">Unsubscribe</a>.` : ''}</p>`, sig),
  }),

  account_setup: (data, sig) => ({
    subject: `Welcome to Jyotish Stack AI — Activate your account, ${data.name}`,
    html: BRAND_SHELL(`
        <p style="font-size:16px;">Namaste ${data.name},</p>
        <p>Your <strong style="color:#D4AF37;">Vedic Remedy Report</strong> is on its way (check your inbox for the PDF email). Your <strong style="color:#D4AF37;">Basic plan</strong> is already active — now let's set up your password to access your full account.</p>
        <div style="background:rgba(212,175,55,0.07);border:1px solid rgba(212,175,55,0.3);border-radius:8px;padding:18px 22px;margin:20px 0;">
          <p style="margin:0 0 14px;color:#D4AF37;font-weight:bold;">Complete your account in 2 steps:</p>
          <p style="margin:0 0 6px;"><strong style="color:#EFE9D8;">Step 1 — Set your password</strong></p>
          <a href="${data.setupUrl}" style="display:inline-block;background:#D4AF37;color:#0B0D1A;padding:13px 32px;text-decoration:none;font-weight:bold;margin:10px 0 18px;border-radius:4px;font-size:15px;">Set My Password →</a>
          <p style="margin:0 0 6px;"><strong style="color:#EFE9D8;">Step 2 — Verify your email address</strong></p>
          <a href="${data.verifyUrl}" style="display:inline-block;color:#D4AF37;font-size:13px;text-decoration:underline;">Click here to verify your email</a>
        </div>
        <p style="color:#c8c0b0;">Once your account is set up you can access your full Kundli, daily Panchang, predictions, and more — all included in your Basic plan.</p>
        <p style="font-size:12px;color:#888;">The password setup link is valid for 72 hours. If you did not request a remedy report, you can safely ignore this email.</p>`, sig),
  }),
};

/**
 * CUSTOMER-FACING labels — these go into the contact acknowledgement email the
 * sender receives (public.routes.js), so they are written for the person writing
 * in, not for the admin. `team` stays "Support" for that reason: the mailbox is
 * team@, but a customer is contacting support, and the admin panel labels it
 * "Team" separately.
 *
 * `legal` was missing here, so a grievance fell through to the `|| 'Support'`
 * fallback and the acknowledgement told the sender their statutory grievance had
 * gone to Support.
 */
const DEPT_LABELS = { sales: 'Sales', team: 'Support', account: 'Accounts', legal: 'Legal & Grievance', general: 'Support' };

/**
 * Send an email.
 * Appends the department's active signature automatically.
 * Stores html_body + department + from_address in email_logs for retry support.
 */
const sendEmail = async ({ to, template, data = {}, from, replyTo, attachments, throwOnFailure = false }) => {
  const tmpl = templates[template];
  if (!tmpl) throw new Error(`Unknown email template: ${template}`);

  const deptKey = from && DEPARTMENTS[from] ? from : (TEMPLATE_DEPARTMENT[template] || 'account');
  const { transport, cfg } = getTransport(deptKey);

  // Fetch signature (non-fatal)
  const sig = await getSignatureHtml(deptKey);
  const { subject, html } = tmpl(data, sig);

  // Log to DB (department + from_address + html_body stored for retry)
  const [logId] = await db('email_logs').insert({
    to_email:     to,
    subject,
    template,
    status:       'queued',
    department:   deptKey,
    from_address: cfg.from,
    html_body:    html,
  });

  try {
    await transport.sendMail({
      from: cfg.from, to, subject, html,
      replyTo: replyTo || undefined,
      attachments: Array.isArray(attachments) && attachments.length ? attachments : undefined,
    });
    await db('email_logs').where({ id: logId }).update({ status: 'sent' });
  } catch (err) {
    await db('email_logs').where({ id: logId }).update({ status: 'failed', error_message: err.message });
    console.error('[Email]', err.message);
    if (throwOnFailure) throw err;
  }
};

// Quick SMTP connectivity + auth test — used by admin test-smtp endpoint
const testSmtpConnection = async (deptKey = 'account') => {
  const dept = DEPARTMENTS[deptKey] ? deptKey : 'account';
  const { user, pass } = DEPARTMENTS[dept];
  const transport = nodemailer.createTransport({
    host: SHARED.host, port: SHARED.port, secure: SHARED.secure,
    requireTLS: SHARED.requireTLS, tls: SHARED.tls,
    auth: user ? { user, pass } : undefined,
  });
  await transport.verify(); // throws on connection/auth failure
  return { dept, from: DEPARTMENTS[dept].from, host: SHARED.host, port: SHARED.port };
};

/**
 * Re-send a failed email log entry using the stored html_body.
 * Creates a new log entry; marks the old one as 'retried'.
 */
const retryEmail = async (logId) => {
  const log = await db('email_logs').where({ id: logId }).first();
  if (!log) throw new Error('Log entry not found');
  if (log.status === 'sent') throw new Error('Email already sent successfully');

  const deptKey = log.department || 'account';
  const { transport, cfg } = getTransport(deptKey);
  const fromAddr = log.from_address || cfg.from;
  const html = log.html_body || '';

  // Old logs (sent before the html_body column existed) have no stored body to
  // resend — fail loudly instead of silently delivering a blank email.
  if (!html.trim()) {
    throw new Error('No stored email body for this entry — only emails sent after the latest update can be retried.');
  }

  const [newLogId] = await db('email_logs').insert({
    to_email:     log.to_email,
    subject:      log.subject,
    template:     log.template,
    status:       'queued',
    department:   deptKey,
    from_address: fromAddr,
    html_body:    html,
  });

  await db('email_logs').where({ id: logId }).update({ status: 'retried' });

  try {
    await transport.sendMail({ from: fromAddr, to: log.to_email, subject: log.subject, html });
    await db('email_logs').where({ id: newLogId }).update({ status: 'sent' });
    return { success: true, new_log_id: newLogId };
  } catch (err) {
    await db('email_logs').where({ id: newLogId }).update({ status: 'failed', error_message: err.message });
    throw new Error('Retry failed: ' + err.message);
  }
};

module.exports = {
  sendEmail,
  retryEmail,
  testSmtpConnection,
  departmentInbox,
  invalidateSignatureCache,
  DEPARTMENTS,
  DEPT_LABELS,
  buildSharedConfig,
  boolEnv,
};
