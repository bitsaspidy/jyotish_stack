'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const t = (lang, en, hi) => lang === 'hi' ? hi : en;

const SECTION_TABS = [
  { key: 'profile',  label_en: 'Soul Profile',  label_hi: 'आत्म प्रोफाइल', icon: '🪬' },
  { key: 'finance',  label_en: 'Finance',        label_hi: 'वित्त',          icon: '💰' },
  { key: 'family',   label_en: 'Family',         label_hi: 'परिवार',         icon: '🏠' },
  { key: 'health',   label_en: 'Health',         label_hi: 'स्वास्थ्य',      icon: '🌿' },
  { key: 'problems', label_en: 'Problems',       label_hi: 'समस्याएं',       icon: '⚠️' },
];

const STRENGTH_COLORS = { 6:'text-emerald-300', 5:'text-green-300', 4:'text-lime-300', 3:'text-amber-300', 2:'text-orange-400', 1:'text-red-400' };
const IMPACT_COLORS = { very_favorable:'border-emerald-400/30 bg-emerald-400/5', favorable:'border-green-400/25 bg-green-400/4', neutral:'border-amber-400/20 bg-amber-400/5', challenging:'border-red-400/25 bg-red-400/5', mixed:'border-orange-400/20 bg-orange-400/5' };
const IMPACT_BADGE = { very_favorable:'bg-emerald-400/15 text-emerald-300', favorable:'bg-green-400/12 text-green-300', neutral:'bg-amber-400/12 text-amber-200', challenging:'bg-red-400/12 text-red-300', mixed:'bg-orange-400/12 text-orange-300' };

function StrengthDot({ score }) {
  const color = STRENGTH_COLORS[Math.round(score)] || 'text-amber-300';
  return <span className={`text-[10px] font-bold ${color}`}>{score >= 5 ? '●●●' : score >= 3 ? '●●○' : '●○○'}</span>;
}

