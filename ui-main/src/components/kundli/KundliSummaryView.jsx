'use client';
import { useState } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD   = '#D4AF37';
const DIM    = 'rgba(245,240,232,0.35)';
const IVORY  = 'rgba(245,240,232,0.85)';
const CARD   = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(212,175,55,0.13)';

const STATUS_COLOR = {
  strong:      '#22C55E',
  balanced:    '#60A5FA',
  'needs-care':'#F59E0B',
  challenging: '#EF4444',
};
const STATUS_BG = {
  strong:      'rgba(34,197,94,0.10)',
  balanced:    'rgba(96,165,250,0.09)',
  'needs-care':'rgba(245,158,11,0.10)',
  challenging: 'rgba(239,68,68,0.10)',
};
const STATUS_LABEL_EN = { strong:'Good', balanced:'Balanced', 'needs-care':'Needs Care', challenging:'Focus Needed' };
const STATUS_LABEL_HI = { strong:'अच्छा', balanced:'संतुलित', 'needs-care':'सावधानी जरूरी', challenging:'ध्यान दें' };

function t(lang, en, hi) { return lang === 'hi' ? hi : en; }

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, lang }) {
  if (!status) return null;
  const col   = STATUS_COLOR[status] || '#9CA3AF';
  const bg    = STATUS_BG[status]    || 'rgba(255,255,255,0.07)';
  const label = lang === 'hi' ? (STATUS_LABEL_HI[status] || status) : (STATUS_LABEL_EN[status] || status);
  return (
    <span style={{
      display:'inline-block', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
      color:col, background:bg, border:`1px solid ${col}44`, letterSpacing:'0.04em',
    }}>
      {label}
    </span>
  );
}

