'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';

const GOLD  = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.88)';
const DIM   = 'rgba(245,240,232,0.45)';

const PLANET_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};
const PLANET_ICON = {
  Sun:'☉', Moon:'☽', Mars:'♂', Mercury:'☿', Jupiter:'♃',
  Venus:'♀', Saturn:'♄', Rahu:'☊', Ketu:'☋',
};
const PLANET_COLOR = {
  Sun:'#F59E0B', Moon:'#94A3B8', Mars:'#EF4444', Mercury:'#10B981',
  Jupiter:'#FBBF24', Venus:'#F472B6', Saturn:'#818CF8', Rahu:'#A78BFA', Ketu:'#6B7280',
};
const RASHI_HI = ['','मेष','वृष','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'];
const RASHI_EN = ['','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

function T(lang, en, hi) { return lang === 'hi' ? hi : en; }
function rn(num, lang) {
  return lang === 'hi' ? (RASHI_HI[num] || '') : (RASHI_EN[num] || '');
}
function ph(name, lang) {
  return lang === 'hi' ? (PLANET_HI[name] || name) : name;
}

/* ── tiny sub-components ── */
function SectionHead({ icon, en, hi, lang, color = GOLD }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ fontSize:11, fontWeight:800, color, textTransform:'uppercase', letterSpacing:'0.14em' }}>
        {T(lang, en, hi)}
      </span>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:'rgba(255,255,255,0.03)', border:'1px solid rgba(212,175,55,0.15)',
      borderRadius:10, padding:'14px 16px', ...style,
    }}>
      {children}
    </div>
  );
}

function Pill({ children, color = GOLD }) {
  return (
    <span style={{
      fontSize:10, fontWeight:700, color,
      background:`${color}12`, border:`1px solid ${color}30`,
      borderRadius:10, padding:'2px 9px', display:'inline-block',
    }}>
      {children}
    </span>
  );
}

