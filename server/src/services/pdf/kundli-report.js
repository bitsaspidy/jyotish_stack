'use strict';
// Premium Kundli PDF report — dark brand theme (Navy / Gold / Ivory).
// Covers every computed aspect: birth + panchang + astro details, D1/D9
// charts (drawn), planet table, Vimshottari dasha, yogas & doshas with
// classical library notes, kundli strength meters, mangal dosha, gochar,
// life guidance, favourite days, remedies and predictions summary.

const { PdfDoc, PAGE_W, PAGE_H } = require('./pdf-doc');

// ── Brand tokens ──────────────────────────────────────────────────────────────
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
const VIOLET= '#A78BFA';

const M = 46;            // page margin
const W = PAGE_W - M * 2; // content width (503)
const FOOT = PAGE_H - 48; // content bottom limit

const ABBR = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };

class Report {
  constructor() {
    this.d = new PdfDoc();
    this.page = 0;
    this.section = '';
    this.y = 0;
  }

  newPage(section) {
    if (section) this.section = section;
    this.page += 1;
    this.d.addPage();
    this.d.rect(0, 0, PAGE_W, PAGE_H, NAVY);
    // header
    this.d.text(M, 26, 'JYOTISH STACK AI', { size: 9, bold: true, color: GOLD });
    this.d.text(M, 26, this.section, { size: 8.5, color: MUTED, align: 'right', width: W });
    this.d.line(M, 44, PAGE_W - M, 44, LINE, 0.8);
    this.d.line(M, 45.5, M + 60, 45.5, GOLD, 1.4);
    // footer
    this.d.line(M, PAGE_H - 36, PAGE_W - M, PAGE_H - 36, LINE, 0.8);
    this.d.text(M, PAGE_H - 30, 'Lahiri ayanamsa - Whole-sign houses - VSOP87 ephemeris - For guidance only', { size: 6.5, color: DIM });
    this.d.text(M, PAGE_H - 31, `Page ${this.page}`, { size: 8, bold: true, color: GOLD, align: 'right', width: W });
    this.y = 62;
  }

  ensure(h) { if (this.y + h > FOOT) this.newPage(); }

  heading(title) {
    this.ensure(34);
    this.d.rect(M, this.y, W, 24, CARD);
    this.d.rect(M, this.y, 3.5, 24, GOLD);
    this.d.text(M + 12, this.y + 6, title.toUpperCase(), { size: 11, bold: true, color: GOLD2 });
    this.y += 32;
  }

  sub(title, color = GOLD) {
    this.ensure(20);
    this.d.text(M, this.y, title, { size: 9.5, bold: true, color });
    this.d.line(M, this.y + 14, M + W, this.y + 14, LINE, 0.6);
    this.y += 20;
  }

  gap(h = 8) { this.y += h; }

  // 2-column key/value grid
  kvGrid(pairs, cols = 2) {
    const colW = W / cols;
    const rowH = 26;
    pairs = pairs.filter((p) => p && p[1] !== undefined && p[1] !== null && p[1] !== '');
    const rows = Math.ceil(pairs.length / cols);
    this.ensure(rows * rowH + 4);
    pairs.forEach(([label, value], i) => {
      const cx = M + (i % cols) * colW;
      const cy = this.y + Math.floor(i / cols) * rowH;
      this.d.text(cx, cy, String(label).toUpperCase(), { size: 6.8, color: DIM });
      this.d.text(cx, cy + 10, String(value), { size: 9.5, bold: true, color: IVORY });
    });
    this.y += rows * rowH + 4;
  }

  // Table. cols: [{ l, w, align? }] (w fractions of W must sum ~1)
  table(cols, rows, { highlight = -1, zebra = true } = {}) {
    const widths = cols.map((c) => c.w * W);
    const rowH = 16;
    this.ensure(rowH + 6);
    // header
    this.d.rect(M, this.y, W, rowH, CARD);
    let x = M;
    cols.forEach((c, i) => {
      this.d.text(x + 5, this.y + 4.5, c.l.toUpperCase(), { size: 6.8, bold: true, color: GOLD, align: c.align || 'left', width: widths[i] - 10 });
      x += widths[i];
    });
    this.y += rowH;
    rows.forEach((row, ri) => {
      this.ensure(rowH);
      if (ri === highlight) this.d.rect(M, this.y, W, rowH, '#2E2A14');
      else if (zebra && ri % 2 === 0) this.d.rect(M, this.y, W, rowH, CARD2);
      let cx = M;
      row.forEach((cell, ci) => {
        const isObj = cell && typeof cell === 'object';
        const txt   = isObj ? cell.t : cell;
        const color = isObj && cell.c ? cell.c : (ri === highlight ? GOLD2 : IVORY);
        const bold  = isObj ? !!cell.b : ri === highlight;
        this.d.text(cx + 5, this.y + 4.5, String(txt ?? '—'), { size: 7.6, color, bold, align: cols[ci].align || 'left', width: widths[ci] - 10 });
        cx += widths[ci];
      });
      this.y += rowH;
    });
    this.y += 6;
  }

  // horizontal score bar with label + value
  bar(label, score, color, max = 100) {
    const h = 17;
    this.ensure(h);
    const labelW = 150, valW = 34;
    const barW = W - labelW - valW;
    this.d.text(M, this.y + 2, label, { size: 8, color: IVORY });
    this.d.rect(M + labelW, this.y + 3.5, barW, 7, CARD);
    this.d.rect(M + labelW, this.y + 3.5, Math.max(2, barW * Math.min(1, score / max)), 7, color);
    this.d.text(M + labelW + barW + 6, this.y + 1.5, `${Math.round(score)}`, { size: 8.5, bold: true, color });
    this.y += h;
  }

  badge(x, y, text, color) {
    const w = this.d.textWidth(text, 7, true) + 12;
    this.d.rect(x, y, w, 12, '#000000');
    this.d.rect(x, y, w, 12, CARD2);
    this.d.rectStroke(x, y, w, 12, color, 0.8);
    this.d.text(x + 6, y + 2.5, text, { size: 7, bold: true, color });
    return w;
  }

  bullets(items, color = GOLD, size = 8.2) {
    (items || []).forEach((it) => {
      const lines = this.d.wrap(String(it), W - 16, size);
      this.ensure(lines.length * (size + 3.5) + 3);
      this.d.text(M + 2, this.y, '•', { size, bold: true, color });
      lines.forEach((ln, i) => this.d.text(M + 12, this.y + i * (size + 3.5), ln, { size, color: IVORY }));
      this.y += lines.length * (size + 3.5) + 3;
    });
  }

  para(text, { size = 8.4, color = MUTED } = {}) {
    if (!text) return;
    const lines = this.d.wrap(String(text), W, size);
    this.ensure(lines.length * (size + 3.5) + 4);
    lines.forEach((ln, i) => this.d.text(M, this.y + i * (size + 3.5), ln, { size, color }));
    this.y += lines.length * (size + 3.5) + 4;
  }
}