// ─── Level 1: Summary Card ────────────────────────────────────────────────────
function SummaryCard({ card, lang }) {
  const title = t(lang, card.titleEn, card.titleHi);
  const value = t(lang, card.valueEn, card.valueHi);
  const desc  = t(lang, card.descEn,  card.descHi);
  const meta  = card.metaEn ? t(lang, card.metaEn, card.metaHi) : null;

  // For strong/care cards that have items[]
  const items = card.items;

  return (
    <div style={{
      background: CARD,
      border: BORDER,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:DIM, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {card.icon} {title}
        </span>
        {card.status && <StatusBadge status={card.status} lang={lang} />}
      </div>

      {value && (
        <p style={{ fontSize:14, fontWeight:700, color:GOLD, fontFamily:'Georgia,serif', lineHeight:1.3, marginTop:2 }}>
          {value}
        </p>
      )}

      {desc && (
        <p style={{ fontSize:11, color:IVORY, lineHeight:1.6, fontFamily:'var(--font-devanagari),sans-serif' }}>
          {desc}
        </p>
      )}

      {meta && (
        <p style={{ fontSize:9, color:DIM, fontFamily:'monospace', marginTop:2 }}>{meta}</p>
      )}

      {/* For strong/care cards: show items as compact pills */}
      {items && items.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
          {items.map((item, i) => (
            <span key={i} style={{
              fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:20,
              color: STATUS_COLOR[item.status] || '#9CA3AF',
              background: STATUS_BG[item.status] || 'rgba(255,255,255,0.04)',
              border:`1px solid ${(STATUS_COLOR[item.status] || '#9CA3AF')}33`,
              fontFamily:'var(--font-devanagari),sans-serif',
            }}>
              {t(lang, item.titleEn, item.titleHi)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Level 2: Life Area Card ─────────────────────────────────────────────────
function LifeAreaCard({ area, lang }) {
  const [open, setOpen] = useState(false);

  const title     = t(lang, area.titleEn, area.titleHi);
  const summary   = t(lang, area.summaryEn, area.summaryHi);
  const goodPts   = lang === 'hi' ? (area.goodPointsHi || []) : (area.goodPoints || []);
  const challenges = lang === 'hi' ? (area.challengesHi || []) : (area.challenges || []);
  const advice    = t(lang, area.adviceEn, area.adviceHi);
  const hasMore   = goodPts.length > 0 || challenges.length > 0 || advice;

  const statusColor = STATUS_COLOR[area.status] || '#9CA3AF';

  return (
    <div style={{
      background: CARD,
      border: `1px solid ${area.status === 'strong' ? 'rgba(34,197,94,0.20)' : area.status === 'challenging' ? 'rgba(239,68,68,0.18)' : 'rgba(212,175,55,0.13)'}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div
        style={{ padding:'12px 14px', cursor: hasMore ? 'pointer' : 'default' }}
        onClick={() => hasMore && setOpen(o => !o)}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16 }}>{area.icon}</span>
            <span style={{ fontSize:11, fontWeight:700, color:IVORY, fontFamily:'var(--font-devanagari),sans-serif' }}>
              {title}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <StatusBadge status={area.status} lang={lang} />
            {hasMore && (
              <span style={{ fontSize:10, color:DIM, transition:'transform 0.2s', display:'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            )}
          </div>
        </div>

        {/* Status bar */}
        {area.score != null && (
          <div style={{ height:3, borderRadius:3, background:'rgba(255,255,255,0.06)', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${Math.min(Math.max(area.score, 0), 100)}%`, borderRadius:3, background:statusColor, transition:'width 0.5s ease' }} />
          </div>
        )}

        <p style={{ fontSize:11, color:'rgba(245,240,232,0.70)', lineHeight:1.55, fontFamily:'var(--font-devanagari),sans-serif' }}>
          {summary}
        </p>
      </div>

      {/* Expandable details */}
      {open && hasMore && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'10px 14px 12px', display:'flex', flexDirection:'column', gap:8 }}>
          {goodPts.length > 0 && (
            <div>
              <p style={{ fontSize:9, color:'#22C55E', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                {t(lang,'Positive Points','सकारात्मक बिंदु')}
              </p>
              {goodPts.slice(0, 3).map((p, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:3 }}>
                  <span style={{ color:'#22C55E', fontSize:9, flexShrink:0, marginTop:2 }}>▸</span>
                  <p style={{ fontSize:10, color:'rgba(245,240,232,0.65)', lineHeight:1.5, fontFamily:'var(--font-devanagari),sans-serif' }}>{p}</p>
                </div>
              ))}
            </div>
          )}

          {challenges.length > 0 && (
            <div>
              <p style={{ fontSize:9, color:'#F59E0B', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                {t(lang,'Points to Watch','ध्यान देने योग्य')}
              </p>
              {challenges.slice(0, 2).map((c, i) => (
                <div key={i} style={{ display:'flex', gap:6, marginBottom:3 }}>
                  <span style={{ color:'#F59E0B', fontSize:9, flexShrink:0, marginTop:2 }}>◈</span>
                  <p style={{ fontSize:10, color:'rgba(245,240,232,0.65)', lineHeight:1.5, fontFamily:'var(--font-devanagari),sans-serif' }}>{c}</p>
                </div>
              ))}
            </div>
          )}

          {advice && (
            <div style={{ background:'rgba(212,175,55,0.07)', borderRadius:8, padding:'8px 10px', border:'1px solid rgba(212,175,55,0.15)' }}>
              <p style={{ fontSize:9, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                {t(lang,'Guidance','मार्गदर्शन')}
              </p>
              <p style={{ fontSize:10, color:'rgba(245,240,232,0.70)', lineHeight:1.55, fontFamily:'var(--font-devanagari),sans-serif' }}>{advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overall score banner ─────────────────────────────────────────────────────
function OverallBanner({ userSummary, lang }) {
  const cards = userSummary?.summaryCards || [];
  const dirCard = cards.find(c => c.cardKey === 'direction');
  if (!dirCard) return null;

  const score  = dirCard.score;
  const label  = t(lang, dirCard.valueEn, dirCard.valueHi);
  const status = dirCard.status || 'balanced';
  const col    = STATUS_COLOR[status] || '#60A5FA';

  return (
    <div style={{
      background: 'rgba(212,175,55,0.06)',
      border: `1px solid ${col}33`,
      borderRadius: 14,
      padding: '14px 20px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div>
        <p style={{ fontSize:10, color:DIM, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>
          {t(lang,'Overall Kundli Picture','कुंडली का समग्र चित्र')}
        </p>
        <p style={{ fontSize:16, fontWeight:700, color:IVORY, fontFamily:'Georgia,serif' }}>{label}</p>
      </div>
      {score != null && (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:`conic-gradient(${col} 0% ${score}%, rgba(255,255,255,0.06) ${score}% 100%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:'#0D0D14', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:col }}>{score}</span>
            </div>
          </div>
          <StatusBadge status={status} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function KundliSummaryView({ userSummary, lang = 'en' }) {
  if (!userSummary?.summaryCards?.length) return null;

  const { summaryCards = [], lifeAreaCards = [] } = userSummary;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Overall banner */}
      <OverallBanner userSummary={userSummary} lang={lang} />

      {/* Level 1: 7 Summary Cards */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{
          fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: 12,
        }}>
          ✦ {t(lang, 'About You', 'आपके बारे में')}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
        }}>
          {summaryCards.map(card => (
            <SummaryCard key={card.cardKey} card={card} lang={lang} />
          ))}
        </div>
      </div>

      {/* Level 2: 10 Life Area Cards */}
      <div>
        <h3 style={{
          fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: 12,
        }}>
          ✦ {t(lang, 'Your Life Areas', 'जीवन के क्षेत्र')}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
        }}>
          {lifeAreaCards.map(area => (
            <LifeAreaCard key={area.areaKey} area={area} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}
