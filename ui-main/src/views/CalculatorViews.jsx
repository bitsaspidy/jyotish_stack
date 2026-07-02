'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import api from '../lib/api';
import BirthFields, { emptyBirthForm } from '../components/calculators/BirthFields';

const GOLD  = '#D4AF37';
const AMBER = '#F59E0B';
const RED   = '#EF4444';
const GREEN = '#22C55E';
const MUTED = 'rgba(245,240,232,0.55)';

const PLANET_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };

// ─── Shared upsell CTA block ──────────────────────────────────────────────────
function UnlockCTA({ lang, items }) {
  const hi = lang === 'hi';
  return (
    <div style={{ marginTop:16 }}>
      {items?.length > 0 && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {items.map((item, i) => (
            <span key={i} style={{
              fontSize:10, color:MUTED, border:'1px dashed rgba(255,255,255,0.2)',
              borderRadius:14, padding:'4px 10px',
            }}>
              🔒 {hi ? item.hi : item.en}
            </span>
          ))}
        </div>
      )}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <Link href="/register" className="btn-gold" style={{ fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none' }}>
          {hi ? '🔓 पूर्ण विश्लेषण खोलें — निःशुल्क खाता' : '🔓 Unlock Full Analysis — Free Account'}
        </Link>
        <Link href="/remedy" style={{
          fontSize:12, padding:'9px 18px', borderRadius:10, textDecoration:'none',
          border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600,
        }}>
          {hi ? '📿 उपाय पुस्तिका ₹250' : '📿 Remedy Booklet ₹250'}
        </Link>
      </div>
    </div>
  );
}

// ─── Generic calculator shell ─────────────────────────────────────────────────
function CalculatorShell({ icon, titleEn, titleHi, introEn, introHi, children }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            {icon} {hi ? titleHi : titleEn}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:560, margin:'8px auto 0', lineHeight:1.7 }}>
            {hi ? introHi : introEn}
          </p>
        </motion.div>
        {children({ lang, hi })}
        <p style={{ fontSize:10, color:MUTED, textAlign:'center', marginTop:24 }}>
          {hi
            ? 'सटीक लाहिरी अयनांश गणना · 100% निःशुल्क · कोई डेटा संग्रहीत नहीं'
            : 'Accurate Lahiri ayanamsa calculations · 100% free · No data stored'}
        </p>
      </div>
    </div>
  );
}

