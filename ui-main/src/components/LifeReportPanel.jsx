'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const t = (lang, en, hi) => lang === 'hi' ? hi : en;

// ─── Tab definitions ──────────────────────────────────────────────────────────
const FRIENDLY_TABS = [
  { key: 'soul',       labelEn: 'Soul Direction',         labelHi: 'आत्मिक दिशा',      icon: '🪬' },
  { key: 'money',      labelEn: 'Money',                  labelHi: 'धन',               icon: '💰' },
  { key: 'family',     labelEn: 'Family & Relationships', labelHi: 'परिवार और रिश्ते', icon: '🏠' },
  { key: 'health',     labelEn: 'Health',                 labelHi: 'स्वास्थ्य',         icon: '🌿' },
  { key: 'challenges', labelEn: 'Challenges & Solutions', labelHi: 'सावधानी और समाधान', icon: '⚡' },
];

// Legacy tabs (backward compat / admin technical view)
const LEGACY_TABS = [
  { key: 'profile',  label_en: 'Soul Profile',  label_hi: 'आत्म प्रोफाइल', icon: '🪬' },
  { key: 'finance',  label_en: 'Finance',        label_hi: 'वित्त',          icon: '💰' },
  { key: 'family',   label_en: 'Family',         label_hi: 'परिवार',         icon: '🏠' },
  { key: 'health',   label_en: 'Health',         label_hi: 'स्वास्थ्य',      icon: '🌿' },
  { key: 'problems', label_en: 'Problems',       label_hi: 'समस्याएं',       icon: '⚠️' },
];

const ST = {
  strong: { border: 'border-emerald-400/25', bg: 'bg-emerald-400/5', dot: 'bg-emerald-400', badge: 'bg-emerald-400/15 text-emerald-300' },
  mid:    { border: 'border-amber-400/20',   bg: 'bg-amber-400/5',   dot: 'bg-amber-400',   badge: 'bg-amber-400/15 text-amber-200' },
  care:   { border: 'border-red-400/20',     bg: 'bg-red-400/5',     dot: 'bg-red-400',     badge: 'bg-red-400/15 text-red-300' },
};

const STRENGTH_COLORS = { 6:'text-emerald-300', 5:'text-green-300', 4:'text-lime-300', 3:'text-amber-300', 2:'text-orange-400', 1:'text-red-400' };

