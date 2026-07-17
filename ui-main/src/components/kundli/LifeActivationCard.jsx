'use client';

/**
 * Compact 🧬 activation summary for the Kundli profile dashboard.
 *
 * Reads the SAME server payload as LifeActivationPanel — no second calculation, no
 * client-side age. `onOpenDetail` switches to the Life Report tab and scrolls to
 * the detailed section; the card renders nothing if activation is unavailable
 * rather than showing an empty shell or a 0%.
 */

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.55)';

const bandColor = (s) => (s >= 90 ? '#10B981' : s >= 80 ? '#22C55E' : s >= 65 ? '#4ADE80' : s >= 45 ? '#60A5FA' : s >= 25 ? '#F59E0B' : '#EF4444');

export default function LifeActivationCard({ activation, lang = 'hi', onOpenDetail }) {
  const isHi = lang === 'hi';
  const L = (pair) => (!pair ? '' : (isHi ? pair.hi : pair.en));

  if (!activation) return null;

  if (!activation.available) {
    return (
      <div style={{ border: '1px solid rgba(212,175,55,0.16)', borderRadius: 14, padding: '14px 16px', background: 'rgba(212,175,55,0.03)' }}>
        <h4 style={{ color: GOLD, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          🧬 {isHi ? 'आयु एवं जीवन सक्रियता' : 'Age & Life Activation'}
        </h4>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7 }}>{activation.message}</p>
      </div>
    );
  }

  const { age, overallActivation: oa, activeLifeAreas, maturity } = activation;
  const maturedCount = (maturity?.maturedPlanets || []).length;
  const totalPlanets = (maturity?.planets || []).length;
  const color = bandColor(oa.score);

  return (
    <div style={{ border: '1px solid rgba(212,175,55,0.22)', borderRadius: 14, padding: '14px 16px', background: 'rgba(212,175,55,0.035)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <h4 style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>
          🧬 {isHi ? 'आयु एवं जीवन सक्रियता' : 'Age & Life Activation'}
        </h4>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{oa.score}</div>
          <div style={{ color: DIM, fontSize: 9 }}>/100</div>
        </div>
      </div>

      <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${oa.score}%`, height: '100%', background: color }} />
      </div>

      <p style={{ color: IVORY, fontSize: 12, lineHeight: 1.8, marginBottom: 8 }}>
        {isHi
          ? `पूर्ण आयु ${age.completedYears} वर्ष ${age.months} महीने · ${age.runningYear}वाँ वर्ष चल रहा है`
          : `Completed age ${age.completedYears}y ${age.months}m · ${age.runningYear}th year running`}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color, background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44`, borderRadius: 10, padding: '3px 9px' }}>
          {L(oa.status_label)}
        </span>
        {totalPlanets > 0 && (
          <span style={{ fontSize: 10.5, color: DIM, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '3px 9px' }}>
            {isHi ? `${maturedCount}/${totalPlanets} ग्रह परिपक्व` : `${maturedCount}/${totalPlanets} planets matured`}
          </span>
        )}
      </div>

      <p style={{ color: DIM, fontSize: 11, lineHeight: 1.75, marginBottom: 10 }}>
        {activeLifeAreas?.length > 0
          ? (isHi
            ? `सक्रिय क्षेत्र: ${activeLifeAreas.map((a) => a.label.hi).join(', ')}`
            : `Active areas: ${activeLifeAreas.map((a) => a.label.en).join(', ')}`)
          : (isHi ? 'इस समय सभी क्षेत्र संतुलित गति से चल रहे हैं।' : 'All areas are moving at a balanced pace right now.')}
      </p>

      <button onClick={onOpenDetail} style={{
        width: '100%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.32)',
        color: GOLD, borderRadius: 8, padding: '7px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
      }}>
        {isHi ? 'विस्तृत जीवन सक्रियता देखें →' : 'View detailed life activation →'}
      </button>
    </div>
  );
}