// Single-birth calculator flow: form → POST → renderResult
function SingleBirthCalculator({ type, submitLabelEn, submitLabelHi, renderResult, lang, hi }) {
  const [form, setForm]     = useState(emptyBirthForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const t = (en, h) => translate(lang, en, h);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error(t('Please search and select the birth place.', 'कृपया जन्म स्थान खोजें और चुनें।'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post(`/public/calculator/${type}`, form);
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('Calculation failed.', 'गणना विफल रही।'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-6">
        <BirthFields form={form} onChange={setForm} lang={lang} showName={false} />
        <button type="submit" disabled={loading} className="btn-gold w-full mt-5" style={{ padding:'12px 0', fontSize:14, fontWeight:700, borderRadius:10 }}>
          {loading ? t('Calculating…', 'गणना हो रही है…') : (hi ? submitLabelHi : submitLabelEn)}
        </button>
      </motion.form>
      {result && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-6 mt-6">
          {renderResult(result, { lang, hi, t })}
        </motion.div>
      )}
    </>
  );
}

// ─── 1. Mangal Dosha Calculator ───────────────────────────────────────────────
export function MangalDoshaCalc() {
  return (
    <CalculatorShell icon="♂️"
      titleEn="Mangal Dosha Calculator" titleHi="मंगल दोष कैलकुलेटर"
      introEn="Check instantly whether you are Manglik. Mars in houses 1, 4, 7, 8 or 12 from lagna, Moon or Venus creates Mangal Dosha — a key factor checked before marriage."
      introHi="तुरंत जांचें कि आप मांगलिक हैं या नहीं। लग्न, चंद्र या शुक्र से 1, 4, 7, 8 या 12वें भाव में मंगल होने से मंगल दोष बनता है — विवाह से पहले जांचा जाने वाला प्रमुख कारक।">
      {({ lang, hi }) => (
        <SingleBirthCalculator type="mangal-dosha" lang={lang} hi={hi}
          submitLabelEn="♂️ Check Mangal Dosha" submitLabelHi="♂️ मंगल दोष जांचें"
          renderResult={(r, { t }) => (
            <div>
              {r.has_dosha ? (
                <>
                  <p style={{ fontSize:18, fontWeight:800, color:RED }}>
                    ⚠️ {t(`Yes — you are ${r.manglik_type || 'Manglik'}`, `हाँ — आप ${r.manglik_type_hi || 'मांगलिक'} हैं`)}
                  </p>
                  {r.cancellations_found > 0 && (
                    <p style={{ fontSize:13, color:AMBER, marginTop:10, lineHeight:1.7 }}>
                      ✨ {t(
                        `Good news: ${r.cancellations_found} possible cancellation${r.cancellations_found > 1 ? 's' : ''} (parihar) found in your chart — your dosha may be partially or fully neutralised. Unlock the full analysis to see how.`,
                        `शुभ समाचार: आपकी कुंडली में ${r.cancellations_found} संभावित परिहार मिले — आपका दोष आंशिक या पूर्ण रूप से शांत हो सकता है। पूर्ण विश्लेषण खोलकर देखें।`)}
                    </p>
                  )}
                  <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7 }}>
                    {t('Which houses trigger it, how severe it is, and the exact remedies — see the full report.',
                       'कौन-से भाव इसे सक्रिय करते हैं, यह कितना तीव्र है, और सटीक उपाय — पूर्ण रिपोर्ट में देखें।')}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:18, fontWeight:800, color:GREEN }}>
                    ✅ {t('No — you are not Manglik', 'नहीं — आप मांगलिक नहीं हैं')}
                  </p>
                  <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7 }}>
                    {t('But other doshas may still affect your marriage timing and compatibility. Get your complete dosha scan in the full report.',
                       'लेकिन अन्य दोष आपके विवाह-समय और अनुकूलता को प्रभावित कर सकते हैं। पूर्ण रिपोर्ट में संपूर्ण दोष स्कैन प्राप्त करें।')}
                  </p>
                </>
              )}
              <UnlockCTA lang={lang} items={[
                { en:'Severity analysis',        hi:'तीव्रता विश्लेषण' },
                { en:'Cancellation details',     hi:'परिहार विवरण' },
                { en:'House-wise triggers',      hi:'भाव-वार कारण' },
                { en:'Remedies',                 hi:'उपाय' },
                { en:'Marriage guidance',        hi:'विवाह मार्गदर्शन' },
              ]} />
            </div>
          )} />
      )}
    </CalculatorShell>
  );
}

