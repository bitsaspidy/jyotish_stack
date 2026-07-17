'use client';

import { useState } from 'react';

/**
 * 🧬 आयु एवं जीवन सक्रियता — detailed section, rendered near the top of the Life
 * Report tab in BOTH the user and admin views.
 *
 * All numbers arrive pre-computed from services/life-activation on the server.
 * This component does no astrology and no age maths: a client-side age would drift
 * with the viewer's own timezone, which is exactly what the shared service exists
 * to prevent. It only picks a language and lays the payload out.
 *
 * `admin` adds the technical evidence block. It never changes the numbers.
 */

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.55)';

// score → colour, matching the config's band boundaries
const bandColor = (s) => (s >= 90 ? '#10B981' : s >= 80 ? '#22C55E' : s >= 65 ? '#4ADE80' : s >= 45 ? '#60A5FA' : s >= 25 ? '#F59E0B' : '#EF4444');

const MATURITY_COLOR = {
  MATURED: '#22C55E', MATURITY_WINDOW: '#60A5FA', EMERGING: '#F59E0B', DEVELOPING: 'rgba(245,240,232,0.45)',
};

/** conic-gradient meter — SVG text inside a rotated SVG renders unreliably here */
function ScoreMeter({ score, size = 104 }) {
  const color = bandColor(score);
  const inner = size - 20;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: `conic-gradient(${color} ${score}%, rgba(255,255,255,0.07) ${score}%)` }} />
      <div style={{
        position: 'absolute', top: 10, left: 10, width: inner, height: inner, borderRadius: '50%',
        background: '#0a0c1c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{score}</span>
        <span style={{ color: DIM, fontSize: 9, marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
      <span style={{ color: DIM, fontSize: 11, minWidth: 104 }}>{label}</span>
      <span style={{ color: IVORY, fontSize: 12.5, fontWeight: 600 }}>{children}</span>
    </div>
  );
}

export default function LifeActivationPanel({ activation, lang = 'hi', admin = false }) {
  const [showTech, setShowTech] = useState(false);
  const isHi = lang === 'hi';
  const L = (pair) => (!pair ? '' : (isHi ? pair.hi : pair.en));

  if (!activation) return null;

  // Insufficient data is a first-class outcome — never a blank card or a 0%.
  if (!activation.available) {
    return (
      <section id="life-activation" style={{ border: '1px solid rgba(212,175,55,0.18)', borderRadius: 16, padding: '18px 20px', marginBottom: 20, background: 'rgba(212,175,55,0.03)', scrollMarginTop: 90 }}>
        <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 15.5, fontWeight: 700, marginBottom: 8 }}>
          🧬 {isHi ? 'आयु एवं जीवन सक्रियता' : 'Age & Life Activation'}
        </h3>
        <p style={{ color: DIM, fontSize: 12.5, lineHeight: 1.8 }}>{activation.message}</p>
      </section>
    );
  }

  const { age, lifeStage, maturity, overallActivation: oa, activePlanets, activeLifeAreas, categoryScores, upcomingPeriods, copy } = activation;

  const ageSentence = isHi
    ? `आपकी पूर्ण आयु ${age.completedYears} वर्ष ${age.months} महीने है और आपका ${age.runningYear}वाँ वर्ष चल रहा है।`
    : `Your completed age is ${age.completedYears} years ${age.months} months, and your ${age.runningYear}th year is in progress.`;

  const matured = (maturity.maturedPlanets || []).map((p) => {
    const hit = maturity.planets.find((x) => x.planet === p);
    return isHi ? (hit?.planet_hi || p) : p;
  });

  return (
    <section id="life-activation" style={{ border: '1px solid rgba(212,175,55,0.22)', borderRadius: 16, padding: '20px 22px', marginBottom: 20, background: 'rgba(212,175,55,0.035)', scrollMarginTop: 90 }}>

      <h3 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        🧬 {isHi ? 'आयु एवं जीवन सक्रियता' : 'Age & Life Activation'}
      </h3>
      <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7, marginBottom: 16 }}>
        {isHi
          ? 'आपकी वर्तमान आयु, ग्रहों की परिपक्वता और इस समय सक्रिय जीवन क्षेत्रों का विश्लेषण'
          : 'Your current age, planetary maturity, and which life areas are most active right now'}
      </p>

      {/* ── 1–3. Age · running year · life stage ─────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ color: IVORY, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{isHi ? 'आपकी वर्तमान आयु' : 'Your current age'}</h4>
        <p style={{ color: IVORY, fontSize: 13, lineHeight: 1.9, marginBottom: 10 }}>{ageSentence}</p>
        <Row label={isHi ? 'पूर्ण आयु' : 'Completed age'}>
          {isHi ? `${age.completedYears} वर्ष ${age.months} महीने ${age.days} दिन` : `${age.completedYears}y ${age.months}m ${age.days}d`}
        </Row>
        <Row label={isHi ? 'चल रहा वर्ष' : 'Running year'}>{isHi ? `${age.runningYear}वाँ वर्ष` : `${age.runningYear}th year`}</Row>
        {lifeStage && <Row label={isHi ? 'जीवन चरण' : 'Life stage'}>{L(lifeStage.label)}</Row>}
      </div>

      {/* ── 5. Current activation ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <ScoreMeter score={oa.score} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <h4 style={{ color: IVORY, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{isHi ? 'वर्तमान जीवन सक्रियता' : 'Current life activation'}</h4>
          <span style={{ fontSize: 12, fontWeight: 700, color: bandColor(oa.score), background: 'rgba(255,255,255,0.05)', border: `1px solid ${bandColor(oa.score)}44`, borderRadius: 12, padding: '3px 12px' }}>
            {L(oa.status_label)}
          </span>
          {/* status_short is the ADJECTIVE — the noun label would read
              "सक्रियता मध्यम सक्रियता है" / "is moderate activation". */}
          <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.8, marginTop: 9 }}>
            {isHi
              ? `इस समय आपकी जीवन-फल सक्रियता ${L(oa.status_short)} है। आपका सक्रियता स्कोर ${oa.score}/100 है।`
              : `Your current life activation is ${L(oa.status_short)}. Your activation score is ${oa.score}/100.`}
          </p>
          <p style={{ color: DIM, fontSize: 11, marginTop: 6 }}>
            {isHi ? 'विश्वसनीयता' : 'Confidence'}: <strong style={{ color: IVORY }}>{L(oa.confidence_label)}</strong>
          </p>
        </div>
      </div>

      {/* ── 6. Active planets ────────────────────────────────────────────── */}
      {activePlanets?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={{ color: IVORY, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{isHi ? 'सक्रिय ग्रह' : 'Active planets'}</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activePlanets.map((p, i) => (
              <span key={i} style={{ fontSize: 11, color: IVORY, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '4px 10px' }}>
                {isHi ? (p.planet_hi || p.planet) : p.planet} · <span style={{ color: DIM }}>{L(p.role)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Active life areas + category scores ───────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <h4 style={{ color: IVORY, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{isHi ? 'सक्रिय जीवन क्षेत्र' : 'Active life areas'}</h4>
        {activeLifeAreas?.length > 0 ? (
          <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.8, marginBottom: 10 }}>
            {isHi
              ? `${activeLifeAreas.map((a) => a.label.hi).join(', ')} से जुड़े क्षेत्र इस समय अधिक सक्रिय दिखाई देते हैं।`
              : `Areas connected with ${activeLifeAreas.map((a) => a.label.en.toLowerCase()).join(', ')} appear more active at this time.`}
          </p>
        ) : (
          <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.8, marginBottom: 10 }}>
            {isHi
              ? 'इस समय कोई एक क्षेत्र विशेष रूप से प्रमुख नहीं है — सभी क्षेत्र संतुलित गति से चल रहे हैं।'
              : 'No single area stands out as dominant right now — all areas are moving at a balanced pace.'}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
          {(categoryScores || []).map((c) => (
            <div key={c.category} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 11px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ color: IVORY, fontSize: 11.5, fontWeight: 600 }}>{L(c.label)}</span>
                {c.available
                  ? <span style={{ color: bandColor(c.score), fontSize: 13, fontWeight: 700 }}>{c.score}</span>
                  : <span style={{ color: DIM, fontSize: 10 }}>—</span>}
              </div>
              {c.available ? (
                <>
                  <div style={{ height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.07)', marginTop: 7, overflow: 'hidden' }}>
                    <div style={{ width: `${c.score}%`, height: '100%', background: bandColor(c.score) }} />
                  </div>
                  <div style={{ color: DIM, fontSize: 9.5, marginTop: 5 }}>
                    {L(c.status_label)} · {isHi ? 'विश्वसनीयता' : 'confidence'} {L(c.confidence_label)}
                  </div>
                </>
              ) : (
                <div style={{ color: DIM, fontSize: 9.5, marginTop: 5, lineHeight: 1.6 }}>{c.message}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Planet maturity ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h4 style={{ color: IVORY, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{isHi ? 'ग्रह परिपक्वता' : 'Planet maturity'}</h4>
        {matured.length > 0 && (
          <p style={{ color: IVORY, fontSize: 12, lineHeight: 1.9, marginBottom: 8 }}>
            {isHi
              ? `${matured.join(', ')} अपनी पारंपरिक परिपक्वता आयु पूरी कर चुके हैं।`
              : `${matured.join(', ')} have completed their traditional maturity age.`}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {(maturity.planets || []).map((p) => (
            <span key={p.planet} title={`${p.maturityAge}`} style={{
              fontSize: 10.5, color: MATURITY_COLOR[p.status] || DIM, background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${(MATURITY_COLOR[p.status] || DIM)}33`, borderRadius: 9, padding: '3px 9px',
            }}>
              {isHi ? p.planet_hi : p.planet} · {p.maturityAge} · {L(p.status_label)}
            </span>
          ))}
        </div>
        {/* Never imply the chart was switched off before a maturity age. */}
        <p style={{ color: DIM, fontSize: 11, lineHeight: 1.85, marginBottom: 6 }}>{L(copy.maturityMilestone)}</p>
        <p style={{ color: DIM, fontSize: 11, lineHeight: 1.85 }}>{L(copy.chartAlwaysActive)}</p>
      </div>

      {/* ── 8. Upcoming activation periods (real dates only) ─────────────── */}
      {upcomingPeriods?.length > 0 && (
        <div style={{ marginBottom: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ color: IVORY, fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{isHi ? 'आगामी सक्रियता काल' : 'Upcoming activation periods'}</h4>
          {upcomingPeriods.map((u, i) => (
            <div key={i} style={{ color: DIM, fontSize: 11.5, lineHeight: 1.9 }}>
              {u.type === 'maturity'
                ? (isHi
                  ? `${u.planet_hi || u.planet} की परिपक्वता ${u.maturityAge} वर्ष की आयु में — लगभग ${u.yearsRemaining} वर्ष शेष।`
                  : `${u.planet} matures at age ${u.maturityAge} — about ${u.yearsRemaining} years remaining.`)
                : (isHi
                  ? `${u.planet_hi || u.planet} ${u.type === 'mahadasha' ? 'महादशा' : 'अंतर्दशा'}: ${u.start} से ${u.end} तक।`
                  : `${u.planet} ${u.type}: ${u.start} to ${u.end}.`)}
            </div>
          ))}
        </div>
      )}

      {/* ── 9. Confidence & explanation ──────────────────────────────────── */}
      {activation.confidenceReasons?.length > 0 && (
        <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ color: IVORY, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
            {isHi ? 'विश्वसनीयता और स्पष्टीकरण' : 'Confidence and explanation'}
          </h4>
          {activation.confidenceReasons.map((r, i) => (
            <p key={i} style={{ color: DIM, fontSize: 11, lineHeight: 1.8 }}>• {L(r)}</p>
          ))}
        </div>
      )}

      {/* ── Admin-only technical evidence ────────────────────────────────── */}
      {admin && activation.evidence && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(167,139,250,0.25)' }}>
          <button onClick={() => setShowTech((v) => !v)} style={{
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#A78BFA',
            borderRadius: 7, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            {showTech ? '▾' : '▸'} Technical evidence ({activation.rule_version})
          </button>

          {showTech && (
            <div style={{ marginTop: 10, fontSize: 11, color: DIM, lineHeight: 1.8 }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#A78BFA' }}>Total activation score:</strong> {activation.evidence.totalScore}/100
                {' · '}weight used: {activation.evidence.usedWeight}/100
                {activation.evidence.missingFactors?.length > 0 && (
                  <span style={{ color: '#F59E0B' }}> · redistributed (missing: {activation.evidence.missingFactors.join(', ')})</span>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, fontSize: 10.5 }}>
                <thead>
                  <tr style={{ color: '#A78BFA', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px' }}>Factor</th><th style={{ padding: '4px 6px' }}>Value /100</th>
                    <th style={{ padding: '4px 6px' }}>Weight</th><th style={{ padding: '4px 6px' }}>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(activation.evidence.weights).map((k) => (
                    <tr key={k} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '4px 6px', color: IVORY }}>{k}</td>
                      <td style={{ padding: '4px 6px' }}>{activation.evidence.factorValues?.[k] ?? '—'}</td>
                      <td style={{ padding: '4px 6px' }}>{activation.evidence.weights[k]}</td>
                      <td style={{ padding: '4px 6px' }}>{activation.evidence[k] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div><strong style={{ color: '#A78BFA' }}>Active Mahadasha:</strong> {activation.evidence.activeMahadasha ? `${activation.evidence.activeMahadasha.planet} (${activation.evidence.activeMahadasha.score}/100, until ${activation.evidence.activeMahadasha.end})` : '—'}</div>
              <div><strong style={{ color: '#A78BFA' }}>Active Antardasha:</strong> {activation.evidence.activeAntardasha ? `${activation.evidence.activeAntardasha.planet} (${activation.evidence.activeAntardasha.score}/100, until ${activation.evidence.activeAntardasha.end})` : '—'}</div>
              <div><strong style={{ color: '#A78BFA' }}>Relevant planets:</strong> {(activation.evidence.relevantPlanets || []).join(', ') || '—'}</div>
              <div><strong style={{ color: '#A78BFA' }}>Relevant houses:</strong> {(activation.evidence.relevantHouses || []).join(', ') || '—'}</div>
              <div><strong style={{ color: '#A78BFA' }}>Varga charts:</strong> {(activation.evidence.vargaCharts || []).map((v) => `${v.slug}=${v.status}`).join(', ') || '—'}</div>

              <div style={{ marginTop: 8 }}>
                <strong style={{ color: '#22C55E' }}>Supporting factors:</strong>
                {(activation.evidence.supportingFactors || []).length
                  ? activation.evidence.supportingFactors.map((f, i) => <div key={i} style={{ paddingLeft: 10 }}>• {f.en}</div>)
                  : <span> —</span>}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong style={{ color: '#EF4444' }}>Contradicting factors:</strong>
                {(activation.evidence.contradictingFactors || []).length
                  ? activation.evidence.contradictingFactors.map((f, i) => <div key={i} style={{ paddingLeft: 10 }}>• {f.en}</div>)
                  : <span> —</span>}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong style={{ color: '#A78BFA' }}>Confidence reason:</strong>
                {(activation.evidence.confidenceReason || []).map((r, i) => <div key={i} style={{ paddingLeft: 10 }}>• {r.en}</div>)}
              </div>

              <div style={{ marginTop: 8, color: 'rgba(245,240,232,0.4)', fontSize: 10 }}>
                <div>Rule version: {activation.rule_version} · calculated at {activation.calculated_at}</div>
                <div>{activation.evidence.strengthSource}</div>
                <div>{activation.evidence.transitSource}</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong style={{ color: '#A78BFA' }}>Per-category evidence:</strong>
                {(categoryScores || []).filter((c) => c.available).map((c) => (
                  <div key={c.category} style={{ paddingLeft: 10, marginTop: 4 }}>
                    <span style={{ color: IVORY }}>{c.category}</span> — {c.score}/100 · {c.status} · conf {c.confidence}
                    <div style={{ paddingLeft: 10, fontSize: 10 }}>
                      houses {c.evidence.houses.join('/')} · lords {c.evidence.houseLords.map((h) => `${h.house}:${h.lord}`).join(', ')} · karakas {c.evidence.karakas.join(', ')}
                      {c.evidence.varga?.length ? ` · ${c.evidence.varga.map((v) => `${v.slug}=${v.status}`).join(', ')}` : ''}
                      {c.evidence.missingFactors?.length ? ` · missing: ${c.evidence.missingFactors.join(', ')}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
