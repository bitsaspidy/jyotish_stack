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

  // ── Ganesh Gayatri Mantra card ────────────────────────────────────────────
  {
    const mantraTitle = hi ? 'गणेश गायत्री मंत्र' : 'Ganesh Gayatri Mantra — Opening Invocation';
    const mantraDesc  = hi
      ? 'एक अत्यंत शक्तिशाली और पवित्र मंत्र जो ज्ञान, बुद्धि और एकाग्रता प्रदान करता है। किसी भी नए कार्य की शुरुआत या ध्यान से पहले इसे जपना बहुत शुभ माना जाता है।'
      : 'An extremely powerful and sacred mantra that bestows knowledge, wisdom, and concentration. Chant before beginning any new work or meditation.';
    const mantraText  = hi
      ? 'ॐ एकदन्ताय विद्महे, वक्रतुण्डाय धीमहि, तन्नो दन्तिः प्रचोदयात्॥'
      : 'Om Ekadantaya Vidmahe Vakratundaya Dhimahi Tanno Dantih Prachodayat';
    const mantraHint  = 'ॐ एकदंताय विद्महे वक्रतुंडाय धीमहि तन्नो दंतिः प्रचोदयात्॥';
    const meaningText = hi
      ? 'एकदंताय विद्महे: हम उस एकदंत ईश्वर का ध्यान करते हैं। वक्रतुंडाय धीमहि: हम घुमावदार सूंड वाले भगवान का ध्यान करते हैं। तन्नो दंतिः प्रचोदयात्: हे गणेश जी, हमें बुद्धि और ज्ञान के मार्ग पर प्रेरित करें।'
      : 'Ekadantaya Vidmahe: We meditate on the one-tusked Lord. Vakratundaya Dhimahi: We meditate upon Him with the curved trunk. Tanno Dantih Prachodayat: May He enlighten our intellect on the path of wisdom.';
    const benefitText = hi
      ? 'यह जीवन से सभी प्रकार की बाधाओं और नकारात्मकता को दूर करता है। मन को शांति, स्पष्टता और एकाग्रता प्रदान करता है।'
      : 'Removes all obstacles and negativity from life. Bestows peace of mind, mental clarity, and concentration.';

    const descLines    = r.d.wrap(mantraDesc,    W - 28, 7.5);
    const meaningLines = r.d.wrap(meaningText,   W - 28, 7.5);
    const benefitLines = r.d.wrap(benefitText,   W - 28, 7.5);
    const textLine     = r.d.wrap(mantraText,    W - 44, 9);
    const hintLine     = hi ? [] : r.d.wrap(mantraHint, W - 44, 8);
    const mCardH       = 17 + textLine.length * 13 + (hintLine.length ? hintLine.length * 11 + 4 : 0) + 10;
    const totalH       = 14 + descLines.length * 11 + 8 + mCardH + 10
                       + 12 + meaningLines.length * 11 + 8
                       + 12 + benefitLines.length * 11 + 12;
    r.ensure(totalH);
    const gcy = r.y;
    r.d.rect(M, gcy, W, totalH, CARD);
    r.d.rect(M, gcy, 4, totalH, GOLD);
    let gy = gcy + 12;
    r.d.text(M + 14, gy, mantraTitle, { size: 10, bold: true, color: GOLD2 }); gy += 14;
    descLines.forEach(ln => { r.d.text(M + 14, gy, ln, { size: 7.5, color: MUTED }); gy += 11; });
    gy += 8;
    r.d.rect(M + 14, gy, W - 28, mCardH, CARD2);
    r.d.text(M + 22, gy + 5, hi ? 'मंत्र (× 9 बार):' : 'Mantra (× 9 times):', { size: 7.5, bold: true, color: GOLD });
    gy += 17;
    textLine.forEach(ln => { r.d.text(M + 22, gy, ln, { size: 9, bold: true, color: IVORY }); gy += 13; });
    hintLine.forEach(ln => { r.d.text(M + 22, gy, ln, { size: 8, color: GOLD2 }); gy += 11; });
    gy += 10;
    r.d.text(M + 14, gy, hi ? 'अर्थ:' : 'Meaning:', { size: 8, bold: true, color: AMBER }); gy += 12;
    meaningLines.forEach(ln => { r.d.text(M + 14, gy, ln, { size: 7.5, color: MUTED }); gy += 11; });
    gy += 8;
    r.d.text(M + 14, gy, hi ? 'लाभ:' : 'Benefits:', { size: 8, bold: true, color: GREEN }); gy += 12;
    benefitLines.forEach(ln => { r.d.text(M + 14, gy, ln, { size: 7.5, color: MUTED }); gy += 11; });
    r.y = gcy + totalH + 12;
  }

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

  // Disclaimer + Membership
  const discTitle = hi
    ? '⚠ महत्वपूर्ण: उपाय पर ध्यान दें — भय पर नहीं'
    : '⚠ Important: Focus on Remedies — Not on Fear';

  const discBody = hi
    ? 'यह रिपोर्ट AI तकनीक और वैदिक ज्योतिष के गहन अध्ययन एवं विश्लेषण द्वारा तैयार की गई है। सभी रिपोर्ट वैदिक पद्धति पर आधारित हैं। यदि आपको कोई संशय हो तो किसी अनुभवी वैदिक ज्योतिषी से पुष्टि करें। स्वास्थ्य, कानूनी या वित्तीय निर्णय के लिए उचित विशेषज्ञ से परामर्श लें।'
    : 'This report is generated using AI technology combined with in-depth Vedic Jyotish study and analysis. All reports are Vedic-based. If you have any doubts, please confirm with a qualified Vedic Jyotish expert. For health, legal, or financial decisions, always consult a qualified professional.';

  const memTitle = hi
    ? 'आपकी निःशुल्क सुविधाएँ एवं सदस्यता'
    : 'Your Free Benefits & Membership';

  const memBody = hi
    ? 'यह आपकी व्यक्तिगत वैदिक उपाय पुस्तिका है — विशेष रूप से आपके लिए तैयार एक सशुल्क मार्गदर्शिका। बेसिक पंजीकरण Rs. 499 में — 3 कुंडली प्रोफाइल देखें। अधिक कुंडली और विवाह मिलान के लिए वार्षिक सदस्यता योजना लें।'
    : 'This is your personalised Vedic Remedy Booklet — a premium paid guide crafted exclusively for you. Basic registration at Rs. 499 — view up to 3 kundli profiles. For unlimited kundlis and matchmaking, upgrade to our Yearly Membership Plan.';

  const discLines = r.d.wrap(discBody, W - 24, 7.5);
  const memLines  = r.d.wrap(memBody,  W - 24, 7.5);
  const boxH = 69 + (discLines.length + memLines.length) * 11;
  r.ensure(boxH + 10);
  const bcy = r.y;
  r.d.rect(M, bcy, W, boxH, CARD2);
  r.d.rect(M, bcy, W, 3, AMBER);
  let by = bcy + 12;
  r.d.text(M + 12, by, discTitle, { size: 9, bold: true, color: AMBER });
  by += 14;
  discLines.forEach(ln => { r.d.text(M + 12, by, ln, { size: 7.5, color: MUTED }); by += 11; });
  by += 8;
  r.d.line(M + 12, by, PAGE_W - M - 12, by, LINE, 0.5);
  by += 9;
  r.d.text(M + 12, by, memTitle, { size: 9, bold: true, color: GOLD2 });
  by += 14;
  memLines.forEach(ln => { r.d.text(M + 12, by, ln, { size: 7.5, color: MUTED }); by += 11; });
  r.y = bcy + boxH + 10;

  r.d.text(M, r.y, 'jyotishstack.com  |  Lahiri Ayanamsa  |  Whole-sign houses  |  VSOP87 ephemeris', { size: 7, color: DIM });

  return r.d.build();
}

module.exports = { buildRemedyPackagePdf };