// ─── 2. Sade Sati Calculator ──────────────────────────────────────────────────
export function SadeSatiCalc() {
  return (
    <CalculatorShell icon="🪐"
      titleEn="Sade Sati Calculator" titleHi="साढ़े साती कैलकुलेटर"
      introEn="Is Saturn's 7½-year Sade Sati running in your life right now? Check your current phase, when it ends, and when the next cycle begins."
      introHi="क्या शनि की साढ़े साती अभी आपके जीवन में चल रही है? अपना वर्तमान चरण, समाप्ति तिथि और अगला चक्र कब शुरू होगा — जांचें।">
      {({ lang, hi }) => (
        <SingleBirthCalculator type="sade-sati" lang={lang} hi={hi}
          submitLabelEn="🪐 Check My Sade Sati" submitLabelHi="🪐 मेरी साढ़े साती जांचें"
          renderResult={(r, { t }) => (
            <div>
              <p style={{ fontSize:11, color:MUTED, marginBottom:8 }}>
                {t('Moon Sign', 'चंद्र राशि')}: <span style={{ color:GOLD, fontWeight:700 }}>{hi ? r.moon_rashi_hi : r.moon_rashi_en}</span>
              </p>
              {r.active ? (
                <>
                  <p style={{ fontSize:18, fontWeight:800, color:AMBER }}>
                    ⚠️ {t('Yes — Sade Sati is ACTIVE in your life right now', 'हाँ — साढ़े साती अभी आपके जीवन में सक्रिय है')}
                  </p>
                  {r.current && (
                    <p style={{ fontSize:13, color:'#F5F0E8', marginTop:10, lineHeight:1.7 }}>
                      {t('Current phase', 'वर्तमान चरण')}: <b style={{ color:AMBER }}>{hi ? r.current.phase_hi : r.current.phase_en}</b>
                      <br />
                      {t('Runs until', 'समाप्ति')}: <b>{r.current.end}</b>
                    </p>
                  )}
                  <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7 }}>
                    {t('What this phase means for career, health and family — and the Shani remedies that soften it — see the full analysis.',
                       'यह चरण करियर, स्वास्थ्य और परिवार के लिए क्या मायने रखता है — और कौन-से शनि उपाय इसे शांत करेंगे — पूर्ण विश्लेषण देखें।')}
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:18, fontWeight:800, color:GREEN }}>
                    ✅ {t('No — Sade Sati is not active right now', 'नहीं — साढ़े साती अभी सक्रिय नहीं है')}
                  </p>
                  {r.next_start && (
                    <p style={{ fontSize:13, color:'#F5F0E8', marginTop:10 }}>
                      {t('Your next Sade Sati begins', 'आपकी अगली साढ़े साती शुरू होगी')}: <b style={{ color:AMBER }}>{r.next_start}</b>
                    </p>
                  )}
                  <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7 }}>
                    {t(`Your lifetime has ${r.lifetime_phase_count} Sade Sati phases. Prepare in advance — see the full timeline with peak periods.`,
                       `आपके जीवन में ${r.lifetime_phase_count} साढ़े साती चरण हैं। पहले से तैयारी करें — शिखर अवधियों सहित पूर्ण समयरेखा देखें।`)}
                  </p>
                </>
              )}
              <UnlockCTA lang={lang} items={[
                { en:'Full lifetime timeline', hi:'संपूर्ण जीवन समयरेखा' },
                { en:'Phase meanings',         hi:'चरणों के अर्थ' },
                { en:'Peak (kantak) periods',  hi:'शिखर (कंटक) अवधि' },
                { en:'Shani remedies',         hi:'शनि उपाय' },
              ]} />
            </div>
          )} />
      )}
    </CalculatorShell>
  );
}

// ─── 3. Mahadasha Calculator ──────────────────────────────────────────────────
export function MahadashaCalc() {
  return (
    <CalculatorShell icon="⏳"
      titleEn="Mahadasha Calculator" titleHi="महादशा कैलकुलेटर"
      introEn="Which Vimshottari Mahadasha is running in your life right now? Find your current planetary period, sub-period (antardasha), and what comes next."
      introHi="अभी आपके जीवन में कौन-सी विंशोत्तरी महादशा चल रही है? अपनी वर्तमान ग्रह दशा, अंतर्दशा और आगे क्या आएगा — जानें।">
      {({ lang, hi }) => (
        <SingleBirthCalculator type="mahadasha" lang={lang} hi={hi}
          submitLabelEn="⏳ Find My Mahadasha" submitLabelHi="⏳ मेरी महादशा जानें"
          renderResult={(r, { t }) => (
            <div>
              {r.current_mahadasha ? (
                <>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:170, background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'12px 16px' }}>
                      <p style={{ fontSize:10, color:MUTED, textTransform:'uppercase' }}>{t('Current Mahadasha', 'वर्तमान महादशा')}</p>
                      <p style={{ fontSize:18, color:GOLD, fontWeight:800, marginTop:3 }}>
                        {hi ? (PLANET_HI[r.current_mahadasha.lord] || r.current_mahadasha.lord) : r.current_mahadasha.lord}
                      </p>
                      <p style={{ fontSize:10, color:MUTED, marginTop:2 }}>
                        {String(r.current_mahadasha.start).slice(0,10)} → {String(r.current_mahadasha.end).slice(0,10)}
                      </p>
                    </div>
                    {r.current_antardasha && (
                      <div style={{ flex:1, minWidth:170, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 16px' }}>
                        <p style={{ fontSize:10, color:MUTED, textTransform:'uppercase' }}>{t('Antardasha', 'अंतर्दशा')}</p>
                        <p style={{ fontSize:18, color:'#F5F0E8', fontWeight:800, marginTop:3 }}>
                          {hi ? (PLANET_HI[r.current_antardasha.lord] || r.current_antardasha.lord) : r.current_antardasha.lord}
                        </p>
                        <p style={{ fontSize:10, color:MUTED, marginTop:2 }}>
                          {t('Until', 'तक')} {String(r.current_antardasha.end).slice(0,10)}
                        </p>
                      </div>
                    )}
                  </div>
                  {r.next_mahadasha && (
                    <p style={{ fontSize:12, color:MUTED, marginTop:12 }}>
                      {t('Next', 'अगली')}: <b style={{ color:'#F5F0E8' }}>{hi ? (PLANET_HI[r.next_mahadasha.lord] || r.next_mahadasha.lord) : r.next_mahadasha.lord} {t('Mahadasha', 'महादशा')}</b> {t('from', 'से')} {String(r.next_mahadasha.start).slice(0,10)}
                    </p>
                  )}
                  <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7 }}>
                    {t('Is this dasha favourable for career, marriage or wealth? What should you start — or avoid? Unlock the full interpretation.',
                       'क्या यह दशा करियर, विवाह या धन के लिए अनुकूल है? क्या शुरू करें — और क्या टालें? पूर्ण व्याख्या खोलें।')}
                  </p>
                </>
              ) : (
                <p style={{ fontSize:13, color:MUTED }}>{t('Unable to determine current dasha.', 'वर्तमान दशा निर्धारित नहीं हो सकी।')}</p>
              )}
              <UnlockCTA lang={lang} items={[
                { en:'Full dasha timeline',        hi:'पूर्ण दशा समयरेखा' },
                { en:'Period interpretations',     hi:'दशा फल व्याख्या' },
                { en:'All antardashas',            hi:'सभी अंतर्दशाएँ' },
                { en:'Favourable windows',         hi:'अनुकूल अवधि' },
                { en:'Dasha remedies',             hi:'दशा उपाय' },
              ]} />
            </div>
          )} />
      )}
    </CalculatorShell>
  );
}

