'use strict';
/**
 * Daily "Today for You" email service.
 * Sends each registered user their personalised daily prediction email
 * based on their first kundli.  Called by the cron job (jobs/daily-digest.js)
 * and the admin trigger endpoint (POST /admin/jobs/daily-digest).
 */
const db = require('../config/db');
const { sendEmail } = require('./email.service');
const { ensureCalculatedChart } = require('./kundli-admin.service');
const { getOrCreateTodayPrediction } = require('./kundli-admin.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
const APP_URL   = process.env.APP_URL || 'https://jyotishstack.com';
const GOLD      = '#D4AF37';
const NAVY      = '#0B0D1A';
const CARD_BG   = '#111428';
const IVORY     = '#F5F0E8';
const GREEN     = '#22C55E';
const AMBER     = '#F59E0B';
const DIM       = '#8B85A0';

function starRating(score) {
  const n = Math.min(5, Math.max(0, Math.round(score || 3)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function pickText(v, lang) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.hi || v.en || '';
}

// ── Email HTML builder ────────────────────────────────────────────────────────
function buildDailyDigestHtml(user, kundliName, prediction, lang) {
  const hi     = lang === 'hi';
  const meta   = prediction.meta  || {};
  const isHi   = hi;

  const dateStr = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const stars   = starRating(meta.score);
  const score   = meta.score || 3;
  const scoreColor = score >= 4 ? GREEN : score >= 3 ? GOLD : AMBER;

  const mainText = isHi
    ? (prediction.content_hi || prediction.content_en || '')
    : (prediction.content_en || prediction.content_hi || '');

  const advice = pickText(meta.advice, lang);
  const caution = pickText(meta.caution, lang);

  const lucky = meta.lucky
    ? [
        isHi ? (meta.lucky.color_hi || meta.lucky.color) : meta.lucky.color,
        meta.lucky.number ? (isHi ? `अंक ${meta.lucky.number}` : `No. ${meta.lucky.number}`) : null,
        meta.lucky.gem,
      ].filter(Boolean).join(' · ')
    : null;

  const moonRashi = meta.moon_rashi_en || (meta.transit?.list?.[0]?.sign_en) || '';
  const dashaLord  = meta.current_md_lord || (meta.dasha_guidance?.lord) || '';
  const taraName   = meta.tara?.name || '';

  // Life areas grid (2×2)
  const AREA_LABEL = isHi
    ? { career: '💼 करियर', love: '💑 संबंध', health: '🌿 स्वास्थ्य', finance: '💰 धन' }
    : { career: '💼 Career', love: '💑 Relationships', health: '🌿 Health', finance: '💰 Finance' };

  const areaCards = ['career', 'love', 'health', 'finance'].map((key) => {
    const area = meta.areas?.[key] || meta[key];
    const text = area
      ? (typeof area === 'string' ? area : (isHi ? (area.hi || area.en) : (area.en || area.hi)) || '')
      : '';
    return `<td style="width:50%;vertical-align:top;padding:6px;">
      <div style="background:${CARD_BG};border:1px solid rgba(212,175,55,0.15);border-radius:8px;padding:12px 13px;">
        <p style="color:${GOLD};font-size:11px;font-weight:700;margin:0 0 5px;letter-spacing:0.05em;">${AREA_LABEL[key]}</p>
        <p style="color:rgba(245,240,232,0.72);font-size:12px;line-height:1.65;margin:0;">${text || (isHi ? 'सामान्य दिन।' : 'A balanced day.')}</p>
      </div>
    </td>`;
  });

  const areasGrid = `<table style="width:100%;border-collapse:collapse;">
    <tr>${areaCards[0]}${areaCards[1]}</tr>
    <tr>${areaCards[2]}${areaCards[3]}</tr>
  </table>`;

  const chips = [
    moonRashi  ? (isHi ? `🌙 चंद्र: ${moonRashi}` : `🌙 Moon: ${moonRashi}`) : null,
    dashaLord  ? (isHi ? `⏳ दशा: ${dashaLord}` : `⏳ Dasha: ${dashaLord}`) : null,
    taraName   ? (isHi ? `🌟 तारा: ${taraName}` : `🌟 Tara: ${taraName}`) : null,
  ].filter(Boolean).map((c) =>
    `<span style="display:inline-block;font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);color:${GOLD};margin:2px 4px 2px 0;">${c}</span>`
  ).join('');

  const greeting = isHi ? `नमस्ते ${user.name}` : `Namaste ${user.name}`;
  const heading  = isHi ? '🪐 आज आपके लिए' : '🪐 Today for You';
  const subhead  = isHi ? `${kundliName || 'आपकी कुंडली'} के लिए` : `Guidance for ${kundliName || 'your kundli'}`;
  const ctaLabel = isHi ? 'पूरी रिपोर्ट देखें →' : 'View Full Prediction →';
  const disclaimer = isHi
    ? 'यह ज्योतिषीय गणना पर आधारित मार्गदर्शन है। उपाय पर ध्यान दें — भय नहीं।'
    : 'This is astrological guidance — focus on the remedies, not on fear.';

  return `<div style="font-family:Georgia,serif;background:${NAVY};color:${IVORY};max-width:600px;margin:auto;border:1px solid ${GOLD}33;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0E1226,#141930);padding:28px 32px;text-align:center;border-bottom:2px solid ${GOLD}44;">
      <p style="color:${DIM};font-size:12px;margin:0 0 6px;letter-spacing:0.12em;text-transform:uppercase;">${dateStr}</p>
      <h1 style="color:${GOLD};font-size:24px;margin:0 0 4px;letter-spacing:1px;">${heading}</h1>
      <p style="color:rgba(245,240,232,0.45);font-size:13px;margin:0;">${subhead}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:${IVORY};margin:0 0 4px;">${greeting},</p>

      <!-- Stars + chips -->
      <div style="margin:14px 0 18px;">
        <span style="font-size:20px;color:${scoreColor};letter-spacing:2px;">${stars}</span>
        <div style="margin-top:8px;">${chips}</div>
      </div>

      <!-- Main prediction text -->
      ${mainText ? `<p style="font-size:14px;color:rgba(245,240,232,0.85);line-height:1.85;margin:0 0 20px;">${mainText.replace(/\n\n/g,'</p><p style="font-size:14px;color:rgba(245,240,232,0.85);line-height:1.85;margin:0 0 12px;">').replace(/\n/g,' ')}</p>` : ''}

      <!-- Life areas grid -->
      <p style="font-size:11px;font-weight:700;color:rgba(212,175,55,0.55);text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">
        ${isHi ? 'जीवन क्षेत्र आज' : 'Life Areas Today'}
      </p>
      ${areasGrid}

      <!-- Advice box -->
      ${advice ? `<div style="margin-top:16px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;padding:12px 16px;">
        <p style="font-size:11px;font-weight:700;color:${GREEN};margin:0 0 5px;text-transform:uppercase;letter-spacing:0.1em;">✓ ${isHi ? 'सलाह' : 'Guidance'}</p>
        <p style="font-size:13px;color:rgba(245,240,232,0.82);line-height:1.7;margin:0;">${advice}</p>
      </div>` : ''}

      <!-- Caution box -->
      ${caution ? `<div style="margin-top:10px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:12px 16px;">
        <p style="font-size:11px;font-weight:700;color:${AMBER};margin:0 0 5px;text-transform:uppercase;letter-spacing:0.1em;">⚠ ${isHi ? 'सावधानी' : 'Caution'}</p>
        <p style="font-size:13px;color:rgba(245,240,232,0.82);line-height:1.7;margin:0;">${caution}</p>
      </div>` : ''}

      <!-- Lucky items -->
      ${lucky ? `<div style="margin-top:10px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.18);border-radius:8px;padding:10px 16px;">
        <p style="font-size:12.5px;color:${GOLD};margin:0;">🍀 ${isHi ? 'शुभ' : 'Lucky'}: <span style="font-weight:600;">${lucky}</span></p>
      </div>` : ''}

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${APP_URL}/kundli" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,${GOLD},#E8C96A);color:${NAVY};font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;letter-spacing:0.04em;">
          ${ctaLabel}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px 24px;border-top:1px solid rgba(212,175,55,0.15);text-align:center;">
      <p style="font-size:11px;color:${DIM};line-height:1.7;margin:0 0 6px;">${disclaimer}</p>
      <p style="font-size:10px;color:rgba(139,133,160,0.5);margin:0;">
        © ${new Date().getFullYear()} Jyotish Stack AI · <a href="${APP_URL}" style="color:rgba(212,175,55,0.4);text-decoration:none;">jyotishstack.com</a><br/>
        ${isHi ? 'अनसब्सक्राइब करने के लिए' : 'To unsubscribe, visit'} <a href="${APP_URL}/account" style="color:rgba(212,175,55,0.4);text-decoration:none;">${isHi ? 'यहाँ जाएं' : 'your account settings'}</a>.
      </p>
    </div>
  </div>`;
}

// ── Main orchestrator ─────────────────────────────────────────────────────────
/**
 * sendDailyDigestToAll()
 * Fetches all verified+active users who have at least one kundli,
 * generates their Today prediction, and sends the daily email.
 * Returns a summary { sent, skipped, errors }.
 */
async function sendDailyDigestToAll() {
  const summary = { sent: 0, skipped: 0, errors: 0 };

  // Get all eligible users (verified + active)
  const users = await db('users')
    .where({ is_active: true, email_verified: true })
    .whereNot('plan', 'free')
    .select('id', 'uuid', 'name', 'email', 'preferred_language', 'plan');

  for (const user of users) {
    try {
      // Find their first (primary) kundli
      const kundli = await db('kundli_profiles')
        .where({ user_id: user.id })
        .orderBy('created_at', 'asc')
        .first();

      if (!kundli) { summary.skipped++; continue; }

      const chart = await ensureCalculatedChart(kundli);
      if (!chart) { summary.skipped++; continue; }

      const lang = user.preferred_language || 'hi';
      const prediction = await getOrCreateTodayPrediction(kundli, chart);
      if (!prediction) { summary.skipped++; continue; }

      const html = buildDailyDigestHtml(user, kundli.person_name, prediction, lang);
      const isHi = lang === 'hi';
      const subject = isHi
        ? `🪐 आज आपके लिए — ${new Date().toLocaleDateString('hi-IN', { day:'2-digit', month:'long' })}`
        : `🪐 Today for You — ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long' })}`;

      await sendEmail({ template: 'daily_digest', to: user.email, data: { subject, html } });

      summary.sent++;
    } catch (err) {
      console.error(`[DailyDigest] Error for user ${user.email}:`, err.message);
      summary.errors++;
    }
  }

  console.log('[DailyDigest] Done:', summary);
  return summary;
}

/**
 * sendDailyDigestToUser(userId)
 * Send to a single user — used for admin test/preview.
 */
async function sendDailyDigestToUser(userId) {
  const user = await db('users')
    .where({ id: userId, is_active: true })
    .select('id', 'uuid', 'name', 'email', 'preferred_language', 'plan')
    .first();
  if (!user) throw new Error('User not found or inactive');

  const kundli = await db('kundli_profiles')
    .where({ user_id: user.id })
    .orderBy('created_at', 'asc')
    .first();
  if (!kundli) throw new Error('No kundli found for this user');

  const chart = await ensureCalculatedChart(kundli);
  if (!chart) throw new Error('Could not calculate chart');

  const lang = user.preferred_language || 'hi';
  const prediction = await getOrCreateTodayPrediction(kundli, chart);
  if (!prediction) throw new Error('Could not generate prediction');

  const html = buildDailyDigestHtml(user, kundli.person_name, prediction, lang);
  const isHi = lang === 'hi';
  const subject = isHi
    ? `🪐 आज आपके लिए — ${new Date().toLocaleDateString('hi-IN', { day:'2-digit', month:'long' })}`
    : `🪐 Today for You — ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long' })}`;

  await sendEmail({ template: 'daily_digest', to: user.email, data: { subject, html } });
  return { sent: true, to: user.email };
}

module.exports = { sendDailyDigestToAll, sendDailyDigestToUser };
