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
const { PLANET_NAME_HI } = require('./helpers/prediction-data');

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

  // These read the fields the prediction ACTUALLY emits. They used to look for
  // `meta.moon_rashi_en`, `meta.current_md_lord` and `meta.dasha_guidance.lord` —
  // none of which exist — so both chips silently resolved to '' and were filtered
  // out of the header. Every email went out with only the Tara chip showing.
  const moonRashi = (isHi ? meta.moon_rashi?.hi : meta.moon_rashi?.en) || '';
  // Planet names must be translated in the Hindi email — the chip used to read
  // "दशा: Rahu / Sun" with the lords left in English.
  const pl = (name) => (isHi ? (PLANET_NAME_HI[name] || name) : name);
  const mahaLord  = meta.dasha?.maha || meta.dasha_guidance?.maha || '';
  const antarLord = meta.dasha?.antar || meta.dasha_guidance?.antar || '';
  const dashaLord = mahaLord
    ? (antarLord ? `${pl(mahaLord)} / ${pl(antarLord)}` : pl(mahaLord))
    : '';
  const taraName  = (isHi ? meta.tara?.name_hi : meta.tara?.name) || '';
  // An inauspicious tara must not be presented as a neutral badge next to five
  // stars — the score already accounts for it, and the chip says so too.
  const taraFav   = meta.tara?.is_favorable;

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

  const taraSuffix = taraFav === false
    ? (isHi ? ' (सतर्कता)' : ' (take care)')
    : taraFav === true ? (isHi ? ' (शुभ)' : ' (favourable)') : '';

  /**
   * Today's planetary positions, read against THIS chart.
   *
   * Comes from meta.planet_positions, which the prediction builds with the same
   * transit engine the Kundli's Gochar tab uses — so the email and the app cannot
   * tell the reader different things. Each row: where the planet is, which of the
   * reader's houses that falls in, and whether the classical from-Moon reading
   * makes it supportive or demanding.
   *
   * Built with tables and inline styles because Gmail/Outlook strip flexbox.
   */
  const pp = meta.planet_positions;
  const FAV_COLOR = { favorable: GREEN, neutral: '#60A5FA', challenging: AMBER };
  const FAV_WORD = isHi
    ? { favorable: 'अनुकूल', neutral: 'मिश्रित', challenging: 'सतर्कता' }
    : { favorable: 'supportive', neutral: 'mixed', challenging: 'demanding' };

  const planetRows = pp?.list?.length
    ? pp.list.map((p, i) => {
      const name = isHi ? p.planet_hi : p.planet;
      const sign = isHi ? p.rashi_hi : p.rashi_en;
      const area = isHi ? p.area_hi : p.area_en;
      const col = FAV_COLOR[p.favour] || '#60A5FA';
      const bg = i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent';
      return `<tr style="background:${bg};">
        <td style="padding:7px 8px;font-size:12.5px;color:${IVORY};white-space:nowrap;">
          ${name}${p.is_retrograde ? ' <span style="color:#F97316;font-size:10px;">℞</span>' : ''}
        </td>
        <td style="padding:7px 8px;font-size:12px;color:rgba(245,240,232,0.6);white-space:nowrap;">${sign}</td>
        <td style="padding:7px 8px;font-size:12px;color:rgba(245,240,232,0.75);">
          ${(isHi ? p.house_label_hi : p.house_label_en) || (isHi ? `भाव ${p.house_from_lagna}` : `House ${p.house_from_lagna}`)}
          <span style="color:rgba(245,240,232,0.4);">· ${area}</span>
        </td>
        <td style="padding:7px 8px;font-size:11px;color:${col};white-space:nowrap;text-align:right;">${FAV_WORD[p.favour] || ''}</td>
      </tr>`;
    }).join('')
    : '';

  const planetSection = planetRows ? `
      <p style="font-size:11px;font-weight:700;color:rgba(212,175,55,0.55);text-transform:uppercase;letter-spacing:0.12em;margin:22px 0 6px;">
        ${isHi ? 'आज ग्रह कहाँ हैं' : 'Where the planets are today'}
      </p>
      <p style="font-size:12px;color:rgba(245,240,232,0.5);line-height:1.7;margin:0 0 10px;">
        ${isHi
    ? 'हर ग्रह अभी आकाश में कहाँ है, वह आपकी कुंडली के किस भाव को छू रहा है, और चंद्र से उसकी पारंपरिक स्थिति कैसी है।'
    : 'Where each planet is right now, which of your houses it falls in, and how the classical reading from your Moon rates it.'}
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid rgba(212,175,55,0.15);border-radius:8px;overflow:hidden;">
        ${planetRows}
      </table>
      <p style="font-size:11.5px;color:rgba(245,240,232,0.45);line-height:1.75;margin:9px 0 0;">
        ${isHi
    ? 'ध्यान दें: शनि, गुरु, राहु और केतु धीरे चलते हैं — ये आपके वर्तमान <em>दौर</em> की बात कहते हैं, आज की नहीं। चंद्र, सूर्य, बुध, शुक्र और मंगल तेज़ चलते हैं और दिन का रंग तय करते हैं। इसीलिए ऊपर का दैनिक स्कोर अच्छा हो सकता है जबकि कोई धीमा ग्रह अभी दबाव में हो।'
    : 'Note: Saturn, Jupiter, Rahu and Ketu move slowly — they describe the <em>season</em> you are in, not today. The Moon, Sun, Mercury, Venus and Mars move quickly and colour the day itself. That is why the daily score above can be good while a slow planet is still demanding.'}
      </p>
      ${(pp.special || []).map((s) => `
        <div style="margin-top:10px;background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:11px 14px;">
          <p style="font-size:12.5px;font-weight:700;color:${AMBER};margin:0 0 4px;">⚠ ${isHi ? s.title?.hi : s.title?.en}</p>
          <p style="font-size:12.5px;color:rgba(245,240,232,0.8);line-height:1.7;margin:0;">${isHi ? s.detail?.hi : s.detail?.en}</p>
        </div>`).join('')}` : '';

  const chips = [
    moonRashi  ? (isHi ? `🌙 चंद्र: ${moonRashi}` : `🌙 Moon: ${moonRashi}`) : null,
    dashaLord  ? (isHi ? `⏳ दशा: ${dashaLord}` : `⏳ Dasha: ${dashaLord}`) : null,
    taraName   ? (isHi ? `🌟 तारा: ${taraName}${taraSuffix}` : `🌟 Tara: ${taraName}${taraSuffix}`) : null,
  ].filter(Boolean).map((c) =>
    `<span style="display:inline-block;font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);color:${GOLD};margin:2px 4px 2px 0;">${c}</span>`
  ).join('');

  // First name only — "Namaste Devavrat Singh" reads like a form letter; a daily
  // note from your astrologer should not. Falls back to the full string if there
  // is only one word, and to a neutral greeting if the name is missing.
  const firstName = String(user.name || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName
    ? (isHi ? `नमस्ते ${firstName}` : `Namaste ${firstName}`)
    : (isHi ? 'नमस्ते' : 'Namaste');
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

      <!-- Where the planets are today (this chart) -->
      ${planetSection}

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
