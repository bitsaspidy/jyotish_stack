'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';
import JudgementPanel from './kundli/JudgementPanel';

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.55)';

const LANGS = ['en', 'hi', 'hinglish'];
const normLang = (l) => (LANGS.includes(l) ? l : 'hi');

const UI = {
  en: { loading: 'Preparing your life report…', error: 'Could not load the report.', advice: 'Advice', caution: 'Caution', lucky: 'Lucky', disclaimer: 'This report is guidance based on astrological calculation and traditional rules — take it for positive direction, not for fear.', printBtn: '🖨️ PDF / Print', title: '🪔 Life Guidance Report', docTitle: 'Life Guidance Report', popup: 'Please allow pop-ups for this site.', dShow: '🔧 Show technical details (Admin)', dHide: '▲ Hide technical details', locale: 'en-IN' },
  hi: { loading: 'आपकी जीवन रिपोर्ट तैयार हो रही है…', error: 'रिपोर्ट लोड नहीं हो पाई।', advice: 'सलाह', caution: 'सावधानी', lucky: 'शुभ', disclaimer: 'यह रिपोर्ट ज्योतिषीय गणना और परंपरागत नियमों पर आधारित मार्गदर्शन है — इसे सकारात्मक दिशा के लिए लें, किसी डर के लिए नहीं।', printBtn: '🖨️ PDF / प्रिंट', title: '🪔 जीवन मार्गदर्शन रिपोर्ट', docTitle: 'जीवन मार्गदर्शन रिपोर्ट', popup: 'कृपया इस साइट के लिए पॉप-अप की अनुमति दें।', dShow: '🔧 तकनीकी विवरण देखें (Admin)', dHide: '▲ तकनीकी विवरण छिपाएं', locale: 'hi-IN' },
  hinglish: { loading: 'Aapki life report ready ho rahi hai…', error: 'Report load nahi ho payi.', advice: 'Advice', caution: 'Caution', lucky: 'Lucky', disclaimer: 'Yeh report astrological calculation aur traditional rules par based guidance hai — ise positive direction ke liye lein, dar ke liye nahi.', printBtn: '🖨️ PDF / Print', title: '🪔 Life Guidance Report', docTitle: 'Life Guidance Report', popup: 'Please is site ke liye pop-up allow karein.', dShow: '🔧 Technical details dekhein (Admin)', dHide: '▲ Technical details chhipayein', locale: 'hi-IN' },
};

const STATUS_COLORS = {
  strong: { c: '#34D399', bg: 'rgba(52,211,153,0.12)', b: 'rgba(52,211,153,0.3)' },
  mid:    { c: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  b: 'rgba(96,165,250,0.3)'  },
  care:   { c: '#FBBF24', bg: 'rgba(245,158,11,0.12)', b: 'rgba(245,158,11,0.3)'  },
};
const colorOf = (key) => STATUS_COLORS[key] || STATUS_COLORS.mid;

// ── Which planets are most relevant to each life-area section ─────────────────
const AREA_PLANETS = {
  personality:  ['Sun', 'Moon'],
  family:       ['Moon', 'Jupiter'],
  career:       ['Saturn', 'Sun', 'Mars'],
  money:        ['Jupiter', 'Mercury', 'Venus'],
  marriage:     ['Venus', 'Jupiter'],
  children:     ['Jupiter', 'Moon'],
  siblings:     ['Mars', 'Mercury'],
  health:       ['Sun', 'Moon', 'Mars'],
  debt:         ['Saturn', 'Mars', 'Rahu'],
  property:     ['Mars', 'Moon'],
  spirituality: ['Ketu', 'Jupiter'],
};