function ScoreRing({ score, label, lang, size = 88 }) {
  const pct  = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#22C55E' : pct >= 50 ? GOLD : pct >= 35 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
        <div style={{
          width:size, height:size, borderRadius:'50%',
          background:`conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
        }} />
        <div style={{
          position:'absolute', top:8, left:8, width:size-16, height:size-16,
          borderRadius:'50%', background:'#0a0c1c',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontSize:18, fontWeight:800, color }}>{pct}</span>
          <span style={{ fontSize:8, color:DIM, textTransform:'uppercase', letterSpacing:'0.1em' }}>/100</span>
        </div>
      </div>
      {label && <span style={{ fontSize:10, fontWeight:700, color, textAlign:'center' }}>{label}</span>}
    </div>
  );
}

/* ── helpers to extract cream from profile ── */
function getTopYogas(chart, lang, n = 4) {
  const yogas = chart?.yogas_doshas?.yogas || [];
  return yogas
    .filter((y) => !y.is_cancelled && y.strength && !['weak','very_weak'].includes(y.strength))
    .slice(0, n)
    .map((y) => ({
      name: lang === 'hi' ? (y.name_hi || y.name) : y.name,
      strength: y.strength,
    }));
}

function getStrongestPlanets(chart, n = 3) {
  const DIGNITY_RANK = { 'Exaltation (उच्च)':5, 'Moolatrikona (मूलत्रिकोण)':4, 'Own Sign (स्वगृह)':3 };
  const planets = chart?.planets || {};
  return Object.entries(planets)
    .filter(([,p]) => p?.dignity && DIGNITY_RANK[p.dignity] >= 3)
    .sort((a, b) => (DIGNITY_RANK[b[1].dignity] || 0) - (DIGNITY_RANK[a[1].dignity] || 0))
    .slice(0, n)
    .map(([name, p]) => ({ name, dignity: p.dignity, house: p.house_num, rashi_num: p.rashi_num }));
}

function getTopBhavaLords(bhavaLordReadings, n = 3) {
  if (!Array.isArray(bhavaLordReadings)) return [];
  return bhavaLordReadings
    .filter((b) => b.overall_effect === 'highly_positive' || b.overall_effect === 'positive')
    .slice(0, n);
}

function getCurrentDasha(chart) {
  const dasha = chart?.dasha;
  if (!Array.isArray(dasha)) return null;
  const maha  = dasha.find((d) => d.is_current) || dasha[0];
  const antar = maha?.antardasha?.find((a) => a.is_current) || null;
  return { maha: maha?.lord, antar: antar?.lord, end: maha?.end };
}

function getCareerVerdict(lifeGuidance, lang) {
  const career = lifeGuidance?.career;
  if (!career) return null;
  return {
    verdict: lang === 'hi' ? (career.verdict_hi || career.verdict) : career.verdict,
    score: career.score,
    location: lang === 'hi'
      ? (career.work_location?.verdict_hi || career.work_location?.verdict)
      : career.work_location?.verdict,
  };
}

function getMarriageTiming(profile, lang) {
  const mt = profile?.marriage_timing;
  if (!mt?.windows?.length) return null;
  const upcoming = mt.windows.find((w) =>
    !w.is_past && (w.rating_en === 'Very Strong' || w.rating_en === 'Strong')
  ) || mt.windows.find((w) => !w.is_past);
  if (!upcoming) return null;
  const reasonStr = lang === 'hi'
    ? (upcoming.reason_hi || upcoming.reason_en || '')
    : (upcoming.reason_en || '');
  return {
    maha:    upcoming.maha,
    antar:   upcoming.antar,
    rating:  upcoming.rating_en || upcoming.rating,
    reasons: reasonStr ? reasonStr.split('; ').slice(0, 2) : [],
  };
}

function getKeyRemedies(profile, lang) {
  const rd = profile?.remedy_data;
  if (!rd) return [];
  const planets = [];
  if (rd.dasha_planet) planets.push(rd.dasha_planet);
  if (rd.lagna_planet) planets.push(rd.lagna_planet);
  return planets
    .filter((p, i, arr) => arr.findIndex(q => q.planet === p.planet) === i) // dedupe
    .map((p) => ({
      planet: p.planet,
      mantra: lang === 'hi'
        ? (p.mantras_hi?.[0] || p.mantras_en?.[0])
        : p.mantras_en?.[0],
      devata: lang === 'hi' ? (p.ishta_devata_hi || p.ishta_devata_en) : p.ishta_devata_en,
    }));
}

function getCharaKarakaHighlight(profile, lang) {
  const cks = profile?.chara_karakas;
  if (!Array.isArray(cks) || !cks.length) return null;
  const ak = cks[0]; // Atmakaraka
  return {
    planet: ak.planet,
    meaning: lang === 'hi' ? (ak.meaning_hi || ak.meaning_en) : ak.meaning_en,
  };
}

function getActiveSadeSati(profile, lang) {
  const sj = profile?.sade_sati_journey;
  const cur = sj?.current_phase;
  if (!cur || !sj?.is_active) return null;
  return {
    phase: lang === 'hi' ? (sj.current_phase_hi || cur) : cur,
    note: lang === 'hi'
      ? 'साढ़ेसाती सक्रिय — धैर्य और साधना इस काल की कुंजी है।'
      : 'Sade Sati is active — patience and discipline are your allies now.',
  };
}

function getFavDayHighlight(profile, lang) {
  const fd = profile?.favourite_days;
  if (!fd?.purposes) return [];
  return fd.purposes
    .filter((p) => !p.avoid_day_num)
    .slice(0, 4)
    .map((p) => ({
      purpose: lang === 'hi' ? (p.purpose_hi || p.purpose_en) : p.purpose_en,
      day: lang === 'hi' ? (p.day_hi || p.day_en) : p.day_en,
      icon: p.icon,
    }));
}

/* ── main panel ── */
export default function KundliSynthesisPanel({ kundli, lang = 'en', admin = false }) {
  const [strength, setStrength]   = useState(null);
  const [loading,  setLoading]    = useState(true);

  const chart  = kundli?.calculated_data
    ? (typeof kundli.calculated_data === 'string'
        ? (() => { try { return JSON.parse(kundli.calculated_data); } catch { return null; } })()
        : kundli.calculated_data)
    : null;

  const uuid = kundli?.uuid;

  useEffect(() => {
    if (!uuid) { setLoading(false); return; }
    const client = admin ? adminApi : api;
    const url    = admin ? `/admin/kundlis/${uuid}/strength` : `/kundli/${uuid}/strength`;
    client.get(url)
      .then((r) => setStrength(r.data?.strength || r.data?.data?.strength || null))
      .catch(() => setStrength(null))
      .finally(() => setLoading(false));
  }, [uuid, admin]);

  if (!chart) return null;

  // ── extract cream ──
  const lagnaNum      = chart.ascendant?.rashi_num;
  const moonNum       = chart.planets?.Moon?.rashi_num;
  const curDasha      = getCurrentDasha(chart);
  const topYogas      = getTopYogas(chart, lang);
  const strongPlanets = getStrongestPlanets(chart);
  const topBhava      = getTopBhavaLords(kundli?.bhava_lord_readings, 3);
  const careerVerdict = getCareerVerdict(kundli?.life_guidance, lang);
  const marriageTiming = getMarriageTiming(kundli, lang);
  const keyRemedies   = getKeyRemedies(kundli, lang);
  const ak            = getCharaKarakaHighlight(kundli, lang);
  const sadeSati      = getActiveSadeSati(kundli, lang);
  const favDays       = getFavDayHighlight(kundli, lang);

  const dashaJourney  = kundli?.dasha_journey || [];
  const curMahaNarr   = dashaJourney.find((d) => d.lord === curDasha?.maha);
  const yutis         = (kundli?.yuti_analysis || []).slice(0, 4);
  const ld            = kundli?.life_guidance;

  const QUAL_COLOR = {
    highly_positive:'#22C55E', positive:'#D4AF37', neutral:'#94A3B8',
    negative:'#F59E0B', highly_negative:'#EF4444',
  };

  return (
    <div style={{ marginBottom:24 }}>

      {/* ── Banner ── */}
      <div style={{
        background:'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(32,38,70,0.88) 60%)',
        border:'1px solid rgba(212,175,55,0.3)', borderRadius:12, padding:'16px 20px', marginBottom:16,
        display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap',
      }}>
        <div style={{ flex:1, minWidth:220 }}>
          <p style={{ fontSize:9, fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:4 }}>
            🔮 {T(lang, 'Kundli Final Results', 'कुंडली का सारांश')}
          </p>
          <h2 style={{ fontSize:17, fontWeight:800, color:IVORY, lineHeight:1.35, marginBottom:6 }} className="font-devanagari">
            {T(lang, 'Your Complete Cosmic Blueprint', 'आपका संपूर्ण ब्रह्मांडीय खाका')}
          </h2>
          <p style={{ fontSize:11.5, color:DIM, lineHeight:1.7 }} className="font-devanagari">
            {T(lang,
              'This section distils the most important insights from every part of your Kundli — strengths, active yogas, current life phase, key life verdicts, remedies, and more — into one complete picture.',
              'यह खंड आपकी कुंडली के प्रत्येक भाग के सबसे महत्वपूर्ण निष्कर्षों को एक स्थान पर प्रस्तुत करता है — शक्ति, सक्रिय योग, वर्तमान जीवन चरण, प्रमुख निर्णय, उपाय और बहुत कुछ।'
            )}
          </p>
          {/* identity chips */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
            {lagnaNum && <Pill color="#818CF8">⬆ {rn(lagnaNum, lang)} {T(lang,'Lagna','लग्न')}</Pill>}
            {moonNum  && <Pill color="#94A3B8">☽ {rn(moonNum, lang)} {T(lang,'Moon','चंद्र')}</Pill>}
            {curDasha?.maha && (
              <Pill color="#A78BFA">
                {ph(curDasha.maha, lang)}{curDasha.antar ? ` / ${ph(curDasha.antar, lang)}` : ''} {T(lang,'Dasha','दशा')}
              </Pill>
            )}
            {ak && <Pill color={GOLD}>👁 {ph(ak.planet, lang)} {T(lang,'AK','आत्मकारक')}</Pill>}
          </div>
        </div>
        {/* Strength ring */}
        {loading ? (
          <div style={{ width:88, height:88, borderRadius:'50%',
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:9, color:DIM }}>…</span>
          </div>
        ) : strength ? (
          <ScoreRing score={strength.overall_score} label={T(lang, strength.label?.en, strength.label?.hi)} lang={lang} />
        ) : null}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>

        {/* ── 1. Atmakaraka + Soul Path ── */}
        {ak && (
          <Card>
            <SectionHead icon="👁" en="Soul Indicator (Atmakaraka)" hi="आत्मकारक — आत्म-संकेतक" lang={lang} color="#FBBF24" />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:22, color: PLANET_COLOR[ak.planet] || GOLD }}>
                {PLANET_ICON[ak.planet] || '✦'}
              </span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:IVORY }}>{ph(ak.planet, lang)}</div>
                <div style={{ fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {T(lang,'Atmakaraka','आत्मकारक')}
                </div>
              </div>
            </div>
            <p style={{ fontSize:11.5, color:DIM, lineHeight:1.75 }} className="font-devanagari">
              {ak.meaning}
            </p>
          </Card>
        )}

        {/* ── 2. Current Dasha Phase ── */}
        {curDasha?.maha && (
          <Card>
            <SectionHead icon="⏳" en="Current Life Phase (Dasha)" hi="वर्तमान जीवन चरण (दशा)" lang={lang} color="#A78BFA" />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:22, color: PLANET_COLOR[curDasha.maha] || GOLD }}>
                {PLANET_ICON[curDasha.maha]}
              </span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#C4B5FD' }}>
                  {ph(curDasha.maha, lang)} {T(lang,'Mahadasha','महादशा')}
                </div>
                {curDasha.antar && (
                  <div style={{ fontSize:11, color:DIM }}>
                    {ph(curDasha.antar, lang)} {T(lang,'Antardasha','अंतर्दशा')}
                  </div>
                )}
                {curDasha.end && (
                  <div style={{ fontSize:9, color:DIM, marginTop:2 }}>
                    {T(lang,'Until','तक')} {String(curDasha.end).slice(0,10)}
                  </div>
                )}
              </div>
            </div>
            {curMahaNarr && (
              <p style={{ fontSize:11, color:DIM, lineHeight:1.75 }} className="font-devanagari">
                {lang === 'hi'
                  ? (curMahaNarr.text_hi || curMahaNarr.text_en)
                  : curMahaNarr.text_en}
              </p>
            )}
          </Card>
        )}

        {/* ── 3. Active Yogas ── */}
        {topYogas.length > 0 && (
          <Card>
            <SectionHead icon="⚡" en="Active Yogas in Your Chart" hi="आपकी कुंडली के सक्रिय योग" lang={lang} color={GOLD} />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {topYogas.map((y, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, color:GOLD, flexShrink:0 }}>✦</span>
                  <span style={{ fontSize:12, color:IVORY, fontWeight:600 }} className="font-devanagari">{y.name}</span>
                  {y.strength && (
                    <span style={{ fontSize:9, color:DIM, marginLeft:'auto', flexShrink:0, textTransform:'capitalize' }}>
                      {y.strength}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 4. Strongest Planets ── */}
        {strongPlanets.length > 0 && (
          <Card>
            <SectionHead icon="💪" en="Strongest Planets" hi="सबसे शक्तिशाली ग्रह" lang={lang} color="#22C55E" />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {strongPlanets.map((p, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18, color: PLANET_COLOR[p.name] || GOLD }}>{PLANET_ICON[p.name]}</span>
                  <div>
                    <span style={{ fontSize:12, fontWeight:700, color:IVORY }}>{ph(p.name, lang)}</span>
                    <span style={{ fontSize:10, color:'#22C55E', marginLeft:7 }}>
                      {T(lang,'H','भाव')}{p.house}
                    </span>
                  </div>
                  <span style={{ marginLeft:'auto', fontSize:9, color:'#22C55E',
                    background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)',
                    borderRadius:6, padding:'1px 7px' }}>
                    {p.dignity?.replace(/ \(.*?\)/,'') || ''}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 5. Career Verdict ── */}
        {careerVerdict && (
          <Card>
            <SectionHead icon="💼" en="Career Direction" hi="करियर दिशा" lang={lang} color="#60A5FA" />
            <div style={{ fontSize:13, fontWeight:700, color:'#60A5FA', marginBottom:6 }} className="font-devanagari">
              {careerVerdict.verdict}
            </div>
            {careerVerdict.location && (
              <p style={{ fontSize:11.5, color:DIM, lineHeight:1.75, marginBottom:6 }} className="font-devanagari">
                📍 {careerVerdict.location}
              </p>
            )}
            {ld?.career?.business_timing?.rating && (
              <Pill color="#60A5FA">
                {T(lang,'Business Timing','व्यापार समय')}: {ld.career.business_timing.rating}
              </Pill>
            )}
          </Card>
        )}

        {/* ── 6. Relationship / Marriage ── */}
        {(ld?.marriage || marriageTiming) && (
          <Card>
            <SectionHead icon="💑" en="Love & Marriage" hi="प्रेम और विवाह" lang={lang} color="#EC4899" />
            {(ld?.marriage?.verdict_en || ld?.marriage?.verdict_hi) && (
              <p style={{ fontSize:12, fontWeight:600, color:'#EC4899', marginBottom:6 }} className="font-devanagari">
                {lang === 'hi'
                  ? (ld.marriage.verdict_hi || ld.marriage.verdict_en)
                  : ld.marriage.verdict_en}
              </p>
            )}
            {marriageTiming && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  {T(lang,'Upcoming Timing Window','आगामी विवाह समय')}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <Pill color="#EC4899">
                    {ph(marriageTiming.maha, lang)}/{ph(marriageTiming.antar, lang)}
                  </Pill>
                  <Pill color={marriageTiming.rating === 'Very Strong' ? '#22C55E' : GOLD}>
                    {marriageTiming.rating}
                  </Pill>
                </div>
                {marriageTiming.reasons.map((r, i) => (
                  <p key={i} style={{ fontSize:10.5, color:DIM, lineHeight:1.65, marginTop:5 }} className="font-devanagari">
                    ✦ {r}
                  </p>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── 7. Best Bhava Lord Placements ── */}
        {topBhava.length > 0 && (
          <Card>
            <SectionHead icon="🏠" en="Best Bhava Lord Placements" hi="उत्तम भाव स्वामी स्थिति" lang={lang} color={GOLD} />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {topBhava.map((b, i) => (
                <div key={i} style={{ borderLeft:`2px solid ${QUAL_COLOR[b.quality] || GOLD}`, paddingLeft:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:IVORY }} className="font-devanagari">
                      {T(lang,'House','भाव')} {b.house_number} {T(lang,'lord','स्वामी')} {b.lord_planet
                        ? `(${ph(b.lord_planet, lang)})`
                        : ''}
                    </span>
                    <span style={{ marginLeft:'auto', fontSize:9,
                      color: QUAL_COLOR[b.quality] || GOLD,
                      background:`${QUAL_COLOR[b.quality]}14`, border:`1px solid ${QUAL_COLOR[b.quality]}30`,
                      borderRadius:6, padding:'1px 7px' }}>
                      {b.quality === 'highly_positive'
                        ? T(lang,'Excellent','उत्कृष्ट')
                        : T(lang,'Favourable','अनुकूल')}
                    </span>
                  </div>
                  <p style={{ fontSize:10.5, color:DIM, lineHeight:1.65, margin:0 }} className="font-devanagari">
                    {lang === 'hi'
                      ? (b.interpretation_hi || b.interpretation_en || '').slice(0,120)
                      : (b.interpretation_en || '').slice(0,120)}
                    {(b.interpretation_en || '').length > 120 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 8. Planetary Conjunctions (Yuti) ── */}
        {yutis.length > 0 && (
          <Card>
            <SectionHead icon="✨" en="Active Planetary Unions (Yuti)" hi="सक्रिय ग्रह युतियां" lang={lang} color="#FBBF24" />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {yutis.map((y, i) => (
                <div key={i}>
                  <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:3 }}>
                    {(y.planets || []).map((p) => (
                      <span key={p} style={{ fontSize:12, color: PLANET_COLOR[p] || GOLD }}>{PLANET_ICON[p]}</span>
                    ))}
                    {y.yoga_name && (
                      <span style={{ fontSize:10, fontWeight:700, color:GOLD, marginLeft:4 }}>
                        {y.yoga_name}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:10.5, color:DIM, lineHeight:1.65, margin:0 }} className="font-devanagari">
                    {lang === 'hi'
                      ? ((y.narrative_hi || y.narrative_en || '')).slice(0,120)
                      : (y.narrative_en || '').slice(0,120)}
                    {(y.narrative_en || '').length > 120 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 9. Key Remedies ── */}
        {keyRemedies.length > 0 && (
          <Card>
            <SectionHead icon="🙏" en="Your Key Remedies" hi="आपके प्रमुख उपाय" lang={lang} color="#22C55E" />
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {keyRemedies.map((r, i) => (
                <div key={i} style={{
                  borderLeft:`2px solid ${PLANET_COLOR[r.planet] || GOLD}`, paddingLeft:10,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:PLANET_COLOR[r.planet] || GOLD, marginBottom:4 }}>
                    {PLANET_ICON[r.planet]} {ph(r.planet, lang)}
                  </div>
                  {r.devata && (
                    <p style={{ fontSize:10.5, color:DIM, marginBottom:4 }} className="font-devanagari">
                      🙏 {r.devata}
                    </p>
                  )}
                  {r.mantra && (
                    <p style={{ fontSize:10.5, color:IVORY, marginBottom:3 }} className="font-devanagari">
                      🔱 {r.mantra}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 10. Sade Sati Alert (if active) ── */}
        {sadeSati && (
          <Card style={{ border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.04)' }}>
            <SectionHead icon="⚠" en="Sade Sati Alert" hi="साढ़ेसाती चेतावनी" lang={lang} color="#EF4444" />
            <Pill color="#EF4444">{sadeSati.phase}</Pill>
            <p style={{ fontSize:11.5, color:DIM, lineHeight:1.75, marginTop:8 }} className="font-devanagari">
              {sadeSati.note}
            </p>
          </Card>
        )}

        {/* ── 11. Strength Category Bars ── */}
        {strength?.life_domain_list?.length > 0 && (
          <Card style={{ gridColumn:'span 2' }}>
            <SectionHead icon="📊" en="Life Domain Strength Overview" hi="जीवन क्षेत्र शक्ति अवलोकन" lang={lang} color={GOLD} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8 }}>
              {strength.life_domain_list.slice(0, 8).map((d, i) => {
                const pct   = Math.min(100, Math.max(0, d.score));
                const color = pct >= 70 ? '#22C55E' : pct >= 50 ? GOLD : pct >= 35 ? '#F59E0B' : '#EF4444';
                return (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:10, color:DIM, textTransform:'capitalize' }}>
                        {lang === 'hi' ? (d.hi || d.en || d.key) : (d.en || d.key)}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700, color }}>{pct}</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
                      <div style={{ width:`${pct}%`, height:5, borderRadius:3, background:color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── 12. Favourite Days Summary ── */}
        {favDays.length > 0 && (
          <Card>
            <SectionHead icon="📅" en="Best Days For You" hi="आपके शुभ दिन" lang={lang} color="#60A5FA" />
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {favDays.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>{f.icon}</span>
                  <span style={{ fontSize:11.5, color:IVORY, flex:1 }} className="font-devanagari">{f.purpose}</span>
                  {f.day && <Pill color="#60A5FA">{f.day}</Pill>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 13. Strength Highlights ── */}
        {(strength?.strengths_en || strength?.challenges_en) && (
          <Card>
            <SectionHead icon="🌟" en="Chart Highlights" hi="कुंडली की विशेषताएं" lang={lang} color={GOLD} />
            {strength?.strengths_en && (
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:9, color:'#22C55E', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  {T(lang,'Strengths','शक्तियां')}
                </div>
                <p style={{ fontSize:11.5, color:DIM, lineHeight:1.75 }} className="font-devanagari">
                  {lang === 'hi'
                    ? (strength.strengths_hi || strength.strengths_en || []).join(' ')
                    : (strength.strengths_en || []).join(' ')}
                </p>
              </div>
            )}
            {strength?.challenges_en && (
              <div>
                <div style={{ fontSize:9, color:'#F59E0B', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  {T(lang,'Growth Areas','विकास क्षेत्र')}
                </div>
                <p style={{ fontSize:11.5, color:DIM, lineHeight:1.75 }} className="font-devanagari">
                  {lang === 'hi'
                    ? (strength.challenges_hi || strength.challenges_en || []).join(' ')
                    : (strength.challenges_en || []).join(' ')}
                </p>
              </div>
            )}
          </Card>
        )}

      </div>

      {/* ── Footer verdict ── */}
      {(strength?.verdict_en || strength?.verdict_hi) && (
        <div style={{
          marginTop:14, background:'rgba(212,175,55,0.06)',
          border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'14px 18px',
          textAlign:'center',
        }}>
          <p style={{ fontSize:9, fontWeight:700, color:GOLD,
            textTransform:'uppercase', letterSpacing:'0.18em', marginBottom:6 }}>
            {T(lang,'Overall Verdict','समग्र निर्णय')}
          </p>
          <p style={{ fontSize:13, color:IVORY, lineHeight:1.75 }} className="font-devanagari">
            {lang === 'hi' ? (strength.verdict_hi || strength.verdict_en) : strength.verdict_en}
          </p>
        </div>
      )}
    </div>
  );
}
