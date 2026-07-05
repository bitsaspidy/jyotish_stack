'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import api from '../lib/api';

const GOLD  = '#D4AF37';
const AMBER = '#F59E0B';
const MUTED = 'rgba(245,240,232,0.55)';
const IVORY = '#EFE9D8';

// Classical graha shanti remedies (same data used in daily horoscope remedies)
const PLANET_REMEDIES = [
  { key:'Sun',     icon:'☉', color:'#F59E0B', en:'Sun (Surya)',      hi:'सूर्य',
    mantra:'Om Suryaya Namah (108×)', mantra_hi:'ॐ सूर्याय नमः (108 बार)',
    gem:'Ruby', gem_hi:'माणिक', day:'Sunday', day_hi:'रविवार', metal:'Copper / Gold', color_en:'Red, Orange', color_hi:'लाल, नारंगी',
    upaya_en:'Offer water to the rising Sun, donate wheat or jaggery on Sundays, respect your father and authority figures.',
    upaya_hi:'सूर्योदय पर जल अर्पित करें, रविवार को गेहूं या गुड़ दान करें, पिता और वरिष्ठों का सम्मान करें।' },
  { key:'Moon',    icon:'☽', color:'#94A3B8', en:'Moon (Chandra)',   hi:'चन्द्र',
    mantra:'Om Chandraya Namah (108×)', mantra_hi:'ॐ चंद्राय नमः (108 बार)',
    gem:'Pearl', gem_hi:'मोती', day:'Monday', day_hi:'सोमवार', metal:'Silver', color_en:'White, Silver', color_hi:'सफेद, चांदी',
    upaya_en:'Offer milk to Lord Shiva on Mondays, donate rice or milk, spend time near water, care for your mother.',
    upaya_hi:'सोमवार को शिवजी को दूध अर्पित करें, चावल या दूध दान करें, माता की सेवा करें।' },
  { key:'Mars',    icon:'♂', color:'#EF4444', en:'Mars (Mangal)',    hi:'मंगल',
    mantra:'Om Mangalaya Namah (108×)', mantra_hi:'ॐ मंगलाय नमः (108 बार)',
    gem:'Red Coral', gem_hi:'मूंगा', day:'Tuesday', day_hi:'मंगलवार', metal:'Copper', color_en:'Red', color_hi:'लाल',
    upaya_en:'Recite Hanuman Chalisa on Tuesdays, donate red lentils (masoor), avoid anger and impulsive conflict.',
    upaya_hi:'मंगलवार को हनुमान चालीसा पढ़ें, मसूर दाल दान करें, क्रोध से बचें।' },
  { key:'Mercury', icon:'☿', color:'#10B981', en:'Mercury (Budh)',   hi:'बुध',
    mantra:'Om Budhaya Namah (108×)', mantra_hi:'ॐ बुधाय नमः (108 बार)',
    gem:'Emerald', gem_hi:'पन्ना', day:'Wednesday', day_hi:'बुधवार', metal:'Bronze', color_en:'Green', color_hi:'हरा',
    upaya_en:'Feed green fodder to cows, donate green moong on Wednesdays, practice honest clear speech, worship Lord Vishnu.',
    upaya_hi:'गाय को हरा चारा खिलाएं, बुधवार को हरी मूंग दान करें, विष्णु पूजा करें।' },
  { key:'Jupiter', icon:'♃', color:'#FBBF24', en:'Jupiter (Guru)',   hi:'बृहस्पति',
    mantra:'Om Gurave Namah (108×)', mantra_hi:'ॐ गुरवे नमः (108 बार)',
    gem:'Yellow Sapphire', gem_hi:'पुखराज', day:'Thursday', day_hi:'गुरुवार', metal:'Gold', color_en:'Yellow', color_hi:'पीला',
    upaya_en:'Donate yellow sweets, turmeric or books to teachers on Thursdays; respect gurus and elders; recite Vishnu Sahasranama.',
    upaya_hi:'गुरुवार को पीली मिठाई, हल्दी या पुस्तकें दान करें; गुरुजनों का सम्मान करें; विष्णु सहस्रनाम पढ़ें।' },
  { key:'Venus',   icon:'♀', color:'#F472B6', en:'Venus (Shukra)',   hi:'शुक्र',
    mantra:'Om Shukraya Namah (108×)', mantra_hi:'ॐ शुक्राय नमः (108 बार)',
    gem:'Diamond / White Sapphire', gem_hi:'हीरा / सफेद पुखराज', day:'Friday', day_hi:'शुक्रवार', metal:'Silver', color_en:'White, Pink', color_hi:'सफेद, गुलाबी',
    upaya_en:'Worship Goddess Lakshmi on Fridays, donate white clothes or curd, maintain cleanliness and harmony at home.',
    upaya_hi:'शुक्रवार को लक्ष्मी पूजा करें, सफेद वस्त्र या दही दान करें, घर में स्वच्छता रखें।' },
  { key:'Saturn',  icon:'♄', color:'#818CF8', en:'Saturn (Shani)',   hi:'शनि',
    mantra:'Om Shanaye Namah (108×)', mantra_hi:'ॐ शनये नमः (108 बार)',
    gem:'Blue Sapphire (test first)', gem_hi:'नीलम (परीक्षण के बाद)', day:'Saturday', day_hi:'शनिवार', metal:'Iron', color_en:'Blue, Black', color_hi:'नीला, काला',
    upaya_en:'Light a mustard-oil lamp under a Peepal tree on Saturdays, donate black sesame or iron, serve the elderly and workers.',
    upaya_hi:'शनिवार को पीपल के नीचे सरसों के तेल का दीपक जलाएं, काले तिल या लोहा दान करें, बुजुर्गों और श्रमिकों की सेवा करें।' },
  { key:'Rahu',    icon:'☊', color:'#A78BFA', en:'Rahu',             hi:'राहु',
    mantra:'Om Rahave Namah (108×)', mantra_hi:'ॐ राहवे नमः (108 बार)',
    gem:'Hessonite (Gomed)', gem_hi:'गोमेद', day:'Saturday', day_hi:'शनिवार', metal:'Lead / Mixed metal', color_en:'Smoky Grey', color_hi:'धूम्र वर्ण',
    upaya_en:'Worship Goddess Durga, donate blankets to the needy, avoid intoxicants and speculative greed, feed street dogs.',
    upaya_hi:'दुर्गा पूजा करें, जरूरतमंदों को कंबल दान करें, नशे और लालच से बचें।' },
  { key:'Ketu',    icon:'☋', color:'#6B7280', en:'Ketu',             hi:'केतु',
    mantra:'Om Ketave Namah (108×)', mantra_hi:'ॐ केतवे नमः (108 बार)',
    gem:"Cat's Eye (Lehsunia)", gem_hi:'लहसुनिया', day:'Tuesday', day_hi:'मंगलवार', metal:'Mixed metal', color_en:'Brown-Grey', color_hi:'भूरा-धूसर',
    upaya_en:'Worship Lord Ganesha, donate multi-coloured blankets, maintain spiritual practice and meditation, feed stray animals.',
    upaya_hi:'गणेश पूजा करें, कंबल दान करें, ध्यान-साधना बनाए रखें।' },
];