const PRIORITY_COL = {
  critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#60A5FA', healthy: '#22C55E',
};
const PRIORITY_BG = {
  critical: 'rgba(239,68,68,0.07)', high: 'rgba(249,115,22,0.07)',
  medium:   'rgba(245,158,11,0.07)', low: 'rgba(96,165,250,0.07)', healthy: 'rgba(34,197,94,0.07)',
};
const PRIORITY_LABEL = {
  en: { critical: 'Urgent', high: 'High Priority', medium: 'Moderate', low: 'Minor', healthy: 'Doing Well' },
  hi: { critical: 'तुरंत', high: 'उच्च प्राथमिकता', medium: 'मध्यम', low: 'हल्का', healthy: 'ठीक' },
};

// ── Inject a targeted daily remedy into care-status sections ──────────────────
function enrichSectionsWithHints(sections, pr, lang) {
  if (!pr?.priorityRemedies?.length) return sections;
  const hi = lang === 'hi';
  return sections.map((s) => {
    // Enhance the remedies section with personalized top-3 planet lines
    if (s.key === 'remedies' && pr.priorityRemedies.length) {
      const extra = pr.priorityRemedies.map((r) => {
        const name = hi ? r.planet?.name_hi : r.planet?.name;
        const why  = hi ? r.why_hi : r.why_en;
        const firstLine = (why || '').split(/[।.\n]/)[0].trim();
        return `${r.planet?.icon || ''} ${name}: ${firstLine}`;
      });
      return { ...s, points: [...(s.points || []), ...extra] };
    }
    // Add a single targeted remedy hint to care-status sections
    if (s.statusKey !== 'care') return s;
    const relPlanets = AREA_PLANETS[s.key] || [];
    const match = pr.priorityRemedies.find((r) => relPlanets.includes(r.planet?.name));
    if (!match) return s;
    const daily = hi ? match.daily_hi : match.daily_en;
    const firstLine = (daily || '').split(/[।.\n]/)[0].trim();
    if (!firstLine) return s;
    const icon = match.planet?.icon || '';
    const name = hi ? match.planet?.name_hi : match.planet?.name;
    return { ...s, advice: [...(s.advice || []).filter(Boolean), `${icon} ${name}: ${firstLine}`] };
  });
}

// ── HTML helpers for print ────────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildJudgementHtml(judgement, lang) {
  if (!judgement) return '';
  const isHi = lang === 'hi';
  const score = judgement.overallScore ?? 0;
  const overallLabel = isHi ? judgement.overallLabel?.hi : judgement.overallLabel?.en;
  const scoreColor = score >= 65 ? '#15803d' : score >= 48 ? '#1d4ed8' : score >= 35 ? '#b45309' : '#b91c1c';
  const statusLabels   = { strong: 'Strong', balanced: 'Balanced', 'needs-care': 'Needs Care', challenging: 'Focus Needed' };
  const statusLabelsHi = { strong: 'मजबूत', balanced: 'संतुलित', 'needs-care': 'देखभाल जरूरी', challenging: 'चुनौतीपूर्ण' };
  const statusColors   = { strong: '#15803d', balanced: '#1d4ed8', 'needs-care': '#b45309', challenging: '#b91c1c' };
  const statusBg       = { strong: '#f0fdf4', balanced: '#eff6ff', 'needs-care': '#fffbeb', challenging: '#fef2f2' };

  const areaHtml = (judgement.areas || []).map((a) => {
    const title  = isHi ? (a.titleHi || a.titleEn) : a.titleEn;
    const slabel = isHi ? (statusLabelsHi[a.status] || a.status) : (statusLabels[a.status] || a.status);
    const col    = statusColors[a.status] || '#374151';
    const bg     = statusBg[a.status]    || '#f9fafb';
    const summ   = isHi ? (a.userSummaryHi || a.userSummaryEn) : a.userSummaryEn;
    return `<div style="background:${bg};border:1px solid ${col}44;border-radius:8px;padding:10px 12px;break-inside:avoid;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:12px;font-weight:700;color:#111827;">${esc(title)}</span>
        <span style="font-size:10px;font-weight:600;color:${col};background:${col}18;border-radius:10px;padding:2px 8px;white-space:nowrap;">${esc(slabel)}</span>
      </div>
      <div style="height:3px;border-radius:3px;background:#e5e7eb;margin-bottom:7px;">
        <div style="height:100%;width:${a.score || 0}%;border-radius:3px;background:${col};"></div>
      </div>
      ${summ ? `<p style="font-size:11px;color:#374151;line-height:1.6;margin:0;">${esc(summ)}</p>` : ''}
    </div>`;
  }).join('');

  return `<div style="border:1px solid #e9d5ff;border-radius:12px;padding:16px 18px;margin-bottom:18px;background:#faf5ff;break-inside:avoid;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;flex-wrap:wrap;">
      <div style="flex-shrink:0;width:64px;height:64px;border-radius:50%;background:conic-gradient(${scoreColor} 0% ${score}%,#e5e7eb ${score}% 100%);display:flex;align-items:center;justify-content:center;">
        <div style="width:48px;height:48px;border-radius:50%;background:#faf5ff;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:17px;font-weight:700;color:${scoreColor};">${score}</span>
        </div>
      </div>
      <div style="flex:1;min-width:140px;">
        <p style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 5px;">⚖️ ${isHi ? 'कुंडली निर्णय स्कोर' : 'Kundli Judgement Score'}</p>
        <span style="font-size:12px;font-weight:600;color:${scoreColor};background:${scoreColor}15;border-radius:10px;padding:3px 10px;">${esc(overallLabel || '')}</span>
        <p style="font-size:11px;color:#6b7280;line-height:1.6;margin:6px 0 0;">
          ${isHi ? '11 परत के शुद्ध ज्योतिषीय नियमों पर आधारित। 65+ मजबूत · 48–64 संतुलित · 35–47 देखभाल जरूरी।' : '11-layer pure Vedic rule analysis. 65+ strong · 48–64 balanced · 35–47 needs care.'}
        </p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;">${areaHtml}</div>
  </div>`;
}

