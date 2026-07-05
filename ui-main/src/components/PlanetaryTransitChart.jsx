'use client';

import { t, planetName } from '../lib/astroI18n';

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B' },
  Moon:    { icon:'☽', color:'#CBD5E1' },
  Mars:    { icon:'♂', color:'#F87171' },
  Mercury: { icon:'☿', color:'#34D399' },
  Jupiter: { icon:'♃', color:'#FCD34D' },
  Venus:   { icon:'♀', color:'#F9A8D4' },
  Saturn:  { icon:'♄', color:'#A5B4FC' },
  Rahu:    { icon:'☊', color:'#C4B5FD' },
  Ketu:    { icon:'☋', color:'#9CA3AF' },
};

const RASHI_META = {
  1:  { symbol:'♈', en:'Aries',       hi:'मेष',    row:1, col:2 },
  2:  { symbol:'♉', en:'Taurus',      hi:'वृषभ',   row:1, col:3 },
  3:  { symbol:'♊', en:'Gemini',      hi:'मिथुन',  row:1, col:4 },
  4:  { symbol:'♋', en:'Cancer',      hi:'कर्क',    row:2, col:4 },
  5:  { symbol:'♌', en:'Leo',         hi:'सिंह',    row:3, col:4 },
  6:  { symbol:'♍', en:'Virgo',       hi:'कन्या',   row:4, col:4 },
  7:  { symbol:'♎', en:'Libra',       hi:'तुला',    row:4, col:3 },
  8:  { symbol:'♏', en:'Scorpio',     hi:'वृश्चिक', row:4, col:2 },
  9:  { symbol:'♐', en:'Sagittarius', hi:'धनु',    row:4, col:1 },
  10: { symbol:'♑', en:'Capricorn',   hi:'मकर',    row:3, col:1 },
  11: { symbol:'♒', en:'Aquarius',    hi:'कुंभ',    row:2, col:1 },
  12: { symbol:'♓', en:'Pisces',      hi:'मीन',    row:1, col:1 },
};

function degreeInSign(position) {
  const raw = Number(position?.longitude);
  if (!Number.isFinite(raw)) return '—';
  return `${(((raw % 30) + 30) % 30).toFixed(1)}°`;
}

function fullPlanetLabel(position, lang) {
  const meta = PLANET_META[position.planet] || {};
  const rashi = t(lang, position.rashi_en, position.rashi_hi);
  const retro = position.is_retrograde ? ` · ${t(lang, 'Retrograde', 'वक्री')}` : '';
  return `${meta.icon || ''} ${planetName(position.planet, lang)} · ${rashi} ${position.degree_dms || degreeInSign(position)}${retro}`;
}