// ─── Legacy helper components (technical/admin view) ─────────────────────────

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
  return (
    <div className="space-y-4">
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
      <div className={`rounded-lg border p-4 ${section.overall_score >= 4 ? 'border-emerald-400/25 bg-emerald-400/5' : section.overall_score >= 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-red-400/20 bg-red-400/5'}`}>
        <p className="text-ivory/80 text-sm leading-relaxed font-devanagari">
          {lang === 'hi' ? section.summary_hi : section.summary_en}
        </p>
      </div>
      {section.indicators?.length > 0 && (
        <div>
          <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{t(lang,'Key Indicators','मुख्य संकेतक')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.indicators.map((item) => <IndicatorCard key={item.key} item={item} lang={lang} />)}
          </div>
        </div>
      )}
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

function DetailedReading({ paras, lang }) {
  if (!paras?.length) return null;
  return (
    <div style={{ marginTop:14, border:'1px solid rgba(212,175,55,0.22)', borderRadius:10,
      background:'linear-gradient(150deg, rgba(212,175,55,0.06), rgba(255,255,255,0.015) 50%)', padding:'13px 15px' }}>
      <p style={{ color:'#D4AF37', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:9 }}
        className="font-devanagari">
        📖 {t(lang, 'Detailed Reading — True Understanding', 'विस्तृत विश्लेषण — सच्ची समझ')}
      </p>
      <div className="space-y-2.5">
        {paras.map((p, i) => (
          <p key={i} className="text-ivory/75 text-[11.5px] leading-[1.85] font-devanagari">
            {lang === 'hi' ? (p.hi || p.en) : p.en}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Friendly view components (user mode) ────────────────────────────────────

function TechnicalDetails({ section, lang }) {
  const tech = section.technicalDetails;
  if (!tech) return null;
  const L = (en, hi) => lang === 'hi' ? hi : en;

  return (
    <div className="mt-2 space-y-3">
      {/* Ishta Devata (soul section) */}
      {tech.ishta_devata && (
        <div className="rounded border border-gold/15 bg-gold/5 p-3 space-y-2">
          <p className="text-gold/60 text-[10px] uppercase tracking-widest">{L('Atmakaraka & Ishta Devata', 'आत्मकारक और इष्ट देवता')}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-ivory/40">{L('Atmakaraka','आत्मकारक')}</p>
              <p className="text-gold font-semibold font-devanagari">
                {L(tech.ishta_devata.atmakaraka, tech.ishta_devata.atmakaraka_hi || tech.ishta_devata.atmakaraka)}
                <span className="text-ivory/40 ml-1">({tech.ishta_devata.atmakaraka_degree}°)</span>
              </p>
            </div>
            <div>
              <p className="text-ivory/40">{L('D9 Sign','D9 राशि')}</p>
              <p className="text-ivory/70 font-devanagari">
                {L(tech.ishta_devata.d9_sign_en, tech.ishta_devata.d9_sign_hi || tech.ishta_devata.d9_sign_en)}
                <span className="text-ivory/40 ml-1">({L('lord','स्वामी')}: {tech.ishta_devata.d9_sign_lord})</span>
              </p>
            </div>
            <div>
              <p className="text-ivory/40">{L('Ishta Devata','इष्ट देवता')}</p>
              <p className="text-saffron font-semibold font-devanagari">
                {L(tech.ishta_devata.ishta_devata_en, tech.ishta_devata.ishta_devata_hi || tech.ishta_devata.ishta_devata_en)}
              </p>
            </div>
            <div>
              <p className="text-ivory/40">{L('Primary Mantra','प्राथमिक मंत्र')}</p>
              <p className="text-ivory/70 font-devanagari text-[10px]">
                {L(tech.ishta_devata.primary_mantra_en, tech.ishta_devata.primary_mantra_hi || tech.ishta_devata.primary_mantra_en)}
              </p>
            </div>
          </div>
          {tech.ishta_devata.method_en && (
            <p className="text-ivory/30 text-[10px] italic font-devanagari">
              {L(tech.ishta_devata.method_en, tech.ishta_devata.method_hi || tech.ishta_devata.method_en)}
            </p>
          )}
        </div>
      )}

      {/* Current dasha (soul section) */}
      {tech.current_dasha && (
        <div className="rounded border border-gold/10 bg-white/2 p-3">
          <p className="text-gold/50 text-[10px] uppercase tracking-widest mb-1">{L('Current Dasha Phase', 'वर्तमान दशा')}</p>
          <p className="text-ivory/70 text-[11px] font-devanagari">
            {L(tech.current_dasha.lord, tech.current_dasha.lord_hi || tech.current_dasha.lord)}
            {tech.current_dasha.antardasha_lord && <span className="text-gold/60 ml-1">/ {tech.current_dasha.antardasha_lord}</span>}
          </p>
        </div>
      )}

      {/* Wealth yogas (money section) */}
      {tech.wealth_yogas?.length > 0 && (
        <div>
          <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">{L('Active Wealth Yogas','सक्रिय धन योग')}</p>
          <div className="flex flex-wrap gap-2">
            {tech.wealth_yogas.map((y) => (
              <div key={y.name} className="rounded border border-gold/25 bg-gold/8 px-3 py-1.5">
                <p className="text-gold/90 text-[11px] font-semibold font-devanagari">
                  {lang === 'hi' ? y.name_hi || y.name : y.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical indicators (money section) */}
      {tech.indicators?.length > 0 && (
        <div className="space-y-1.5">
          {tech.indicators.slice(0, 5).map((ind, i) => (
            <div key={i} className="rounded border border-gold/10 bg-white/2 px-3 py-2">
              <p className="text-gold/50 text-[10px] font-devanagari">
                {lang === 'hi' ? ind.label_hi || ind.label_en : ind.label_en}
              </p>
              <p className="text-ivory/65 text-[11px] font-devanagari">
                {lang === 'hi' ? ind.value_hi || ind.value_en : ind.value_en}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Doshas detected (family / challenges) */}
      {tech.doshas_detected?.length > 0 && (
        <div>
          <p className="text-red-400/70 text-[10px] uppercase tracking-widest mb-2">{L('Doshas Detected','मिले दोष')}</p>
          <div className="flex flex-wrap gap-2">
            {tech.doshas_detected.map((d) => (
              <div key={d.name} className="rounded border border-red-400/20 bg-red-400/5 px-3 py-1.5">
                <p className="text-red-300/85 text-[11px] font-semibold font-devanagari">
                  {lang === 'hi' ? d.name_hi || d.name : d.name}
                </p>
                <p className="text-ivory/35 text-[10px] font-devanagari">{d.severity || d.category || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judgement challenging areas (challenges section) */}
      {tech.judgementChallenging?.length > 0 && (
        <div>
          <p className="text-orange-400/70 text-[10px] uppercase tracking-widest mb-2">{L('Chart signals needing care','ध्यान चाहने वाले संकेत')}</p>
          <div className="space-y-1.5">
            {tech.judgementChallenging.map((a, i) => (
              <div key={i} className="rounded border border-orange-400/15 bg-orange-400/5 px-3 py-2">
                <p className="text-orange-300/80 text-[11px] font-semibold font-devanagari">
                  {L(a.keyEn, a.keyHi)}
                </p>
                {L(a.summaryEn, a.summaryHi) && (
                  <p className="text-ivory/50 text-[10px] mt-0.5 font-devanagari">{L(a.summaryEn, a.summaryHi)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw BPHS problems */}
      {tech.rawProblems?.length > 0 && (
        <div>
          <p className="text-ivory/30 text-[10px] uppercase tracking-widest mb-2">{L('Classical analysis details','शास्त्रीय विश्लेषण विवरण')}</p>
          <div className="space-y-1.5">
            {tech.rawProblems.map((p, i) => (
              <div key={i} className="rounded border border-white/8 bg-white/2 px-3 py-2">
                <p className="text-ivory/50 text-[10px] leading-relaxed font-devanagari">
                  {lang === 'hi' ? p.hi || p.en : p.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FriendlySection({ section, lang, adminMode, advancedRemedies }) {
  const [techOpen, setTechOpen] = useState(!!adminMode);
  const [advOpen, setAdvOpen] = useState(false);

  const st = ST[section.statusKey] || ST.mid;
  const L = (en, hi) => lang === 'hi' ? hi : en;

  const goodPoints  = L(section.goodPointsEn,    section.goodPointsHi);
  const challenges  = L(section.challengesEn,    section.challengesHi);
  const adviceItems = L(section.adviceEn,         section.adviceHi);
  const remedyItems = L(section.simpleRemediesEn, section.simpleRemediesHi);
  const summary     = L(section.summaryEn,        section.summaryHi);
  const dashaText   = section.key === 'soul' ? L(section.dashaTextEn, section.dashaTextHi) : '';

  return (
    <div className="space-y-4">
      {/* Status + Summary */}
      <div className={`rounded-lg border ${st.border} ${st.bg} p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.badge}`}>
            {section.statusKey === 'strong' ? L('Looking Good','अच्छा दिख रहा है')
              : section.statusKey === 'mid' ? L('Balanced','संतुलित')
              : L('Needs Attention','ध्यान चाहिए')}
          </span>
        </div>
        <p className="text-ivory/82 text-sm leading-relaxed font-devanagari">{summary}</p>
        {dashaText && (
          <p className="text-ivory/55 text-[11.5px] leading-relaxed font-devanagari mt-2">{dashaText}</p>
        )}
      </div>

      {/* Good points */}
      {goodPoints?.length > 0 && (
        <div>
          <p className="text-emerald-400/70 text-[10px] uppercase tracking-widest mb-2">
            {L('What looks good','जो अच्छा दिखता है')}
          </p>
          <div className="space-y-1.5">
            {goodPoints.map((p, i) => (
              <div key={i} className="rounded border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 flex gap-2">
                <span className="text-emerald-400/60 text-[11px] mt-0.5 shrink-0">✦</span>
                <p className="text-ivory/75 text-[11px] leading-relaxed font-devanagari">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges (soft) */}
      {challenges?.length > 0 && (
        <div>
          <p className="text-amber-400/70 text-[10px] uppercase tracking-widest mb-2">
            {L('What needs care','जिसपर ध्यान दें')}
          </p>
          <div className="space-y-1.5">
            {challenges.map((c, i) => (
              <div key={i} className="rounded border border-amber-400/20 bg-amber-400/5 px-3 py-2 flex gap-2">
                <span className="text-amber-400/60 text-[11px] mt-0.5 shrink-0">◈</span>
                <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">{c}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidance */}
      {adviceItems?.length > 0 && (
        <div>
          <p className="text-gold/70 text-[10px] uppercase tracking-widest mb-2">
            {L('Guidance','मार्गदर्शन')}
          </p>
          <div className="space-y-1.5">
            {adviceItems.map((a, i) => (
              <div key={i} className="rounded border border-gold/15 bg-gold/5 px-3 py-2 flex gap-2">
                <span className="text-gold/55 text-[11px] mt-0.5 shrink-0">→</span>
                <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple remedies (Level A) */}
      {remedyItems?.length > 0 && (
        <div>
          <p className="text-saffron/70 text-[10px] uppercase tracking-widest mb-2">
            {L('Simple Remedies','सरल उपाय')}
          </p>
          <div className="space-y-1.5">
            {remedyItems.map((r, i) => (
              <div key={i} className="rounded border border-saffron/15 bg-saffron/5 px-3 py-2 flex gap-2">
                <span className="text-saffron/55 text-[11px] mt-0.5 shrink-0">✿</span>
                <p className="text-ivory/70 text-[11px] leading-relaxed font-devanagari">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical details (collapsed for user, open for admin) */}
      <div>
        <button
          type="button"
          onClick={() => setTechOpen((o) => !o)}
          className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded border border-gold/15 bg-white/2 hover:bg-white/4 transition-colors"
        >
          <span className="text-gold/55 text-[10px] uppercase tracking-widest font-devanagari">
            📖 {L('View classical details','शास्त्रीय विवरण देखें')}
          </span>
          <span className="text-gold/40 text-xs">{techOpen ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence>
          {techOpen && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} transition={{ duration:0.18 }} className="overflow-hidden">
              <TechnicalDetails section={section} lang={lang} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced remedies (Level B) — always collapsed */}
      {advancedRemedies && (
        <div>
          <button
            type="button"
            onClick={() => setAdvOpen((o) => !o)}
            className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded border border-purple-400/15 bg-white/2 hover:bg-white/4 transition-colors"
          >
            <span className="text-purple-400/55 text-[10px] uppercase tracking-widest font-devanagari">
              🕉 {L('Advanced Remedies — consult astrologer','उन्नत उपाय — ज्योतिषी से परामर्श लें')}
            </span>
            <span className="text-purple-400/40 text-xs">{advOpen ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {advOpen && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                exit={{ opacity:0, height:0 }} transition={{ duration:0.18 }} className="overflow-hidden mt-2 space-y-1.5">
                {(lang === 'hi' ? advancedRemedies.hi : advancedRemedies.en).map((r, i) => (
                  <div key={i} className="rounded border border-purple-400/15 bg-purple-400/5 px-3 py-2 flex gap-2">
                    <span className="text-purple-400/55 text-[11px] mt-0.5 shrink-0">॥</span>
                    <p className="text-ivory/65 text-[11px] leading-relaxed font-devanagari">{r}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LifeReportPanel({ lifeReport, lang, narratives = null, lifeReportFriendly = null, admin = false }) {
  const hasFriendly = !!lifeReportFriendly?.sections?.length;

  // For admin: allow toggling between friendly and full technical view
  const [techMode, setTechMode] = useState(false);

  // Friendly mode tab state
  const [activeTab, setActiveTab] = useState(hasFriendly ? FRIENDLY_TABS[0].key : 'profile');

  // Legacy tab state
  const [legacyTab, setLegacyTab] = useState('profile');

  // Decide rendering mode
  const showFriendly = hasFriendly && !techMode;

  // ── Friendly mode ─────────────────────────────────────────────────────────
  if (showFriendly) {
    const activeSection = lifeReportFriendly.sections.find((s) => s.key === activeTab);
    return (
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="card-royal p-5 mt-6">

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-gold text-sm font-semibold">
              {t(lang, 'Life Report — Practical Guidance', 'जीवन रिपोर्ट — व्यावहारिक मार्गदर्शन')}
            </h2>
            <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
              {t(lang,
                'Soul Direction · Money · Family · Health · Challenges',
                'आत्मिक दिशा · धन · परिवार · स्वास्थ्य · सावधानी'
              )}
            </p>
          </div>
          {admin && (
            <button
              type="button"
              onClick={() => setTechMode(true)}
              className="shrink-0 px-3 py-1.5 rounded border border-gold/20 bg-white/3 text-gold/60 text-[10px] hover:bg-white/5 transition-colors"
            >
              {t(lang, 'Technical View', 'तकनीकी विवरण')}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gold/10">
          {FRIENDLY_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const sec = lifeReportFriendly.sections.find((s) => s.key === tab.key);
            const hasCare = sec?.statusKey === 'care';
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
                <span className="block text-[10px] font-devanagari mt-0.5">
                  {lang === 'hi' ? tab.labelHi : tab.labelEn}
                </span>
                {hasCare && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400/80" />}
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.18 }}
          >
            <p className="text-gold text-xs font-semibold mb-3 font-devanagari">
              {lang === 'hi' ? activeSection?.titleHi : activeSection?.titleEn}
            </p>
            {activeSection && (
              <FriendlySection
                section={activeSection}
                lang={lang}
                adminMode={admin}
                advancedRemedies={lifeReportFriendly.advancedRemedies}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Legacy / technical mode (admin toggle or no friendly data) ─────────────
  if (!lifeReport?.sections) return null;
  const sections = lifeReport.sections;
  const activeSection = sections[legacyTab];
  if (!activeSection) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
      className="card-royal p-5 mt-6">

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'Life Report — Practical Kundli Analysis', 'जीवन रिपोर्ट — व्यावहारिक कुंडली विश्लेषण')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
            {t(lang,
              'Finance · Family · Health · Problem Solutions · Soul Profile',
              'वित्त · परिवार · स्वास्थ्य · समस्या समाधान · आत्म प्रोफाइल'
            )}
          </p>
        </div>
        {admin && hasFriendly && (
          <button
            type="button"
            onClick={() => setTechMode(false)}
            className="shrink-0 px-3 py-1.5 rounded border border-emerald-400/20 bg-white/3 text-emerald-400/60 text-[10px] hover:bg-white/5 transition-colors"
          >
            {t(lang, '← User View', '← उपयोगकर्ता दृश्य')}
          </button>
        )}
      </div>

      {/* Legacy tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gold/10">
        {LEGACY_TABS.map((tab) => {
          const active = legacyTab === tab.key;
          const hasIssue = tab.key === 'problems' && (sections.problems?.dosha_count > 0 || sections.problems?.sade_sati_active);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setLegacyTab(tab.key)}
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
          key={legacyTab}
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.18 }}
        >
          <p className="text-gold text-xs font-semibold mb-3 font-devanagari">
            {lang === 'hi' ? activeSection.title_hi : activeSection.title_en}
          </p>
          {legacyTab === 'profile'
            ? <ProfileSection section={activeSection} lang={lang} />
            : <SectionWithIndicators section={activeSection} lang={lang} />
          }
          <DetailedReading paras={narratives?.[legacyTab]} lang={lang} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
