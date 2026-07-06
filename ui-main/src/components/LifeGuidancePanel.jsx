'use client';
import { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const t = (lang, en, hi) => (lang === 'hi' ? hi : en);

const VERDICT_COLORS = {
  // career
  business:    { color:'#FBBF24', bg:'rgba(251,191,36,0.10)',  border:'rgba(251,191,36,0.25)' },
  job:         { color:'#60A5FA', bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)' },
  both_viable: { color:'#34D399', bg:'rgba(52,211,153,0.10)',  border:'rgba(52,211,153,0.25)' },
  // location
  home:        { color:'#34D399', bg:'rgba(52,211,153,0.10)',  border:'rgba(52,211,153,0.25)' },
  relocate:    { color:'#F472B6', bg:'rgba(244,114,182,0.10)', border:'rgba(244,114,182,0.25)' },
  flexible:    { color:'#A78BFA', bg:'rgba(167,139,250,0.10)', border:'rgba(167,139,250,0.25)' },
  // timing
  excellent:   { color:'#22C55E', bg:'rgba(34,197,94,0.10)',   border:'rgba(34,197,94,0.25)'  },
  favorable:   { color:'#60A5FA', bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)' },
  moderate:    { color:'#F59E0B', bg:'rgba(245,158,11,0.10)',  border:'rgba(245,158,11,0.25)' },
  wait:        { color:'#F87171', bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.25)' },
  // relationships
  flourishing:       { color:'#22C55E', bg:'rgba(34,197,94,0.10)',   border:'rgba(34,197,94,0.25)'  },
  'needs nurturing': { color:'#F59E0B', bg:'rgba(245,158,11,0.10)',  border:'rgba(245,158,11,0.25)' },
  'needs healing':   { color:'#F87171', bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.25)' },
  // marriage
  very_favorable:    { color:'#22C55E', bg:'rgba(34,197,94,0.10)',   border:'rgba(34,197,94,0.25)'  },
  favorable:         { color:'#60A5FA', bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)' },
  moderate_m:        { color:'#F59E0B', bg:'rgba(245,158,11,0.10)',  border:'rgba(245,158,11,0.25)' },
  needs_remedies:    { color:'#F87171', bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.25)' },
  // parents/children
  strong_bond:       { color:'#22C55E', bg:'rgba(34,197,94,0.10)',   border:'rgba(34,197,94,0.25)'  },
  supportive:        { color:'#60A5FA', bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)' },
  needs_healing:     { color:'#F59E0B', bg:'rgba(245,158,11,0.10)',  border:'rgba(245,158,11,0.25)' },
  very_blessed:      { color:'#22C55E', bg:'rgba(34,197,94,0.10)',   border:'rgba(34,197,94,0.25)'  },
  positive:          { color:'#60A5FA', bg:'rgba(96,165,250,0.10)',  border:'rgba(96,165,250,0.25)' },
  needs_attention:   { color:'#F87171', bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.25)' },
};

const AREA_PRIORITY = { high:'🔴', medium:'🟡', low:'🔵' };

function VerdictBadge({ verdict, label, lang }) {
  const cfg = VERDICT_COLORS[verdict] || VERDICT_COLORS.flexible;
  return (
    <span style={{
      fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
      padding:'3px 10px', borderRadius:20,
      background: cfg.bg, border:`1px solid ${cfg.border}`, color: cfg.color,
    }}>{label}</span>
  );
}

function ScoreBar({ score, max = 6, label, color = '#D4AF37' }) {
  const pct = Math.max(0, Math.min(100, ((score + max) / (max * 2)) * 100));
  return (
    <div style={{ marginTop:6 }}>
      {label && <div style={{ fontSize:10, color:'#94A3B8', marginBottom:3 }}>{label}: {score > 0 ? '+' : ''}{score}</div>}
      <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.5s' }} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      <button onClick={() => setOpen(!open)} style={{ width:'100%', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#F1F5F9' }}>{title}</span>
        <span style={{ fontSize:12, color:'#64748B' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding:'0 18px 16px' }}>{children}</div>}
    </div>
  );
}

function IndicatorList({ items }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin:'8px 0 0', paddingLeft:0, listStyle:'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize:11, color:'#94A3B8', display:'flex', gap:6, marginBottom:4 }}>
          <span style={{ color:'#D4AF37', flexShrink:0 }}>◈</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DescriptionBlock({ text }) {
  if (!text) return null;
  return <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:'10px 0 0' }}>{text}</p>;
}

