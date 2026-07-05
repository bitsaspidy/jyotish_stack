'use client';

import { motion } from 'framer-motion';
import { planetName, t } from '../lib/astroI18n';

const GOLD = '#D4AF37';
const TEXT = 'rgba(245,240,232,0.80)';
const MUTED = 'rgba(245,240,232,0.52)';

const STATUS_STYLE = {
  supported: { color:'#34D399', background:'rgba(52,211,153,0.09)', border:'rgba(52,211,153,0.25)' },
  balanced:  { color:'#FBBF24', background:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.24)' },
  care:      { color:'#FB923C', background:'rgba(251,146,60,0.08)', border:'rgba(251,146,60,0.24)' },
};

const AREA_ICON = {
  career:'💼', relationships:'💞', health:'🌿', finance:'💰', spirituality:'🪷',
};

const TRANSIT_ICON = { saturn:'🧱', jupiter:'🌱', change:'🧭' };

function pick(lang, item, key) {
  return t(lang, item?.[`${key}En`] || '', item?.[`${key}Hi`] || item?.[`${key}En`] || '');
}

function pickList(lang, item, key) {
  const english = item?.[`${key}En`] || [];
  const hindi = item?.[`${key}Hi`] || english;
  return lang === 'hi' ? hindi : english;
}

function formatEnd(date, lang) {
  if (!date) return '—';
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month:'short', year:'numeric' });
}

function BulletList({ items, color, lang }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const value = typeof item === 'string'
          ? item
          : t(lang, item.en || '', item.hi || item.en || '');
        return (
          <div key={`${value}-${index}`} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
            <span style={{ color, fontSize:12, lineHeight:1.7 }}>●</span>
            <p style={{ color:TEXT, fontSize:12.5, lineHeight:1.7 }}>{value}</p>
          </div>
        );
      })}
    </div>
  );
}

