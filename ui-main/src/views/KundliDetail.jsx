'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import LifeReportPanel from '../components/LifeReportPanel';
import KundliInsightPanel from '../components/KundliInsightPanel';
import PlanetImpactPanel from '../components/PlanetImpactPanel';
import BhavaLordPanel from '../components/BhavaLordPanel';
import LifeGuidancePanel from '../components/LifeGuidancePanel';
import VarshphalPanel from '../components/VarshphalPanel';
import KundliStrengthPanel from '../components/KundliStrengthPanel';
import GuidanceReport from '../components/GuidanceReport';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';
import { predictionHref } from '../lib/kundliLinks';
import {
  chartStyleLabel,
  houseLabel,
  localizeAstroText,
  planetName,
  predictionSummaryLines,
  t,
} from '../lib/astroI18n';

// ─── Kundli sub-components ────────────────────────────────────────────────────
import {
  PLANET_META,
  DIGNITY_STYLE,
  BHAVA_NATURE,
  MAIN_TABS,
} from '../components/kundli/kundliConstants';
import { ChartToggle, SouthIndianChart, NorthIndianChart } from '../components/kundli/KundliChart';
import EditKundliModal    from '../components/kundli/EditKundliModal';
import BasicDetailsPanel  from '../components/kundli/BasicDetailsPanel';
import PersonalityInsights from '../components/kundli/PersonalityInsights';
import LifePortraitPanel  from '../components/kundli/LifePortraitPanel';
import YogasAndDoshasPanel  from '../components/kundli/YogasAndDoshasPanel';
import FavouriteDaysPanel   from '../components/FavouriteDaysPanel';
import TodayPredictionPanel from '../components/TodayPredictionPanel';
import CharaKarakaPanel     from '../components/CharaKarakaPanel';
import SadeSatiPanel        from '../components/SadeSatiPanel';
import YutiPanel            from '../components/YutiPanel';
import AstaVakriPanel       from '../components/AstaVakriPanel';
import RemedyManualPanel    from '../components/RemedyManualPanel';
import PlacementNarrativesPanel from '../components/PlacementNarrativesPanel';
import AvakahadaPanel       from '../components/AvakahadaPanel';
import DashaJourneyPanel    from '../components/DashaJourneyPanel';
import KundliSynthesisPanel from '../components/KundliSynthesisPanel';
import AIPredictionPanel    from '../components/AIPredictionPanel';
import DetailedReportsPanel from '../components/kundli/DetailedReportsPanel';
import JudgementPanel      from '../components/kundli/JudgementPanel';
import VargaChartsPanel   from '../components/kundli/VargaChartsPanel';
import DrishtiHouseCard   from '../components/kundli/DrishtiHouseCard';

// ─────────────────────────────────────────────────────────────────────────────