// ── North Indian chart drawing ────────────────────────────────────────────────
// housesMap: { 1..12: { rashi_num, planets: [{abbr, retro}] } }
const HOUSE_POS = {
  1:[0.50,0.27], 2:[0.25,0.12], 3:[0.11,0.27], 4:[0.27,0.50], 5:[0.11,0.73], 6:[0.25,0.88],
  7:[0.50,0.74], 8:[0.75,0.88], 9:[0.89,0.73], 10:[0.73,0.50], 11:[0.89,0.27], 12:[0.75,0.12],
};

function drawNorthChart(r, x, y, S, title, housesMap, sub) {
  const d = r.d;
  d.rect(x, y, S, S + 22, CARD2);
  d.text(x, y + 6, title, { size: 9, bold: true, color: GOLD, align: 'center', width: S });
  const cy0 = y + 22;
  d.rectStroke(x + 1, cy0, S - 2, S - 2, GOLD, 1.1);
  // diagonals
  d.line(x + 1, cy0, x + S - 1, cy0 + S - 2, LINE === GOLD ? GOLD : '#7A6A2A', 0.9);
  d.line(x + S - 1, cy0, x + 1, cy0 + S - 2, '#7A6A2A', 0.9);
  // midpoint diamond
  const mx = x + S / 2, my = cy0 + (S - 2) / 2;
  d.poly([[mx, cy0], [x + S - 1, my], [mx, cy0 + S - 2], [x + 1, my]], '#7A6A2A', 0.9);

  for (let h = 1; h <= 12; h++) {
    const cell = housesMap[h];
    if (!cell) continue;
    const [fx, fy] = HOUSE_POS[h];
    const px = x + fx * S, py = cy0 + fy * (S - 2);
    d.text(px - 20, py - 11, String(cell.rashi_num), { size: 6.5, color: GOLD, align: 'center', width: 40 });
    const names = cell.planets || [];
    const lines = [];
    for (let i = 0; i < names.length; i += 3) lines.push(names.slice(i, i + 3));
    lines.forEach((grp, li) => {
      const txt = grp.map((p) => p.abbr + (p.retro ? '*' : '')).join(' ');
      d.text(px - 26, py - 1 + li * 8, txt, { size: 6.8, bold: true, color: IVORY, align: 'center', width: 52 });
    });
  }
  if (sub) d.text(x, y + S + 24, sub, { size: 6.8, color: MUTED, align: 'center', width: S });
}

