'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Combustion (Asta) & Retrogression (Vakri) analysis — Class 13 (BPHS, Saravali,
// Phaladeepika, Jataka Parijata). Data: profile.asta_vakri (kundli-admin.service).

const P_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि' };

function Badge({ children, color }) {
  return (
    <span style={{ fontSize:9.5, fontWeight:700, color, background:`${color}14`,
      border:`1px solid ${color}40`, borderRadius:10, padding:'2px 9px', whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
}

export default function AstaVakriPanel({ data, lang = 'en' }) {
  const [showRules, setShowRules] = useState(false);
  const T = (en, hi) => (lang === 'hi' ? hi : en);
  // Regional DB langs (seed 030): derive the base column from the _en name and
  // read the regional column with EN fallback. en/hi keep hi→en fallback.
  const REG = ['ta','te','bn','mr','pa','gu'].includes(lang);
  const pick = (r, en, hi) => {
    if (!r) return null;
    if (REG) { const base = en.replace(/_en$/, ''); return r[`${base}_${lang}`] || r[en]; }
    return lang === 'hi' ? (r[hi] || r[en]) : r[en];
  };
  const pickArr = (r, base) => {
    if (!r) return null;
    if (REG) return r[`${base}_${lang}`]?.length ? r[`${base}_${lang}`] : r[`${base}_en`];
    return lang === 'hi' ? (r[`${base}_hi`] || r[`${base}_en`]) : r[`${base}_en`];
  };
  if (!data || (!data.combust?.length && !data.retro?.length)) return null;

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🔥 {T('Combustion & Retrograde Analysis', 'अस्त एवं वक्री ग्रह विश्लेषण')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('A combust (Asta) planet loses its light to the Sun and weakens; a retrograde (Vakri) planet gains exaltation-like strength but expresses it in unusual, karmic ways (BPHS).',
           'अस्त ग्रह सूर्य के प्रकाश में अपनी दीप्ति खोकर निर्बल होता है; वक्री ग्रह उच्च-समान बल पाता है किंतु उसे असामान्य, कार्मिक रूप से व्यक्त करता है (BPHS)।')}
      </p>

      <div className="space-y-3">
        {/* Combust planets */}
        {(data.combust || []).map((c) => (
          <div key={`c-${c.planet}`} style={{ border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 14px', background:'rgba(239,68,68,0.04)' }}>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-ivory/90 text-xs font-bold font-devanagari">
                ☀️ {lang === 'hi' ? P_HI[c.planet] : c.planet} — {T('Combust', 'अस्त')} ({lang === 'hi' ? c.rashi_hi : c.rashi_en}, {T('House','भाव')} {c.house})
              </span>
              <Badge color={c.level === 'deep' ? '#EF4444' : '#F59E0B'}>
                {c.level === 'deep' ? T('DEEP COMBUSTION','गहरी अस्त') : T('MILD COMBUSTION','साधारण अस्त')}
              </Badge>
              {c.sun_distance != null && <Badge color="#60A5FA">{c.sun_distance}° {T('from Sun','सूर्य से')}</Badge>}
              {c.also_retrograde && <Badge color="#A78BFA">{T('ALSO RETROGRADE (rare)','वक्री भी (दुर्लभ)')}</Badge>}
            </div>
            {(pick(c.planet_effects, 'description_en', 'description_hi')) && (
              <p className="text-ivory/65 text-[10.5px] leading-relaxed font-devanagari mb-2">
                {pick(c.planet_effects, 'description_en', 'description_hi')}
              </p>
            )}
            {pickArr(c.planet_effects, 'effects')?.map((e, i) => (
              <p key={i} className="text-ivory/70 text-[10.5px] leading-relaxed font-devanagari">▸ {e}</p>
            ))}
            {c.planet_effects?.extra_data?.exception_en && (
              <p className="text-[10px] leading-relaxed font-devanagari mt-2" style={{ color:'#22C55E' }}>
                ✓ {T('Exception','अपवाद')}: {lang === 'hi' ? (c.planet_effects.extra_data.exception_hi || c.planet_effects.extra_data.exception_en) : c.planet_effects.extra_data.exception_en}
              </p>
            )}
            {pick(c.house_effect, 'description_en', 'description_hi') && (
              <p className="text-[10px] leading-relaxed font-devanagari mt-2" style={{ color:'#F59E0B' }}>
                🏠 {T(`In house ${c.house}`, `भाव ${c.house} में`)}: {pick(c.house_effect, 'description_en', 'description_hi')}
              </p>
            )}
            {c.remedy && (
              <p className="text-[10px] font-devanagari mt-2" style={{ color:'#A78BFA' }}>
                🕉 {c.remedy.mantra} · {lang === 'hi' ? c.remedy.daan_hi : c.remedy.daan_en} · {c.remedy.yantra} · 💎 {c.remedy.gemstone}
              </p>
            )}
          </div>
        ))}

        {/* Retrograde planets */}
        {(data.retro || []).map((r) => (
          <div key={`r-${r.planet}`} style={{ border:'1px solid rgba(167,139,250,0.25)', borderRadius:10, padding:'12px 14px', background:'rgba(167,139,250,0.04)' }}>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-ivory/90 text-xs font-bold font-devanagari">
                ↺ {lang === 'hi' ? P_HI[r.planet] : r.planet} — {T('Retrograde', 'वक्री')} ({lang === 'hi' ? r.rashi_hi : r.rashi_en}, {T('House','भाव')} {r.house})
              </span>
              <Badge color="#A78BFA">{r.is_benefic ? T('BENEFIC — ENHANCED RESULTS','शुभ — उन्नत फल') : T('MALEFIC — INTENSIFIED','अशुभ — तीव्र')}</Badge>
              {r.is_debilitated && <Badge color="#22C55E">{T('VAKRI NEECHABHANGA — debility cancelled','वक्री नीचभंग — नीच रद्द')}</Badge>}
              {r.is_exalted && <Badge color="#D4AF37">{T('VAKRI UCHCHA — doubly powerful','वक्री उच्च — दोगुना बलवान')}</Badge>}
            </div>
            <p className="text-ivory/60 text-[10.5px] leading-relaxed font-devanagari mb-1.5">
              {T('Per BPHS this planet gains exaltation-level strength — its results are powerful but arrive in unusual, internal or delayed ways, often tied to past-life karma.',
                 'BPHS के अनुसार यह ग्रह उच्च-स्तरीय बल पाता है — फल शक्तिशाली किंतु असामान्य, आंतरिक या विलंबित रूप से, प्रायः पूर्वजन्म कर्म से जुड़े।')}
            </p>
            {pick(r.house_effect, 'description_en', 'description_hi') && (
              <p className="text-[10px] leading-relaxed font-devanagari" style={{ color:'#A78BFA' }}>
                🏠 {T(`In house ${r.house}`, `भाव ${r.house} में`)}: {pick(r.house_effect, 'description_en', 'description_hi')}
              </p>
            )}
            {r.remedy && (
              <p className="text-[10px] font-devanagari mt-2" style={{ color:'rgba(245,240,232,0.5)' }}>
                🕉 {r.remedy.mantra} · {lang === 'hi' ? r.remedy.daan_hi : r.remedy.daan_en}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Special remedies */}
      {(data.special_remedies || []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {data.special_remedies.map((sr) => (
            <div key={sr.item_key} style={{ background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, padding:'9px 11px' }}>
              <p style={{ color:'#22C55E', fontSize:10, fontWeight:700, marginBottom:4 }} className="font-devanagari">
                {pick(sr, 'title_en', 'title_hi')}
              </p>
              {pickArr(sr, 'effects')?.map((e, i) => (
                <p key={i} className="text-ivory/60 text-[9.5px] leading-relaxed font-devanagari">• {e}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Classical rules + misconceptions (collapsible) */}
      <button onClick={() => setShowRules(!showRules)}
        style={{ marginTop:12, background:'transparent', border:'none', color:'#A78BFA', fontSize:11, fontWeight:700, cursor:'pointer', padding:0 }}>
        📖 {T('Classical Rules & Misconceptions (BPHS · Saravali · Phaladeepika · Jataka Parijata)','शास्त्रीय नियम एवं भ्रांतियां')} {showRules ? '▲' : '▼'}
      </button>
      {showRules && (
        <div className="space-y-2 mt-2">
          {(data.rules || []).map((r) => (
            <div key={r.item_key} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'8px 11px' }}>
              <p style={{ color:'#D4AF37', fontSize:10.5, fontWeight:700, marginBottom:3 }} className="font-devanagari">
                {pick(r, 'title_en', 'title_hi')}
              </p>
              <p className="text-ivory/62 text-[10px] leading-relaxed font-devanagari">
                {pick(r, 'description_en', 'description_hi')}
              </p>
              {r.source && <p className="text-ivory/30 text-[8.5px] italic mt-1">— {r.source}</p>}
            </div>
          ))}
          {(data.misconceptions || []).map((m) => (
            <div key={m.item_key} style={{ background:'rgba(239,68,68,0.03)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'8px 11px' }}>
              <p style={{ color:'#EF4444', fontSize:10.5, fontWeight:700, marginBottom:3 }} className="font-devanagari">
                ✕ {pick(m, 'title_en', 'title_hi')}
              </p>
              <p className="text-ivory/62 text-[10px] leading-relaxed font-devanagari">
                {pick(m, 'description_en', 'description_hi')}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
