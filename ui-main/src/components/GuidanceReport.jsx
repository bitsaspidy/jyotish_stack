'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.55)';

// status label → colour (we read the soft Hindi label, never a raw score)
function statusColor(label = '') {
  if (label.includes('मजबूत')) return { c: '#34D399', bg: 'rgba(52,211,153,0.12)', b: 'rgba(52,211,153,0.3)' };
  if (label.includes('सामान्य')) return { c: '#60A5FA', bg: 'rgba(96,165,250,0.12)', b: 'rgba(96,165,250,0.3)' };
  return { c: '#FBBF24', bg: 'rgba(245,158,11,0.12)', b: 'rgba(245,158,11,0.3)' }; // needs care
}

function StatusPill({ label }) {
  if (!label) return null;
  const s = statusColor(label);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.c, border: `1px solid ${s.b}`, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function SectionCard({ section }) {
  if (!section) return null;
  const { heading, status, text, points = [], advice = [], caution = [] } = section;
  return (
    <section style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.14)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700 }}>{heading}</h3>
        <StatusPill label={status} />
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
        <div key={`a${i}`} style={{ marginTop: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: 8, padding: '8px 12px', color: '#A7F3D0', fontSize: 13, lineHeight: 1.7 }}>
          ✓ सलाह: {a}
        </div>
      ))}
      {caution.filter(Boolean).map((c, i) => (
        <div key={`c${i}`} style={{ marginTop: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, padding: '8px 12px', color: '#FCD9A0', fontSize: 13, lineHeight: 1.7 }}>
          ⚠ सावधानी: {c}
        </div>
      ))}
    </section>
  );
}

function DebugPanel({ debug }) {
  if (!debug) return null;
  return (
    <section style={{ background: '#0D0F1E', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: 18, marginTop: 8 }}>
      <p style={{ color: '#60A5FA', fontWeight: 700, fontSize: 13, marginBottom: 12 }}>🔧 तकनीकी विवरण (Admin Debug)</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14, fontSize: 12, color: DIM }}>
        <span>लग्न: <b style={{ color: IVORY }}>{debug.lagna?.sign} (#{debug.lagna?.num})</b></span>
        <span>लग्नेश: <b style={{ color: IVORY }}>{debug.lagna_lord?.planet} → H{debug.lagna_lord?.house}</b></span>
        <span>चंद्र: <b style={{ color: IVORY }}>sign {debug.moon?.sign}, nak {debug.moon?.nakshatra}</b></span>
        <span>दशा: <b style={{ color: IVORY }}>{debug.dasha?.maha} / {debug.dasha?.antar}</b></span>
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

export default function GuidanceReport({ uuid, admin = false }) {
  const [report, setReport] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true); setError(null);
    const client = admin ? adminApi : api;
    const url = admin ? `/admin/kundlis/${uuid}/guidance` : `/kundli/${uuid}/guidance`;
    client.get(url)
      .then(({ data }) => { setReport(data.report); setDaily(data.daily); })
      .catch((e) => setError(e?.response?.data?.message || 'रिपोर्ट लोड नहीं हो पाई'))
      .finally(() => setLoading(false));
  }, [uuid, admin]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: DIM }}>
      <div style={{ fontSize: 38, marginBottom: 12, animation: 'spin 2.5s linear infinite', display: 'inline-block' }}>🪔</div>
      <p>आपकी जीवन रिपोर्ट तैयार हो रही है…</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error) return <div style={{ padding: 28, textAlign: 'center', color: '#F87171' }}>{error}</div>;
  if (!report) return null;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Summary */}
      <section style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
        <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>🪔 {report.summary?.heading}</h2>
        {(report.summary?.lines || []).map((l, i) => (
          <p key={i} style={{ color: IVORY, fontSize: 14.5, lineHeight: 1.9, marginBottom: 6 }}>{l}</p>
        ))}
      </section>

      {/* Today's guidance */}
      {daily && (
        <section style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
          <h3 style={{ color: '#93C5FD', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>📅 {daily.heading}</h3>
          {daily.text && <p style={{ color: IVORY, fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>{daily.text}</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(daily.points || []).map((p, i) => <li key={i} style={{ color: DIM, fontSize: 13.5, lineHeight: 1.7 }}>• {p}</li>)}
          </ul>
          {daily.advice?.filter(Boolean).map((a, i) => <p key={i} style={{ marginTop: 8, color: '#A7F3D0', fontSize: 13 }}>✓ सलाह: {a}</p>)}
          {daily.caution?.filter(Boolean).map((c, i) => <p key={i} style={{ marginTop: 4, color: '#FCD9A0', fontSize: 13 }}>⚠ सावधानी: {c}</p>)}
          {daily.lucky && <p style={{ marginTop: 8, color: GOLD, fontSize: 13 }}>🍀 शुभ: {daily.lucky}</p>}
        </section>
      )}

      {/* Life-area sections */}
      {(report.sections || []).map((s) => <SectionCard key={s.key} section={s} />)}

      {/* Disclaimer */}
      <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>
        यह रिपोर्ट ज्योतिषीय गणना और परंपरागत नियमों पर आधारित मार्गदर्शन है — इसे सकारात्मक दिशा के लिए लें, किसी डर के लिए नहीं।
      </p>

      {/* Admin debug toggle */}
      {admin && report.debug && (
        <div style={{ marginTop: 18 }}>
          <button onClick={() => setShowDebug((v) => !v)} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', color: '#60A5FA', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {showDebug ? '▲ तकनीकी विवरण छिपाएं' : '🔧 तकनीकी विवरण देखें (Admin)'}
          </button>
          {showDebug && <DebugPanel debug={report.debug} />}
        </div>
      )}
    </div>
  );
}
