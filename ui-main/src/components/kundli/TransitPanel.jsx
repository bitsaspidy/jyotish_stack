'use client';

import { useState } from 'react';

/**
 * 🌍 गोचर / Transit — what today's planets are doing in THIS chart.
 *
 * The public /planetary-positions page shows the sky for everyone; this shows the
 * same sky mapped onto the user's own Lagna and Moon. All numbers and text arrive
 * pre-composed from services/transit — this component picks a language and lays it
 * out, it does no astrology.
 *
 * User side: one simple line per planet, plus Sade Sati / Dhaiyya alerts.
 * Admin side (`admin`): a technical table — house-from-Lagna, house-from-Moon, the
 * classical favourability rule applied, and the retrograde flag — the reasoning
 * behind every verdict.
 */

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.55)';

const FAVOUR_STYLE = {
  favorable:   { c: '#22C55E', bg: 'rgba(34,197,94,0.12)',  b: 'rgba(34,197,94,0.30)' },
  neutral:     { c: '#60A5FA', bg: 'rgba(96,165,250,0.12)', b: 'rgba(96,165,250,0.30)' },
  challenging: { c: '#F59E0B', bg: 'rgba(245,158,11,0.12)', b: 'rgba(245,158,11,0.30)' },
};

const PLANET_GLYPH = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};

const TONE_COLOR = { supportive: '#22C55E', mixed: '#60A5FA', demanding: '#F59E0B' };

