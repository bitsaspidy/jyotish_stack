'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, planetName, houseLabel, dignityLabel } from '../../lib/astroI18n';
import { PLANET_META, ASSESSMENT_STYLE, TIMING_STYLE, assessmentLabel, timingToneLabel } from './kundliConstants';

export default function DetailedReportsPanel({ reports, lang, onRecalculate, recalcing }) {
  const [tab, setTab] = useState('general');
  const tabs = [
    { key:'general',   label:t(lang, 'General Report',  'सामान्य रिपोर्ट') },
    { key:'planets',   label:t(lang, 'Planet Report',   'ग्रह रिपोर्ट')    },
    { key:'yogaDasha', label:t(lang, 'Yoga + Dasha',    'योग + दशा')       },
    { key:'timing',    label:t(lang, 'Event Timing',    'घटना समय')        },
    { key:'matrix',    label:t(lang, 'Varga Matrix',    'वर्ग तालिका')      },
    { key:'details',   label:t(lang, 'Planet Details',  'ग्रह विवरण')       },
    { key:'cusps',     label:t(lang, 'Cusps',           'कस्प')             },
  ];

  if (!reports) {
    return (
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        className="card-royal p-5 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-gold text-sm font-semibold">
              {t(lang, 'Graha Rashi Bhav Detailed Report', 'ग्रह राशि भाव विस्तृत रिपोर्ट')}
            </h2>
            <p className="text-ivory/45 text-xs mt-1">
              {t(lang, 'This saved Kundli needs recalculation to generate the new report tables.', 'नई रिपोर्ट तालिकाएं बनाने के लिए इस कुंडली की पुनः गणना जरूरी है।')}
            </p>
          </div>
          <button onClick={onRecalculate} disabled={recalcing} className="btn-outline-gold text-xs px-4 py-2">
            {recalcing ? t(lang, 'Recalculating...', 'पुनः गणना हो रही है...') : t(lang, 'Recalculate', 'पुनः गणना')}
          </button>
        </div>
      </motion.div>
    );
  }

  const matrix      = reports.varga_matrix  || {};
  const planetOrder = matrix.planet_order   || [];
  const planetRows  = reports.planet_details || [];
  const cuspRows    = reports.cusp_details   || [];
  const planetReport = reports.planet_report || [];
  const general      = reports.general_report || {};
  const yogaDasha    = reports.yoga_dasha_report || {};
  const eventTiming  = reports.event_timing  || {};
  const cellStyle = 'py-2 pr-3 border-b border-white/5 whitespace-nowrap';
  const headStyle = 'text-left py-2 pr-3 border-b border-gold/15 text-ivory/35 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap';

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5 mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'Graha Rashi Bhav Detailed Report', 'ग्रह राशि भाव विस्तृत रिपोर्ट')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1">
            {t(lang,
              'General narrative, planet interpretations, divisional matrix, KP-style sub lords, and equal-house cusps.',
              'सामान्य फल, ग्रह व्याख्या, वर्ग तालिका, KP शैली सब-लॉर्ड और समान-भाव कस्प।'
            )}
          </p>
        </div>
        <span className="rounded border border-gold/15 px-2 py-1 text-gold/65 text-[10px]">
          {t(lang, 'Graha + Rashi + Bhav', 'ग्रह + राशि + भाव')}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-gold/10">
        {tabs.map((item) => (
          <button key={item.key} type="button" onClick={() => setTab(item.key)} className="shrink-0"
            style={{
              padding:'7px 12px', borderRadius:8,
              border:`1px solid ${tab === item.key ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.14)'}`,
              background: tab === item.key ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
              color: tab === item.key ? '#D4AF37' : 'rgba(245,240,232,0.55)',
              fontSize:11, fontWeight:700,
            }}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div>
          <p className="text-ivory/75 text-sm leading-relaxed font-devanagari mb-4">
            {lang === 'hi' ? (general.summary_hi || general.summary_en) : general.summary_en}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(general.sections || []).map((section) => (
              <div key={section.key} className="rounded border border-gold/10 bg-[#111428]/55 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-2 font-devanagari">
                  {lang === 'hi' ? (section.title_hi || section.title_en) : section.title_en}
                </p>
                <p className="text-ivory/60 text-xs leading-relaxed font-devanagari">
                  {lang === 'hi' ? (section.body_hi || section.body_en) : section.body_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'planets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {planetReport.map((row) => {
            const assessment = row.assessment || {};
            const badgeStyle = ASSESSMENT_STYLE[assessment.polarity] || ASSESSMENT_STYLE.mixed;
            const reasons = lang === 'hi' ? assessment.reasons_hi : assessment.reasons_en;
            return (
              <div key={row.planet} className="rounded border border-gold/10 bg-white/3 p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-gold/85 text-xs font-semibold font-devanagari">
                    {PLANET_META[row.planet]?.icon} {lang === 'hi' ? row.title_hi : row.title_en}
                  </p>
                  <span className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                    style={{ background:badgeStyle.bg, color:badgeStyle.color, border:`1px solid ${badgeStyle.border}` }}>
                    {assessmentLabel(assessment, lang)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="rounded bg-gold/10 text-gold/75 px-2 py-1 text-[9px]">{houseLabel(row.house, lang)}</span>
                  <span className="rounded bg-white/5 text-ivory/45 px-2 py-1 text-[9px]">
                    {t(lang, 'Score', 'स्कोर')}: {assessment.score ?? '—'}
                  </span>
                </div>
                <p className="text-ivory/60 text-xs leading-relaxed font-devanagari">
                  {lang === 'hi' ? (row.summary_hi || row.summary_en) : row.summary_en}
                </p>
                {!!reasons?.length && (
                  <div className="mt-3 space-y-1">
                    {reasons.slice(0, 3).map((reason, index) => (
                      <p key={index} className="text-ivory/42 text-[10px] leading-relaxed font-devanagari">{reason}</p>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="rounded bg-gold/10 text-gold/75 px-2 py-1 text-[9px]">{lang === 'hi' ? row.rashi_hi : row.rashi_en}</span>
                  <span className="rounded bg-white/5 text-ivory/45 px-2 py-1 text-[9px]">{dignityLabel(row.dignity, lang)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'yogaDasha' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <p className="text-ivory/75 text-sm leading-relaxed font-devanagari">
              {lang === 'hi' ? (yogaDasha.summary_hi || yogaDasha.summary_en) : yogaDasha.summary_en}
            </p>
            <p className="text-ivory/45 text-xs leading-relaxed mt-2 font-devanagari">
              {lang === 'hi' ? (yogaDasha.guidance_hi || yogaDasha.guidance_en) : yogaDasha.guidance_en}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { key:'yogas',  title:t(lang, 'Dasha Activated Yogas',  'दशा सक्रिय योग'),  rows:yogaDasha.yogas  || [], empty:t(lang, 'No yogas detected.',  'कोई योग नहीं मिला।')  },
              { key:'doshas', title:t(lang, 'Dasha Activated Doshas', 'दशा सक्रिय दोष'), rows:yogaDasha.doshas || [], empty:t(lang, 'No doshas detected.', 'कोई दोष नहीं मिला।') },
            ].map((group) => (
              <div key={group.key} className="rounded border border-gold/10 bg-white/3 p-4">
                <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">{group.title}</p>
                {group.rows.length === 0 ? (
                  <p className="text-ivory/30 text-xs">{group.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {group.rows.slice(0, 6).map((item, index) => {
                      const activeStyle = item.active ? ASSESSMENT_STYLE.positive : ASSESSMENT_STYLE.mixed;
                      return (
                        <div key={`${group.key}-${item.name}-${index}`} className="rounded border border-white/5 bg-[#0f1128]/55 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-ivory/75 text-xs font-semibold font-devanagari">{lang === 'hi' ? item.name_hi : item.name}</p>
                              <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
                                {item.activated_by?.length
                                  ? `${t(lang, 'Activated by', 'सक्रिय ग्रह')}: ${item.activated_by.map((p) => planetName(p, lang)).join(', ')}`
                                  : t(lang, 'Background natal promise', 'जन्म कुंडली का पृष्ठभूमि संकेत')}
                              </p>
                            </div>
                            <span className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                              style={{ background:activeStyle.bg, color:activeStyle.color, border:`1px solid ${activeStyle.border}` }}>
                              {item.active ? t(lang, 'Active', 'सक्रिय') : t(lang, 'Background', 'पृष्ठभूमि')}
                            </span>
                          </div>
                          <p className="text-ivory/55 text-xs leading-relaxed mt-2 font-devanagari">
                            {lang === 'hi' ? (item.timing_hi || item.timing_en) : item.timing_en}
                          </p>
                          {(item.trigger_en || item.trigger_hi) && (
                            <p className="text-ivory/32 text-[10px] leading-relaxed mt-2 font-devanagari">
                              {lang === 'hi' ? (item.trigger_hi || item.trigger_en) : item.trigger_en}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'timing' && (
        <div className="space-y-4">
          <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-ivory/70 text-xs leading-relaxed font-devanagari">
                {lang === 'hi' ? (eventTiming.methodology_hi || eventTiming.methodology_en) : eventTiming.methodology_en}
              </p>
              <span className="rounded border border-gold/15 px-2 py-1 text-gold/70 text-[10px] shrink-0">
                {t(lang, 'As of', 'तिथि')}: {eventTiming.as_of || '—'}
              </span>
            </div>
            {eventTiming.current_window && (
              <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
                <span className="rounded bg-gold/10 text-gold/75 px-2 py-1">
                  {t(lang, 'Maha', 'महा')}: {planetName(eventTiming.current_window.mahadasha?.lord, lang)} {eventTiming.current_window.mahadasha?.end || ''}
                </span>
                <span className="rounded bg-white/5 text-ivory/55 px-2 py-1">
                  {t(lang, 'Antar', 'अंतर')}: {planetName(eventTiming.current_window.antardasha?.lord, lang)} {eventTiming.current_window.antardasha?.end || ''}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(eventTiming.windows || []).map((window) => {
              const toneStyle = TIMING_STYLE[window.tone] || TIMING_STYLE.moderate;
              const triggers = lang === 'hi' ? (window.triggers_hi || window.triggers_en) : window.triggers_en;
              return (
                <div key={window.key} className="rounded border border-gold/10 bg-white/3 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-gold/85 text-xs font-semibold font-devanagari">
                      {lang === 'hi' ? (window.title_hi || window.title_en) : window.title_en}
                    </p>
                    <span className="rounded px-2 py-1 text-[9px] font-semibold shrink-0"
                      style={{ background:toneStyle.bg, color:toneStyle.color, border:`1px solid ${toneStyle.border}` }}>
                      {timingToneLabel(window.tone, lang)}
                    </span>
                  </div>
                  <p className="text-ivory/35 text-[10px] mb-2">
                    {window.date_from || '—'} → {window.date_to || '—'} · {t(lang, 'Score', 'स्कोर')}: {window.score}
                  </p>
                  <p className="text-ivory/62 text-xs leading-relaxed font-devanagari">
                    {lang === 'hi' ? (window.prediction_hi || window.prediction_en) : window.prediction_en}
                  </p>
                  {!!triggers?.length && (
                    <div className="mt-3 space-y-1">
                      {triggers.slice(0, 4).map((trigger, index) => (
                        <p key={index} className="text-ivory/38 text-[10px] leading-relaxed font-devanagari">{trigger}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!!eventTiming.upcoming_antardashas?.length && (
            <div className="rounded border border-gold/10 bg-[#111428]/55 p-4">
              <p className="text-gold/85 text-xs font-semibold mb-3 font-devanagari">
                {t(lang, 'Upcoming Antardasha Signals — Yoga + Dasha Forecast', 'आने वाली अंतर्दशा — योग + दशा पूर्वानुमान')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {eventTiming.upcoming_antardashas.map((period) => {
                  const pm          = PLANET_META[period.lord] || {};
                  const activeYogas  = (period.activated_yogas  || []).filter((y) => !y.is_cancelled);
                  const activeDoshas = period.activated_doshas  || [];
                  const topAreas     = (period.life_area_windows || []).filter((a) => a.score > 0).slice(0, 3);
                  return (
                    <div key={`${period.lord}-${period.start}`}
                      className="rounded border bg-white/3 p-3 flex flex-col gap-2.5"
                      style={{ borderColor: `${pm.color || '#D4AF37'}22` }}>
                      <div className="flex items-center gap-2 pb-1.5" style={{ borderBottom: `1px solid ${pm.color || '#D4AF37'}18` }}>
                        <span style={{ color: pm.color || '#D4AF37', fontSize:'1.1rem', lineHeight:1 }}>{pm.icon || '◎'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold font-devanagari leading-tight" style={{ color: pm.color || '#D4AF37' }}>
                            {planetName(period.lord, lang)} {t(lang, 'Antardasha', 'अंतर्दशा')}
                          </p>
                          <p className="text-ivory/30 text-[10px] leading-tight mt-0.5">{period.start} → {period.end}</p>
                        </div>
                      </div>
                      <p className="text-ivory/55 text-[10px] leading-relaxed font-devanagari">
                        {lang === 'hi' ? (period.focus_hi || period.focus_en) : period.focus_en}
                      </p>
                      {topAreas.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] text-ivory/30 uppercase tracking-wide">{t(lang, 'Life Areas', 'जीवन क्षेत्र')}</p>
                          {topAreas.map((area) => {
                            const ts = TIMING_STYLE[area.tone] || TIMING_STYLE.moderate;
                            return (
                              <div key={area.key} className="flex items-center gap-1.5 rounded px-2 py-1"
                                style={{ background: ts.bg, border: `1px solid ${ts.border}` }}>
                                <span className="text-[9px] font-semibold font-devanagari flex-1" style={{ color: ts.color }}>
                                  {lang === 'hi' ? (area.title_hi || area.title_en) : area.title_en}
                                </span>
                                <span className="text-[9px] font-bold flex-shrink-0" style={{ color: ts.color }}>
                                  {area.tone === 'favorable' ? '↑' : area.tone === 'caution' ? '⚠' : '~'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {activeYogas.length > 0 && (
                        <div>
                          <p className="text-[9px] text-gold/45 mb-1 font-devanagari">{t(lang, 'Yogas That Activate', 'सक्रिय होने वाले योग')}</p>
                          <div className="flex flex-wrap gap-1">
                            {activeYogas.map((y) => (
                              <span key={y.name} className="text-[9px] px-1.5 py-0.5 rounded font-devanagari"
                                style={{ background:'rgba(34,197,94,0.10)', color:'#22C55E', border:'1px solid rgba(34,197,94,0.22)' }}>
                                {lang === 'hi' ? y.name_hi : y.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeDoshas.length > 0 && (
                        <div>
                          <p className="text-[9px] text-saffron/45 mb-1 font-devanagari">{t(lang, 'Doshas to Watch', 'ध्यान देने योग्य दोष')}</p>
                          <div className="flex flex-wrap gap-1">
                            {activeDoshas.map((d) => (
                              <span key={d.name} className="text-[9px] px-1.5 py-0.5 rounded font-devanagari"
                                style={{ background:'rgba(245,158,11,0.10)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.22)' }}>
                                {lang === 'hi' ? d.name_hi : d.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(period.key_themes || []).length > 0 && (
                        <div>
                          <p className="text-[9px] text-ivory/30 mb-1">{t(lang, 'Key Themes', 'मुख्य विषय')}</p>
                          <ul className="space-y-0.5">
                            {period.key_themes.map((theme) => (
                              <li key={theme} className="text-[9px] text-ivory/50 flex items-start gap-1.5 font-devanagari">
                                <span className="text-gold/50 mt-0.5 flex-shrink-0">·</span><span>{theme}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(period.cautions || []).length > 0 && (
                        <div>
                          <p className="text-[9px] text-crimson/50 mb-1">{t(lang, 'Cautions', 'सावधानियां')}</p>
                          <ul className="space-y-0.5">
                            {period.cautions.map((c) => (
                              <li key={c} className="text-[9px] text-ivory/40 flex items-start gap-1.5 font-devanagari">
                                <span className="text-saffron/50 mt-0.5 flex-shrink-0">⚠</span><span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'matrix' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={headStyle}>{t(lang, 'Chart', 'चार्ट')}</th>
                  {planetOrder.map((planet) => (
                    <th key={planet} className={headStyle}>{lang === 'hi' ? planetName(planet, lang) : planet.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(matrix.rows || []).map((row) => (
                  <tr key={row.key} className="hover:bg-white/3">
                    <td className={`${cellStyle} text-gold/80 font-semibold font-devanagari`}>
                      {lang === 'hi' ? (row.label_hi || row.label_en) : row.label_en}
                    </td>
                    {planetOrder.map((planet) => (
                      <td key={`${row.key}-${planet}`} className={`${cellStyle} text-ivory/65 font-mono`}>
                        {row.values?.[planet] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-ivory/30 text-[10px] mt-3">
            {t(lang, 'Values are rashi numbers. Chalit uses equal-house bhav sign from Lagna degree.', 'मान राशि संख्या है। चलित में लग्न अंश से समान-भाव राशि ली गई है।')}
          </p>
        </div>
      )}

      {tab === 'details' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {[
                  t(lang, 'Planet', 'ग्रह'), t(lang, 'Degree', 'अंश'), t(lang, 'Retro', 'वक्री'),
                  t(lang, 'Normalized Degree', 'राशि अंश'), t(lang, 'House', 'भाव'),
                  t(lang, 'Zodiac Sign', 'राशि'), t(lang, 'Sign Lord', 'राशि स्वामी'),
                  t(lang, 'Nakshatra', 'नक्षत्र'), t(lang, 'Nakshatra Lord', 'नक्षत्र स्वामी'),
                  t(lang, 'Charan', 'चरण'), t(lang, 'Sub Lord', 'सब लॉर्ड'),
                  t(lang, 'Sub Sub Lord', 'सब-सब लॉर्ड'),
                ].map((head) => <th key={head} className={headStyle}>{head}</th>)}
                <th className={headStyle}>{t(lang, 'Positive/Negative', 'शुभ/अशुभ')}</th>
              </tr>
            </thead>
            <tbody>
              {planetRows.map((row) => (
                <tr key={row.planet} className="hover:bg-white/3">
                  <td className={`${cellStyle} text-gold/80 font-semibold font-devanagari`}>
                    {row.planet === 'Ascendant' ? t(lang, 'Ascendant', 'लग्न') : planetName(row.planet, lang)}
                  </td>
                  <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.degree}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{row.retrograde ? t(lang, 'Yes', 'हाँ') : t(lang, 'No', 'नहीं')}</td>
                  <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.normalized_degree}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{lang === 'hi' ? (row.house_label_hi || row.house_label_en) : row.house_label_en}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.zodiac_sign_hi : row.zodiac_sign}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sign_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.nakshatra_hi : row.nakshatra}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.nakshatra_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60`}>{row.charan}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_sub_lord, lang)}</td>
                  <td className={`${cellStyle} text-ivory/60 font-devanagari`}>
                    {row.assessment ? `${assessmentLabel(row.assessment, lang)} (${row.assessment_score ?? row.assessment.score})` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cusps' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {[
                    t(lang, 'Cusp', 'कस्प'), t(lang, 'Cusp Degree', 'कस्प अंश'),
                    t(lang, 'Zodiac Sign', 'राशि'), t(lang, 'Sign Lord', 'राशि स्वामी'),
                    t(lang, 'Nakshatra', 'नक्षत्र'), t(lang, 'Nakshatra Lord', 'नक्षत्र स्वामी'),
                    t(lang, 'Sub Lord', 'सब लॉर्ड'), t(lang, 'Sub Sub Lord', 'सब-सब लॉर्ड'),
                  ].map((head) => <th key={head} className={headStyle}>{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {cuspRows.map((row) => (
                  <tr key={row.cusp} className="hover:bg-white/3">
                    <td className={`${cellStyle} text-gold/80 font-semibold`}>{row.cusp}</td>
                    <td className={`${cellStyle} text-ivory/60 font-mono`}>{row.degree}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.zodiac_sign_hi : row.zodiac_sign}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sign_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{lang === 'hi' ? row.nakshatra_hi : row.nakshatra}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.nakshatra_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_lord, lang)}</td>
                    <td className={`${cellStyle} text-ivory/60 font-devanagari`}>{planetName(row.sub_sub_lord, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-ivory/30 text-[10px] mt-3">
            {t(lang, 'Cusp model: equal-house cusps from the exact Lahiri Lagna degree.', 'कस्प मॉडल: सटीक लाहिड़ी लग्न अंश से समान-भाव कस्प।')}
          </p>
        </div>
      )}
    </motion.div>
  );
}
