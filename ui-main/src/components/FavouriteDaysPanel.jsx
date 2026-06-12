'use client';
import { useState } from 'react';

const SCORE_COLOR = (s) => s >= 4.5 ? '#D4AF37' : s >= 3.5 ? '#22C55E' : s >= 2.5 ? '#60A5FA' : '#EF4444';
const SCORE_LABEL = { en: (s) => s >= 4.5 ? 'Excellent' : s >= 3.5 ? 'Good' : s >= 2.5 ? 'Average' : 'Weak',
                      hi: (s) => s >= 4.5 ? 'उत्तम'     : s >= 3.5 ? 'अच्छा' : s >= 2.5 ? 'सामान्य'  : 'कमज़ोर' };
const WEEKDAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_HI = ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

function Stars({ score }) {
  const filled = Math.round(score);
  return (
    <span style={{ letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? SCORE_COLOR(score) : 'rgba(255,255,255,0.12)', fontSize: 11 }}>★</span>
      ))}
    </span>
  );
}

function PurposeCard({ item, lang, isToday }) {
  const [open, setOpen] = useState(false);
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const color = SCORE_COLOR(item.score);

  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: isToday ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isToday ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{item.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600, margin: 0 }}>
            {T(item.purpose_en, item.purpose_hi)}
          </p>
          <Stars score={item.score} />
        </div>
        <span style={{ color: 'rgba(245,240,232,0.3)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Best day badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${color}18`, border: `1px solid ${color}40`,
          borderRadius: 8, padding: '5px 12px',
        }}>
          <span style={{ fontSize: 14 }}>{item.planet_icon}</span>
          <div>
            <p style={{ color, fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {T(item.best_day, item.best_day_hi)}
            </p>
            <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 10, margin: 0 }}>
              {T('Best day', 'सर्वोत्तम दिन')}
            </p>
          </div>
        </div>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 1 }}>
          <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: 10, margin: 0 }}>
            {T('Also good:', 'यह भी:')} <span style={{ color: '#60A5FA' }}>{T(item.alt_day, item.alt_day_hi)}</span>
          </p>
          {item.avoid_day && (
            <p style={{ color: 'rgba(239,68,68,0.6)', fontSize: 10, margin: 0 }}>
              {T('Avoid:', 'बचें:')} <span style={{ color: '#EF4444' }}>{T(item.avoid_day, item.avoid_day_hi)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: 'rgba(245,240,232,0.55)', fontSize: 12, lineHeight: 1.6, margin: '0 0 6px' }}>
            {T(item.tip_en, item.tip_hi)}
          </p>
          <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: 11, margin: 0 }}>
            {T('Why: ', 'क्यों: ')}<span style={{ color: SCORE_COLOR(item.score) }}>{item.reason_en}</span>
            {' · '}<span style={{ color: 'rgba(245,240,232,0.35)' }}>{T(SCORE_LABEL.en(item.score), SCORE_LABEL.hi(item.score))}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function FavouriteDaysPanel({ favouriteDays, lang = 'en' }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;

  if (!favouriteDays?.purposes?.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: 13 }}>
        {T('Chart data not available', 'चार्ट डेटा उपलब्ध नहीं')}
      </div>
    );
  }

  const todayIdx = new Date().getDay();
  const { purposes, by_day } = favouriteDays;
  const todayPurposes = by_day?.find(d => d.day_num === todayIdx)?.purposes || [];

  return (
    <div>
      {/* Today banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
        border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12,
        padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ color: '#D4AF37', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
            {T('Today', 'आज')}
          </p>
          <p style={{ color: '#F5F0E8', fontSize: 16, fontWeight: 700, margin: 0 }}>
            {T(WEEKDAYS_EN[todayIdx], WEEKDAYS_HI[todayIdx])}
          </p>
        </div>
        {todayPurposes.length > 0 ? (
          <div style={{ flex: 1 }}>
            <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: 11, margin: '0 0 6px' }}>
              {T('Favourable for:', 'शुभ कार्य:')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {todayPurposes.map(p => (
                <span key={p.key} style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#86EFAC',
                }}>
                  {p.icon} {T(p.purpose_en, p.purpose_hi)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12, margin: 0 }}>
            {T('A mixed day — proceed with general caution.', 'सामान्य सतर्कता के साथ आगे बढ़ें।')}
          </p>
        )}
      </div>

      {/* Purpose grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {purposes.map(item => (
          <PurposeCard
            key={item.key}
            item={item}
            lang={lang}
            isToday={item.best_day_num === todayIdx}
          />
        ))}
      </div>

      {/* Weekly overview */}
      <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
        <p style={{ color: 'rgba(212,175,55,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 12 }}>
          {T('Weekly Overview', 'साप्ताहिक सारांश')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {by_day.map(d => (
            <div key={d.day_num} style={{
              textAlign: 'center', padding: '8px 4px', borderRadius: 8,
              background: d.day_num === todayIdx ? 'rgba(212,175,55,0.1)' : 'transparent',
              border: `1px solid ${d.day_num === todayIdx ? 'rgba(212,175,55,0.3)' : 'transparent'}`,
            }}>
              <p style={{ color: d.day_num === todayIdx ? '#D4AF37' : 'rgba(245,240,232,0.45)', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
                {T(d.day_en.slice(0, 3), d.day_hi.slice(0, 3))}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                {d.purposes.length ? d.purposes.map(p => (
                  <span key={p.key} title={T(p.purpose_en, p.purpose_hi)} style={{ fontSize: 14 }}>{p.icon}</span>
                )) : <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ color: 'rgba(245,240,232,0.2)', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
        {T('Based on planetary dignities and house placements in your birth chart (BPHS)', 'जन्म कुंडली में ग्रह बल और भाव स्थिति के आधार पर (बृहत् पाराशर होरा शास्त्र)')}
      </p>
    </div>
  );
}