function buildHousesMap(ascRashi, planets, retroSrc) {
  const map = {};
  for (let h = 1; h <= 12; h++) map[h] = { rashi_num: ((ascRashi + h - 2) % 12) + 1, planets: [] };
  Object.entries(planets || {}).forEach(([name, p]) => {
    if (!p?.rashi_num || !ABBR[name]) return;
    const h = ((p.rashi_num - ascRashi + 12) % 12) + 1;
    const retro = name !== 'Rahu' && name !== 'Ketu' && !!(retroSrc?.[name]?.is_retrograde ?? p.is_retrograde);
    map[h].planets.push({ abbr: ABBR[name], retro });
  });
  return map;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const nm = (v) => (v && typeof v === 'object' ? (v.name_en || v.en || v.name || v.day_en || '') : (v ?? ''));
const dt = (v) => String(v || '').slice(0, 10);
const capz = (v) => (typeof v === 'string' && v ? v[0].toUpperCase() + v.slice(1) : v);
const scoreColor = (s) => (s >= 70 ? GREEN : s >= 55 ? '#84CC16' : s >= 40 ? AMBER : RED);
const STRENGTH_COLOR = { strong: GREEN, moderate: AMBER, weak: RED, mild: BLUE };

// ── Main builder ──────────────────────────────────────────────────────────────
function buildKundliReport(profile, chart, extras = {}) {
  const r = new Report();
  const { strength, life_guidance: lg, favourite_days: fav, library, remedy, problems,
          chara_karakas: karakas, sade_sati: sadeSati, dasha_journey: dashaJourney, numerology,
          yuti, antar_narratives: antarNarr, remedy_suite: suite, marriage_timing: marriage,
          asta_vakri: astaVakri, placement_narratives: placements } = extras;
  const maha  = (chart.dasha || []).find((p) => p.is_current) || chart.dasha?.[0];
  const antar = maha?.antardasha?.find((p) => p.is_current) || maha?.antardasha?.[0];

  // ════ COVER ════
  r.newPage('Vedic Kundli Report');
  const d = r.d;
  d.rect(0, 0, PAGE_W, PAGE_H, NAVY); // re-cover header/footer for clean cover
  d.rectStroke(26, 26, PAGE_W - 52, PAGE_H - 52, GOLD, 1.6);
  d.rectStroke(34, 34, PAGE_W - 68, PAGE_H - 68, '#7A6A2A', 0.7);

  // decorative shatkona + ring
  const ccx = PAGE_W / 2, ccy = 318, R1 = 96, R2 = 64;
  d.circle(ccx, ccy, R1, '#7A6A2A', 1);
  d.circle(ccx, ccy, R1 - 6, GOLD, 0.7);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    d.circle(ccx + Math.cos(a) * (R1 - 13), ccy + Math.sin(a) * (R1 - 13), 1.4, GOLD, 0.5, true);
  }
  const tri = (rot) => [0, 1, 2].map((i) => {
    const a = rot + (i / 3) * Math.PI * 2;
    return [ccx + Math.cos(a) * R2, ccy + Math.sin(a) * R2];
  });
  d.poly(tri(-Math.PI / 2), GOLD, 1.3);
  d.poly(tri(Math.PI / 2), GOLD, 1.3);
  d.circle(ccx, ccy, 7, GOLD2, 1, true);

  d.text(0, 92, 'JYOTISH STACK AI', { size: 26, bold: true, color: GOLD, align: 'center', width: PAGE_W });
  d.text(0, 126, 'VEDIC ASTROLOGY - INTELLIGENT INSIGHTS', { size: 8, color: MUTED, align: 'center', width: PAGE_W });
  d.line(PAGE_W / 2 - 90, 148, PAGE_W / 2 + 90, 148, GOLD, 1);
  d.text(0, 168, 'COMPLETE VEDIC KUNDLI REPORT', { size: 13, bold: true, color: IVORY, align: 'center', width: PAGE_W });

  d.text(0, 452, 'PREPARED FOR', { size: 8, color: DIM, align: 'center', width: PAGE_W });
  d.text(0, 468, String(profile.name || ''), { size: 24, bold: true, color: GOLD2, align: 'center', width: PAGE_W });
  d.line(PAGE_W / 2 - 110, 502, PAGE_W / 2 + 110, 502, '#7A6A2A', 0.8);
  d.text(0, 514, `Born ${dt(profile.date_of_birth)} at ${String(profile.time_of_birth || '').slice(0, 8)}`, { size: 10.5, color: IVORY, align: 'center', width: PAGE_W });
  d.text(0, 532, String(profile.place_of_birth || ''), { size: 10.5, color: IVORY, align: 'center', width: PAGE_W });
  d.text(0, 556, `Lagna ${chart.ascendant?.rashi_en || ''}  |  Moon ${chart.planets?.Moon?.rashi_en || ''}  |  ${chart.nakshatra?.en || ''} Nakshatra Pada ${chart.nakshatra?.pada || ''}`, { size: 9, color: GOLD, align: 'center', width: PAGE_W });

  const sections = ['Birth Details & Panchang', 'Birth Charts (D1, Moon, D9)', 'Planets & Chara Karakas', 'Vimshottari Dasha', 'Mahadasha Journey', 'Yogas & Doshas', 'Kundli Strength', 'Mangal Dosha & Sade Sati', 'Life Guidance', 'Favourite Days', 'Vedic Remedies', 'Numerology', 'Predictions Summary'];
  d.text(0, 612, 'INSIDE THIS REPORT', { size: 8, bold: true, color: GOLD, align: 'center', width: PAGE_W });
  sections.forEach((s, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    d.text(PAGE_W / 2 - 190 + col * 200, 630 + row * 16, `${String(i + 1).padStart(2, '0')}  ${s}`, { size: 8.2, color: MUTED });
  });
  d.text(0, 766, `Generated on ${new Date().toISOString().slice(0, 10)}  -  jyotishstack.com`, { size: 7.5, color: DIM, align: 'center', width: PAGE_W });

  // ════ 1. BIRTH DETAILS & PANCHANG ════
  r.newPage('01 - Birth Details & Panchang');
  r.heading('Birth Details');
  r.kvGrid([
    ['Name', profile.name], ['Gender', profile.gender],
    ['Date of Birth', dt(profile.date_of_birth)], ['Time of Birth', String(profile.time_of_birth || '').slice(0, 8)],
    ['Place of Birth', profile.place_of_birth], ['Coordinates', `${profile.latitude}, ${profile.longitude}`],
    ['Timezone', `UTC+${profile.timezone_offset}`], ['System', chart.meta?.system],
    ['Ayanamsa (Lahiri)', chart.meta?.ayanamsa_dms], ['Julian Day', chart.meta?.julian_day],
  ]);
  r.gap(4);
  r.heading('Panchang at Birth');
  const pan = chart.panchang || {};
  r.kvGrid([
    ['Tithi', nm(pan.tithi)], ['Vara (Weekday)', nm(pan.vara)],
    ['Nakshatra', `${chart.nakshatra?.en || ''} (Pada ${chart.nakshatra?.pada || ''})`], ['Yoga', nm(pan.yoga)],
    ['Karana', nm(pan.karana)], ['Masa (Month)', nm(pan.masa)],
    ['Vikram Samvat', pan.samvat ? `${pan.samvat.vikram} (${pan.samvat.samvatsara_en})` : null], ['Shaka Samvat', pan.samvat?.shaka],
    ['Sunrise', pan.sunrise], ['Sunset', pan.sunset],
    ['Lunar Day (of 30)', pan.moon_phase], ['Pahar', pan.pahar],
  ]);
  r.gap(4);
  r.heading('Avakahada Chakra (Astro Details)');
  const ad = chart.astro_details || {};
  r.kvGrid([
    ['Rashi (Moon Sign)', nm(ad.moon_sign_en)], ['Rashi Swami', nm(ad.moon_sign_lord)],
    ['Lagna', nm(ad.ascendant_rashi_en)], ['Lagna Swami', nm(ad.ascendant_lord)],
    ['Nakshatra-Charan', `${ad.moon_nakshatra_en || chart.nakshatra?.en || ''} - ${ad.moon_pada || chart.nakshatra?.pada || ''}`], ['Nakshatra Swami', nm(ad.moon_nakshatra_lord)],
    ['Varna', capz(nm(ad.varna))], ['Vashya', capz(nm(ad.vashya))],
    ['Yoni', capz(nm(ad.yoni))], ['Gana', capz(nm(ad.gana))],
    ['Nadi', capz(nm(ad.nadi))], ['Tatva', capz(nm(ad.tatva))],
    ['Yunja', ad.yunja?.yunja || nm(ad.yunja)], ['Paya', ad.paya?.paya || nm(ad.paya)],
    ['Naam Akshar', nm(ad.naam_akshar)], ['Nakshatra Deity', nm(chart.nakshatra?.deity_en)],
  ]);

  // ════ 2. CHARTS ════
  r.newPage('02 - Birth Charts');
  r.heading('Birth Charts');
  const chS = 160;
  const ascR = chart.ascendant?.rashi_num || 1;
  const d1Map = buildHousesMap(ascR, chart.planets, chart.planets);
  drawNorthChart(r, M, r.y, chS, 'LAGNA (D1)', d1Map, `Asc: ${chart.ascendant?.rashi_en || ''} ${chart.ascendant?.degree_in_sign_dms || ''}`);
  const moonR = chart.planets?.Moon?.rashi_num || 1;
  const moonMap = buildHousesMap(moonR, chart.planets, chart.planets);
  drawNorthChart(r, M + (W - chS) / 2, r.y, chS, 'CHANDRA KUNDLI', moonMap, `Moon Lagna: ${chart.planets?.Moon?.rashi_en || ''}`);
  const navAsc = chart.navamsha?.ascendant?.rashi_num || 1;
  const d9Map = buildHousesMap(navAsc, chart.navamsha?.planets, chart.planets);
  drawNorthChart(r, M + W - chS, r.y, chS, 'NAVAMSHA (D9)', d9Map, `Nav Lagna: ${chart.navamsha?.ascendant?.rashi_en || ''}`);
  r.y += chS + 40;
  r.para('Su Sun - Mo Moon - Ma Mars - Me Mercury - Ju Jupiter - Ve Venus - Sa Saturn - Ra Rahu - Ke Ketu  |  * retrograde  |  Number in each house = rashi (sign) number', { size: 7.2, color: DIM });
  r.gap(2);
  r.sub('Divisional Charts Computed (18 Vargas)');
  r.para('D1 Rashi - D2 Hora - D3 Drekkana - D4 Chaturthamsha - D7 Saptamsha - D9 Navamsha - D10 Dashamsha - D12 Dwadashamsha - D16 Shodashamsha - D20 Vimshamsha - D24 Chaturvimshamsha - D27 Saptavimshamsha - D30 Trimshamsha - D40 Khavedamsha - D45 Akshavedamsha - D60 Shashtiamsha and more. Detailed Varga readings, past-life (D60) and spiritual path (D20) analyses are available in your online dashboard.', { size: 7.8 });

  // ════ 3. PLANETS ════
  r.newPage('03 - Planetary Positions');
  r.heading('Planetary Positions at Birth');
  const planetHouse = {};
  Object.entries(d1Map).forEach(([h, cell]) => cell.planets.forEach((p) => {
    const full = Object.keys(ABBR).find((k) => ABBR[k] === p.abbr);
    if (full) planetHouse[full] = h;
  }));
  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const pRows = [[
    { t: 'Ascendant', b: true, c: GOLD2 }, chart.ascendant?.rashi_en, chart.ascendant?.degree_in_sign_dms,
    `${chart.nakshatra?.en || ''} (${chart.nakshatra?.pada || ''})`, '1', '—', '—',
  ]];
  order.forEach((name) => {
    const p = chart.planets?.[name];
    if (!p) return;
    const status = [p.is_retrograde ? 'Retro' : '', p.is_combust ? 'Combust' : '', p.awastha || ''].filter(Boolean).join(', ');
    pRows.push([
      { t: name, b: true }, p.rashi_en, p.degree_in_sign_dms,
      `${p.nakshatra_en || ''} (${p.nakshatra_pada || ''})`, planetHouse[name] || '—',
      { t: `${p.dignity || ''}${p.dignity_strength ? ` ${p.dignity_strength}%` : ''}`, c: /Exalt|Own|Mool/i.test(p.dignity || '') ? GREEN : /Debil|Enemy/i.test(p.dignity || '') ? RED : IVORY },
      { t: status || 'Direct', c: p.is_retrograde || p.is_combust ? AMBER : MUTED },
    ]);
  });
  r.table([
    { l: 'Planet', w: 0.13 }, { l: 'Sign', w: 0.13 }, { l: 'Degree', w: 0.13 },
    { l: 'Nakshatra (Pada)', w: 0.24 }, { l: 'House', w: 0.08, align: 'center' },
    { l: 'Dignity', w: 0.16 }, { l: 'Status / Awastha', w: 0.13 },
  ], pRows);
  r.gap(4);
  if (karakas?.length) {
    r.heading('Chara Karakas - Planets Behind Your Purpose');
    r.para('In Jaimini astrology, the seven planets are ranked by their degree in sign. Each rank gives a Karaka — a planet carrying a specific responsibility in your life.', { size: 7.8 });
    r.table(
      [{ l: 'Karaka', w: 0.30 }, { l: 'Planet', w: 0.16 }, { l: 'Degree', w: 0.13, align: 'center' }, { l: 'Sign', w: 0.16 }, { l: 'Governs', w: 0.25 }],
      karakas.map((k) => [
        { t: k.en, b: true, c: GOLD2 }, k.planet, k.degree.toFixed(2), k.rashi_en,
        { t: k.en.match(/\(([^)]+)\)/)?.[1] || '', c: MUTED },
      ])
    );
    r.gap(2);
    karakas.forEach((k) => {
      r.ensure(26);
      r.d.text(M, r.y, `${k.planet} as ${k.en.split(' ')[0]}`, { size: 8, bold: true, color: VIOLET });
      r.y += 11;
      r.para(`${k.meaning_en} ${k.reading_en}`, { size: 7.4, color: IVORY });
      r.gap(1);
    });
  }
  // ── Graha Phal — per-planet placement narratives (sign + house) ──
  if (placements?.length) {
    r.gap(4);
    r.heading('Graha Phal — What Each Planet Says About You');
    r.para('A direct reading of every planet\'s rashi (sign) and bhava (house) placement in your chart — the two coordinates that shape how each graha expresses in your life.', { size: 7.6 });
    placements.forEach((pl) => {
      r.ensure(56);
      let bx = M;
      const title = `${pl.planet} in ${pl.rashi_en} - House ${pl.house}`;
      r.d.text(bx, r.y + 1, title, { size: 9, bold: true, color: GOLD });
      bx += r.d.textWidth(title, 9, true) + 10;
      const dig = (pl.dignity || '').toLowerCase();
      if (/exalt/.test(dig))      bx += r.badge(bx, r.y, 'EXALTED', GREEN) + 5;
      else if (/debil/.test(dig)) bx += r.badge(bx, r.y, 'DEBILITATED', RED) + 5;
      else if (/own|mool/.test(dig)) bx += r.badge(bx, r.y, 'OWN SIGN', BLUE) + 5;
      if (pl.is_retrograde) bx += r.badge(bx, r.y, 'RETRO', VIOLET) + 5;
      if (pl.is_combust)    r.badge(bx, r.y, pl.combust_level === 'deep' ? 'DEEP COMBUST' : 'COMBUST', pl.combust_level === 'deep' ? RED : AMBER);
      r.y += 15;
      if (pl.sign_text?.en)  r.para(pl.sign_text.en,  { size: 7.4, color: IVORY });
      if (pl.house_text?.en) r.para(pl.house_text.en, { size: 7.4, color: IVORY });
      (pl.modifiers || []).forEach((m) => { if (m.en) r.para(`* ${m.en}`, { size: 7, color: AMBER }); });
      r.gap(3);
    });
  }

  // ── Combustion & Retrograde analysis (Class 13) ──
  if (astaVakri && (astaVakri.combust?.length || astaVakri.retro?.length)) {
    r.gap(4);
    r.heading('Combustion & Retrograde Analysis');
    r.para('A combust (Asta) planet loses its light to the Sun and weakens; a retrograde (Vakri) planet gains exaltation-like strength but expresses it in unusual, karmic ways (BPHS).', { size: 7.6 });
    (astaVakri.combust || []).forEach((c) => {
      r.ensure(44);
      let bx = M;
      r.d.text(bx, r.y + 1, `${c.planet} - Combust in ${c.rashi_en} (House ${c.house})`, { size: 9, bold: true, color: RED });
      bx += r.d.textWidth(`${c.planet} - Combust in ${c.rashi_en} (House ${c.house})`, 9, true) + 10;
      bx += r.badge(bx, r.y, c.level === 'deep' ? 'DEEP COMBUSTION' : 'MILD COMBUSTION', c.level === 'deep' ? RED : AMBER) + 6;
      if (c.sun_distance != null) r.badge(bx, r.y, `${c.sun_distance} DEG FROM SUN`, BLUE);
      r.y += 17;
      (c.planet_effects?.effects_en || []).slice(0, 4).forEach((e) => {
        r.ensure(11);
        r.d.text(M + 4, r.y, `- ${e}`, { size: 7.2, color: IVORY });
        r.y += 10.5;
      });
      if (c.house_effect?.description_en) r.para(`In house ${c.house}: ${c.house_effect.description_en}`, { size: 7, color: AMBER });
      if (c.remedy) {
        // mantra is stored as "देवनागरी | Latin transliteration" — keep the Latin part for the ASCII-only PDF
        const mantra = String(c.remedy.mantra || '').split('|').map((s) => s.trim()).filter((s) => /[A-Za-z]/.test(s)).pop() || '';
        r.para(`Remedy: ${mantra} | ${c.remedy.daan_en} | ${c.remedy.yantra} | ${c.remedy.gemstone}`, { size: 6.8, color: VIOLET });
      }
      r.gap(3);
    });
    (astaVakri.retro || []).forEach((rt) => {
      r.ensure(34);
      let bx = M;
      r.d.text(bx, r.y + 1, `${rt.planet} - Retrograde in ${rt.rashi_en} (House ${rt.house})`, { size: 9, bold: true, color: VIOLET });
      bx += r.d.textWidth(`${rt.planet} - Retrograde in ${rt.rashi_en} (House ${rt.house})`, 9, true) + 10;
      bx += r.badge(bx, r.y, rt.is_benefic ? 'BENEFIC - ENHANCED' : 'MALEFIC - INTENSIFIED', VIOLET) + 6;
      if (rt.is_debilitated) r.badge(bx, r.y, 'VAKRI NEECHABHANGA', GREEN);
      else if (rt.is_exalted) r.badge(bx, r.y, 'VAKRI UCHCHA', GOLD);
      r.y += 17;
      r.para('Per BPHS this planet gains exaltation-level strength - results are powerful but arrive in unusual, internal or delayed ways, often tied to past-life karma.', { size: 7.2, color: IVORY });
      if (rt.house_effect?.description_en) r.para(`In house ${rt.house}: ${rt.house_effect.description_en}`, { size: 7, color: VIOLET });
      r.gap(3);
    });
  }

  r.gap(2);
  r.sub('Graha Drishti & Digbala');
  r.para('Full planetary aspects (Graha Drishti) with 7-life-area impact, directional strength (Digbala) and Bhava Karak significators are computed for this chart — explore them interactively in your dashboard.', { size: 7.8 });

  // ════ 4. DASHA ════
  r.newPage('04 - Vimshottari Dasha');
  r.heading('Vimshottari Mahadasha Timeline');
  const mahaIdx = (chart.dasha || []).findIndex((p) => p.is_current);
  r.table(
    [{ l: '#', w: 0.06, align: 'center' }, { l: 'Mahadasha Lord', w: 0.28 }, { l: 'From', w: 0.22 }, { l: 'To', w: 0.22 }, { l: 'Years', w: 0.10, align: 'center' }, { l: 'Status', w: 0.12, align: 'center' }],
    (chart.dasha || []).map((p, i) => [
      String(i + 1), { t: p.lord, b: true }, dt(p.start), dt(p.end), String(p.full_years ?? ''),
      { t: p.is_current ? 'RUNNING' : i < mahaIdx ? 'Past' : 'Future', c: p.is_current ? GREEN : i < mahaIdx ? DIM : MUTED, b: p.is_current },
    ]),
    { highlight: mahaIdx }
  );
  if (maha?.antardasha?.length) {
    r.gap(4);
    r.sub(`Antardashas of ${maha.lord} Mahadasha (current)`);
    const antIdx = maha.antardasha.findIndex((p) => p.is_current);
    r.table(
      [{ l: '#', w: 0.06, align: 'center' }, { l: 'Antardasha', w: 0.30 }, { l: 'From', w: 0.26 }, { l: 'To', w: 0.26 }, { l: 'Status', w: 0.12, align: 'center' }],
      maha.antardasha.map((p, i) => [
        String(i + 1), { t: `${maha.lord} - ${p.lord}`, b: p.is_current }, dt(p.start), dt(p.end),
        { t: p.is_current ? 'NOW' : '', c: GREEN, b: true },
      ]),
      { highlight: antIdx }
    );
  }
  if (maha && antar) {
    r.gap(2);
    r.para(`You are currently in ${maha.lord} Mahadasha (${dt(maha.start)} to ${dt(maha.end)}) with ${antar.lord} Antardasha (${dt(antar.start)} to ${dt(antar.end)}). Pratyantardasha and Sookshmadasha micro-periods are available in the dashboard for precise event timing.`, { size: 8, color: GOLD2 });
  }

  // ════ 4b. MAHADASHA JOURNEY ════
  if (dashaJourney?.length) {
    r.newPage('05 - Mahadasha Journey');
    r.heading('Your Mahadasha Journey - Life in Nine Chapters');
    r.para('Life moves through planetary chapters. Each Mahadasha colors everything for years at a stretch. Here is what each chapter holds for you, based on the lord\'s placement in your chart.', { size: 7.9 });
    r.gap(2);
    dashaJourney.forEach((dj) => {
      r.ensure(58);
      r.d.rect(M, r.y, W, 16, dj.is_current ? '#2E2A14' : CARD);
      r.d.rect(M, r.y, 3, 16, dj.is_current ? GREEN : GOLD);
      r.d.text(M + 10, r.y + 3.5, `${dj.lord} Mahadasha - ${dj.title_en || ''}`, { size: 9, bold: true, color: dj.is_current ? GOLD2 : IVORY });
      r.d.text(M, r.y + 4, `${dt(dj.start)} to ${dt(dj.end)}  (${dj.years} yrs)${dj.is_current ? '  - RUNNING NOW' : ''}`, { size: 7, bold: dj.is_current, color: dj.is_current ? GREEN : MUTED, align: 'right', width: W - 10 });
      r.y += 21;
      r.para(dj.text_en, { size: 7.6, color: IVORY });
      if (dj.placement_en) r.para(dj.placement_en, { size: 7.3, color: VIOLET });
      // Per-antardasha narratives (sub-chapters of this mahadasha)
      const ants = antarNarr?.[dj.lord];
      if (ants?.length) {
        r.gap(1);
        r.sub(`Antardasha phal of ${dj.lord} Mahadasha`, BLUE);
        ants.forEach((ad) => {
          r.ensure(30);
          r.d.text(M, r.y, `${dj.lord} - ${ad.lord}`, { size: 7.8, bold: true, color: ad.is_current ? GREEN : GOLD });
          r.d.text(M, r.y, `${ad.start} to ${ad.end}${ad.is_current ? '  (NOW)' : ''}`, { size: 6.8, color: ad.is_current ? GREEN : DIM, align: 'right', width: W });
          r.y += 11;
          r.para(ad.narrative_en.replace(/^[^:]+:\s*/, ''), { size: 7.1, color: MUTED });
        });
      }
      r.gap(6);
    });
  }

  // ════ 5. YOGAS & DOSHAS ════
  r.newPage('06 - Yogas & Doshas');
  const yd = chart.yogas_doshas || { yogas: [], doshas: [] };
  r.heading(`Auspicious Yogas Detected (${yd.yoga_count ?? yd.yogas.length})`);
  yd.yogas.forEach((yg) => {
    r.ensure(46);
    const bw = r.badge(M, r.y, (yg.strength || 'moderate').toUpperCase(), STRENGTH_COLOR[yg.strength] || AMBER);
    r.d.text(M + bw + 8, r.y + 1, yg.name, { size: 9.5, bold: true, color: GOLD2 });
    r.y += 16;
    r.para(yg.trigger_en, { size: 7.8, color: IVORY });
    const lib = library?.yogas?.[yg.name];
    if (lib?.effects_en) r.para(`Effects: ${lib.effects_en}`, { size: 7.4, color: MUTED });
    r.gap(3);
  });
  if (!yd.yogas.length) r.para('No major yogas detected in this chart.');
  r.gap(4);
  r.heading(`Doshas Detected (${yd.dosha_count ?? yd.doshas.length})`);
  yd.doshas.forEach((ds) => {
    r.ensure(46);
    const bw = r.badge(M, r.y, (ds.severity || 'mild').toUpperCase(), STRENGTH_COLOR[ds.severity] || BLUE);
    r.d.text(M + bw + 8, r.y + 1, ds.name, { size: 9.5, bold: true, color: RED });
    if (ds.is_cancelled) r.badge(M + bw + 14 + r.d.textWidth(ds.name, 9.5, true), r.y, 'RELIEVED', GREEN);
    r.y += 16;
    r.para(ds.trigger_en, { size: 7.8, color: IVORY });
    if (ds.relief_en) r.para(`Relief check: ${ds.relief_en}`, { size: 7.4, color: GREEN });
    const lib = library?.doshas?.[ds.name];
    if (lib?.effects_en) r.para(`Classical effects: ${lib.effects_en}`, { size: 7.4, color: MUTED });
    r.gap(3);
  });
  if (!yd.doshas.length) r.para('No major doshas detected in this chart.');

  // ── Yuti (conjunction) narratives ──
  if (yuti?.length) {
    r.gap(4);
    r.heading('When Energies Merge - Planetary Conjunctions');
    r.para('When two planets share one sign, their energies blend into a single force. These are the conjunctions (yuti) shaping your chart:', { size: 7.8 });
    yuti.forEach((yt) => {
      r.ensure(40);
      const title = `${yt.planets.join(' + ')} in ${yt.rashi_en} (House ${yt.house})`;
      r.d.text(M, r.y, title, { size: 9, bold: true, color: GOLD2 });
      if (yt.yoga_name) r.badge(M + r.d.textWidth(title, 9, true) + 10, r.y - 1, yt.yoga_name.toUpperCase(), VIOLET);
      r.y += 14;
      r.d.text(M, r.y, `Degrees: ${yt.planets[0]} ${yt.degrees[0]} deg - ${yt.planets[1]} ${yt.degrees[1]} deg`, { size: 6.8, color: DIM });
      r.y += 11;
      r.para(yt.narrative_en, { size: 7.6, color: IVORY });
      r.gap(3);
    });
  }

  // ════ 6. STRENGTH ════
  if (strength) {
    r.newPage('07 - Kundli Strength');
    r.heading('Overall Kundli Strength');
    r.ensure(54);
    r.d.rect(M, r.y, W, 44, CARD);
    r.d.rect(M, r.y, 3.5, 44, scoreColor(strength.overall_score));
    r.d.text(M + 16, r.y + 7, String(strength.overall_score), { size: 26, bold: true, color: scoreColor(strength.overall_score) });
    r.d.text(M + 70, r.y + 10, `/ 100  -  ${strength.label?.en || ''}`, { size: 11, bold: true, color: IVORY });
    const curM = strength.current_mahadasha?.planet || strength.current_mahadasha || '';
    const curA = strength.current_antardasha?.planet || strength.current_antardasha || '';
    r.d.text(M + 70, r.y + 27, `Current period: ${curM} Mahadasha, ${curA} Antardasha`, { size: 8, color: MUTED });
    r.y += 52;
    r.sub('Category Scores');
    r.bar('Planetary Strength (35%)', strength.planet_avg, scoreColor(strength.planet_avg));
    r.bar('Yogas & Doshas (25%)', strength.yoga_score, scoreColor(strength.yoga_score));
    r.bar('Life Domains (25%)', strength.domain_avg, scoreColor(strength.domain_avg));
    r.bar('Dasha Favorability (15%)', strength.dasha_score, scoreColor(strength.dasha_score));
    r.gap(6);
    r.sub('Planet Scores');
    Object.entries(strength.planet_scores || {}).forEach(([p, s]) => r.bar(p, s, scoreColor(s)));
    r.gap(6);
    r.sub('Life Domain Scores');
    (strength.life_domain_list || []).forEach((dom) => r.bar(dom.en, dom.score, dom.label?.color || scoreColor(dom.score)));
    r.gap(6);
    r.sub('Key Strengths', GREEN);
    r.bullets(strength.strengths_en, GREEN);
    r.gap(2);
    r.sub('Key Challenges', RED);
    r.bullets(strength.challenges_en, RED);
    r.gap(2);
    r.para(strength.verdict_en, { color: GOLD2, size: 8.6 });
  }

  // ════ 7. MANGAL DOSHA & TRANSITS ════
  r.newPage('08 - Mangal Dosha & Sade Sati');
  r.heading('Mangal (Mars) Dosha Analysis');
  const md = chart.mangal_dosha || {};
  r.ensure(20);
  let bx = M;
  bx += r.badge(bx, r.y, md.has_dosha ? `MANGLIK - ${(md.manglik_type || '').toUpperCase()}` : 'NOT MANGLIK', md.has_dosha ? RED : GREEN) + 6;
  bx += r.badge(bx, r.y, `SEVERITY: ${(md.severity || 'none').toUpperCase()}`, STRENGTH_COLOR[md.severity] || GREEN) + 6;
  r.y += 20;
  r.para(md.summary_en, { color: IVORY });
  r.table(
    [{ l: 'Checked From', w: 0.3 }, { l: 'Mars in House', w: 0.3, align: 'center' }, { l: 'Dosha?', w: 0.4, align: 'center' }],
    (md.checks || []).map((c) => [c.basis, String(c.house), { t: c.has_dosha ? 'YES' : 'No', c: c.has_dosha ? RED : GREEN, b: true }])
  );
  if (md.cancellations?.length) {
    r.sub('Cancellations Present', GREEN);
    r.bullets(md.cancellations.map((c) => (typeof c === 'object' ? c.en : c)), GREEN);
  }
  if (md.has_dosha && md.effects_en?.length) {
    r.sub('Possible Effects', AMBER);
    r.bullets(md.effects_en, AMBER);
  }
  r.gap(6);
  r.heading('Current Transits (Gochar)');
  const gh = chart.gochar?.highlights || {};
  const ss = gh.sade_sati || {};
  r.kvGrid([
    ['Sade Sati', ss.active ? `ACTIVE - ${ss.phase} phase` : 'Not active'],
    ['Saturn from Moon', ss.saturn_house_from_moon ? `House ${ss.saturn_house_from_moon}` : '—'],
    ['Jupiter Support', gh.jupiter_support?.favorable ? 'Favorable' : 'Needs patience'],
    ['Rahu-Ketu Axis', typeof gh.rahu_ketu_axis === 'string' ? gh.rahu_ketu_axis : nm(gh.rahu_ketu_axis)],
  ]);
  const gn = chart.predictions?.gochar_narrative;
  if (gn && typeof gn === 'object') {
    Object.values(gn).forEach((g) => {
      const txt = typeof g === 'string' ? g : g?.description_en;
      if (txt) r.para(txt, { size: 7.8 });
    });
  } else if (typeof gn === 'string') r.para(gn, { size: 7.8 });

  // ── Sade Sati Journey (lifetime cycles) ──
  if (sadeSati?.phases?.length) {
    r.gap(4);
    r.heading('Your Sade Sati Journey - Lifetime Map');
    r.ensure(18);
    let sx = M;
    sx += r.badge(sx, r.y, sadeSati.active ? 'SADE SATI ACTIVE NOW' : 'NOT ACTIVE CURRENTLY', sadeSati.active ? RED : GREEN) + 6;
    r.badge(sx, r.y, `MOON: ${sadeSati.moon_rashi_en?.toUpperCase()}`, BLUE);
    r.y += 20;
    r.para(`Sade Sati is Saturn's 7.5-year transit around your natal Moon (${sadeSati.moon_rashi_en}). It comes roughly every 30 years in three phases — Rising (12th from Moon), Peak (over Moon) and Setting (2nd from Moon). Your complete lifetime map:`, { size: 7.8 });
    const PH_COLOR = { rising: AMBER, peak: RED, setting: BLUE };
    const curIdx = sadeSati.phases.findIndex((p) => p.is_current);
    r.table(
      [{ l: 'Cycle', w: 0.10, align: 'center' }, { l: 'Phase', w: 0.22 }, { l: 'From', w: 0.22 }, { l: 'To', w: 0.22 }, { l: 'Status', w: 0.24, align: 'center' }],
      sadeSati.phases.map((p) => [
        String(p.cycle), { t: p.phase_en, b: true, c: PH_COLOR[p.phase] || IVORY }, p.start, p.end,
        { t: p.is_current ? 'RUNNING NOW' : p.is_past ? 'Completed' : 'Upcoming', c: p.is_current ? GREEN : p.is_past ? DIM : MUTED, b: p.is_current },
      ]),
      { highlight: curIdx }
    );
    r.gap(2);
    r.sub('What Each Phase Means For You');
    ['rising', 'peak', 'setting'].forEach((ph) => {
      const info = sadeSati.phases.find((p) => p.phase === ph);
      if (!info) return;
      r.ensure(30);
      r.d.text(M, r.y, info.phase_en, { size: 8.5, bold: true, color: PH_COLOR[ph] });
      r.y += 12;
      r.para(info.text_en, { size: 7.5, color: IVORY });
      r.gap(2);
    });
  }

  // ════ 8. LIFE GUIDANCE ════
  if (lg) {
    r.newPage('09 - Life Guidance');
    r.heading('Life Guidance');
    const gcard = (title, obj, extra) => {
      if (!obj) return;
      r.ensure(40);
      r.d.text(M, r.y, title, { size: 9.5, bold: true, color: GOLD2 });
      const v = obj.verdict_en || obj.verdict || '';
      if (v) r.badge(M + r.d.textWidth(title, 9.5, true) + 10, r.y - 1, String(v).toUpperCase().slice(0, 40), BLUE);
      r.y += 15;
      if (extra) extra();
      r.para(obj.description_en || obj.summary_en, { size: 7.9, color: IVORY });
      if (obj.advice_en) r.para(`Advice: ${obj.advice_en}`, { size: 7.5, color: GREEN });
      r.gap(4);
    };
    gcard('Career Path - Job vs Business', lg.career, () => {
      r.bar('Job Suitability', lg.career.job_score ?? 0, BLUE, Math.max(10, lg.career.job_score, lg.career.business_score));
      r.bar('Business Suitability', lg.career.business_score ?? 0, VIOLET, Math.max(10, lg.career.job_score, lg.career.business_score));
    });
    gcard('Work Location', lg.workLocation);
    gcard('Business Timing', lg.businessTiming);
    gcard('Love & Relationships', lg.relationships);
    gcard('Marriage', lg.marriage);
    // Marriage timing windows (dasha-based)
    if (marriage?.windows?.length) {
      r.sub('Favourable Marriage Timing Windows', '#EC4899');
      r.para(`Based on Venus, Jupiter and your 7th lord (${marriage.seventh_lord}) dasha activations over the coming years:`, { size: 7.6 });
      const curIdx = marriage.windows.findIndex((w) => w.is_current);
      r.table(
        [{ l: 'From', w: 0.16 }, { l: 'To', w: 0.16 }, { l: 'Period', w: 0.22 }, { l: 'Strength', w: 0.14, align: 'center' }, { l: 'Why', w: 0.32 }],
        marriage.windows.map((w) => [
          w.start, w.end, { t: `${w.maha} - ${w.antar}`, b: true },
          { t: w.rating_en, c: w.rating === 'high' ? GREEN : w.rating === 'good' ? GOLD : AMBER, b: true },
          { t: w.reason_en, c: MUTED },
        ]),
        { highlight: curIdx }
      );
      r.para('Timing windows indicate favourable dasha support — final muhurta should always be matched with panchang and partner\'s chart.', { size: 6.8, color: DIM });
      r.gap(3);
    }
    gcard('Parents', lg.parents);
    gcard('Children', lg.children);
  }

  // ════ 9. FAVOURITE DAYS ════
  if (fav?.purposes?.length) {
    r.newPage('10 - Favourite Days');
    r.heading('Favourite Days by Purpose');
    r.para('Best weekdays for each life purpose, derived from the strongest governing planet in your chart (dignity + house placement).', { size: 7.8 });
    r.table(
      [{ l: 'Purpose', w: 0.28 }, { l: 'Best Day', w: 0.17 }, { l: 'Alternative', w: 0.17 }, { l: 'Avoid', w: 0.14 }, { l: 'Planet', w: 0.14 }, { l: 'Score', w: 0.10, align: 'center' }],
      fav.purposes.map((p) => [
        { t: p.purpose_en, b: true }, { t: p.best_day, c: GREEN, b: true }, p.alt_day,
        { t: p.avoid_day || '—', c: p.avoid_day ? RED : DIM }, p.planet,
        { t: `${p.score}/5`, c: scoreColor(p.score * 20) },
      ])
    );
    r.gap(4);
    fav.purposes.slice(0, 8).forEach((p) => {
      r.ensure(14);
      r.d.text(M, r.y, `${p.purpose_en}:`, { size: 7.4, bold: true, color: GOLD });
      r.d.text(M + 110, r.y, p.tip_en, { size: 7.4, color: MUTED });
      r.y += 12;
    });
  }

  // ════ 10. REMEDIES ════
  r.newPage('11 - Vedic Remedies');
  r.heading('Vedic Remedies');
  const remCard = (title, pl) => {
    if (!pl) return;
    r.ensure(40);
    r.d.text(M, r.y, `${title} - ${pl.planet}`, { size: 9.5, bold: true, color: GOLD2 });
    r.y += 14;
    if (pl.ishta_devata_en) r.para(`Remedy Devata: ${pl.ishta_devata_en}`, { size: 8, color: VIOLET });
    (pl.mantras_en || []).slice(0, 4).forEach((m) => {
      r.ensure(12);
      r.d.text(M + 4, r.y, `• ${m}`, { size: 7.8, color: IVORY });
      r.y += 11;
    });
    if (pl.special_notes_en) r.para(`Note: ${pl.special_notes_en}`, { size: 7.3, color: MUTED });
    r.gap(5);
  };
  remCard('Dasha Lord Remedy', remedy?.dasha_planet);
  remCard('Lagna Lord Remedy', remedy?.lagna_planet);
  if (remedy?.puja_sequence?.length) {
    r.sub('Daily Puja Sequence');
    r.bullets(remedy.puja_sequence.map((s) => s.action_en || s.title_en || s.step_key), GOLD);
    r.gap(3);
  }
  if (problems?.length) {
    r.heading('Problem-wise Remedies');
    problems.forEach((pr) => {
      r.ensure(34);
      r.d.text(M, r.y, pr.problem_en, { size: 8.8, bold: true, color: GOLD2 });
      r.badge(M + r.d.textWidth(pr.problem_en, 8.8, true) + 10, r.y - 1, pr.planet, VIOLET);
      r.y += 13;
      if (pr.devata_en) r.para(`Devata: ${pr.devata_en}`, { size: 7.5, color: VIOLET });
      (pr.mantras_en || []).slice(0, 2).forEach((m) => {
        r.ensure(11);
        r.d.text(M + 4, r.y, `• ${m}`, { size: 7.5, color: IVORY });
        r.y += 10.5;
      });
      if (pr.notes_en) r.para(pr.notes_en, { size: 7.2, color: MUTED });
      r.gap(3);
    });
  }

  // ── Sacred remedy suite: Rudraksha / Yantra / Daan ──
  if (suite?.items?.length) {
    r.gap(4);
    r.heading('Sacred Remedies - Rudraksha, Yantra & Daan');
    suite.items.forEach((it) => {
      r.ensure(64);
      r.d.text(M, r.y, `For ${it.planet}`, { size: 9.5, bold: true, color: GOLD2 });
      r.y += 13;
      r.para(it.reason_en, { size: 7.4, color: MUTED });
      const cardW = (W - 16) / 3;
      const cards = [
        ['RUDRAKSHA', `${it.rudraksha.mukhi}`, it.rudraksha.en, '#A78BFA'],
        ['YANTRA', it.yantra.name, it.yantra.en, '#60A5FA'],
        ['DAAN (CHARITY)', `${it.daan.day}`, it.daan.en, '#22C55E'],
      ];
      r.ensure(74);
      cards.forEach(([label, title, txt, color], ci) => {
        const cx = M + ci * (cardW + 8);
        r.d.rect(cx, r.y, cardW, 68, CARD2);
        r.d.rect(cx, r.y, cardW, 2, color);
        r.d.text(cx + 8, r.y + 7, label, { size: 6.5, bold: true, color });
        r.d.text(cx + 8, r.y + 17, title, { size: 8.2, bold: true, color: IVORY });
        r.d.wrap(txt, cardW - 16, 6.6).slice(0, 4).forEach((ln, li) =>
          r.d.text(cx + 8, r.y + 30 + li * 9, ln, { size: 6.6, color: MUTED }));
      });
      r.y += 76;
    });
    r.sub('How To Use These Remedies');
    r.para(suite.wearing_en, { size: 7.4, color: IVORY });
  }

  // ════ 11. NUMEROLOGY ════
  if (numerology) {
    r.newPage('12 - Numerology');
    r.heading('Numerology - Numbers of Divinity');
    r.para('Numbers are not just counts — they carry the vibration of planets. Your Moolank (birth-day number) shapes your nature; your Bhagyank (destiny number) shapes your life path.', { size: 7.9 });
    r.gap(2);
    [['Moolank (Birth Number)', numerology.moolank], ['Bhagyank (Destiny Number)', numerology.bhagyank]].forEach(([label, n]) => {
      if (!n) return;
      r.ensure(56);
      r.d.rect(M, r.y, W, 46, CARD);
      r.d.rect(M, r.y, 3.5, 46, GOLD);
      r.d.text(M + 16, r.y + 8, String(n.num), { size: 24, bold: true, color: GOLD2 });
      r.d.text(M + 56, r.y + 8, label, { size: 9.5, bold: true, color: IVORY });
      r.d.text(M + 56, r.y + 22, `Ruled by ${n.planet}`, { size: 7.5, color: VIOLET });
      const lines = r.d.wrap(n.en, W - 200, 7.4);
      lines.slice(0, 3).forEach((ln, i) => r.d.text(M + 190, r.y + 8 + i * 11, ln, { size: 7.4, color: MUTED }));
      r.y += 52;
    });
  }

  // ════ 12. PREDICTIONS SUMMARY ════
  r.newPage('13 - Predictions Summary');
  r.heading('Predictions Summary');
  r.bullets(chart.predictions?.summary_en || [], GOLD, 8.6);
  if (chart.predictions?.current_opportunities?.length) {
    r.gap(4);
    r.sub('Current Opportunities', GREEN);
    r.bullets(chart.predictions.current_opportunities.map((o) => (typeof o === 'object' ? o.en || o.text_en || JSON.stringify(o).slice(0, 120) : o)), GREEN);
  }
  if (chart.predictions?.current_challenges?.length) {
    r.gap(4);
    r.sub('Current Challenges', AMBER);
    r.bullets(chart.predictions.current_challenges.map((o) => (typeof o === 'object' ? o.en || o.text_en || JSON.stringify(o).slice(0, 120) : o)), AMBER);
  }
  r.gap(10);
  r.ensure(70);
  r.d.rect(M, r.y, W, 58, CARD2);
  r.d.rectStroke(M, r.y, W, 58, '#7A6A2A', 0.8);
  r.d.text(M + 12, r.y + 8, 'EXPLORE MORE IN YOUR DASHBOARD', { size: 8.5, bold: true, color: GOLD });
  const moreLines = r.d.wrap('Varshphal (annual solar return) with 5-year journey - 18 Varga chart deep readings - Bhava Lord BPHS interpretations - Graha Drishti life-area impacts - Daily personal prediction - Matchmaking (Ashtakoot + Rajju-Vedha) - Panchang Muhurta. Visit jyotishstack.com', W - 24, 7.6);
  moreLines.forEach((ln, i) => r.d.text(M + 12, r.y + 22 + i * 11, ln, { size: 7.6, color: MUTED }));
  r.y += 66;
  r.para('Disclaimer: This report is generated by the Jyotish Stack AI rule engine using Lahiri ayanamsa, whole-sign houses and the VSOP87 ephemeris. It is intended for guidance and self-reflection. Important life decisions should be taken with the counsel of a qualified astrologer.', { size: 7, color: DIM });

  return r.d.build();
}

module.exports = { buildKundliReport };