export default function TransitPanel({ transit, lang = 'hi', admin = false }) {
  const [showTech, setShowTech] = useState(false);
  const isHi = lang === 'hi';
  const L = (pair) => (!pair ? '' : (isHi ? pair.hi : pair.en));

  if (!transit) return null;

  if (!transit.available) {
    return (
      <section style={{ border: '1px solid rgba(212,175,55,0.18)', borderRadius: 16, padding: '18px 20px', marginBottom: 20, background: 'rgba(212,175,55,0.03)' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 15.5, fontWeight: 700, marginBottom: 8 }}>
          🌍 {isHi ? 'गोचर' : 'Transit'}
        </h3>
        <p style={{ color: DIM, fontSize: 12.5, lineHeight: 1.8 }}>{transit.message}</p>
      </section>
    );
  }

  const toneColor = TONE_COLOR[transit.overall?.tone] || '#60A5FA';

  return (
    <section style={{ border: '1px solid rgba(212,175,55,0.22)', borderRadius: 16, padding: '20px 22px', marginBottom: 20, background: 'rgba(212,175,55,0.035)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700 }}>
          🌍 {isHi ? 'आज का गोचर' : "Today's Transit"}
        </h3>
        {transit.date && <span style={{ color: DIM, fontSize: 11 }}>{transit.date}</span>}
      </div>
      <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7, marginBottom: 14 }}>
        {isHi
          ? 'इस समय ग्रह आकाश में कहाँ हैं और वे आपकी कुंडली के किन भावों को छू रहे हैं'
          : 'Where the planets are in the sky right now, and which houses of your chart they are touching'}
      </p>

      {/* Overall tilt */}
      {transit.overall && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: toneColor, background: 'rgba(255,255,255,0.05)', border: `1px solid ${toneColor}44`, borderRadius: 12, padding: '3px 12px' }}>
            {isHi ? 'समग्र रुझान: ' : 'Overall: '}{L(transit.overall.tone_label)}
          </span>
        </div>
      )}

      {/* Special conditions first — this is what users came to check */}
      {(transit.special || []).map((s, i) => (
        <div key={i} style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', borderRadius: 10, padding: '11px 13px', marginBottom: 12 }}>
          <div style={{ color: '#F59E0B', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>⚠ {L(s.title)}</div>
          <p style={{ color: IVORY, fontSize: 12, lineHeight: 1.75 }}>{L(s.detail)}</p>
        </div>
      ))}

      {/* Per-planet lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {(transit.planets || []).map((p) => {
          const st = FAVOUR_STYLE[p.favour] || FAVOUR_STYLE.neutral;
          return (
            <div key={p.planet} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 18, color: GOLD, width: 22, textAlign: 'center', flexShrink: 0, lineHeight: 1.5 }}>
                {PLANET_GLYPH[p.planet] || '•'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ color: IVORY, fontSize: 12.5, fontWeight: 700 }}>{p.planet_label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: st.c, background: st.bg, border: `1px solid ${st.b}`, borderRadius: 9, padding: '2px 8px' }}>
                    {L(p.favour_label)}
                  </span>
                  {p.is_retrograde && (
                    <span style={{ fontSize: 10, color: '#F97316' }}>℞ {isHi ? 'वक्री' : 'retrograde'}</span>
                  )}
                </div>
                <p style={{ color: DIM, fontSize: 12, lineHeight: 1.75 }}>{p.summary}</p>
                {(p.notes || []).map((n, i) => (
                  <p key={i} style={{ color: 'rgba(249,115,22,0.75)', fontSize: 11, lineHeight: 1.7, marginTop: 4 }}>{n}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer — the chart is always active; a transit is a passing influence */}
      {transit.disclaimer && (
        <p style={{ color: DIM, fontSize: 11, lineHeight: 1.8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {L(transit.disclaimer)}
        </p>
      )}

      {/* ── Admin-only technical evidence ─────────────────────────────────── */}
      {admin && transit.evidence && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(167,139,250,0.25)' }}>
          <button onClick={() => setShowTech((v) => !v)} style={{
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA',
            borderRadius: 7, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            {showTech ? '▾' : '▸'} Technical reasoning ({transit.rule_version})
          </button>

          {showTech && (
            <div style={{ marginTop: 10, fontSize: 11, color: DIM, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 8 }}>
                Natal Moon rashi <strong style={{ color: IVORY }}>{transit.evidence.moon_rashi}</strong>,
                Lagna rashi <strong style={{ color: IVORY }}>{transit.evidence.lagna_rashi}</strong>.
                Favourability is judged FROM THE MOON (classical Gochar); the life area is read FROM THE LAGNA.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, minWidth: 460 }}>
                  <thead>
                    <tr style={{ color: '#A78BFA', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px' }}>Planet</th>
                      <th style={{ padding: '4px 6px' }}>Rashi</th>
                      <th style={{ padding: '4px 6px' }}>H(Lagna)</th>
                      <th style={{ padding: '4px 6px' }}>H(Moon)</th>
                      <th style={{ padding: '4px 6px' }}>Verdict</th>
                      <th style={{ padding: '4px 6px' }}>Rule applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transit.evidence.rows.map((r) => (
                      <tr key={r.planet} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '4px 6px', color: IVORY }}>{r.planet}{r.retrograde ? ' ℞' : ''}</td>
                        <td style={{ padding: '4px 6px' }}>{r.rashi}</td>
                        <td style={{ padding: '4px 6px' }}>{r.house_from_lagna}</td>
                        <td style={{ padding: '4px 6px' }}>{r.house_from_moon}</td>
                        <td style={{ padding: '4px 6px', color: (FAVOUR_STYLE[r.favour] || FAVOUR_STYLE.neutral).c }}>{r.favour}</td>
                        <td style={{ padding: '4px 6px', color: 'rgba(245,240,232,0.4)' }}>{r.rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8 }}>
                Slow-planet tally (Saturn/Jupiter/Rahu/Ketu): {transit.evidence.slow_tally.favorable} favourable ·
                {' '}{transit.evidence.slow_tally.challenging} challenging → tone <strong style={{ color: IVORY }}>{transit.evidence.slow_tally.tone}</strong>.
              </div>
              <div style={{ marginTop: 6, color: 'rgba(245,240,232,0.4)', fontSize: 10 }}>{transit.evidence.source}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