function OverviewCard({ overview, lang }) {
  const strengths = pickList(lang, overview, 'strengths');
  const care = pickList(lang, overview, 'care');
  return (
    <motion.section initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="card-royal p-5">
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:22 }}>👤</span>
        <div>
          <h2 className="font-serif text-gold text-base font-semibold">
            {t(lang, 'Your Nature in Simple Words', 'आपका स्वभाव सरल शब्दों में')}
          </h2>
          <p style={{ color:MUTED, fontSize:10, marginTop:2 }}>
            {t(lang, 'How you approach life and process feelings', 'आप जीवन और भावनाओं को कैसे संभालते हैं')}
          </p>
        </div>
      </div>
      <p style={{ color:TEXT, fontSize:13.5, lineHeight:1.85 }}>{pick(lang, overview, 'summary')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(52,211,153,0.055)', border:'1px solid rgba(52,211,153,0.16)' }}>
          <p style={{ color:'#34D399', fontSize:10, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            ✦ {t(lang, 'Natural strengths', 'स्वाभाविक ताकत')}
          </p>
          <BulletList items={strengths} color="#34D399" lang={lang} />
        </div>
        <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(251,191,36,0.045)', border:'1px solid rgba(251,191,36,0.15)' }}>
          <p style={{ color:'#FBBF24', fontSize:10, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            ◈ {t(lang, 'Keep in balance', 'संतुलन में रखें')}
          </p>
          <BulletList items={care} color="#FBBF24" lang={lang} />
        </div>
      </div>
    </motion.section>
  );
}

function CurrentPhaseCard({ phase, lang }) {
  const focus = pickList(lang, phase, 'focus');
  return (
    <motion.section initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.04 }} className="card-royal p-5">
      <h2 className="font-serif text-gold text-base font-semibold mb-2">
        🧭 {t(lang, 'What Is Happening Now', 'अभी क्या चल रहा है')}
      </h2>
      <p style={{ color:TEXT, fontSize:14, lineHeight:1.8, fontWeight:600 }}>{pick(lang, phase, 'headline')}</p>
      <p style={{ color:MUTED, fontSize:12.5, lineHeight:1.8, marginTop:7 }}>{pick(lang, phase, 'summary')}</p>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
        <div style={{ padding:'7px 12px', borderRadius:9, background:'rgba(212,175,55,0.10)', border:'1px solid rgba(212,175,55,0.28)' }}>
          <p style={{ color:MUTED, fontSize:9 }}>{t(lang, 'Main influence', 'मुख्य प्रभाव')}</p>
          <p style={{ color:GOLD, fontSize:12, fontWeight:700, marginTop:2 }}>
            {planetName(phase.mainPlanet, lang)} · {t(lang, 'until', 'तक')} {formatEnd(phase.mainEnd, lang)}
          </p>
        </div>
        <div style={{ padding:'7px 12px', borderRadius:9, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.24)' }}>
          <p style={{ color:MUTED, fontSize:9 }}>{t(lang, 'Current influence', 'वर्तमान प्रभाव')}</p>
          <p style={{ color:'#C4B5FD', fontSize:12, fontWeight:700, marginTop:2 }}>
            {planetName(phase.supportingPlanet, lang)} · {t(lang, 'until', 'तक')} {formatEnd(phase.supportingEnd, lang)}
          </p>
        </div>
      </div>

      <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.10)' }}>
        <p style={{ color:GOLD, fontSize:10, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {t(lang, 'Best use of this period', 'इस समय का सही उपयोग')}
        </p>
        <BulletList items={focus} color={GOLD} lang={lang} />
      </div>
    </motion.section>
  );
}

function LifeAreas({ areas, lang }) {
  if (!areas?.length) return null;
  return (
    <section>
      <p style={{ color:'rgba(245,240,232,0.58)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.28em', marginBottom:11 }}>
        {t(lang, 'What This Means for Daily Life', 'रोजमर्रा के जीवन में इसका अर्थ')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {areas.map((area, index) => {
          const status = STATUS_STYLE[area.statusKey] || STATUS_STYLE.balanced;
          return (
            <motion.article key={area.key} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.06 + index * 0.025 }}
              style={{ padding:'15px 16px', borderRadius:12, background:'rgba(17,20,40,0.72)', border:'1px solid rgba(212,175,55,0.12)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10 }}>
                <h3 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:13, fontWeight:700 }}>
                  {AREA_ICON[area.key] || '✦'} {pick(lang, area, 'title')}
                </h3>
                <span style={{ color:status.color, background:status.background, border:`1px solid ${status.border}`, borderRadius:12, padding:'2px 7px', fontSize:8.5, fontWeight:700, whiteSpace:'nowrap' }}>
                  {pick(lang, area, 'label')}
                </span>
              </div>
              <p style={{ color:TEXT, fontSize:12.5, lineHeight:1.75 }}>{pick(lang, area, 'summary')}</p>
              <div style={{ marginTop:10, paddingTop:9, borderTop:'1px solid rgba(212,175,55,0.08)' }}>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                  {t(lang, 'What helps now', 'अभी क्या सहायक है')}
                </p>
                <p style={{ color:status.color, fontSize:11.5, lineHeight:1.65 }}>{pick(lang, area, 'advice')}</p>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function OpportunitiesAndCare({ opportunities, cautions, lang }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <section className="card-royal p-5">
        <h2 className="font-serif text-sm font-semibold mb-3" style={{ color:'#34D399' }}>
          ✦ {t(lang, 'Good Areas to Use', 'उपयोग करने योग्य अच्छे अवसर')}
        </h2>
        <BulletList items={opportunities} color="#34D399" lang={lang} />
      </section>
      <section className="card-royal p-5">
        <h2 className="font-serif text-sm font-semibold mb-3" style={{ color:'#FB923C' }}>
          ◈ {t(lang, 'Take Extra Care With', 'इन बातों में अतिरिक्त ध्यान रखें')}
        </h2>
        <BulletList items={cautions} color="#FB923C" lang={lang} />
      </section>
    </div>
  );
}

function TransitSummary({ transits, lang }) {
  if (!transits) return null;
  return (
    <section className="card-royal p-5">
      <h2 className="font-serif text-gold text-base font-semibold mb-2">
        🌍 {t(lang, 'What Is Shaping This Period', 'इस समय को क्या प्रभावित कर रहा है')}
      </h2>
      <p style={{ color:TEXT, fontSize:13, lineHeight:1.8 }}>{pick(lang, transits, 'headline')}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {transits.items?.map((item) => (
          <div key={item.key} style={{ padding:'12px 13px', borderRadius:10, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.1)' }}>
            <p style={{ color:GOLD, fontSize:11, fontWeight:700, marginBottom:6 }}>
              {TRANSIT_ICON[item.key] || '✦'} {pick(lang, item, 'title')}
            </p>
            <p style={{ color:MUTED, fontSize:11.5, lineHeight:1.7 }}>{pick(lang, item, 'summary')}</p>
          </div>
        ))}
      </div>
      <p style={{ color:'rgba(245,240,232,0.33)', fontSize:9.5, marginTop:12 }}>
        {t(lang, 'Use this as guidance, not certainty. Your choices and circumstances still matter.', 'इसे मार्गदर्शन मानें, निश्चित परिणाम नहीं। आपके निर्णय और परिस्थितियां भी महत्वपूर्ण हैं।')}
      </p>
    </section>
  );
}

export default function PredictionFriendlyView({ data, lang = 'en' }) {
  if (!data) return null;
  return (
    <>
      <OverviewCard overview={data.overview} lang={lang} />
      <CurrentPhaseCard phase={data.currentPhase} lang={lang} />
      <LifeAreas areas={data.lifeAreas} lang={lang} />
      <OpportunitiesAndCare opportunities={data.opportunities} cautions={data.cautions} lang={lang} />
      <TransitSummary transits={data.transits} lang={lang} />
    </>
  );
}