// ─── 4. Kundli Milan (dual-form) ──────────────────────────────────────────────
export function KundliMilanCalc() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const t = (en, h) => translate(lang, en, h);

  const [boy, setBoy]       = useState({ ...emptyBirthForm, gender: 'male' });
  const [girl, setGirl]     = useState({ ...emptyBirthForm, gender: 'female' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!boy.latitude || !girl.latitude) {
      toast.error(t('Please select birth places for both.', 'कृपया दोनों के जन्म स्थान चुनें।'));
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/public/calculator/kundli-milan', { boy, girl });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('Calculation failed.', 'गणना विफल रही।'));
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = result
    ? (result.total >= 25 ? GREEN : result.total >= 18 ? AMBER : RED)
    : GOLD;

  return (
    <CalculatorShell icon="💑"
      titleEn="Kundli Milan — Free Gun Milan Calculator" titleHi="कुंडली मिलान — निःशुल्क गुण मिलान"
      introEn="Ashtakoot Guna Milan checks 36 gunas across 8 kootas for marriage compatibility. Enter both birth details and get the matching score instantly."
      introHi="अष्टकूट गुण मिलान विवाह अनुकूलता के लिए 8 कूटों में 36 गुणों की जांच करता है। दोनों के जन्म विवरण भरें और तुरंत मिलान स्कोर पाएं।">
      {({ lang: l, hi: h }) => (
        <>
          <motion.form onSubmit={handleSubmit} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div className="card-royal p-6 mb-4">
              <p className="font-serif text-gold text-sm font-semibold mb-3">🤵 {t("Boy's Details", 'वर का विवरण')}</p>
              <BirthFields form={boy} onChange={setBoy} lang={l} />
            </div>
            <div className="card-royal p-6 mb-4">
              <p className="font-serif text-gold text-sm font-semibold mb-3">👰 {t("Girl's Details", 'वधू का विवरण')}</p>
              <BirthFields form={girl} onChange={setGirl} lang={l} />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full" style={{ padding:'12px 0', fontSize:14, fontWeight:700, borderRadius:10 }}>
              {loading ? t('Matching kundlis…', 'कुंडली मिलान हो रहा है…') : t('💑 Match Kundlis Now', '💑 कुंडली मिलान करें')}
            </button>
          </motion.form>

          {result && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-6 mt-6 text-center">
              <p style={{ fontSize:12, color:MUTED }}>
                {result.boy_name} ❤ {result.girl_name}
              </p>
              <p style={{ fontSize:44, fontWeight:900, color:scoreColor, margin:'10px 0 0' }}>
                {result.total}<span style={{ fontSize:20, color:MUTED }}>/{result.max}</span>
              </p>
              <p style={{ fontSize:13, fontWeight:700, color:scoreColor, marginTop:4 }}>
                {h ? result.verdict_hi : result.verdict_en}
              </p>
              {result.issues_detected > 0 && (
                <p style={{ fontSize:12, color:AMBER, marginTop:12, lineHeight:1.7 }}>
                  ⚠️ {t(
                    `${result.issues_detected} compatibility issue${result.issues_detected > 1 ? 's' : ''} detected (koota dosha / mangal mismatch) — details locked.`,
                    `${result.issues_detected} अनुकूलता समस्या पाई गई (कूट दोष / मंगल असंगति) — विवरण लॉक है।`)}
                </p>
              )}
              <p style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.7, textAlign:'left' }}>
                {t(`Which of the ${result.koota_count} kootas scored low? Is there Rajju or Vedha dosha? Does Mangal Dosha match? Get the complete koota-by-koota breakdown with remedies in the full matchmaking report.`,
                   `${result.koota_count} कूटों में से किसमें कम अंक मिले? क्या रज्जु या वेध दोष है? क्या मंगल दोष मेल खाता है? पूर्ण मिलान रिपोर्ट में कूट-वार विश्लेषण और उपाय पाएं।`)}
              </p>
              <div style={{ textAlign:'left' }}>
                <UnlockCTA lang={l} items={[
                  { en:'Koota-by-koota breakdown', hi:'कूट-वार विश्लेषण' },
                  { en:'Rajju & Vedha dosha',      hi:'रज्जु और वेध दोष' },
                  { en:'Mangal Dosha comparison',  hi:'मंगल दोष तुलना' },
                  { en:'Remedies',                 hi:'उपाय' },
                ]} />
              </div>
            </motion.div>
          )}
        </>
      )}
    </CalculatorShell>
  );
}