function ProblemSolutionList({ problems, solutions, lang }) {
  return (
    <div className="space-y-3">
      {problems?.length > 0 && (
        <div>
          <p className="text-red-400/70 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Challenges Identified','चिन्हित चुनौतियाँ')}</p>
          <div className="space-y-1.5">
            {problems.map((p, i) => (
              <div key={i} className="rounded border border-red-400/20 bg-red-400/5 px-3 py-2 flex gap-2">
                <span className="text-red-400/60 text-[11px] mt-0.5 shrink-0">⚠</span>
                <p className="text-ivory/65 text-[11px] leading-relaxed font-devanagari">
                  {lang === 'hi' ? p.hi : p.en}
                  {p.severity && <span className="ml-2 text-[10px] text-red-400/50">({p.severity})</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {solutions?.length > 0 && (
        <div>
          <p className="text-emerald-400/70 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Solutions & Remedies','समाधान और उपाय')}</p>
          <div className="space-y-1.5">
            {solutions.map((s, i) => (
              <div key={i} className="rounded border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 flex gap-2">
                <span className="text-emerald-400/60 text-[11px] mt-0.5 shrink-0">✦</span>
                <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">
                  {lang === 'hi' ? s.hi : s.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IndicatorCard({ item, lang }) {
  return (
    <div className="rounded border border-gold/10 bg-white/3 p-3">
      <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-1 font-devanagari">{item.label_hi && lang === 'hi' ? item.label_hi : item.label_en}</p>
      <p className="text-ivory/80 text-[12px] font-devanagari">{item.value_hi && lang === 'hi' ? item.value_hi : item.value_en}</p>
      {item.strength_score != null && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <StrengthDot score={item.strength_score} />
          <span className="text-[10px] text-ivory/40">
            {item.strength_score >= 5 ? t(lang,'Strong','मजबूत') : item.strength_score >= 3 ? t(lang,'Moderate','सामान्य') : t(lang,'Weak','निर्बल')}
          </span>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ section, lang }) {
  const ish = section.ishta_devata;
  const ak = section.atmakaraka;
  return (
    <div className="space-y-4">
      {/* Atmakaraka + Isht Devata — prime card */}
      {ish && (
        <div className="rounded-lg border border-gold/35 bg-gradient-to-r from-[#1a1530]/80 to-[#0f1128]/80 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gold text-base">🪬</span>
            <p className="text-gold text-sm font-semibold">{t(lang,'Your Isht Devata','आपके इष्ट देवता')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-ivory/40 text-[10px] uppercase tracking-widest">{t(lang,'Atmakaraka Planet','आत्मकारक ग्रह')}</p>
              <p className="text-gold text-xl font-serif mt-1">{ish.atmakaraka_hi && lang === 'hi' ? ish.atmakaraka_hi : ish.atmakaraka} <span className="text-ivory/40 text-xs">({ish.atmakaraka_degree}°)</span></p>
              <p className="text-ivory/50 text-[11px] mt-1 font-devanagari">{t(lang,'D9 sign:','D9 राशि:')} {ish.d9_sign_hi && lang === 'hi' ? `${ish.d9_sign_hi} (स्वामी: ${ish.d9_sign_lord})` : `${ish.d9_sign_en} (lord: ${ish.d9_sign_lord})`}</p>
            </div>
            <div>
              <p className="text-ivory/40 text-[10px] uppercase tracking-widest">{t(lang,'Isht Devata','इष्ट देवता')}</p>
              <p className="text-saffron font-devanagari text-base font-semibold mt-1">{ish.ishta_devata_hi && lang === 'hi' ? ish.ishta_devata_hi : ish.ishta_devata_en}</p>
              <p className="text-ivory/50 text-[11px] mt-1 font-devanagari">{t(lang,'Primary mantra:','प्राथमिक मंत्र:')} {ish.primary_mantra_hi && lang === 'hi' ? ish.primary_mantra_hi : ish.primary_mantra_en}</p>
            </div>
          </div>
          <p className="text-ivory/30 text-[10px] mt-3 italic">{ish.method_hi && lang === 'hi' ? ish.method_hi : ish.method_en}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Lagna */}
        {section.lagna && (
          <div className="rounded border border-gold/15 bg-white/3 p-3">
            <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Ascendant (Lagna)','लग्न राशि')}</p>
            <p className="text-ivory text-sm font-semibold font-devanagari">
              {lang === 'hi' ? section.lagna.sign_hi : section.lagna.sign_en}
              <span className="text-gold/60 text-xs ml-2">({t(lang,'lord:','स्वामी:')} {section.lagna.lord})</span>
            </p>
            <p className="text-ivory/55 text-[11px] mt-1.5 leading-relaxed font-devanagari">
              {lang === 'hi' ? section.lagna.summary_hi : section.lagna.summary_en}
            </p>
          </div>
        )}
        {/* Moon */}
        {section.moon_sign && (
          <div className="rounded border border-gold/15 bg-white/3 p-3">
            <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Moon Sign (Rashi)','चंद्र राशि')}</p>
            <p className="text-ivory text-sm font-semibold font-devanagari">
              {lang === 'hi' ? section.moon_sign.sign_hi : section.moon_sign.sign_en}
            </p>
            <p className="text-ivory/55 text-[11px] mt-1.5 leading-relaxed font-devanagari">
              {lang === 'hi' ? section.moon_sign.summary_hi : section.moon_sign.summary_en}
            </p>
          </div>
        )}
        {/* Nakshatra */}
        {section.nakshatra?.name_en && (
          <div className="rounded border border-gold/15 bg-white/3 p-3">
            <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Nakshatra','नक्षत्र')}</p>
            <p className="text-ivory text-sm font-semibold font-devanagari">
              {lang === 'hi' ? section.nakshatra.name_hi : section.nakshatra.name_en}
              <span className="text-gold/60 text-xs ml-2">{t(lang,'Pada','पाद')} {section.nakshatra.pada}</span>
            </p>
            <p className="text-ivory/55 text-[11px] mt-1.5 leading-relaxed font-devanagari">
              {lang === 'hi' ? section.nakshatra.summary_hi : section.nakshatra.summary_en}
            </p>
          </div>
        )}
        {/* Current Dasha */}
        {section.current_dasha && (
          <div className="rounded border border-gold/15 bg-white/3 p-3">
            <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Current Dasha','वर्तमान दशा')}</p>
            <p className="text-ivory text-sm font-semibold font-devanagari">
              {lang === 'hi' ? section.current_dasha.lord_hi : section.current_dasha.lord}
              {section.current_dasha.antardasha_lord && (
                <span className="text-gold/60 text-xs ml-1">/ {section.current_dasha.antardasha_lord}</span>
              )}
            </p>
            <p className="text-ivory/55 text-[11px] mt-1.5 leading-relaxed font-devanagari">
              {lang === 'hi' ? section.current_dasha.summary_hi : section.current_dasha.summary_en}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionWithIndicators({ section, lang }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`rounded-lg border p-4 ${section.overall_score >= 4 ? 'border-emerald-400/25 bg-emerald-400/5' : section.overall_score >= 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-red-400/20 bg-red-400/5'}`}>
        <p className="text-ivory/80 text-sm leading-relaxed font-devanagari">
          {lang === 'hi' ? section.summary_hi : section.summary_en}
        </p>
      </div>

      {/* Indicators grid */}
      {section.indicators?.length > 0 && (
        <div>
          <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Key Indicators','मुख्य संकेतक')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.indicators.map((item) => <IndicatorCard key={item.key} item={item} lang={lang} />)}
          </div>
        </div>
      )}

      {/* Wealth yogas (finance only) */}
      {section.wealth_yogas?.length > 0 && (
        <div>
          <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Active Wealth Yogas','सक्रिय धन योग')}</p>
          <div className="flex flex-wrap gap-2">
            {section.wealth_yogas.map((y) => (
              <div key={y.name} className="rounded border border-gold/25 bg-gold/8 px-3 py-1.5">
                <p className="text-gold/90 text-[11px] font-semibold font-devanagari">{lang === 'hi' ? y.name_hi || y.name : y.name}</p>
                {y.trigger_en && <p className="text-ivory/45 text-[10px] mt-0.5 font-devanagari">{lang === 'hi' ? y.trigger_hi || y.trigger_en : y.trigger_en}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doshas detected (problems section) */}
      {section.doshas_detected?.length > 0 && (
        <div>
          <p className="text-red-400/70 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Doshas Detected','मिले दोष')}</p>
          <div className="flex flex-wrap gap-2">
            {section.doshas_detected.map((d) => (
              <div key={d.name} className="rounded border border-red-400/20 bg-red-400/5 px-3 py-1.5">
                <p className="text-red-300/85 text-[11px] font-semibold font-devanagari">{lang === 'hi' ? d.name_hi || d.name : d.name}</p>
                <p className="text-ivory/35 text-[10px] font-devanagari">{d.severity || d.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProblemSolutionList problems={section.problems} solutions={section.solutions} lang={lang} />
    </div>
  );
}

export default function LifeReportPanel({ lifeReport, lang }) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!lifeReport?.sections) return null;
  const sections = lifeReport.sections;
  const activeSection = sections[activeTab];
  if (!activeSection) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
      className="card-royal p-5 mt-6">

      {/* Header */}
      <div className="mb-4">
        <h2 className="font-serif text-gold text-sm font-semibold">
          {t(lang, 'Life Report — Practical Kundli Analysis', 'जीवन रिपोर्ट — व्यावहारिक कुंडली विश्लेषण')}
        </h2>
        <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
          {t(lang,
            'Finance · Family · Health · Problem Solutions · Soul Profile with Isht Devata',
            'वित्त · परिवार · स्वास्थ्य · समस्या समाधान · आत्म प्रोफाइल एवं इष्ट देवता'
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gold/10">
        {SECTION_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const hasIssue = tab.key === 'problems' && (sections.problems?.dosha_count > 0 || sections.problems?.sade_sati_active);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                minWidth: 80, padding:'7px 12px', borderRadius: 8, cursor:'pointer', flex:'0 0 auto',
                border:`1px solid ${active ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.14)'}`,
                background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
                color: active ? '#D4AF37' : 'rgba(245,240,232,0.55)',
                position: 'relative',
              }}
            >
              <span className="block text-sm">{tab.icon}</span>
              <span className="block text-[10px] font-devanagari mt-0.5">{lang === 'hi' ? tab.label_hi : tab.label_en}</span>
              {hasIssue && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400/80" />}
            </button>
          );
        })}
      </div>

      {/* Active section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.18 }}
        >
          {/* Section title */}
          <p className="text-gold text-xs font-semibold mb-3 font-devanagari">
            {lang === 'hi' ? activeSection.title_hi : activeSection.title_en}
          </p>

          {activeTab === 'profile'
            ? <ProfileSection section={activeSection} lang={lang} />
            : <SectionWithIndicators section={activeSection} lang={lang} />
          }
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