export default function PlanetaryTransitChart({ positions = [], date, lang = 'en' }) {
  const byRashi = Object.fromEntries(Array.from({ length:12 }, (_, i) => [i + 1, []]));
  for (const position of positions) {
    if (byRashi[position?.rashi_num]) byRashi[position.rashi_num].push(position);
  }

  const formattedDate = date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day:'numeric', month:'short', year:'numeric',
      })
    : '—';

  return (
    <div className="transit-chart-shell">
      <div className="transit-chart" role="img" aria-label={t(lang, 'Planetary Positions', 'ग्रह स्थिति')}>
        {Object.entries(RASHI_META).map(([rashiNum, rashi]) => {
          const planets = byRashi[rashiNum] || [];
          return (
            <div key={rashiNum} className="rashi-cell" style={{ gridRow:rashi.row, gridColumn:rashi.col }}>
              <div className="rashi-heading">
                <span className="rashi-symbol">{rashi.symbol}</span>
                <span className="rashi-name">{t(lang, rashi.en, rashi.hi)}</span>
                <span className="rashi-number">{rashiNum}</span>
              </div>

              <div className="planet-tokens">
                {planets.map((position) => {
                  const meta = PLANET_META[position.planet] || {};
                  return (
                    <span
                      key={position.planet}
                      className="planet-token"
                      title={fullPlanetLabel(position, lang)}
                      aria-label={fullPlanetLabel(position, lang)}
                      style={{ color:meta.color || '#D4AF37', borderColor:`${meta.color || '#D4AF37'}55` }}
                    >
                      <span className="planet-icon">{meta.icon}</span>
                      <span>{degreeInSign(position)}</span>
                      {position.is_retrograde && <span className="retrograde">℞</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="chart-centre">
          <div className="centre-orbit centre-orbit-outer" />
          <div className="centre-orbit centre-orbit-inner" />
          <span className="centre-icon">✦</span>
          <span className="centre-title">{t(lang, 'Planetary Positions', 'ग्रह स्थिति')}</span>
          <span className="centre-date">{formattedDate}</span>
          <span className="centre-time">12:00 IST</span>
        </div>
      </div>

      <div className="planet-legend" aria-label={t(lang, 'Planet', 'ग्रह')}>
        {positions.map((position) => {
          const meta = PLANET_META[position.planet] || {};
          return (
            <span key={position.planet} className="legend-item">
              <span style={{ color:meta.color }}>{meta.icon}</span>
              {planetName(position.planet, lang)}
              {position.is_retrograde && <span className="legend-retro">℞</span>}
            </span>
          );
        })}
      </div>

      <style jsx>{`
        .transit-chart-shell {
          width: 100%;
        }
        .transit-chart {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(4, minmax(0, 1fr));
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          border: 1px solid rgba(212,175,55,0.48);
          border-radius: 14px;
          background: radial-gradient(circle at center, rgba(61,53,128,0.28), rgba(8,11,30,0.94) 68%);
          box-shadow: inset 0 0 42px rgba(15,18,45,0.9), 0 18px 45px rgba(0,0,0,0.2);
        }
        .rashi-cell {
          position: relative;
          min-width: 0;
          padding: 7px;
          border: 1px solid rgba(212,175,55,0.2);
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
          transition: background 160ms ease, border-color 160ms ease;
        }
        .rashi-cell:hover {
          z-index: 2;
          background: linear-gradient(145deg, rgba(212,175,55,0.11), rgba(61,53,128,0.09));
          border-color: rgba(212,175,55,0.52);
        }
        .rashi-heading {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 4px;
          color: rgba(245,240,232,0.78);
          line-height: 1;
        }
        .rashi-symbol {
          color: #D4AF37;
          font-size: 13px;
        }
        .rashi-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          font-weight: 700;
        }
        .rashi-number {
          margin-left: auto;
          color: rgba(212,175,55,0.42);
          font-size: 8px;
          font-weight: 700;
        }
        .planet-tokens {
          display: flex;
          align-content: flex-start;
          flex-wrap: wrap;
          gap: 3px;
          margin-top: 7px;
        }
        .planet-token {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          min-width: 0;
          padding: 3px 4px;
          border: 1px solid;
          border-radius: 999px;
          background: rgba(4,7,22,0.72);
          font-size: 8px;
          font-weight: 800;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .planet-icon {
          font-size: 10px;
        }
        .retrograde {
          color: #F59E0B;
          font-size: 7px;
        }
        .chart-centre {
          position: relative;
          grid-row: 2 / 4;
          grid-column: 2 / 4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(212,175,55,0.26);
          background: radial-gradient(circle, rgba(29,34,76,0.98), rgba(9,12,31,0.98));
          text-align: center;
        }
        .centre-orbit {
          position: absolute;
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 50%;
          pointer-events: none;
        }
        .centre-orbit-outer { width: 84%; height: 84%; }
        .centre-orbit-inner { width: 54%; height: 54%; border-color: rgba(129,140,248,0.13); }
        .centre-icon {
          position: relative;
          color: #D4AF37;
          font-size: 22px;
          line-height: 1;
          text-shadow: 0 0 18px rgba(212,175,55,0.45);
        }
        .centre-title {
          position: relative;
          max-width: 86%;
          margin-top: 7px;
          color: #F5F0E8;
          font-family: Georgia, serif;
          font-size: 12px;
          font-weight: 700;
        }
        .centre-date {
          position: relative;
          margin-top: 4px;
          color: rgba(245,240,232,0.58);
          font-size: 9px;
        }
        .centre-time {
          position: relative;
          margin-top: 3px;
          color: rgba(212,175,55,0.62);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }
        .planet-legend {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 5px 10px;
          margin-top: 12px;
        }
        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: rgba(245,240,232,0.62);
          font-size: 9px;
        }
        .legend-retro {
          color: #F59E0B;
          font-weight: 800;
        }
        @media (max-width: 520px) {
          .rashi-cell { padding: 5px; }
          .rashi-name { font-size: 8px; }
          .rashi-symbol { font-size: 11px; }
          .planet-tokens { gap: 2px; margin-top: 5px; }
          .planet-token { padding: 2px 3px; font-size: 7px; }
          .planet-icon { font-size: 9px; }
          .centre-title { font-size: 10px; }
          .centre-date { font-size: 8px; }
        }
      `}</style>
    </div>
  );
}