// ─── Calculators hub ──────────────────────────────────────────────────────────
const HUB_ITEMS = [
  { href:'/calculators/mangal-dosha', icon:'♂️', en:'Mangal Dosha Calculator', hi:'मंगल दोष कैलकुलेटर',
    desc_en:'Check if you are Manglik — instantly', desc_hi:'जांचें कि आप मांगलिक हैं या नहीं — तुरंत' },
  { href:'/calculators/sade-sati', icon:'🪐', en:'Sade Sati Calculator', hi:'साढ़े साती कैलकुलेटर',
    desc_en:"Is Saturn's 7½-year cycle active now?", desc_hi:'क्या शनि की साढ़े साती अभी सक्रिय है?' },
  { href:'/calculators/mahadasha', icon:'⏳', en:'Mahadasha Calculator', hi:'महादशा कैलकुलेटर',
    desc_en:'Find your current planetary period', desc_hi:'अपनी वर्तमान ग्रह दशा जानें' },
  { href:'/calculators/kundli-milan', icon:'💑', en:'Kundli Milan (Gun Milan)', hi:'कुंडली मिलान (गुण मिलान)',
    desc_en:'36-guna marriage compatibility score', desc_hi:'36-गुण विवाह अनुकूलता स्कोर' },
  { href:'/free-kundli', icon:'🔯', en:'Free Kundli', hi:'निःशुल्क कुंडली',
    desc_en:'Complete birth chart in 30 seconds', desc_hi:'30 सेकंड में पूर्ण जन्म कुंडली' },
];

export function CalculatorsHub() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <h1 className="font-serif text-gold" style={{ fontSize:28, fontWeight:800 }}>
            🧮 {hi ? 'निःशुल्क ज्योतिष कैलकुलेटर' : 'Free Astrology Calculators'}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, lineHeight:1.7 }}>
            {hi ? 'सटीक वैदिक गणनाएँ — बिना लॉगिन, बिना शुल्क' : 'Accurate Vedic calculations — no login, no charge'}
          </p>
        </motion.div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14 }}>
          {HUB_ITEMS.map((c, i) => (
            <motion.div key={c.href} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}>
              <Link href={c.href} className="card-royal" style={{ display:'block', padding:'20px 18px', textDecoration:'none', height:'100%' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
                <p style={{ fontSize:14, fontWeight:700, color:GOLD }}>{hi ? c.hi : c.en}</p>
                <p style={{ fontSize:11, color:MUTED, marginTop:4, lineHeight:1.6 }}>{hi ? c.desc_hi : c.desc_en}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
