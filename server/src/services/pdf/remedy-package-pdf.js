'use strict';
const { PdfDocUnicode, PAGE_W, PAGE_H } = require('./pdf-doc-unicode');

const NAVY  = '#0E1226';
const CARD  = '#1A2040';
const CARD2 = '#141930';
const LINE  = '#2B3158';
const GOLD  = '#D4AF37';
const GOLD2 = '#E8C96A';
const IVORY = '#EFE9D8';
const MUTED = '#9D97B0';
const DIM   = '#6E6884';
const GREEN = '#22C55E';
const RED   = '#EF4444';
const AMBER = '#F59E0B';
const BLUE  = '#60A5FA';

const M    = 46;
const W    = PAGE_W - M * 2;
const FOOT = PAGE_H - 48;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(s) {
  if (!s) return 'Not specified';
  const [yr, mo, dy] = s.split('-');
  return `${parseInt(dy, 10)} ${MONTHS[parseInt(mo, 10) - 1] || ''} ${yr}`;
}
function cap(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ''; }

// ── Report helper class ────────────────────────────────────────────────────────
class R {
  constructor() {
    this.d = new PdfDocUnicode();
    this.page = 0;
    this.section = '';
    this.y = 0;
  }

  newPage(section) {
    if (section) this.section = section;
    this.page += 1;
    this.d.addPage();
    this.d.rect(0, 0, PAGE_W, PAGE_H, NAVY);
    this.d.text(M, 26, 'JYOTISH STACK AI', { size: 9, bold: true, color: GOLD });
    this.d.text(M, 26, this.section, { size: 8.5, color: MUTED, align: 'right', width: W });
    this.d.line(M, 44, PAGE_W - M, 44, LINE, 0.8);
    this.d.line(M, 45.5, M + 60, 45.5, GOLD, 1.4);
    this.d.line(M, PAGE_H - 36, PAGE_W - M, PAGE_H - 36, LINE, 0.8);
    this.d.text(M, PAGE_H - 30, 'Vedic Remedy Report  |  For spiritual guidance only  |  jyotishstack.com', { size: 6.5, color: DIM });
    this.d.text(M, PAGE_H - 31, `Page ${this.page}`, { size: 8, bold: true, color: GOLD, align: 'right', width: W });
    this.y = 62;
  }

  ensure(h) { if (this.y + h > FOOT) this.newPage(); }
  gap(h = 8) { this.y += h; }

  heading(title, sub = '') {
    const subLines = sub ? this.d.wrap(sub, W - 18, 7.5) : [];
    const boxH = sub ? (16 + subLines.length * 11 + 8) : 26;
    this.ensure(boxH + 12);
    this.d.rect(M, this.y, W, boxH, CARD);
    this.d.rect(M, this.y, 4, boxH, GOLD);
    this.d.text(M + 14, this.y + 9, title, { size: 10.5, bold: true, color: GOLD2 });
    if (sub) {
      let sy = this.y + 22;
      subLines.forEach(line => { this.d.text(M + 14, sy, line, { size: 7.5, color: MUTED }); sy += 11; });
    }
    this.y += boxH + 10;
  }

  kv(label, value, color = IVORY) {
    this.ensure(20);
    this.d.text(M, this.y, label, { size: 8, color: DIM });
    this.d.text(M + 140, this.y, value || '—', { size: 8, color, bold: color !== IVORY });
    this.y += 14;
  }

  para(text, size = 8.5, color = MUTED) {
    if (!text) return;
    const lines = this.d.wrap(text, W, size);
    lines.forEach(line => {
      this.ensure(size + 5);
      this.d.text(M, this.y, line, { size, color });
      this.y += size + 4;
    });
  }