export default function RemediesShowcase() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const t = (en, h) => translate(lang, en, h);

  const [mantras, setMantras] = useState([]);

  useEffect(() => {
    api.get('/public/mantras')
      .then(({ data }) => setMantras(data.mantras || []))
      .catch(() => setMantras([]));
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-8">
          <h1 className="font-serif text-gold" style={{ fontSize:30, fontWeight:800 }}>
            📿 {t('Vedic Remedies (Upay)', 'वैदिक उपाय')}
          </h1>
          <p style={{ color:MUTED, fontSize:13, marginTop:8, maxWidth:620, margin:'8px auto 0', lineHeight:1.7 }}>
            {t('Classical graha shanti remedies — mantra, gemstone, charity and conduct for each of the nine planets. Free general guidance below; your personalised remedy plan comes from your own kundli.',
               'शास्त्रीय ग्रह शांति उपाय — नवग्रहों के मंत्र, रत्न, दान और आचरण। नीचे निःशुल्क सामान्य मार्गदर्शन; आपकी व्यक्तिगत उपाय योजना आपकी कुंडली से बनती है।')}
          </p>
        </motion.div>

        {/* Personalised upsell — top */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card-royal p-5 mb-8"
          style={{ border:'1px solid rgba(245,158,11,0.35)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:30 }}>🪔</span>
            <div style={{ flex:1, minWidth:220 }}>
              <p style={{ fontSize:14, fontWeight:800, color:AMBER }}>
                {t('Generic remedies help. Personalised remedies transform.', 'सामान्य उपाय सहायक हैं। व्यक्तिगत उपाय परिवर्तनकारी हैं।')}
              </p>
              <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginTop:4 }}>
                {t('Your kundli reveals WHICH planet troubles you, WHY, and the exact mantra, dana and sadhana for it — with dasha-specific timing. Get your complete remedy booklet prepared from your birth chart.',
                   'आपकी कुंडली बताती है कि कौन-सा ग्रह कष्ट दे रहा है, क्यों, और उसका सटीक मंत्र, दान और साधना — दशा-अनुसार समय के साथ। अपनी जन्म कुंडली से तैयार पूर्ण उपाय पुस्तिका पाएं।')}
              </p>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Link href="/remedy" className="btn-gold" style={{ fontSize:12, fontWeight:700, padding:'10px 18px', borderRadius:10, textDecoration:'none' }}>
                {t('📿 Get My Remedy Booklet — ₹250', '📿 मेरी उपाय पुस्तिका — ₹250')}
              </Link>
              <Link href="/free-kundli" style={{ fontSize:12, padding:'10px 18px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
                {t('🔯 Free Dosha Scan', '🔯 निःशुल्क दोष स्कैन')}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* 9 planet cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
          {PLANET_REMEDIES.map((p, i) => (
            <motion.div key={p.key} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
              className="card-royal p-5">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:24, color:p.color }}>{p.icon}</span>
                <p style={{ fontSize:15, fontWeight:800, color:p.color }}>{hi ? p.hi : p.en}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:7, fontSize:12 }}>
                <p><span style={{ color:MUTED }}>{t('Mantra', 'मंत्र')}: </span>
                  <span style={{ color:GOLD, fontFamily:'var(--font-devanagari),sans-serif' }}>{hi ? p.mantra_hi : p.mantra}</span></p>
                <p><span style={{ color:MUTED }}>{t('Gemstone', 'रत्न')}: </span><span style={{ color:IVORY }}>{hi ? p.gem_hi : p.gem}</span></p>
                <p><span style={{ color:MUTED }}>{t('Day', 'वार')}: </span><span style={{ color:IVORY }}>{hi ? p.day_hi : p.day}</span>
                   <span style={{ color:MUTED, marginLeft:10 }}>{t('Colour', 'रंग')}: </span><span style={{ color:IVORY }}>{hi ? p.color_hi : p.color_en}</span></p>
                <p style={{ color:MUTED, lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>
                  {hi ? p.upaya_hi : p.upaya_en}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mantra library (DB-driven; hidden when empty) */}
        {mantras.length > 0 && (
          <div style={{ marginTop:28 }}>
            <p className="font-serif text-gold" style={{ fontSize:20, fontWeight:800, marginBottom:14 }}>
              🕉️ {t('Sacred Mantras', 'पवित्र मंत्र')}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
              {mantras.map((m) => (
                <div key={m.id} className="card-royal p-5">
                  <p style={{ fontSize:14, fontWeight:800, color:GOLD, fontFamily:'var(--font-devanagari),sans-serif' }}>
                    {hi ? (m.name_hi || m.name_en) : (m.name_en || m.name_hi)}
                  </p>
                  {m.mantra_text_sanskrit && (
                    <p style={{ fontSize:13, color:IVORY, lineHeight:1.9, margin:'10px 0', fontFamily:'var(--font-devanagari),sans-serif' }}>
                      {m.mantra_text_sanskrit}
                    </p>
                  )}
                  <p style={{ fontSize:11, color:MUTED, lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>
                    {hi ? (m.benefits_hi || m.benefits_en) : (m.benefits_en || m.benefits_hi)}
                  </p>
                  {m.jap_count && (
                    <p style={{ fontSize:10, color:AMBER, marginTop:8 }}>
                      {t('Jap count', 'जप संख्या')}: {m.jap_count}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer + bottom CTA */}
        <p style={{ fontSize:10, color:'rgba(245,240,232,0.35)', textAlign:'center', marginTop:28, lineHeight:1.7 }}>
          {t('Remedies are traditional spiritual guidance, not a substitute for medical, legal or financial advice. Gemstones should be worn only after proper chart analysis.',
             'उपाय पारंपरिक आध्यात्मिक मार्गदर्शन हैं — चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं। रत्न उचित कुंडली विश्लेषण के बाद ही धारण करें।')}
        </p>
      </div>
    </div>
  );
}