export default function KundliDetail({ uuid }) {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const router   = useRouter();

  const [kundli,              setKundli]              = useState(null);
  const [nakshatraInsight,    setNakshatraInsight]    = useState(null);
  const [chartEnrichment,     setChartEnrichment]     = useState(null);
  const [error,               setError]               = useState(null);
  const [fetching,            setFetching]            = useState(true);
  const [recalcing,           setRecalcing]           = useState(false);
  const [editOpen,            setEditOpen]            = useState(false);
  const [chartStyle,          setChartStyle]          = useState('north');
  const [vargaReference,      setVargaReference]      = useState(null);
  const [vargaReferenceError, setVargaReferenceError] = useState(null);
  const [activeTab,           setActiveTab]           = useState('kundli');

  // Persist chart style preference
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kundli_chart_style') : null;
    if (saved === 'south' || saved === 'north') setChartStyle(saved);
  }, []);

  const handleStyleChange = (s) => {
    setChartStyle(s);
    localStorage.setItem('kundli_chart_style', s);
  };

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  const fetchKundli = useCallback(() => {
    if (!user || !uuid) return;
    setFetching(true);
    api.get(`/kundli/${uuid}`)
      .then(({ data }) => {
        setKundli(data.profile);
        setNakshatraInsight(data.profile.nakshatra_insight || null);
        setChartEnrichment(data.profile.chart_enrichment  || null);
      })
      .catch(e => setError(e.response?.data?.message || 'Could not load Kundli'))
      .finally(() => setFetching(false));
  }, [user, uuid]);

  useEffect(fetchKundli, [fetchKundli]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setVargaReferenceError(null);
    api.get('/kundli/reference/varga')
      .then(({ data }) => { if (alive) setVargaReference(data.reference || null); })
      .catch((e) => { if (alive) setVargaReferenceError(e.response?.data?.message || 'Varga reference unavailable'); });
    return () => { alive = false; };
  }, [user]);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      const { data } = await api.post(`/kundli/${uuid}/recalculate`);
      setKundli(data.profile);
      setNakshatraInsight(data.profile.nakshatra_insight || null);
      setChartEnrichment(data.profile.chart_enrichment  || null);
    } catch {}
    finally { setRecalcing(false); }
  };

  const handleEditSaved = useCallback(() => {
    setEditOpen(false);
    fetchKundli();
  }, [fetchKundli]);

  const isPremium = user?.plan === 'premium' || user?.plan === 'yearly' || user?.role === 'admin';

  const handlePdf = async () => {
    if (!isPremium) {
      toast.error(t(lang,
        '🔒 PDF export requires Premium or Yearly plan. Please upgrade to download reports.',
        '🔒 PDF डाउनलोड के लिए Premium या Yearly plan चाहिए। कृपया अपग्रेड करें।'
      ));
      return;
    }
    try {
      const response = await api.get(`/kundli/${uuid}/report.pdf`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${kundli?.name || 'kundli'}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.response?.data?.message || t(lang, 'Unable to export PDF', 'PDF निर्यात नहीं हो पाया'));
    }
  };

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">🪐</div>
          <p className="text-gold/50 text-sm tracking-widest font-devanagari">
            {lang==='hi' ? 'कुंडली गणना हो रही है…' : 'Computing Kundli…'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card-royal p-10 text-center max-w-md">
          <p className="text-4xl mb-4">❌</p>
          <h2 className="font-serif text-gold text-xl mb-2">
            {lang==='hi' ? 'कुंडली नहीं मिली' : 'Kundli Not Found'}
          </h2>
          <p className="text-ivory/55 text-sm mb-6">{error}</p>
          <Link href="/dashboard" className="btn-outline-gold px-6 py-2 text-sm">← Dashboard</Link>
        </div>
      </div>
    );
  }
  if (!kundli) return null;

  // Parse calculated_data
  let chart = null;
  try {
    chart = kundli.calculated_data
      ? (typeof kundli.calculated_data === 'string' ? JSON.parse(kundli.calculated_data) : kundli.calculated_data)
      : null;
  } catch {}

  const dob      = String(kundli.date_of_birth).slice(0, 10);
  const curDasha = chart?.dasha?.find(d => d.is_current) || chart?.dasha?.[0];

  return (
    <div className="relative min-h-screen pt-20 pb-16 px-4"
      style={{ background:'radial-gradient(ellipse at top,#181C35 0%,#0B0D1A 60%,#06070F 100%)' }}>
      <StarField count={70} />

      <div className="relative z-10 max-w-8xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ivory/30 mb-6">
          <Link href="/dashboard" className="hover:text-gold transition-colors">{t(lang, 'Dashboard', 'डैशबोर्ड')}</Link>
          <span>/</span>
          <span className="text-gold/80">{kundli.name}</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="card-royal p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl shrink-0">🪐</div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gradient-gold">{kundli.name}</h1>
              <p className="text-ivory/45 text-sm mt-0.5 font-devanagari">
                {dob} · {kundli.time_of_birth?.slice(0,5)} · {kundli.place_of_birth}
              </p>
              {chart?.meta && (
                <p className="text-ivory/20 text-[10px] mt-1 font-mono">
                  {chart.meta.system} · Ayanamsa {chart.meta.ayanamsa_dms} · JD {chart.meta.julian_day}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            {/* Plan badge */}
            <span style={{
              fontSize:9, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase',
              padding:'2px 8px', borderRadius:6,
              background: isPremium ? 'rgba(212,175,55,0.18)' : 'rgba(148,163,184,0.12)',
              color: isPremium ? '#D4AF37' : '#94A3B8',
              border: isPremium ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(148,163,184,0.25)',
            }}>
              {user?.role === 'admin' ? '👑 Admin' : user?.plan === 'yearly' ? '🌟 Yearly' : isPremium ? '⭐ Premium' : '🔒 Basic'}
            </span>
            <button onClick={handlePdf}
              className="btn-outline-gold text-xs px-4 py-2"
              style={!isPremium ? { opacity:0.55, cursor:'not-allowed' } : {}}>
              {isPremium ? '📄' : '🔒'} {t(lang, 'PDF Report', 'PDF रिपोर्ट')}
            </button>
            <button onClick={handleRecalc} disabled={recalcing} className="btn-outline-gold text-xs px-4 py-2">
              {recalcing ? `⏳ ${t(lang, 'Recalculating…', 'पुनः गणना हो रही है…')}` : `🔄 ${t(lang, 'Recalculate', 'पुनः गणना')}`}
            </button>
            <button onClick={() => setEditOpen(true)}
              style={{
                padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700,
                background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.45)',
                color:'#D4AF37', cursor:'pointer',
              }}>
              ✏️ {t(lang, 'Edit Details', 'विवरण संपादित करें')}
            </button>
          </div>
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editOpen && kundli && (
            <EditKundliModal kundli={kundli} onClose={() => setEditOpen(false)} onSaved={handleEditSaved} />
          )}
        </AnimatePresence>

        {/* ── Main Tab Navigation ──────────────────────────────────────────── */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max pb-1">
            {MAIN_TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding:'7px 13px', borderRadius:8, fontSize:11,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontFamily:'var(--font-devanagari), sans-serif',
                  background: activeTab === tab.key ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                  border:`1px solid ${activeTab === tab.key ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  color: activeTab === tab.key ? '#D4AF37' : 'rgba(245,240,232,0.55)',
                  cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
                }}>
                {tab.icon} {lang === 'hi' ? tab.hi : tab.en}
              </button>
            ))}
          </div>
        </div>

        {/* ══ TAB: YOUR KUNDLI ══════════════════════════════════════════════ */}
        {activeTab === 'kundli' && (
          <TodayPredictionPanel uuid={kundli?.uuid || uuid} lang={lang} />
        )}

        {activeTab === 'kundli' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left col: Chart ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Chart card with style toggle */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="card-royal p-5">
              <ChartToggle style={chartStyle} onChange={handleStyleChange} lang={lang} />
              <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                🔯 {lang==='hi'?'लग्न कुंडली (D1)':'Lagna Chart (D1)'}
                <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                  {chartStyleLabel(chartStyle, lang)}
                </span>
              </p>
              <AnimatePresence mode="wait">
                <motion.div key={chartStyle}
                  initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                  exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2 }}>
                  {chartStyle === 'south'
                    ? <SouthIndianChart chart={chart} lang={lang} />
                    : <NorthIndianChart chart={chart} lang={lang} />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Navamsha D9 */}
            {chart?.navamsha && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
                className="card-royal p-5">
                <p className="font-serif text-gold text-sm font-semibold text-center mb-3">
                  🔯 {t(lang, 'D9 Navamsha', 'D9 नवांश')}
                  <span className="text-gold/40 text-[10px] ml-2 normal-case font-sans">
                    {lang==='hi' ? chart.navamsha.ascendant?.rashi_hi : chart.navamsha.ascendant?.rashi_en} {t(lang, 'Lagna', 'लग्न')} ·{' '}
                    {chartStyleLabel(chartStyle, lang)}
                  </span>
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={`nav-${chartStyle}`}
                    initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.97 }} transition={{ duration:0.2 }}>
                    {chartStyle === 'south'
                      ? <SouthIndianChart chart={chart.navamsha} lang={lang} />
                      : <NorthIndianChart chart={chart.navamsha} lang={lang} />
                    }
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}

            {/* Quick stats */}
            {chart && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="grid grid-cols-2 gap-3">
                {[
                  { l: lang==='hi'?'लग्न':'Ascendant',  v: lang==='hi'?chart.ascendant.rashi_hi:chart.ascendant.rashi_en,      s: chart.ascendant.degree_in_sign_dms,       c:'#D4AF37' },
                  { l: lang==='hi'?'नक्षत्र':'Nakshatra', v: lang==='hi'?chart.nakshatra.hi:chart.nakshatra.en,                  s:t(lang,`Pada ${chart.nakshatra.pada}`,`चरण ${chart.nakshatra.pada}`), c:'#A78BFA' },
                  { l: lang==='hi'?'चन्द्र':'Moon',      v: lang==='hi'?chart.planets.Moon.rashi_hi:chart.planets.Moon.rashi_en, s: chart.planets.Moon.degree_in_sign_dms,    c:'#94A3B8' },
                  { l: lang==='hi'?'सूर्य':'Sun',         v: lang==='hi'?chart.planets.Sun.rashi_hi:chart.planets.Sun.rashi_en,  s: chart.planets.Sun.degree_in_sign_dms,     c:'#F59E0B' },
                ].map(({ l, v, s, c }) => (
                  <div key={l} className="card-royal p-3 text-center">
                    <p style={{ color:c, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700, lineHeight:1.2 }}>{v}</p>
                    <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, marginTop:2 }}>{s}</p>
                    <p style={{ color:'rgba(245,240,232,0.45)', fontSize:10, marginTop:3 }}>{l}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Basic Details + Ghat Chakra + Astro Details */}
            <BasicDetailsPanel kundli={kundli} chart={chart} lang={lang} />
          </div>

          {/* ── Right col: Planets + Dasha + Houses ────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Planet table — full 13-column comprehensive view */}
            {chart && (() => {
              const PLANET_ORDER   = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
              const AWASTHA_COLOR  = { Bala:'#60A5FA', Kumara:'#22C55E', Yuva:'#FBBF24', Vridha:'#F97316', Mrit:'#EF4444' };
              const houseForRashi  = (rNum) => {
                const entry = Object.entries(chart.houses).find(([,h]) => h.rashi_num === rNum);
                return entry ? parseInt(entry[0]) : null;
              };
              const fmtSpeed = (dm) => dm !== undefined ? parseFloat(dm.toFixed(2)).toString() : '0.00';

              const asc = chart.ascendant;
              const ascRow = {
                name:'Ascendant', nameHi:'लग्न', icon:'⊕', color:'#D4AF37',
                fullDeg: asc.longitude_dms, normDeg: asc.degree_in_sign_dms,
                speed:'0.00', retro:false,
                sign: lang==='hi' ? asc.rashi_hi : asc.rashi_en,
                signLord: asc.rashi_lord,
                nak:  lang==='hi' ? (asc.nakshatra_hi || '—') : (asc.nakshatra_en || '—'),
                nakLord: asc.nakshatra_lord || '—',
                pada: asc.nakshatra_pada ?? '—',
                house:1, combust:false, awastha:'—', awasthaHi:'—',
                dignityLbl:null, ds:null, strength:null,
              };

              const planetRows = PLANET_ORDER.map((name) => {
                const pd = chart.planets[name];
                if (!pd) return null;
                const meta = PLANET_META[name] || {};
                const h    = houseForRashi(pd.rashi_num);
                return {
                  name, nameHi: meta.hi || name, icon: meta.icon || '●', color: meta.color || '#9CA3AF',
                  fullDeg: pd.longitude_dms, normDeg: pd.degree_in_sign_dms,
                  speed: fmtSpeed(pd.daily_motion), retro: pd.is_retrograde,
                  sign: lang==='hi' ? pd.rashi_hi : pd.rashi_en,
                  signLord: pd.rashi_lord,
                  nak:  lang==='hi' ? (pd.nakshatra_hi || '—') : (pd.nakshatra_en || '—'),
                  nakLord: pd.nakshatra_lord || '—',
                  pada: pd.nakshatra_pada ?? '—',
                  house: h, combust: pd.is_combust || false,
                  awastha: pd.awastha || '—', awasthaHi: pd.awastha_hi || '—',
                  dignityLbl: pd.dignity,
                  ds: DIGNITY_STYLE[pd.dignity] || DIGNITY_STYLE.Neutral,
                  strength: pd.dignity_strength,
                };
              }).filter(Boolean);

              const allRows  = [ascRow, ...planetRows];
              const thStyle  = 'text-left py-2 px-2 text-ivory/30 text-[9px] font-medium uppercase tracking-wider whitespace-nowrap';
              const tdStyle  = 'py-2 px-2 text-ivory/68 text-[10px] whitespace-nowrap';

              return (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                  className="card-royal p-5">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                    🌌 {lang==='hi'?'ग्रह स्थिति':'Planet Positions'}
                  </h2>
                  <div className="overflow-x-auto">
                    <table style={{ minWidth:900 }} className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gold/15">
                          <th className={thStyle}>{t(lang,'Planet','ग्रह')}</th>
                          <th className={thStyle}>{t(lang,'Full Degree','पूर्ण अंश')}</th>
                          <th className={thStyle}>{t(lang,'Norm. Degree','राशि अंश')}</th>
                          <th className={thStyle}>{t(lang,'Speed°/d','गति°/दिन')}</th>
                          <th className={thStyle}>{t(lang,'Retro','वक्री')}</th>
                          <th className={thStyle}>{t(lang,'Sign','राशि')}</th>
                          <th className={thStyle}>{t(lang,'Sign Lord','राशि स्वामी')}</th>
                          <th className={thStyle}>{t(lang,'Nakshatra','नक्षत्र')}</th>
                          <th className={thStyle}>{t(lang,'Nak. Lord','नक्षत्र स्वामी')}</th>
                          <th className={thStyle}>{t(lang,'Pada','चरण')}</th>
                          <th className={thStyle}>{t(lang,'House','भाव')}</th>
                          <th className={thStyle}>{t(lang,'Combust','अस्त')}</th>
                          <th className={thStyle}>{t(lang,'Awastha','अवस्था')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRows.map((row) => (
                          <tr key={row.name} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-1.5">
                                <span style={{ color:row.color, fontSize:12, width:14 }}>{row.icon}</span>
                                <div>
                                  <p style={{ color:row.color, fontSize:11, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                                    {lang==='hi' ? row.nameHi : row.name}
                                  </p>
                                  <p className="text-ivory/30 text-[9px]">{lang==='hi' ? row.name : row.nameHi}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`${tdStyle} font-mono`}>{row.fullDeg}</td>
                            <td className={`${tdStyle} font-mono`}>{row.normDeg}</td>
                            <td className={`${tdStyle} font-mono`} style={{ color:row.retro?'#F97316':undefined }}>{row.speed}</td>
                            <td className={tdStyle}>
                              {row.retro
                                ? <span className="text-red-400 font-bold text-[10px]">℞ {t(lang,'Yes','हाँ')}</span>
                                : <span className="text-ivory/35">{t(lang,'No','नहीं')}</span>}
                            </td>
                            <td className={`${tdStyle} font-devanagari`}>{row.sign}</td>
                            <td className={`${tdStyle} font-devanagari`} style={{ color:(PLANET_META[row.signLord]||{}).color||'#9CA3AF' }}>
                              {planetName(row.signLord, lang)}
                            </td>
                            <td className={`${tdStyle} font-devanagari`}>{row.nak}</td>
                            <td className={`${tdStyle} font-devanagari`} style={{ color:(PLANET_META[row.nakLord]||{}).color||'#9CA3AF' }}>
                              {row.nakLord !== '—' ? planetName(row.nakLord, lang) : '—'}
                            </td>
                            <td className={tdStyle}>
                              {row.pada !== '—' ? <span className="bg-white/8 rounded px-1.5 py-0.5">{row.pada}</span> : '—'}
                            </td>
                            <td className={tdStyle}>{row.house ? houseLabel(String(row.house), lang) : '—'}</td>
                            <td className={tdStyle}>
                              {row.name === 'Sun' || row.name === 'Ascendant'
                                ? <span className="text-ivory/25">—</span>
                                : row.combust
                                  ? <span style={{ color:'#EF4444', fontWeight:700 }}>{t(lang,'Yes ☉','हाँ ☉')}</span>
                                  : <span className="text-ivory/35">{t(lang,'No','नहीं')}</span>}
                            </td>
                            <td className={tdStyle}>
                              {row.awastha !== '—'
                                ? <span style={{
                                    fontSize:10, padding:'2px 6px', borderRadius:10, fontWeight:600,
                                    background:`${AWASTHA_COLOR[row.awastha]||'#9CA3AF'}22`,
                                    color: AWASTHA_COLOR[row.awastha] || '#9CA3AF',
                                  }}>
                                    {lang==='hi' ? row.awasthaHi : row.awastha}
                                  </span>
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-ivory/25 text-[9px] mt-3">
                    {t(lang, 'Degrees are sidereal (Lahiri). Awastha = Baladi Avastha. Combust = within orb of Sun (BPHS).', 'अंश सायन (लाहिड़ी)। अवस्था = बालादि अवस्था। अस्त = सूर्य से BPHS कक्षा के भीतर।')}
                  </p>
                </motion.div>
              );
            })()}

            {/* Dasha timeline */}
            {chart?.dasha && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
                className="card-royal p-5">
                <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                  ⏳ {lang==='hi'?'विंशोत्तरी दशा':'Vimshottari Dasha'}
                  {curDasha && (
                    <span className="text-gold/45 text-[10px] font-sans font-normal ml-2 normal-case">
                      {lang==='hi'?'चालू:':'Current:'} {lang==='hi' ? PLANET_META[curDasha.lord]?.hi : curDasha.lord}
                    </span>
                  )}
                </h2>
                <div className="space-y-1.5">
                  {chart.dasha.map((d, i) => {
                    const meta  = PLANET_META[d.lord] || {};
                    const isCur = d.is_current;
                    const today = new Date();
                    const start = new Date(d.start);
                    const end   = new Date(d.end);
                    const pct   = isCur ? Math.min(100, Math.max(0, (today - start) / (end - start) * 100)) : 0;
                    return (
                      <div key={i} style={{
                        position:'relative', display:'flex', alignItems:'center', gap:10,
                        padding:'8px 10px', borderRadius:6, overflow:'hidden',
                        border:`1px solid ${isCur ? 'rgba(212,175,55,0.3)' : 'transparent'}`,
                        background: isCur ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                        transition:'all 0.2s',
                      }}>
                        {isCur && (
                          <div style={{
                            position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, opacity:0.08,
                            background:'linear-gradient(90deg,#D4AF37,transparent)', pointerEvents:'none',
                          }} />
                        )}
                        <span style={{ color:meta.color, fontSize:15, width:18, textAlign:'center', flexShrink:0 }}>{meta.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <span style={{ color:'#F5F0E8', fontSize:12, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                              {lang==='hi' ? meta.hi : d.lord}
                            </span>
                            {isCur && (
                              <span style={{ fontSize:9, padding:'1px 7px', borderRadius:10, fontWeight:700, background:'rgba(212,175,55,0.2)', color:'#D4AF37', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                                {lang==='hi'?'चालू':'NOW'}
                              </span>
                            )}
                          </div>
                          <span style={{ color:'rgba(245,240,232,0.35)', fontSize:10, fontFamily:'monospace' }}>
                            {d.start} → {d.end}
                          </span>
                        </div>
                        <span style={{ color:'rgba(245,240,232,0.25)', fontSize:10, flexShrink:0 }}>
                          {d.full_years}{lang==='hi'?' वर्ष':'Y'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {curDasha?.antardasha && (() => {
                  const curAntar       = curDasha.antardasha.find(a => a.is_current) || curDasha.antardasha[0];
                  const curPratyantar  = curAntar?.pratyantardasha?.find(p => p.is_current) || curAntar?.pratyantardasha?.[0];
                  const curSookshmaDasha = curPratyantar?.sookshmadasha || [];
                  return (
                    <>
                      {/* Antardasha */}
                      <div className="mt-5 pt-4 border-t border-gold/10">
                        <h3 style={{ color:'rgba(212,175,55,0.8)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.22em', marginBottom:10 }}>
                          {t(lang,'Antardasha','अंतर्दशा')}
                          {curAntar && (
                            <span style={{ color:'rgba(212,175,55,0.45)', fontWeight:400, marginLeft:8, textTransform:'none', letterSpacing:0 }}>
                              {t(lang,'Current:','चालू:')} {lang==='hi' ? PLANET_META[curAntar.lord]?.hi : curAntar.lord}
                            </span>
                          )}
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {curDasha.antardasha.map((ad) => {
                            const isCur = ad.is_current;
                            const meta  = PLANET_META[ad.lord] || {};
                            return (
                              <div key={`ad-${ad.lord}-${ad.start}`} style={{
                                borderRadius:6,
                                border:`1px solid ${isCur ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                background: isCur ? 'rgba(212,175,55,0.09)' : 'rgba(255,255,255,0.03)',
                                padding:'7px 8px',
                              }}>
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex items-center gap-1">
                                    <span style={{ color:meta.color, fontSize:11 }}>{meta.icon}</span>
                                    <span style={{ color:'#F5F0E8', fontSize:11, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                                      {lang==='hi' ? meta.hi : ad.lord}
                                    </span>
                                  </div>
                                  {isCur && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, fontWeight:700, background:'rgba(212,175,55,0.2)', color:'#D4AF37', textTransform:'uppercase' }}>{t(lang,'Now','चालू')}</span>}
                                </div>
                                <p style={{ color:'rgba(245,240,232,0.30)', fontSize:9, fontFamily:'monospace', marginTop:3 }}>{ad.start}</p>
                                <p style={{ color:'rgba(245,240,232,0.30)', fontSize:9, fontFamily:'monospace' }}>→ {ad.end}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pratyantardasha */}
                      {curAntar?.pratyantardasha?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gold/8">
                          <h3 style={{ color:'rgba(167,139,250,0.85)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.22em', marginBottom:10 }}>
                            {t(lang,'Pratyantardasha','प्रत्यंतर्दशा')}
                            {curPratyantar && (
                              <span style={{ color:'rgba(167,139,250,0.45)', fontWeight:400, marginLeft:8, textTransform:'none', letterSpacing:0 }}>
                                {t(lang,'Current:','चालू:')} {lang==='hi' ? PLANET_META[curPratyantar.lord]?.hi : curPratyantar.lord}
                              </span>
                            )}
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {curAntar.pratyantardasha.map((pp) => {
                              const isCur = pp.is_current;
                              const meta  = PLANET_META[pp.lord] || {};
                              return (
                                <div key={`pp-${pp.lord}-${pp.start}`} style={{
                                  borderRadius:6,
                                  border:`1px solid ${isCur ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                  background: isCur ? 'rgba(167,139,250,0.09)' : 'rgba(255,255,255,0.02)',
                                  padding:'7px 8px',
                                }}>
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="flex items-center gap-1">
                                      <span style={{ color:meta.color, fontSize:11 }}>{meta.icon}</span>
                                      <span style={{ color:'#F5F0E8', fontSize:11, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                                        {lang==='hi' ? meta.hi : pp.lord}
                                      </span>
                                    </div>
                                    {isCur && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, fontWeight:700, background:'rgba(167,139,250,0.2)', color:'#A78BFA', textTransform:'uppercase' }}>{t(lang,'Now','चालू')}</span>}
                                  </div>
                                  <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace', marginTop:3 }}>{pp.start}</p>
                                  <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace' }}>→ {pp.end}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sookshmadasha */}
                      {curSookshmaDasha.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gold/8">
                          <h3 style={{ color:'rgba(52,211,153,0.85)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.22em', marginBottom:10 }}>
                            {t(lang,'Sookshmadasha','सूक्ष्म दशा')}
                            {(() => {
                              const curS = curSookshmaDasha.find(s => s.is_current) || curSookshmaDasha[0];
                              return curS ? (
                                <span style={{ color:'rgba(52,211,153,0.45)', fontWeight:400, marginLeft:8, textTransform:'none', letterSpacing:0 }}>
                                  {t(lang,'Current:','चालू:')} {lang==='hi' ? PLANET_META[curS.lord]?.hi : curS.lord}
                                </span>
                              ) : null;
                            })()}
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {curSookshmaDasha.map((sd) => {
                              const isCur = sd.is_current;
                              const meta  = PLANET_META[sd.lord] || {};
                              return (
                                <div key={`sd-${sd.lord}-${sd.start}`} style={{
                                  borderRadius:6,
                                  border:`1px solid ${isCur ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                  background: isCur ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.02)',
                                  padding:'7px 8px',
                                }}>
                                  <div className="flex justify-between items-start gap-1">
                                    <div className="flex items-center gap-1">
                                      <span style={{ color:meta.color, fontSize:11 }}>{meta.icon}</span>
                                      <span style={{ color:'#F5F0E8', fontSize:11, fontWeight:600, fontFamily:'var(--font-devanagari),sans-serif' }}>
                                        {lang==='hi' ? meta.hi : sd.lord}
                                      </span>
                                    </div>
                                    {isCur && <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, fontWeight:700, background:'rgba(52,211,153,0.2)', color:'#34D399', textTransform:'uppercase' }}>{t(lang,'Now','चालू')}</span>}
                                  </div>
                                  <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace', marginTop:3 }}>{sd.start}</p>
                                  <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9, fontFamily:'monospace' }}>→ {sd.end}</p>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-ivory/20 text-[9px] mt-3">
                            {t(lang,
                              `Sookshmadasha of ${curPratyantar ? (lang==='hi'?PLANET_META[curPratyantar.lord]?.hi:curPratyantar.lord) : '—'} Pratyantardasha in ${curAntar ? (lang==='hi'?PLANET_META[curAntar.lord]?.hi:curAntar.lord) : '—'} Antardasha.`,
                              `${curAntar ? PLANET_META[curAntar.lord]?.hi : '—'} अंतर्दशा के ${curPratyantar ? PLANET_META[curPratyantar.lord]?.hi : '—'} प्रत्यंतर की सूक्ष्म दशा।`
                            )}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Dosha, transit, predictions */}
            {chart && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-royal p-5">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                    <h2 className="font-serif text-gold text-sm font-semibold">{t(lang,'Mangal Dosha','मंगल दोष')}</h2>
                    {chart.mangal_dosha?.has_dosha && chart.mangal_dosha?.manglik_type && (
                      <span style={{
                        fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:8,
                        color:  chart.mangal_dosha.active_count >= 3 ? '#EF4444' : chart.mangal_dosha.active_count === 2 ? '#F97316' : '#F59E0B',
                        background: chart.mangal_dosha.active_count >= 3 ? 'rgba(239,68,68,0.12)' : chart.mangal_dosha.active_count === 2 ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)',
                        border:`1px solid ${chart.mangal_dosha.active_count >= 3 ? 'rgba(239,68,68,0.3)' : chart.mangal_dosha.active_count === 2 ? 'rgba(249,115,22,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}>
                        {t(lang, chart.mangal_dosha.manglik_type, chart.mangal_dosha.manglik_type_hi)}
                      </span>
                    )}
                    {!chart.mangal_dosha?.has_dosha && (
                      <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:8, color:'#10B981', background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.25)' }}>
                        {t(lang,'No Dosha','दोष नहीं')}
                      </span>
                    )}
                  </div>
                  <p className="text-ivory/75 text-sm font-devanagari mb-4">
                    {lang === 'hi'
                      ? (chart.mangal_dosha?.summary_hi || 'लग्न, चंद्र और शुक्र से प्रमुख मंगल दोष नहीं दिखता।')
                      : (chart.mangal_dosha?.summary_en || 'Not calculated')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(chart.mangal_dosha?.checks || []).map((check) => (
                      <div key={check.basis} style={{
                        borderRadius:8,
                        border: check.has_dosha ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(212,175,55,0.12)',
                        background: check.has_dosha ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                        padding:'8px', textAlign:'center',
                      }}>
                        <p style={{ fontSize:10, color:'#64748B' }}>
                          {check.basis==='Lagna' ? t(lang,'Lagna','लग्न') : check.basis==='Moon' ? t(lang,'Moon','चंद्र') : t(lang,'Venus','शुक्र')}
                        </p>
                        <p style={{ fontSize:13, fontWeight:700, color:check.has_dosha?'#F97316':'#94A3B8', marginTop:3 }}>H{check.house}</p>
                        {check.has_dosha && <p style={{ fontSize:9, color:'#EF4444', marginTop:2 }}>✗ {t(lang,'Dosha','दोष')}</p>}
                      </div>
                    ))}
                  </div>
                  {chart.mangal_dosha?.has_dosha && chart.mangal_dosha.effects_en?.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:10, fontWeight:600, color:'#F97316', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                        {t(lang,'Effects','प्रभाव')}
                      </div>
                      {(lang==='hi' ? chart.mangal_dosha.effects_hi : chart.mangal_dosha.effects_en)?.map((eff, i) => (
                        <div key={i} style={{ fontSize:11, color:'#94A3B8', display:'flex', gap:6, marginBottom:4 }}>
                          <span style={{ color:'#F97316', flexShrink:0 }}>▸</span><span>{eff}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {chart.mangal_dosha?.cancellations?.length > 0 && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:10 }}>
                      <div style={{ fontSize:10, fontWeight:600, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                        {t(lang,'Cancellations / Relief','दोष शांति')}
                      </div>
                      {chart.mangal_dosha.cancellations.map((c, i) => (
                        <div key={i} style={{ fontSize:11, color:'#6EE7B7', display:'flex', gap:6, marginBottom:4 }}>
                          <span style={{ flexShrink:0 }}>◈</span>
                          <span>{lang==='hi' ? (c.hi || c) : (c.en || c)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-royal p-5">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">{t(lang,'Gochar','गोचर')}</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">{t(lang,'Sade Sati','साढ़ेसाती')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.sade_sati?.active ? localizeAstroText(chart.gochar.highlights.sade_sati.phase, lang) : t(lang,'Inactive','सक्रिय नहीं')}</span>
                    </div>
                    <div className="flex justify-between border-b border-gold/8 pb-2">
                      <span className="text-ivory/45">{t(lang,'Jupiter','गुरु')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.jupiter_support?.favorable ? t(lang,'Supportive','सहायक') : t(lang,'Patient','धैर्य चाहिए')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ivory/45">{t(lang,'Rahu Ketu','राहु केतु')}</span>
                      <span className="text-ivory">{chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-royal p-5 md:col-span-2">
                  <h2 className="font-serif text-gold text-sm font-semibold mb-3">{t(lang,'Prediction Engine','भविष्यवाणी इंजन')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {predictionSummaryLines(chart, lang).map((line, index) => (
                      <p key={index} className="border border-gold/10 rounded p-3 text-sm text-ivory/70 font-devanagari">{line}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Houses grid */}
            {chart?.houses && (
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                className="card-royal p-5">
                <h2 className="font-serif text-gold text-sm font-semibold mb-4">
                  🏠 {lang==='hi'?'12 भाव (पूर्ण राशि)':'12 Houses (Whole Sign)'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(chart.houses).map(h => (
                    <div key={h.house_num}
                      className={`border rounded p-2.5 transition-all ${
                        h.rashi_num === chart.ascendant.rashi_num
                          ? 'border-gold/40 bg-gold/6'
                          : 'border-gold/10 hover:border-gold/20'
                      }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-ivory/35 uppercase tracking-wider font-medium">{houseLabel(h.house_num, lang)}</span>
                        <span className="text-[10px] text-ivory/55 font-devanagari">
                          {lang==='hi' ? h.rashi_hi : h.rashi_en?.split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-[9px] text-ivory/30">
                        {lang==='hi'?'स्वामी':'Lord'}: <span className="text-gold/55">{planetName(h.rashi_lord, lang)}</span>
                      </p>
                      {BHAVA_NATURE[h.house_num] && (
                        <span style={{
                          display:'inline-block', marginTop:3, fontSize:8, padding:'1px 6px', borderRadius:8,
                          fontWeight:600, letterSpacing:'0.03em',
                          color: BHAVA_NATURE[h.house_num].color,
                          background: BHAVA_NATURE[h.house_num].bg,
                          border:`1px solid ${BHAVA_NATURE[h.house_num].color}33`,
                        }}>
                          {lang==='hi' ? BHAVA_NATURE[h.house_num].hi : BHAVA_NATURE[h.house_num].en}
                        </span>
                      )}
                      {h.planets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {h.planets.map(p => (
                            <span key={p} style={{ color:PLANET_META[p]?.color||'#D4AF37', fontSize:10 }}>
                              {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {nakshatraInsight && <PersonalityInsights insight={nakshatraInsight} chart={chart} lang={lang} />}
            {chart?.predictions?.portrait && <LifePortraitPanel chart={chart} lang={lang} />}

          </div>
        </div>
        )} {/* end kundli tab */}

        {/* Chara Karakas + Sade Sati Journey (kundli tab) */}
        {activeTab === 'kundli' && (
          <>
            <AvakahadaPanel chart={chart} lang={lang} />
            <PlacementNarrativesPanel data={kundli?.placement_narratives} lang={lang} />
            <CharaKarakaPanel karakas={kundli?.chara_karakas} lang={lang} />
            <YutiPanel yuti={kundli?.yuti_analysis} lang={lang} />
            <AstaVakriPanel data={kundli?.asta_vakri} lang={lang} />
            <RemedyManualPanel data={kundli?.remedy_manual} lang={lang} />
            <DashaJourneyPanel journey={kundli?.dasha_journey} antarNarratives={kundli?.antar_narratives} lang={lang} />
            <SadeSatiPanel journey={kundli?.sade_sati_journey} lang={lang} />
          </>
        )}

        {/* ══ TAB: LIFE REPORT ════════════════════════════════════════════ */}
        {activeTab === 'life-report' && (
        <div>
          {chart?.life_report?.sections && <LifeReportPanel lifeReport={chart.life_report} lang={lang} narratives={kundli?.life_report_narratives} />}
        </div>
        )}

        {/* ══ TAB: KUNDLI STRENGTH ════════════════════════════════════════ */}
        {activeTab === 'strength' && (
        <div>
          {kundli?.uuid && (
            <section style={{ marginTop:0 }}>
              <KundliStrengthPanel kundliUuid={kundli.uuid} natalPlanets={chart?.planets} lang={lang} />
            </section>
          )}
        </div>
        )}

        {/* ══ TAB: PLANET IMPACT ══════════════════════════════════════════ */}
        {activeTab === 'impact' && (
        <div>
          {chart && chartEnrichment && <KundliInsightPanel chart={chart} enrichment={chartEnrichment} lang={lang} />}
          {chart?.reports?.planet_assessments && <PlanetImpactPanel chart={chart} lang={lang} />}
        </div>
        )}

        {/* ══ TAB: BHAVA LORDS ════════════════════════════════════════════ */}
        {activeTab === 'bhava-lords' && (
        <div>
          {kundli?.bhava_lord_readings?.length > 0 && (
            <section style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, marginTop:24 }}>
              <BhavaLordPanel readings={kundli.bhava_lord_readings} lang={lang} />
            </section>
          )}
        </div>
        )}

        {/* ══ TAB: GUIDANCE ═══════════════════════════════════════════════ */}
        {activeTab === 'guidance' && (
        <div>
          {kundli?.life_guidance && (
            <section style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, marginTop:24 }}>
              <LifeGuidancePanel guidance={kundli.life_guidance} lang={lang} marriageTiming={kundli?.marriage_timing} />
            </section>
          )}
        </div>
        )}

        {/* ══ TAB: VARSHPHAL ══════════════════════════════════════════════ */}
        {activeTab === 'varshphal' && (
        <div>
          {kundli?.uuid && (
            <section style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:24, marginTop:24 }}>
              <VarshphalPanel kundliUuid={kundli.uuid} lang={lang} />
            </section>
          )}
        </div>
        )}

        {/* ══ TAB: GRB REPORT ═════════════════════════════════════════════ */}
        {activeTab === 'grb' && (
        <div>
          {chart && (
            <DetailedReportsPanel
              reports={chart.reports}
              lang={lang}
              onRecalculate={handleRecalc}
              recalcing={recalcing}
            />
          )}
        </div>
        )}

        {/* ══ TAB: VARGA CHARTS ═══════════════════════════════════════════ */}
        {activeTab === 'varga' && (
        <div>
          {chart && (
            <VargaChartsPanel
              birthChart={chart}
              reference={vargaReference}
              referenceError={vargaReferenceError}
              chartStyle={chartStyle}
              lang={lang}
            />
          )}
        </div>
        )}

        {/* ══ TAB: DIGBALA ════════════════════════════════════════════════ */}
        {activeTab === 'digbala' && (
        <div>
          {chart?.digbala && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
              className="card-royal p-5 mt-6">
              <h2 className="font-serif text-gold text-sm font-semibold mb-1">
                🧭 {lang==='hi' ? 'ग्रह दिग्बल (Digbala)' : 'Graha Digbala — Directional Strength'}
              </h2>
              <p className="text-ivory/30 text-[10px] mb-4">
                {lang==='hi'
                  ? 'जब कोई ग्रह अपनी विशेष दिशा (भाव) में होता है तो उसे दिग्बल प्राप्त होता है।'
                  : 'A planet gains Digbala (directional strength) when placed in its specific directional house.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(chart.digbala).map((d) => {
                  const meta     = PLANET_META[d.planet] || {};
                  const barColor = d.has_digbala ? '#22C55E' : d.has_digbala_loss ? '#EF4444' : '#D4AF37';
                  return (
                    <div key={d.planet} style={{
                      border:`1px solid ${d.has_digbala ? 'rgba(34,197,94,0.4)' : d.has_digbala_loss ? 'rgba(239,68,68,0.25)' : 'rgba(212,175,55,0.12)'}`,
                      borderRadius:8, padding:'10px 12px',
                      background: d.has_digbala ? 'rgba(34,197,94,0.06)' : 'rgba(17,20,40,0.5)',
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ color:meta.color, fontSize:14 }}>{meta.icon}</span>
                          <span className="text-ivory text-xs font-semibold font-devanagari">{planetName(d.planet, lang)}</span>
                          {d.has_digbala && (
                            <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(34,197,94,0.2)', color:'#22C55E', fontWeight:700, textTransform:'uppercase' }}>
                              {t(lang,'Digbala','दिग्बल')} ✓
                            </span>
                          )}
                          {d.has_digbala_loss && (
                            <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'rgba(239,68,68,0.15)', color:'#EF4444', fontWeight:700, textTransform:'uppercase' }}>
                              {t(lang,'Lost','ह्रास')}
                            </span>
                          )}
                        </div>
                        <span className="text-ivory/35 text-[10px]">{d.strength_percent}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:6 }}>
                        <div style={{ height:'100%', width:`${d.strength_percent}%`, background:barColor, borderRadius:2, transition:'width 0.4s ease' }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-ivory/35">
                        <span>
                          {houseLabel(d.planet_house, lang)} ({lang==='hi' ? d.rashi_hi||d.rashi_en : d.rashi_en})
                          {'  →  '}
                          {lang==='hi' ? 'शक्तिशाली भाव' : 'Strong at'} {houseLabel(d.strong_house, lang)}
                        </span>
                        <span style={{ color:'#A78BFA' }}>{d.strong_direction?.[lang==='hi'?'hi':'en']}</span>
                      </div>
                      <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                        <p className="text-ivory/74 text-[11px] leading-relaxed font-devanagari">
                          {lang==='hi' ? (d.effect_hi||d.effect_en) : d.effect_en}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          <p className="text-emerald-300/78 text-[10px] leading-relaxed font-devanagari">
                            {t(lang,'Benefit:','लाभ:')} {lang==='hi' ? (d.benefit_hi||d.benefit_en) : d.benefit_en}
                          </p>
                          <p className="text-amber-200/78 text-[10px] leading-relaxed font-devanagari">
                            {t(lang,'Watch:','सावधानी:')} {lang==='hi' ? (d.watch_hi||d.watch_en) : d.watch_en}
                          </p>
                          <p className="text-violet-200/78 text-[10px] leading-relaxed font-devanagari">
                            {t(lang,'Remedy:','उपाय:')} {lang==='hi' ? (d.remedy_hi||d.remedy_en) : d.remedy_en}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
        )}

        {/* ══ TAB: BHAV KARAK ═════════════════════════════════════════════ */}
        {activeTab === 'bhav-karak' && (
        <div>
          {chart?.bhav_karak && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
              className="card-royal p-5 mt-6">
              <h2 className="font-serif text-gold text-sm font-semibold mb-1">
                🏠 {lang==='hi' ? 'हर जीवन क्षेत्र का शासक ग्रह' : 'Planet Rulers of Your Life Areas'}
              </h2>
              <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
                {lang==='hi'
                  ? 'हर भाव (जीवन का हिस्सा) पर एक ग्रह का स्वाभाविक नियंत्रण होता है। जब वह ग्रह मजबूत और अच्छी जगह हो, उस क्षेत्र में अच्छे परिणाम आते हैं।'
                  : 'Each area of your life has a planet that naturally governs it. When that planet is strong and well-placed, that area of life tends to go well.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.values(chart.bhav_karak).map((bk) => (
                  <div key={bk.house} className="border border-gold/12 rounded p-3 hover:border-gold/25 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold/70 text-[10px] font-bold uppercase tracking-wider">{houseLabel(bk.house, lang)}</span>
                      <div className="flex gap-1">
                        {bk.karakas.map((p) => (
                          <span key={p} style={{ fontSize:10, color:PLANET_META[p]?.color||'#D4AF37', fontWeight:700 }}>
                            {PLANET_META[p]?.icon}{planetName(p, lang).slice(0,2)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-ivory/55 text-[10px] mb-2 leading-tight">
                      {lang==='hi' ? bk.signification_hi : bk.signification_en}
                    </p>
                    {bk.karaka_positions.map((kp) => {
                      const meta         = PLANET_META[kp.planet] || {};
                      const q            = kp.placement_quality;
                      const qualityColor = q==='trikona' ? '#22C55E' : q==='kendra' ? '#60A5FA' : 'rgba(245,240,232,0.35)';
                      const qualityLabel = lang==='hi'
                        ? (q==='trikona' ? 'शुभ स्थान' : q==='kendra' ? 'मजबूत स्थान' : '')
                        : (q==='trikona' ? 'Auspicious' : q==='kendra' ? 'Strong position' : '');
                      return (
                        <div key={kp.planet} className="flex items-center justify-between mt-1 border-t border-white/4 pt-1">
                          <span style={{ color:meta.color, fontSize:10 }}>{meta.icon} {planetName(kp.planet, lang)}</span>
                          <span style={{ fontSize:9, color:qualityColor }}>
                            {houseLabel(kp.house, lang)} · {lang==='hi' ? localizeAstroText(kp.rashi_en, lang) : kp.rashi_en}
                            {qualityLabel && <span style={{ marginLeft:4, opacity:0.7 }}>({qualityLabel})</span>}
                            {kp.is_in_own_karak_house && (
                              <span style={{ marginLeft:4, color:'#F59E0B' }} title={lang==='hi' ? 'यह ग्रह उसी भाव में है जिसे यह नियंत्रित करता है — परिणाम मिश्रित हो सकते हैं' : 'This planet sits in the very house it governs — results can be mixed'}>⚠</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                    <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                      <p className="text-emerald-300/78 text-[10px] leading-relaxed font-devanagari">
                        ✓ {lang==='hi' ? (bk.benefit_hi||bk.benefit_en) : bk.benefit_en}
                      </p>
                      <p className="text-amber-200/78 text-[10px] leading-relaxed font-devanagari">
                        ⚠ {lang==='hi' ? (bk.danger_hi||bk.danger_en) : bk.danger_en}
                      </p>
                      <p className="text-violet-200/78 text-[10px] leading-relaxed font-devanagari">
                        🔹 {t(lang,'Remedy:','उपाय:')} {lang==='hi' ? (bk.remedy_hi||bk.remedy_en) : bk.remedy_en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        )}

        {/* ══ TAB: DRISHTI ════════════════════════════════════════════════ */}
        {activeTab === 'drishti' && (
        <div>
          {chart?.drishti && (
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }}
              className="card-royal p-5 mt-6">
              <h2 className="font-serif text-gold text-sm font-semibold mb-1">
                👁 {lang==='hi' ? 'ग्रह प्रभाव — आपके भावों पर' : 'How Planets Influence Your Life Areas'}
              </h2>
              <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
                {lang==='hi'
                  ? 'हर ग्रह जहाँ बैठा है वहाँ से दूसरे भावों पर नज़र रखता है। इसे दृष्टि कहते हैं। मंगल, गुरु, शनि जैसे ग्रहों की एक से ज़्यादा जगहों पर नज़र होती है।'
                  : 'Every planet casts its energy on other areas of your chart. Strong planets uplift those areas; challenging ones bring lessons. Mars, Jupiter, and Saturn influence more areas than others.'}
              </p>

              {chart.drishti.by_house_detail && (
                <div className="mb-5">
                  <h3 className="text-gold/70 text-[10px] uppercase tracking-widest mb-3">
                    {lang==='hi' ? 'हर भाव पर असर — आसान भाषा में' : 'What Each Life Area Is Receiving'}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Object.values(chart.drishti.by_house_detail).map((item) => (
                      <DrishtiHouseCard key={item.house} item={item} lang={lang} />
                    ))}
                  </div>
                </div>
              )}

              {/* By Planet */}
              <h3 className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">
                {lang==='hi' ? 'कौन सा ग्रह किस क्षेत्र को प्रभावित कर रहा है' : 'Which Planet Is Influencing Which Area'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
                {Object.entries(chart.drishti.by_planet || {}).map(([planet, info]) => {
                  const meta       = PLANET_META[planet] || {};
                  const hasSpecial = info.aspects.length > 1;
                  return (
                    <div key={planet} style={{
                      border:`1px solid ${hasSpecial ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)'}`,
                      borderRadius:8, padding:'8px 10px',
                      background: hasSpecial ? 'rgba(212,175,55,0.04)' : 'transparent',
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color:meta.color, fontSize:13 }}>{meta.icon}</span>
                        <span className="text-ivory text-xs font-semibold font-devanagari">{planetName(planet, lang)}</span>
                        <span className="text-ivory/30 text-[9px]">{houseLabel(info.from_house, lang)}</span>
                        {hasSpecial && (
                          <span style={{ fontSize:8, padding:'1px 5px', borderRadius:8, background:'rgba(212,175,55,0.15)', color:'#D4AF37', marginLeft:'auto' }}>
                            {t(lang,'Multi-house influence','बहु-भाव प्रभाव')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {info.aspects.map(({ house, offset, nature }) => {
                          const natColor = nature==='auspicious'  ? '#22C55E'
                                         : nature==='aggressive'  ? '#EF4444'
                                         : nature==='karmic'      ? '#A78BFA'
                                         : nature==='restricting' ? '#818CF8'
                                         : '#94A3B8';
                          const natLabel = lang==='hi'
                            ? (nature==='auspicious' ? 'शुभ' : nature==='aggressive' ? 'तीव्र' : nature==='karmic' ? 'कर्मिक' : nature==='restricting' ? 'सीमित' : 'सामान्य')
                            : (nature==='auspicious' ? 'Positive' : nature==='aggressive' ? 'Intense' : nature==='karmic' ? 'Karmic' : nature==='restricting' ? 'Limiting' : 'Neutral');
                          return (
                            <span key={offset} style={{
                              fontSize:9, padding:'2px 7px', borderRadius:10, fontWeight:600,
                              background:`${natColor}18`, color:natColor, border:`1px solid ${natColor}33`,
                            }}>
                              {houseLabel(house, lang)} · {natLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* By House */}
              <h3 className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">
                {lang==='hi' ? 'कौन से भाव पर कितने ग्रहों का प्रभाव है' : 'Energy Summary — Areas Receiving Planetary Attention'}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Object.entries(chart.drishti.by_house || {}).map(([house, planets]) => (
                  <div key={house} className={`border rounded p-2 text-center ${planets.length ? 'border-gold/20 bg-gold/4' : 'border-gold/8'}`}>
                    <p className="text-[9px] text-ivory/35 uppercase tracking-wider mb-1">{houseLabel(house, lang)}</p>
                    {planets.length ? (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {planets.map((p) => (
                          <span key={p} style={{ fontSize:9, color:PLANET_META[p]?.color||'#D4AF37', fontWeight:700 }}>
                            {planetName(p, lang).slice(0,2)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-ivory/15 text-[9px]">—</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        )}

        {/* ══ TAB: YOGAS ══════════════════════════════════════════════════ */}
        {activeTab === 'yogas' && (
        <div>
          {chart?.yogas_doshas && <YogasAndDoshasPanel chart={chart} lang={lang} library={kundli?.yoga_dosha_library} judgement={kundli?.judgement} />}
        </div>
        )}

        {/* ══ TAB: FAVOURITE DAYS ═════════════════════════════════════════ */}
        {activeTab === 'fav-days' && (
        <div className="card-royal p-5">
          <h3 className="text-gold font-semibold mb-4 text-sm">
            📅 {lang==='hi' ? 'शुभ दिन — उद्देश्य अनुसार' : 'Favourite Days — By Purpose'}
          </h3>
          <FavouriteDaysPanel favouriteDays={kundli?.favourite_days} lang={lang} />
        </div>
        )}

        {/* ══ TAB: FINAL RESULTS (SYNTHESIS) ══════════════════════════════ */}
        {activeTab === 'results' && (
          <KundliSynthesisPanel kundli={kundli} lang={lang} admin={false} />
        )}

        {/* ══ TAB: SIMPLE LIFE REPORT (human-friendly) ════════════════════ */}
        {activeTab === 'life-guide' && (
          <GuidanceReport uuid={kundli?.uuid || uuid} name={kundli?.name} lang={lang} judgement={kundli?.judgement} />
        )}

        {/* ══ TAB: JUDGEMENT SCORE ════════════════════════════════════════ */}
        {activeTab === 'judgement' && (
          <div className="mt-6">
            <JudgementPanel judgement={kundli?.judgement} lang={lang} admin={false} />
            {!kundli?.judgement && (
              <p className="text-ivory/35 text-xs text-center py-8">
                {lang==='hi' ? 'निर्णय डेटा उपलब्ध नहीं है। कुंडली को पुनः गणना करें।' : 'Judgement data not available. Recalculate the kundli to generate it.'}
              </p>
            )}
          </div>
        )}

        {/* ══ TAB: AI READING ══════════════════════════════════════════════ */}
        {activeTab === 'ai-reading' && (
          <div className="max-w-3xl mx-auto">
            <AIPredictionPanel uuid={kundli?.uuid || uuid} lang={lang} />
          </div>
        )}

        {/* Bottom nav */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          className="mt-6 flex flex-wrap gap-3 justify-between items-center card-royal p-4">
          <Link href="/dashboard" className="btn-outline-gold text-xs px-5 py-2">
            ← {lang==='hi'?'वापस':'Dashboard'}
          </Link>
          <div className="flex gap-3">
            <Link href="/matchmaking" className="btn-outline-gold text-xs px-5 py-2">
              💍 {lang==='hi'?'मिलान':'Matchmaking'}
            </Link>
            <Link href={predictionHref(kundli?.uuid || uuid)} className="btn-gold text-xs px-5 py-2 font-semibold">
              💫 {lang==='hi'?'भविष्यवाणी':'Predictions'}
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