  bullet(text, size = 8.5, color = MUTED) {
    if (!text) return;
    const lines = this.d.wrap(text, W - 14, size);
    lines.forEach((line, i) => {
      this.ensure(size + 5);
      if (i === 0) this.d.text(M, this.y, '•', { size, color: GOLD });
      this.d.text(M + 14, this.y, line, { size, color });
      this.y += size + 4;
    });
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
async function buildRemedyPackagePdf({ name, date_of_birth, time_of_birth, place_of_birth, chart, remedies, lang = 'en' }) {
  const r  = new R();
  const hi = lang === 'hi';

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 1 — Cover + Birth Details + Chart Snapshot
  // ────────────────────────────────────────────────────────────────────────────
  r.newPage(hi ? 'वैदिक उपाय रिपोर्ट' : 'Vedic Remedy Report');

  // Cover band
  r.d.rect(M, r.y, W, 90, CARD);
  r.d.rect(M, r.y, W, 4, GOLD);
  r.d.text(M + 16, r.y + 18, hi ? 'वैदिक उपाय रिपोर्ट' : 'VEDIC REMEDY REPORT', { size: 9, bold: true, color: GOLD });
  r.d.text(M + 16, r.y + 34, name, { size: 20, bold: true, color: IVORY });
  r.d.text(M + 16, r.y + 58, hi ? 'व्यक्तिगत ग्रह उपाय एवं साधना मार्गदर्शन' : 'Personalised Planetary Remedies & Sadhana Guidance', { size: 9, color: MUTED });
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  r.d.text(M + 16, r.y + 72, `Generated: ${today}`, { size: 7.5, color: DIM });
  r.y += 102;

  // ── Birth Details ──────────────────────────────────────────────────────────
  r.heading(hi ? 'जन्म विवरण' : 'Birth Details');
  r.kv(hi ? 'नाम'           : 'Name',          name, GOLD2);
  r.kv(hi ? 'जन्म तिथि' : 'Date of Birth', fmtDate(date_of_birth));
  r.kv(hi ? 'जन्म समय'       : 'Time of Birth', time_of_birth ? time_of_birth.slice(0, 5) + ' IST' : 'Not provided');
  r.kv(hi ? 'जन्म स्थान' : 'Place of Birth', (place_of_birth || 'India').split(',').slice(0, 2).join(','));
  r.gap(8);

  // ── Chart Snapshot ─────────────────────────────────────────────────────────
  r.heading(hi ? 'कुंडली सारांश' : 'Chart Snapshot');

  const meta = remedies?.meta || {};
  const lagnaRashi = cap(meta.lagna_rashi_en || chart?.lagna_rashi || '—');
  const lagnaLord  = cap(meta.lagna_lord || '—');
  const atma       = cap(meta.atmakarak || '—');
  const md         = cap(meta.current_md_lord || '—');
  const ad         = cap(meta.current_ad_lord || '—');
  const sad        = remedies?.sadhanaDuration;

  r.kv(hi ? 'लग्न राशि'  : 'Lagna Rashi',        lagnaRashi);
  r.kv(hi ? 'लग्नेश'               : 'Lagna Lord',         lagnaLord);
  r.kv(hi ? 'आत्मकारक'   : 'Atmakaraka',         atma);
  r.kv(hi ? 'महादशा'               : 'Current Mahadasha',  md, AMBER);
  r.kv(hi ? 'अंतर्दशा'   : 'Current Antardasha', ad, AMBER);
  r.gap(6);

  if (sad) {
    const sadLabel = hi
      ? `साधना अवधि: ${sad.days} दिन`
      : `Recommended Sadhana Duration: ${sad.days} days`;
    const sadReason = hi ? (sad.reason_hi || '') : (sad.reason_en || '');
    const sadLines  = sadReason ? r.d.wrap(sadReason, W - 28, 7.5) : [];
    const sadCardH  = 14 + (sadLines.length ? 6 + sadLines.length * 11 : 0) + 8;
    r.ensure(sadCardH + 4);
    r.d.rect(M, r.y, W, sadCardH, CARD2);
    r.d.rect(M, r.y, 4, sadCardH, AMBER);
    r.d.text(M + 14, r.y + 8, sadLabel, { size: 9, bold: true, color: AMBER });
    let sy = r.y + 20;
    sadLines.forEach(line => { r.d.text(M + 14, sy, line, { size: 7.5, color: MUTED }); sy += 11; });
    r.y += sadCardH + 4;
  }
  r.gap(8);

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 2 — Priority Remedies
  // ────────────────────────────────────────────────────────────────────────────
  r.newPage(hi ? 'प्राथमिकता उपाय' : 'Priority Remedies');

  const prio = (remedies?.priorityRemedies || []).slice(0, 3);

  if (prio.length === 0) {
    r.para(hi ? 'कोई प्राथमिकता उपाय नहीं मिले।' : 'No priority remedies identified.', 10, MUTED);
  } else {
    r.heading(
      hi ? 'प्राथमिकता उपाय' : 'Priority Remedies',
      hi ? 'आपके जन्म चार्ट के आधार पर ये ग्रह विशेष ध्यान चाहते हैं'
         : 'These planets require focused attention based on your chart',
    );

    const RANK_CLR = [RED, AMBER, BLUE];

    prio.forEach((rem, idx) => {
      const pl     = rem.planet || {};
      const pname  = hi ? (pl.name_hi || pl.name || '') : (pl.name || '');
      const why    = hi ? (rem.why_hi   || rem.why_en   || '') : (rem.why_en   || '');
      const daily  = hi ? (rem.daily_hi || rem.daily_en || '') : (rem.daily_en || '');
      const weekly = hi ? (rem.weekly_hi || rem.weekly_en || '') : (rem.weekly_en || '');
      const mantra = rem.primary_text_en || '';
      const dayStr = hi ? (rem.day_hi   || rem.day_en   || '') : (rem.day_en   || '');
      const devata = hi ? (rem.ishta_devata_hi || rem.ishta_devata_en || '') : (rem.ishta_devata_en || '');

      const whyLines    = why    ? r.d.wrap(why,    W - 28, 8.5) : [];
      const dailyLines  = daily  ? r.d.wrap(daily,  W - 28, 8.5) : [];
      const weeklyLines = weekly ? r.d.wrap(weekly, W - 28, 8.5) : [];
      const mantraLines = mantra ? r.d.wrap(mantra, W - 44, 8)   : [];

      let cardH = 12;
      cardH += 14;
      cardH += 20;
      if (why)    cardH += 12 + whyLines.length    * 13 + 4;
      if (daily)  cardH += 12 + dailyLines.length  * 13 + 4;
      if (weekly) cardH += 12 + weeklyLines.length * 13 + 4;
      if (mantra) cardH += 17 + mantraLines.length * 12 + 8;
      if (dayStr) cardH += 14;
      if (devata) cardH += 14;
      cardH += 12;

      r.ensure(cardH);

      const cy = r.y;
      r.d.rect(M, cy, W, cardH, CARD);
      r.d.rect(M, cy, 4, cardH, RANK_CLR[idx] || GOLD);

      let iy = cy + 12;

      const rankLabel = `${['1st','2nd','3rd'][idx] || (idx+1)+'.'} Priority`;
      r.d.text(M + 14, iy, rankLabel.toUpperCase(), { size: 7, bold: true, color: RANK_CLR[idx] || GOLD });
      r.d.text(M + 80, iy, `Score: ${pl.score != null ? pl.score : '—'}`, { size: 7, color: DIM });
      iy += 14;
      r.d.text(M + 14, iy, pname, { size: 13, bold: true, color: IVORY });
      iy += 20;

      if (why) {
        r.d.text(M + 14, iy, hi ? 'क्यों: ' : 'Why: ', { size: 8, bold: true, color: MUTED }); iy += 12;
        whyLines.forEach(line => { r.d.text(M + 14, iy, line, { size: 8.5, color: MUTED }); iy += 13; });
        iy += 4;
      }

      if (daily) {
        r.d.text(M + 14, iy, hi ? 'दैनिक अभ्यास:' : 'Daily Practice:', { size: 8, bold: true, color: GOLD2 }); iy += 12;
        dailyLines.forEach(line => { r.d.text(M + 14, iy, line, { size: 8.5, color: IVORY }); iy += 13; });
        iy += 4;
      }

      if (weekly) {
        r.d.text(M + 14, iy, hi ? 'साप्ताहिक:' : 'Weekly:', { size: 8, bold: true, color: GOLD2 }); iy += 12;
        weeklyLines.forEach(line => { r.d.text(M + 14, iy, line, { size: 8.5, color: MUTED }); iy += 13; });
        iy += 4;
      }

      if (mantra) {
        const mRectH = 17 + mantraLines.length * 12 + 4;
        r.d.rect(M + 14, iy, W - 28, mRectH, CARD2);
        r.d.text(M + 22, iy + 5, hi ? 'मंत्र:' : 'Mantra:', { size: 7.5, bold: true, color: GOLD });
        iy += 17;
        mantraLines.forEach(line => { r.d.text(M + 22, iy, line, { size: 8, color: IVORY }); iy += 12; });
        iy += 8;
      }

      if (dayStr) {
        r.d.text(M + 14, iy, (hi ? 'शुभ दिन: ' : 'Best day: ') + dayStr, { size: 8, color: AMBER }); iy += 14;
      }
      if (devata) {
        r.d.text(M + 14, iy, (hi ? 'इष्ट देवता: ' : 'Deity: ') + devata, { size: 8, color: BLUE }); iy += 14;
      }

      r.y = cy + cardH + 12;
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PAGE 3 — Daily Puja Sequence + Optional Planets + Disclaimer
  // ────────────────────────────────────────────────────────────────────────────
  r.newPage(hi ? 'दैनिक अभ्यास' : 'Daily Practice & Disclaimer');

  // Daily Puja
  const puja = remedies?.dailyPujaSequence || [];
  if (puja.length > 0) {
    r.heading(
      hi ? 'दैनिक पूजा क्रम' : 'Daily Puja Sequence',
      hi ? 'प्रत्येक दिन इस क्रम में करें' : 'Follow this sequence every day',
    );

    puja.forEach((step, i) => {
      const title = hi ? (step.label_hi || step.label_en || '') : (step.label_en || '');
      const desc  = hi ? (step.action_hi || step.action_en || '') : (step.action_en || '');

      r.ensure(30);
      r.d.text(M, r.y, `${i + 1}.`, { size: 9, bold: true, color: GOLD });
      r.d.text(M + 18, r.y, title, { size: 9, bold: true, color: IVORY });
      r.y += 13;
      if (desc) r.para(desc, 8, MUTED);
      r.gap(6);
    });
    r.gap(8);
  }

  // Optional (healthy) planets
  const opts = (remedies?.optionalRemedies || []).slice(0, 6);
  if (opts.length > 0) {
    r.heading(hi ? 'अन्य ग्रह — स्वस्थ स्थिति में' : 'Other Planets — In Good Standing');

    opts.forEach(op => {
      const pname  = hi ? (op.name_hi  || op.name  || '') : (op.name  || '');
      const status = hi ? (op.status_hi || op.status_en || '') : (op.status_en || '');
      const opt    = hi ? (op.optional_hi || op.optional_en || '') : (op.optional_en || '');

      r.ensure(20);
      r.d.text(M, r.y, `✶ ${pname}`, { size: 9, bold: true, color: GREEN });
      r.d.text(M + 90, r.y, status, { size: 8, color: MUTED });
      r.y += 12;
      if (opt) r.para(opt, 8, DIM);
      r.gap(4);
    });
    r.gap(8);
  }

  // Disclaimer
  r.ensure(90);
  r.d.rect(M, r.y, W, 78, CARD2);
  r.d.rect(M, r.y, W, 3, AMBER);
  const discTitle = hi
    ? '⚠ महत्वपूर्ण: उपाय पर ध्यान दें — भय पर नहीं'
    : '⚠ Important: Focus on Remedies — Not on Fear';
  r.d.text(M + 12, r.y + 14, discTitle, { size: 9, bold: true, color: AMBER });

  const discText = hi
    ? 'यह रिपोर्ट आध्यात्मिक मार्गदर्शन के लिए है। ग्रह-स्थिति से कभी भयभीत न हों — उपाय आपकी सुरक्षा करते हैं। स्वास्थ्य, कानूनी या वित्तीय निर्णय के लिए उचित विशेषज्ञ से परामर्श लें।'
    : 'This report is for spiritual guidance purposes only. Never be afraid of planetary placements — remedies are tools of empowerment, not prediction of fate. For health, legal, or financial decisions, always consult a qualified professional.';

  const discLines = r.d.wrap(discText, W - 24, 7.5);
  let dy2 = r.y + 28;
  discLines.forEach(line => { r.d.text(M + 12, dy2, line, { size: 7.5, color: MUTED }); dy2 += 11; });
  r.y += 90;

  r.gap(10);
  r.d.text(M, r.y, 'jyotishstack.com  |  Lahiri Ayanamsa  |  Whole-sign houses  |  VSOP87 ephemeris', { size: 7, color: DIM });

  return r.d.build();
}

module.exports = { buildRemedyPackagePdf };
