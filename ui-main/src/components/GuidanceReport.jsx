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

// UI chrome strings per language (the engine returns the report content already
// in the selected language; these are only the surrounding labels).
const UI = {
  en: { loading: 'Preparing your life report…', error: 'Could not load the report.', advice: 'Advice', caution: 'Caution', lucky: 'Lucky', disclaimer: 'This report is guidance based on astrological calculation and traditional rules — take it for positive direction, not for fear.', printBtn: '🖨️ PDF / Print', title: '🪔 Life Guidance Report', docTitle: 'Life Guidance Report', popup: 'Please allow pop-ups for this site.', dShow: '🔧 Show technical details (Admin)', dHide: '▲ Hide technical details', locale: 'en-IN' },
  hi: { loading: 'आपकी जीवन रिपोर्ट तैयार हो रही है…', error: 'रिपोर्ट लोड नहीं हो पाई।', advice: 'सलाह', caution: 'सावधानी', lucky: 'शुभ', disclaimer: 'यह रिपोर्ट ज्योतिषीय गणना और परंपरागत नियमों पर आधारित मार्गदर्शन है — इसे सकारात्मक दिशा के लिए लें, किसी डर के लिए नहीं।', printBtn: '🖨️ PDF / प्रिंट', title: '🪔 जीवन मार्गदर्शन रिपोर्ट', docTitle: 'जीवन मार्गदर्शन रिपोर्ट', popup: 'कृपया इस साइट के लिए पॉप-अप की अनुमति दें।', dShow: '🔧 तकनीकी विवरण देखें (Admin)', dHide: '▲ तकनीकी विवरण छिपाएं', locale: 'hi-IN' },
  hinglish: { loading: 'Aapki life report ready ho rahi hai…', error: 'Report load nahi ho payi.', advice: 'Advice', caution: 'Caution', lucky: 'Lucky', disclaimer: 'Yeh report astrological calculation aur traditional rules par based guidance hai — ise positive direction ke liye lein, dar ke liye nahi.', printBtn: '🖨️ PDF / Print', title: '🪔 Life Guidance Report', docTitle: 'Life Guidance Report', popup: 'Please is site ke liye pop-up allow karein.', dShow: '🔧 Technical details dekhein (Admin)', dHide: '▲ Technical details chhipayein', locale: 'hi-IN' },
};

const STATUS_COLORS = {
  strong: { c: '#34D399', bg: 'rgba(52,211,153,0.12)', b: 'rgba(52,211,153,0.3)' },
  mid: { c: '#60A5FA', bg: 'rgba(96,165,250,0.12)', b: 'rgba(96,165,250,0.3)' },
  care: { c: '#FBBF24', bg: 'rgba(245,158,11,0.12)', b: 'rgba(245,158,11,0.3)' },
};
const colorOf = (key) => STATUS_COLORS[key] || STATUS_COLORS.mid;

// ── Print / Save-as-PDF (browser renders any script correctly; no server font) ──
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildPrintHtml(report, daily, name, lang, ui) {
  const pill = (s) => s.status ? `<span class="pill st-${s.statusKey || 'mid'}">${esc(s.status)}</span>` : '';
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
<div class="summary">${(report.summary?.lines || []).map((l) => `<p>${esc(l)}</p>`).join('')}</div>
${dailyHtml}
${(report.sections || []).map(block).join('')}
<div class="foot">${esc(ui.disclaimer)}<br/>© ${new Date().getFullYear()} Jyotish Stack AI · jyotishstack.com</div>
</div></body></html>`;
}

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

export default function GuidanceReport({ uuid, admin = false, name = '', lang = 'hi', judgement = null }) {
  const L = normLang(lang);
  const ui = UI[L];
  const [report, setReport] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const handlePrint = () => {
    if (!report) return;
    const html = buildPrintHtml(report, daily, name, L, ui);
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
    const url = admin ? `/admin/kundlis/${uuid}/guidance` : `/kundli/${uuid}/guidance`;
    client.get(url, { params: { lang: L } })
      .then(({ data }) => { setReport(data.report); setDaily(data.daily); })
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
  if (error) return <div style={{ padding: 28, textAlign: 'center', color: '#F87171' }}>{error}</div>;
  if (!report) return null;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {ui.printBtn}
        </button>
      </div>

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

      {(report.sections || []).map((s) => <SectionCard key={s.key} section={s} ui={ui} />)}

      <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>{ui.disclaimer}</p>

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