function AdviceBox({ text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(212,175,55,0.07)', borderLeft:'3px solid rgba(212,175,55,0.4)', borderRadius:'0 8px 8px 0' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Guidance</div>
      <p style={{ fontSize:12, color:'#E2E8F0', lineHeight:1.7, margin:0 }}>{text}</p>
    </div>
  );
}

// ─── Tab: Career ─────────────────────────────────────────────────────────────
function CareerTab({ data, lang }) {
  const { career, workLocation, businessTiming } = data;
  if (!career && !workLocation && !businessTiming) return <p style={{ color:'#64748B', fontSize:12 }}>Career data not available.</p>;

  return (
    <div>
      {/* Job vs Business */}
      {career && (
        <SectionCard title={t(lang,'Job vs Business Recommendation','नौकरी बनाम व्यापार')} icon="⚖️">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={career.verdict} label={t(lang, career.verdict_en, career.verdict_hi)} />
            <span style={{ fontSize:11, color:'#64748B' }}>
              {t(lang,`Business Score: ${career.business_score} | Job Score: ${career.job_score}`, `व्यापार: ${career.business_score} | नौकरी: ${career.job_score}`)}
            </span>
          </div>
          <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <ScoreBar score={career.business_score} label={t(lang,'Business','व्यापार')} color="#FBBF24" />
            <ScoreBar score={career.job_score} label={t(lang,'Job','नौकरी')} color="#60A5FA" />
          </div>
          <DescriptionBlock text={t(lang, career.description_en, career.description_hi)} />
          <IndicatorList items={t(lang, career.indicators_en, career.indicators_hi)} />
          <AdviceBox text={t(lang, career.advice_en, career.advice_hi)} />
          {career.current_dasha_en && (
            <div style={{ marginTop:8, fontSize:11, color:'#64748B' }}>
              {t(lang, career.current_dasha_en, career.current_dasha_hi)}
            </div>
          )}
        </SectionCard>
      )}

      {/* Work Location */}
      {workLocation && (
        <SectionCard title={t(lang,'Work Location — Home vs Away','काम का स्थान — घर बनाम बाहर')} icon="🏠">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={workLocation.verdict} label={t(lang, workLocation.verdict_en, workLocation.verdict_hi)} />
            <span style={{ fontSize:11, color:'#64748B' }}>
              {t(lang,`Home: ${workLocation.home_score} | Away: ${workLocation.away_score}`,`घर: ${workLocation.home_score} | बाहर: ${workLocation.away_score}`)}
            </span>
          </div>
          <DescriptionBlock text={t(lang, workLocation.description_en, workLocation.description_hi)} />
          <IndicatorList items={t(lang, workLocation.indicators_en, workLocation.indicators_hi)} />
          <AdviceBox text={t(lang, workLocation.advice_en, workLocation.advice_hi)} />
        </SectionCard>
      )}

      {/* Business Timing */}
      {businessTiming && (
        <SectionCard title={t(lang,'Best Time to Start a Business','व्यापार शुरू करने का सर्वोत्तम समय')} icon="🕐">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={businessTiming.timing_verdict} label={t(lang, businessTiming.verdict_en, businessTiming.verdict_hi)} />
            {businessTiming.jupiter_favorable && (
              <span style={{ fontSize:10, color:'#FBBF24', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', padding:'2px 8px', borderRadius:12 }}>
                ♃ {t(lang,'Jupiter Favorable','गुरु सहायक')}
              </span>
            )}
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, color:'#94A3B8', marginBottom:4 }}>
              {t(lang,
                `${businessTiming.current_maha} Mahadasha (rating: ${businessTiming.maha_rating}/3) + ${businessTiming.current_antar} Antardasha (rating: ${businessTiming.antar_rating}/3)`,
                `${businessTiming.current_maha} महादशा (${businessTiming.maha_rating}/3) + ${businessTiming.current_antar} अंतर्दशा (${businessTiming.antar_rating}/3)`
              )}
            </div>
            <div style={{ fontSize:11, color:'#CBD5E1' }}>{t(lang, businessTiming.maha_reason_en, businessTiming.maha_reason_hi)}</div>
          </div>
          <DescriptionBlock text={t(lang, businessTiming.description_en, businessTiming.description_hi)} />
          <AdviceBox text={t(lang, businessTiming.advice_en, businessTiming.advice_hi)} />
          {businessTiming.next_good_period_en && (
            <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8 }}>
              <span style={{ fontSize:10, color:'#34D399', fontWeight:700 }}>{t(lang,'NEXT FAVORABLE PERIOD','अगला अनुकूल काल')}: </span>
              <span style={{ fontSize:11, color:'#94A3B8' }}>{t(lang, businessTiming.next_good_period_en, businessTiming.next_good_period_hi)}</span>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ─── Tab: Relationships ───────────────────────────────────────────────────────
function MarriageTimingTable({ timing, lang }) {
  if (!timing?.windows?.length) return null;
  const T = (en, hi) => (lang === 'hi' ? hi : en);
  const RC = { high:'#22C55E', good:'#D4AF37', moderate:'#F59E0B' };
  return (
    <div style={{ marginTop:10, border:'1px solid rgba(236,72,153,0.2)', borderRadius:10, padding:'12px 14px', background:'rgba(236,72,153,0.04)' }}>
      <p style={{ color:'#EC4899', fontSize:11, fontWeight:700, marginBottom:4 }} className="font-devanagari">
        💒 {T('Favourable Marriage Timing Windows', 'विवाह के अनुकूल समय')}
      </p>
      <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, marginBottom:8 }} className="font-devanagari">
        {T(`Based on Venus, Jupiter and your 7th lord (${timing.seventh_lord}) dasha activations:`,
           `शुक्र, गुरु और आपके सप्तमेश (${timing.seventh_lord_hi}) की दशाओं के आधार पर:`)}
      </p>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10.5 }}>
          <thead>
            <tr style={{ background:'rgba(236,72,153,0.08)' }}>
              {[T('From','से'), T('To','तक'), T('Period','दशा'), T('Strength','शक्ति'), T('Why','कारण')].map((h) => (
                <th key={h} style={{ padding:'5px 9px', textAlign:'left', color:'#EC4899', fontSize:9, textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timing.windows.map((w, i) => (
              <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background: w.is_current ? 'rgba(212,175,55,0.08)' : 'transparent' }}>
                <td style={{ padding:'5px 9px', color:'rgba(245,240,232,0.8)' }}>{w.start}</td>
                <td style={{ padding:'5px 9px', color:'rgba(245,240,232,0.8)' }}>{w.end}</td>
                <td style={{ padding:'5px 9px', color:'rgba(245,240,232,0.9)', fontWeight:600 }} className="font-devanagari">
                  {lang === 'hi' ? `${w.maha_hi}-${w.antar_hi}` : `${w.maha}-${w.antar}`}{w.is_current ? ' ⏳' : ''}
                </td>
                <td style={{ padding:'5px 9px', color: RC[w.rating] || '#F59E0B', fontWeight:700 }} className="font-devanagari">
                  {lang === 'hi' ? w.rating_hi : w.rating_en}
                </td>
                <td style={{ padding:'5px 9px', color:'rgba(245,240,232,0.5)', fontSize:9.5 }} className="font-devanagari">
                  {lang === 'hi' ? w.reason_hi : w.reason_en}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:6 }} className="font-devanagari">
        {T('Windows indicate favourable dasha support — final muhurta should be matched with panchang and the partner chart.',
           'ये समय अनुकूल दशा-समर्थन दर्शाते हैं — अंतिम मुहूर्त पंचांग और साथी की कुंडली से मिलाकर तय करें।')}
      </p>
    </div>
  );
}

function RelationshipsTab({ data, lang, marriageTiming }) {
  const { relationships, marriage } = data;
  if (!relationships && !marriage) return <p style={{ color:'#64748B', fontSize:12 }}>Relationship data not available.</p>;

  return (
    <div>
      {relationships && (
        <SectionCard title={t(lang,'Relationship Life','प्रेम और संबंध')} icon="💞">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={relationships.outlook} label={t(lang, relationships.verdict_en, relationships.verdict_hi)} />
            {relationships.mangal_dosha && (
              <span style={{ fontSize:10, color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', padding:'2px 8px', borderRadius:12 }}>
                ♂ {t(lang,`Mangal Dosha (${relationships.mangal_severity})`,`मंगल दोष (${relationships.mangal_severity})`)}
              </span>
            )}
          </div>
          <div className="responsive-three-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:8 }}>
            <ScoreBar score={relationships.venus_score} label={t(lang,'Venus','शुक्र')} color="#F472B6" />
            <ScoreBar score={relationships.fifth_lord_score} label={t(lang,'5th Lord','5वां स्वामी')} color="#A78BFA" />
            <ScoreBar score={relationships.seventh_lord_score} label={t(lang,'7th Lord','7वां स्वामी')} color="#60A5FA" />
          </div>
          <DescriptionBlock text={t(lang, relationships.description_en, relationships.description_hi)} />
          <IndicatorList items={t(lang, relationships.indicators_en, relationships.indicators_hi)} />
          <AdviceBox text={t(lang, relationships.advice_en, relationships.advice_hi)} />
        </SectionCard>
      )}

      {marriage && (
        <SectionCard title={t(lang,'Marriage Guidance','विवाह मार्गदर्शन')} icon="💍">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={marriage.outlook === 'moderate' ? 'moderate_m' : marriage.outlook} label={t(lang, marriage.verdict_en, marriage.verdict_hi)} />
            {marriage.marriage_dasha_active && (
              <span style={{ fontSize:10, color:'#22C55E', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', padding:'2px 8px', borderRadius:12 }}>
                ⏳ {t(lang,'Marriage Dasha Active','विवाह दशा सक्रिय')}
              </span>
            )}
            {marriage.mangal_dosha && (
              <span style={{ fontSize:10, color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', padding:'2px 8px', borderRadius:12 }}>
                ♂ {t(lang,'Mangal Dosha','मंगल दोष')}
              </span>
            )}
          </div>
          <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
            <ScoreBar score={marriage.seventh_lord_score} label={t(lang,`7th Lord (${marriage.seventh_lord})`,`7वें स्वामी (${marriage.seventh_lord})`)} color="#F472B6" />
            <ScoreBar score={marriage.venus_score} label={t(lang,'Venus','शुक्र')} color="#A78BFA" />
          </div>
          <DescriptionBlock text={t(lang, marriage.description_en, marriage.description_hi)} />
          <IndicatorList items={t(lang, marriage.indicators_en, marriage.indicators_hi)} />
          <AdviceBox text={t(lang, marriage.advice_en, marriage.advice_hi)} />
          <MarriageTimingTable timing={marriageTiming} lang={lang} />
        </SectionCard>
      )}
    </div>
  );
}

// ─── Tab: Family ─────────────────────────────────────────────────────────────
function FamilyTab({ data, lang }) {
  const { parents, children } = data;
  if (!parents && !children) return <p style={{ color:'#64748B', fontSize:12 }}>Family data not available.</p>;

  return (
    <div>
      {/* Mother */}
      {parents?.mother && (
        <SectionCard title={t(lang,'Mother Relationship','माता संबंध')} icon="🌸">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={parents.mother.outlook} label={t(lang, parents.mother.verdict_en, parents.mother.verdict_hi)} />
            <span style={{ fontSize:11, color:'#64748B' }}>{t(lang,`Score: ${parents.mother.score}`,`स्कोर: ${parents.mother.score}`)}</span>
          </div>
          <IndicatorList items={parents.mother.indicators_en} />
        </SectionCard>
      )}

      {/* Father */}
      {parents?.father && (
        <SectionCard title={t(lang,'Father Relationship','पिता संबंध')} icon="🏛️">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={parents.father.outlook} label={t(lang, parents.father.verdict_en, parents.father.verdict_hi)} />
            <span style={{ fontSize:11, color:'#64748B' }}>{t(lang,`Score: ${parents.father.score}`,`स्कोर: ${parents.father.score}`)}</span>
          </div>
          <IndicatorList items={parents.father.indicators_en} />
        </SectionCard>
      )}

      {/* Parents combined description + advice */}
      {parents && (
        <SectionCard title={t(lang,'Parent Relations — Full Analysis','माता-पिता संबंध — पूर्ण विश्लेषण')} icon="🧬">
          <DescriptionBlock text={t(lang, parents.description_en, parents.description_hi)} />
          <AdviceBox text={t(lang, parents.advice_en, parents.advice_hi)} />
        </SectionCard>
      )}

      {/* Children */}
      {children && (
        <SectionCard title={t(lang,'Children & Family Expansion','संतान और परिवार विस्तार')} icon="👶">
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={children.outlook} label={t(lang, children.verdict_en, children.verdict_hi)} />
            {children.dasha_active && (
              <span style={{ fontSize:10, color:'#22C55E', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', padding:'2px 8px', borderRadius:12 }}>
                ⏳ {t(lang,'Child Dasha Active','संतान दशा सक्रिय')}
              </span>
            )}
          </div>
          <div className="responsive-two-column" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
            <ScoreBar score={children.fifth_lord_score} label={t(lang,`5th Lord (${children.fifth_lord})`,`5वें स्वामी (${children.fifth_lord})`)} color="#FBBF24" />
            <ScoreBar score={children.jupiter_score} label={t(lang,'Jupiter ♃','गुरु ♃')} color="#F59E0B" />
          </div>
          <DescriptionBlock text={t(lang, children.description_en, children.description_hi)} />
          <IndicatorList items={t(lang, children.indicators_en, children.indicators_hi)} />
          <AdviceBox text={t(lang, children.advice_en, children.advice_hi)} />
        </SectionCard>
      )}
    </div>
  );
}

// ─── Tab: Remedies ────────────────────────────────────────────────────────────
function RemediesTab({ remedies, lang }) {
  if (!remedies?.length) return <p style={{ color:'#64748B', fontSize:12 }}>No remedies data.</p>;

  const AREA_ICON = { career:'💼', relationship:'💞', marriage:'💍', parents:'🧬', children:'👶', dasha:'🌀', general:'🕉️' };
  const AREA_LABEL = {
    career:       t(lang,'Career','करियर'),
    relationship: t(lang,'Relationship','संबंध'),
    marriage:     t(lang,'Marriage','विवाह'),
    parents:      t(lang,'Parents','माता-पिता'),
    children:     t(lang,'Children','संतान'),
    dasha:        t(lang,'Current Dasha','वर्तमान दशा'),
    general:      t(lang,'Daily Practice','दैनिक अभ्यास'),
  };

  const high   = remedies.filter((r) => r.priority === 'high');
  const medium = remedies.filter((r) => r.priority === 'medium');
  const low    = remedies.filter((r) => r.priority === 'low');

  function RemedyCard({ remedy }) {
    const icon = AREA_ICON[remedy.area] || '✨';
    const areaLabel = lang === 'hi' ? remedy.area_hi : (AREA_LABEL[remedy.area] || remedy.area);
    const text = lang === 'hi' ? remedy.remedy_hi : remedy.remedy_en;
    return (
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px', marginBottom:8, display:'flex', gap:12 }}>
        <span style={{ fontSize:20, flexShrink:0, paddingTop:2 }}>{icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.07em' }}>{areaLabel}</span>
            <span style={{ fontSize:10, color:'#64748B' }}>{AREA_PRIORITY[remedy.priority]}</span>
          </div>
          <p style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.7, margin:0 }}>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {high.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            🔴 {t(lang,'High Priority','उच्च प्राथमिकता')}
          </div>
          {high.map((r, i) => <RemedyCard key={i} remedy={r} />)}
        </div>
      )}
      {medium.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            🟡 {t(lang,'Medium Priority','मध्यम प्राथमिकता')}
          </div>
          {medium.map((r, i) => <RemedyCard key={i} remedy={r} />)}
        </div>
      )}
      {low.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#60A5FA', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            🔵 {t(lang,'Daily Practice','दैनिक अभ्यास')}
          </div>
          {low.map((r, i) => <RemedyCard key={i} remedy={r} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
const TABS = [
  { key:'career',        icon:'💼', en:'Career Path',    hi:'करियर मार्ग'    },
  { key:'relationships', icon:'💞', en:'Relationships',  hi:'संबंध'           },
  { key:'family',        icon:'🏠', en:'Family',         hi:'परिवार'          },
  { key:'remedies',      icon:'🕉️', en:'Remedies',       hi:'उपाय'            },
];

export default function LifeGuidancePanel({ guidance, lang = 'en', marriageTiming = null }) {
  const [activeTab, setActiveTab] = useState('career');
  if (!guidance) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#F1F5F9', margin:'0 0 4px' }}>
          {t(lang,'🌟 Life Guidance','🌟 जीवन मार्गदर्शन')}
        </h2>
        <p style={{ fontSize:12, color:'#64748B', margin:0 }}>
          {t(lang,
            'Personalized guidance based on your natal chart — career, relationships, family & remedies',
            'आपकी जन्म कुंडली पर आधारित व्यक्तिगत मार्गदर्शन — करियर, संबंध, परिवार और उपाय'
          )}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding:'7px 16px', borderRadius:20, border:'1px solid',
              fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
              background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
              borderColor: active ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)',
              color: active ? '#D4AF37' : '#94A3B8',
            }}>
              {tab.icon} {t(lang, tab.en, tab.hi)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'career'        && <CareerTab data={guidance} lang={lang} />}
        {activeTab === 'relationships' && <RelationshipsTab data={guidance} lang={lang} marriageTiming={marriageTiming} />}
        {activeTab === 'family'        && <FamilyTab data={guidance} lang={lang} />}
        {activeTab === 'remedies'      && <RemediesTab remedies={guidance.remedies} lang={lang} />}
      </div>
    </div>
  );
}
