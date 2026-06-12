'use client';
import { motion } from 'framer-motion';

// Avakahada Chakra — the classical at-a-glance birth summary table found at the
// start of every traditional kundli. Pure presentation: composes existing
// chart.astro_details + chart.panchang + chart.nakshatra fields.

const P_HI = { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' };
const YONI_HI = { horse:'अश्व', elephant:'गज', sheep:'मेष', serpent:'सर्प', dog:'श्वान', cat:'मार्जार', rat:'मूषक', cow:'गौ', buffalo:'महिष', tiger:'व्याघ्र', deer:'मृग', monkey:'वानर', mongoose:'नकुल', lion:'सिंह' };

const cap = (s) => (typeof s === 'string' && s ? s[0].toUpperCase() + s.slice(1) : s);

export default function AvakahadaPanel({ chart, lang = 'en' }) {
  const T = (en, hi) => (lang === 'hi' ? hi : en);
  const ad = chart?.astro_details;
  if (!ad) return null;
  const nak = chart?.nakshatra || {};
  const pan = chart?.panchang || {};
  const hiOf = (obj, enKey = 'name', hiKey = 'name_hi') => (obj ? (obj[hiKey] || cap(obj[enKey])) : null);

  // [label_en, label_hi, value_en, value_hi]
  const ROWS = [
    ['Rashi (Moon Sign)', 'राशि',          ad.moon_sign_en, ad.moon_sign_hi],
    ['Rashi Swami', 'राशि स्वामी',          ad.moon_sign_lord, P_HI[ad.moon_sign_lord]],
    ['Lagna', 'लग्न',                       ad.ascendant_rashi_en, ad.ascendant_rashi_hi],
    ['Lagna Swami', 'लग्न स्वामी',          ad.ascendant_lord, P_HI[ad.ascendant_lord]],
    ['Nakshatra-Charan', 'नक्षत्र-चरण',     `${ad.moon_nakshatra_en || nak.en || ''} — ${ad.moon_pada || nak.pada || ''}`, `${ad.moon_nakshatra_hi || nak.hi || ''} — ${ad.moon_pada || nak.pada || ''}`],
    ['Nakshatra Swami', 'नक्षत्र स्वामी',   ad.moon_nakshatra_lord, P_HI[ad.moon_nakshatra_lord]],
    ['Varna', 'वर्ण',                       cap(ad.varna?.name), hiOf(ad.varna)],
    ['Vashya', 'वश्य',                      cap(ad.vashya?.name), hiOf(ad.vashya)],
    ['Yoni', 'योनि',                        cap(ad.yoni?.name), ad.yoni?.name_hi || YONI_HI[(ad.yoni?.name || '').toLowerCase()] || cap(ad.yoni?.name)],
    ['Gana', 'गण',                          cap(ad.gana?.name), hiOf(ad.gana)],
    ['Nadi', 'नाड़ी',                       cap(ad.nadi?.name), hiOf(ad.nadi)],
    ['Tatva', 'तत्व',                       ad.tatva?.en, ad.tatva?.hi],
    ['Yunja', 'युंजा',                      ad.yunja?.yunja, ad.yunja?.yunja_hi || ad.yunja?.yunja],
    ['Paya', 'पाया',                        ad.paya?.paya, ad.paya?.paya_hi || ad.paya?.paya],
    ['Naam Akshar', 'नामाक्षर',             ad.naam_akshar, ad.naam_akshar],
    ['Nakshatra Deity', 'नक्षत्र देवता',    nak.deity_en, nak.deity_hi],
    ['Tithi', 'तिथि',                       ad.tithi?.display_en || pan.tithi?.display_en, ad.tithi?.display_hi || pan.tithi?.display_hi],
    ['Vara', 'वार',                         pan.vara?.day_en, pan.vara?.day_hi],
    ['Yoga', 'योग',                         ad.yoga?.name || pan.yoga?.name, ad.yoga?.name || pan.yoga?.name],
    ['Karana', 'करण',                       ad.karana?.name || pan.karana?.name, ad.karana?.name || pan.karana?.name],
    ['Masa', 'मास',                         pan.masa?.name, pan.masa?.name_hi],
  ].filter((r) => r[2] !== undefined && r[2] !== null && r[2] !== '');

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      className="card-royal p-5 mt-6">
      <h2 className="font-serif text-gold text-sm font-semibold mb-1">
        🕉 {T('Avakahada Chakra', 'अवकहड़ा चक्र')}
      </h2>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T('The classical at-a-glance summary of your birth — the first table of every traditional kundli.',
           'आपके जन्म का शास्त्रीय सार-चक्र — हर पारंपरिक कुंडली की पहली तालिका।')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ border:'1px solid rgba(212,175,55,0.30)', borderRadius:10, overflow:'hidden' }}>
        {ROWS.map(([len, lhi, ven, vhi], i) => (
          <div key={len} className="flex items-center justify-between gap-2 px-3.5 py-2"
            style={{ background: i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(212,175,55,0.05)',
                     borderBottom:'1px solid rgba(212,175,55,0.12)' }}>
            <span className="text-ivory/55 text-[11px] font-devanagari">{T(len, lhi)}</span>
            <span className="text-ivory/90 text-[11.5px] font-semibold font-devanagari text-right">
              {lang === 'hi' ? (vhi ?? ven) : ven}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