// ── Print HTML for Personalized Remedy Plan ───────────────────────────────────
function buildRemedyHtml(pr, lang) {
  if (!pr?.priorityRemedies?.length) return '';
  const hi  = lang === 'hi';
  const pcol = { critical: '#b91c1c', high: '#c2410c', medium: '#b45309', low: '#1d4ed8', healthy: '#15803d' };
  const plab = {
    en: { critical: 'Urgent', high: 'High Priority', medium: 'Moderate', low: 'Minor', healthy: 'Doing Well' },
    hi: { critical: 'तुरंत', high: 'उच्च प्राथमिकता', medium: 'मध्यम', low: 'हल्का', healthy: 'ठीक' },
  };
  const meta    = pr.meta || {};
  const sadhana = pr.sadhanaDuration;
  const puja    = pr.dailyPujaSequence || [];

  const metaLine = hi
    ? `लग्न स्वामी: ${meta.lagna_lord_hi || meta.lagna_lord || '—'} · वर्तमान दशा: ${meta.current_md_lord || '—'}`
    : `Lagna Lord: ${meta.lagna_lord || '—'} · Current Dasha: ${meta.current_md_lord || '—'}`;

  const remedyCards = pr.priorityRemedies.map((r, idx) => {
    const p    = r.planet || {};
    const col  = pcol[p.priority] || '#374151';
    const lab  = (hi ? plab.hi : plab.en)[p.priority] || p.priority || '';
    const name = esc(hi ? p.name_hi : p.name);
    const why  = esc(hi ? r.why_hi   : r.why_en);
    const ben  = esc(hi ? r.benefit_hi : r.benefit_en);
    const day  = esc(hi ? r.daily_hi  : r.daily_en);
    return `<div style="border:1px solid ${col}50;border-radius:9px;padding:12px 14px;margin-bottom:10px;background:${col}0c;break-inside:avoid;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;gap:8px;">
        <span style="font-size:13px;font-weight:700;color:#1f2433;">P${idx + 1} ${esc(p.icon || '')} ${name}</span>
        <span style="font-size:10px;font-weight:600;color:${col};background:${col}1a;border-radius:8px;padding:2px 9px;white-space:nowrap;">${esc(lab)}</span>
      </div>
      ${why  ? `<p style="font-size:12px;color:#374151;line-height:1.65;margin:0 0 5px;">${why}</p>` : ''}
      ${ben  ? `<p style="font-size:11.5px;color:#b45309;font-style:italic;margin:0 0 6px;">✨ ${ben}</p>` : ''}
      ${day  ? `<div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:7px;padding:7px 10px;font-size:12px;color:#15803d;line-height:1.65;">${day}</div>` : ''}
    </div>`;
  }).join('');

  const pujaRows = puja.length ? `<div style="margin-top:14px;">
    <h4 style="color:#b8860b;font-size:13px;margin:0 0 8px;">🕉 ${hi ? 'दैनिक पूजा क्रम' : 'Daily Puja Sequence'}</h4>
    <ol style="padding-left:20px;margin:0;">${puja.map((st) => {
      const lbl  = esc(hi ? (st.label_hi  || st.label_en  || '') : (st.label_en  || ''));
      const act  = esc(hi ? (st.action_hi || st.action_en || '') : (st.action_en || ''));
      return `<li style="font-size:12px;color:#374151;margin-bottom:5px;line-height:1.65;"><b>${lbl}</b>${act ? `<br/><span style="color:#6b7280;">${act.substring(0, 120)}</span>` : ''}</li>`;
    }).join('')}</ol>
  </div>` : '';

  const sadhanaBlock = sadhana ? `<div style="margin-top:12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;break-inside:avoid;">
    <span style="font-size:12.5px;font-weight:700;color:#b45309;">⏰ ${hi ? `${sadhana.days} दिन की साधना` : `${sadhana.days}-Day Sadhana`}</span>
    ${sadhana.reason_en ? `<p style="font-size:11.5px;color:#92400e;margin:4px 0 0;line-height:1.6;">${esc(hi ? (sadhana.reason_hi || sadhana.reason_en) : sadhana.reason_en)}</p>` : ''}
    ${sadhana.start_day_en ? `<p style="font-size:11px;color:#a16207;margin:4px 0 0;">${esc(hi ? (sadhana.start_day_hi || sadhana.start_day_en) : sadhana.start_day_en)}</p>` : ''}
  </div>` : '';

  return `<div class="section" style="border-color:#d4af3766;background:#fffdf5;">
    <div class="sec-head"><h3>🪷 ${esc(hi ? 'व्यक्तिगत उपाय योजना' : 'Personalized Remedy Plan')}</h3></div>
    <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">${esc(metaLine)}</p>
    ${remedyCards}
    ${pujaRows}
    ${sadhanaBlock}
  </div>`;
}

function buildPrintHtml(report, daily, name, lang, ui, judgement, personalizedRemedies) {
  const pill  = (s) => s.status ? `<span class="pill st-${s.statusKey || 'mid'}">${esc(s.status)}</span>` : '';
  const block = (s) => `
    <div class="section">
      <div class="sec-head"><h3>${esc(s.heading)}</h3>${pill(s)}</div>
      ${s.text ? `<p class="lead">${esc(s.text)}</p>` : ''}
      ${(s.points || []).length ? `<ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${(s.advice || []).filter(Boolean).map((a) => `<div class="adv">✓ ${esc(ui.advice)}: ${esc(a)}</div>`).join('')}
      ${(s.caution || []).filter(Boolean).map((c) => `<div class="cau">⚠ ${esc(ui.caution)}: ${esc(c)}</div>`).join('')}
    </div>`;
  const dailyHtml = daily ? `
    <div class="section daily">
      <div class="sec-head"><h3>${esc(daily.heading)}</h3></div>
      ${daily.text ? `<p class="lead">${esc(daily.text)}</p>` : ''}
      ${(daily.points || []).length ? `<ul>${daily.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
      ${(daily.advice || []).filter(Boolean).map((a) => `<div class="adv">✓ ${esc(ui.advice)}: ${esc(a)}</div>`).join('')}
      ${(daily.caution || []).filter(Boolean).map((c) => `<div class="cau">⚠ ${esc(ui.caution)}: ${esc(c)}</div>`).join('')}
    </div>` : '';
  const today = new Date().toLocaleDateString(ui.locale, { day: '2-digit', month: 'long', year: 'numeric' });
  return `<!doctype html><html lang="${lang === 'en' ? 'en' : 'hi'}"><head><meta charset="utf-8">
<title>${esc(ui.docTitle)}${name ? ` - ${esc(name)}` : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{font-family:'Noto Sans Devanagari',system-ui,serif;color:#1f2433;margin:0;line-height:1.75;}
.wrap{max-width:760px;margin:0 auto;padding:24px;}
.top{border-bottom:3px solid #b8860b;padding-bottom:14px;margin-bottom:18px;}
.top h1{color:#b8860b;font-size:23px;margin:0 0 4px;}
.top .sub{color:#6b7280;font-size:13px;}
.summary{background:#faf6e9;border:1px solid #e6d79a;border-radius:10px;padding:16px 18px;margin-bottom:18px;}
.summary p{margin:0 0 6px;font-size:14px;}
.section{border:1px solid #e3e6ec;border-radius:10px;padding:14px 16px;margin-bottom:14px;break-inside:avoid;page-break-inside:avoid;}
.section.daily{background:#eef4ff;border-color:#cfe0ff;}
.sec-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
.sec-head h3{color:#b8860b;font-size:16px;margin:0;}
.pill{font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;white-space:nowrap;}
.st-strong{background:#dcfce7;color:#15803d;}.st-mid{background:#dbeafe;color:#1d4ed8;}.st-care{background:#fef3c7;color:#b45309;}
.lead{font-size:14px;margin:0 0 8px;}
ul{margin:6px 0;padding-left:20px;}li{font-size:13px;margin-bottom:4px;color:#374151;}
.adv{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:7px;padding:6px 10px;margin-top:6px;font-size:12.5px;color:#15803d;}
.cau{background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:6px 10px;margin-top:6px;font-size:12.5px;color:#b45309;}
.foot{margin-top:18px;text-align:center;color:#9ca3af;font-size:11px;line-height:1.6;}
@page{margin:16mm;}
</style></head><body><div class="wrap">
<div class="top"><h1>${esc(ui.title)}</h1>
<div class="sub">${name ? esc(name) + ' · ' : ''}${today} · Jyotish Stack AI</div></div>
${buildJudgementHtml(judgement, lang)}
<div class="summary">${(report.summary?.lines || []).map((l) => `<p>${esc(l)}</p>`).join('')}</div>
${dailyHtml}
${(report.sections || []).map(block).join('')}
${buildRemedyHtml(personalizedRemedies, lang)}
<div class="foot">${esc(ui.disclaimer)}<br/>© ${new Date().getFullYear()} Jyotish Stack AI · jyotishstack.com</div>
</div></body></html>`;
}

// ── React components ──────────────────────────────────────────────────────────

function StatusPill({ label, statusKey }) {
  if (!label) return null;
  const s = colorOf(statusKey);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.c, border: `1px solid ${s.b}`, whiteSpace: 'nowrap' }}>{label}</span>
  );
}

function SectionCard({ section, ui }) {
  if (!section) return null;
  const { heading, status, statusKey, text, points = [], advice = [], caution = [] } = section;
  return (
    <section style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700 }}>{heading}</h3>
        <StatusPill label={status} statusKey={statusKey} />
      </div>
      {text && <p style={{ color: IVORY, fontSize: 14.5, lineHeight: 1.85, marginBottom: points.length ? 12 : 0 }}>{text}</p>}
      {points.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {points.map((p, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, color: DIM, fontSize: 13.5, lineHeight: 1.7 }}>
              <span style={{ color: GOLD, flexShrink: 0 }}>•</span><span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {advice.filter(Boolean).map((a, i) => (
        <div key={`a${i}`} style={{ marginTop: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: 8, padding: '8px 12px', color: '#A7F3D0', fontSize: 13, lineHeight: 1.7 }}>✓ {ui.advice}: {a}</div>
      ))}
      {caution.filter(Boolean).map((c, i) => (
        <div key={`c${i}`} style={{ marginTop: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, padding: '8px 12px', color: '#FCD9A0', fontSize: 13, lineHeight: 1.7 }}>⚠ {ui.caution}: {c}</div>
      ))}
    </section>
  );
}

// ── 🪷 Personalized Remedy Plan block (on-screen) ─────────────────────────────
function RemedyPlanBlock({ plan, lang }) {
  if (!plan?.priorityRemedies?.length) return null;
  const hi = lang === 'hi';
  const T  = (en, h) => hi ? h : en;
  const [expanded, setExpanded] = useState({});

  const { priorityRemedies, dailyPujaSequence: puja = [], sadhanaDuration: sadhana, meta = {} } = plan;

  return (
    <section style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))', border: '2px solid rgba(212,175,55,0.32)', borderRadius: 16, padding: '20px 22px', marginBottom: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 19, fontWeight: 700, margin: 0 }}>
          🪷 {T('Personalized Remedy Plan', 'व्यक्तिगत उपाय योजना')}
        </h2>
        {sadhana && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 20, padding: '3px 12px' }}>
            ⏰ {sadhana.days} {T('days sadhana', 'दिन साधना')}
          </span>
        )}
      </div>

      {/* Meta line */}
      {(meta.lagna_lord || meta.current_md_lord) && (
        <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.45)', marginBottom: 14, lineHeight: 1.6 }}>
          {T(
            `Lagna Lord: ${meta.lagna_lord || '—'} · Current Dasha: ${meta.current_md_lord || '—'}`,
            `लग्न स्वामी: ${meta.lagna_lord_hi || meta.lagna_lord || '—'} · वर्तमान दशा: ${meta.current_md_lord || '—'}`,
          )}
        </p>
      )}

      {/* Priority remedy cards (expandable) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {priorityRemedies.map((r, idx) => {
          const p   = r.planet || {};
          const col = PRIORITY_COL[p.priority]  || PRIORITY_COL.medium;
          const bg  = PRIORITY_BG[p.priority]   || PRIORITY_BG.medium;
          const lab = (hi ? PRIORITY_LABEL.hi : PRIORITY_LABEL.en)[p.priority] || p.priority;
          const key = p.name || idx;
          const isOpen = !!expanded[key];
          return (
            <div key={key} style={{ border: `1px solid ${col}44`, borderRadius: 12, overflow: 'hidden', background: bg }}>
              <button
                onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: col, minWidth: 24 }}>P{idx + 1}</span>
                <span style={{ color: 'rgba(245,240,232,0.9)', fontSize: 12.5, fontWeight: 600 }}>
                  {p.icon} {hi ? p.name_hi : p.name}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: col, background: `${col}18`, borderRadius: 8, padding: '2px 8px', marginLeft: 'auto' }}>{lab}</span>
                <span style={{ color: col, fontSize: 11 }}>{isOpen ? '▲' : '▾'}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '12px 14px', borderTop: `1px solid ${col}25`, background: 'rgba(0,0,0,0.15)' }}>
                  {/* Why */}
                  <p style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.82)', lineHeight: 1.7, marginBottom: 8 }}>
                    {hi ? r.why_hi : r.why_en}
                  </p>
                  {/* Benefit */}
                  <p style={{ fontSize: 12, color: GOLD, fontStyle: 'italic', marginBottom: 10 }}>
                    ✨ {hi ? r.benefit_hi : r.benefit_en}
                  </p>
                  {/* Daily practice */}
                  <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '9px 12px', marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                      {T('Daily Practice', 'दैनिक साधना')}
                    </p>
                    <p style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.78)', lineHeight: 1.7 }}>
                      {hi ? r.daily_hi : r.daily_en}
                    </p>
                  </div>
                  {/* Weekly practice */}
                  {(hi ? r.weekly_hi : r.weekly_en) && (
                    <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 8, padding: '9px 12px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                        {T('Weekly Practice', 'साप्ताहिक साधना')}
                      </p>
                      <p style={{ fontSize: 12, color: DIM, lineHeight: 1.7 }}>
                        {hi ? r.weekly_hi : r.weekly_en}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily puja sequence (compact numbered list) */}
      {puja.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(212,175,55,0.1)', margin: '0 0 14px' }} />
          <h4 style={{ color: 'rgba(212,175,55,0.75)', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            🕉 {T('Daily Puja Sequence', 'दैनिक पूजा क्रम')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {puja.map((step, i) => {
              const lbl = hi ? (step.label_hi || step.label_en || '') : (step.label_en || '');
              const act = hi ? (step.action_hi || step.action_en || '') : (step.action_en || '');
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: IVORY, margin: 0 }}>{lbl}</p>
                    {act && <p style={{ fontSize: 11.5, color: DIM, margin: '2px 0 0', lineHeight: 1.6 }}>{act.substring(0, 110)}{act.length > 110 ? '…' : ''}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sadhana duration */}
      {sadhana && (
        <div style={{ marginTop: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24', marginBottom: sadhana.reason_en ? 4 : 0 }}>
            ⏳ {T(`Practise for ${sadhana.days} days`, `${sadhana.days} दिन साधना करें`)}
          </p>
          {sadhana.reason_en && (
            <p style={{ fontSize: 12, color: DIM, lineHeight: 1.65, margin: 0 }}>
              {hi ? (sadhana.reason_hi || sadhana.reason_en) : sadhana.reason_en}
            </p>
          )}
          {sadhana.start_day_en && (
            <p style={{ fontSize: 11.5, color: 'rgba(245,240,232,0.38)', margin: '4px 0 0' }}>
              {hi ? (sadhana.start_day_hi || sadhana.start_day_en) : sadhana.start_day_en}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function DebugPanel({ debug }) {
  if (!debug) return null;
  return (
    <section style={{ background: '#0D0F1E', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: 18, marginTop: 8 }}>
      <p style={{ color: '#60A5FA', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🔧 Technical breakdown (Admin)</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14, fontSize: 12, color: DIM }}>
        <span>Lagna: <b style={{ color: IVORY }}>{debug.lagna?.sign} (#{debug.lagna?.num})</b></span>
        <span>Lagna lord: <b style={{ color: IVORY }}>{debug.lagna_lord?.planet} → H{debug.lagna_lord?.house}</b></span>
        <span>Moon: <b style={{ color: IVORY }}>sign {debug.moon?.sign}, nak {debug.moon?.nakshatra}</b></span>
        <span>Dasha: <b style={{ color: IVORY }}>{debug.dasha?.maha} / {debug.dasha?.antar}</b></span>
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
          <thead><tr style={{ color: '#60A5FA' }}>
            {['Planet', 'Sign', 'House', 'Dignity'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '4px 8px' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {Object.entries(debug.planets || {}).map(([name, p]) => (
              <tr key={name} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: IVORY }}>
                <td style={{ padding: '4px 8px' }}>{name}</td><td style={{ padding: '4px 8px' }}>{p.sign}</td>
                <td style={{ padding: '4px 8px' }}>H{p.house}</td><td style={{ padding: '4px 8px' }}>{p.dignity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: '#60A5FA', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Area scores & matched rules</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(debug.areas || []).map((a) => (
          <div key={a.area} style={{ fontSize: 12, color: DIM }}>
            <b style={{ color: IVORY }}>{a.area}</b> — score {a.score}/5 · {a.label} · <span style={{ color: 'rgba(245,240,232,0.4)' }}>[{a.rule_ids.join(', ')}]</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GuidanceReport({ uuid, admin = false, name = '', lang = 'hi', judgement = null }) {
  const L  = normLang(lang);
  const ui = UI[L];
  const [report, setReport]                   = useState(null);
  const [daily,  setDaily]                    = useState(null);
  const [personalizedRemedies, setRemedies]   = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error,   setError]                   = useState(null);
  const [showDebug, setShowDebug]             = useState(false);

  const handlePrint = () => {
    if (!report) return;
    const html = buildPrintHtml(report, daily, name, L, ui, judgement, personalizedRemedies);
    const w = window.open('', '_blank');
    if (!w) { alert(ui.popup); return; }
    w.document.open(); w.document.write(html); w.document.close();
    let done = false;
    const go = () => { if (done) return; done = true; try { w.focus(); w.print(); } catch (_) {} };
    w.onload = () => setTimeout(go, 500);
    setTimeout(go, 1300);
  };

  useEffect(() => {
    if (!uuid) return;
    setLoading(true); setError(null);
    const client = admin ? adminApi : api;
    const url    = admin ? `/admin/kundlis/${uuid}/guidance` : `/kundli/${uuid}/guidance`;
    client.get(url, { params: { lang: L } })
      .then(({ data }) => {
        setReport(data.report);
        setDaily(data.daily);
        setRemedies(data.personalizedRemedies || null);
      })
      .catch((e) => setError(e?.response?.data?.message || ui.error))
      .finally(() => setLoading(false));
  }, [uuid, admin, L]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: DIM }}>
      <div style={{ fontSize: 38, marginBottom: 12, animation: 'spin 2.5s linear infinite', display: 'inline-block' }}>🪔</div>
      <p>{ui.loading}</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error)   return <div style={{ padding: 28, textAlign: 'center', color: '#F87171' }}>{error}</div>;
  if (!report) return null;

  // Enrich sections: inject remedy hints into care-status areas + enhance remedies section
  const enrichedSections = enrichSectionsWithHints(report.sections || [], personalizedRemedies, L);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {ui.printBtn}
        </button>
      </div>

      <div className="simple-report-print-area">
        {judgement && <JudgementPanel judgement={judgement} lang={L} admin={admin} />}

        <section style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
          <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{ui.title}</h2>
          {(report.summary?.lines || []).map((l, i) => (
            <p key={i} style={{ color: IVORY, fontSize: 14.5, lineHeight: 1.9, marginBottom: 6 }}>{l}</p>
          ))}
        </section>

        {daily && (
          <section style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
            <h3 style={{ color: '#93C5FD', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>📅 {daily.heading}</h3>
            {daily.text && <p style={{ color: IVORY, fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>{daily.text}</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(daily.points || []).map((p, i) => <li key={i} style={{ color: DIM, fontSize: 13.5, lineHeight: 1.7 }}>• {p}</li>)}
            </ul>
            {daily.advice?.filter(Boolean).map((a, i) => <p key={i} style={{ marginTop: 8, color: '#A7F3D0', fontSize: 13 }}>✓ {ui.advice}: {a}</p>)}
            {daily.caution?.filter(Boolean).map((c, i) => <p key={i} style={{ marginTop: 4, color: '#FCD9A0', fontSize: 13 }}>⚠ {ui.caution}: {c}</p>)}
            {daily.lucky && <p style={{ marginTop: 8, color: GOLD, fontSize: 13 }}>🍀 {ui.lucky}: {daily.lucky}</p>}
          </section>
        )}

        {enrichedSections.map((s) => <SectionCard key={s.key} section={s} ui={ui} />)}

        {/* 🪷 Personalized Remedy Plan */}
        <RemedyPlanBlock plan={personalizedRemedies} lang={L} />

        <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>{ui.disclaimer}</p>
      </div>

      {admin && report.debug && (
        <div style={{ marginTop: 18 }}>
          <button onClick={() => setShowDebug((v) => !v)} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', color: '#60A5FA', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {showDebug ? ui.dHide : ui.dShow}
          </button>
          {showDebug && <DebugPanel debug={report.debug} />}
        </div>
      )}
    </div>
  );
}
