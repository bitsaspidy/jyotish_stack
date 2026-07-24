'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarField from '../components/StarField';
import { useLang } from '../context/LangContext';
import { t as translate } from '../lib/astroI18n';
import {
  BRAND_NAME, TRADEMARK_SYMBOL, LEGAL_ENTITY, LEGAL_PROPRIETOR,
  TRADEMARK_APP_NO, TRADEMARK_CLASS,
} from '../lib/brand';

const GOLD = '#D4AF37';
const IVORY = '#F5F0E8';
const MUTED = 'rgba(245,240,232,0.6)';

// Everything here is honest: it describes what the platform actually does and the
// method behind it. No invented team, user counts, founding date or credentials.
export default function AboutUs() {
  const { lang } = useLang();
  const t = (en, hi) => translate(lang, en, hi);

  const offerings = [
    ['🔯', t('Kundli & Charts', 'कुंडली एवं चार्ट'), t('A full birth chart — lagna, navamsa and the divisional charts — with dashas and yogas, calculated from your exact birth time and place.', 'आपके सटीक जन्म समय व स्थान से गणना — लग्न, नवांश एवं वर्ग कुंडलियाँ, दशा और योग सहित।')],
    ['💑', t('Matchmaking', 'विवाह मिलान'), t('Ashtakoot Guna Milan and Mangal Dosha analysis for two charts, read together rather than as a single score.', 'दो कुंडलियों का अष्टकूट गुण मिलान एवं मंगल दोष विश्लेषण — केवल अंक नहीं, समग्र दृष्टि।')],
    ['📅', t('Panchang & Muhurat', 'पंचांग एवं मुहूर्त'), t('Daily panchang and auspicious timings for marriage, griha pravesh, naamkaran and more.', 'दैनिक पंचांग एवं विवाह, गृह प्रवेश, नामकरण आदि हेतु शुभ मुहूर्त।')],
    ['🌌', t('Planetary Positions', 'ग्रह स्थिति'), t('Live sidereal positions of every graha for any place, day and time — nakshatra, sub-lord, speed, and the ascendant.', 'किसी भी स्थान, दिन व समय हेतु सभी ग्रहों की निरयन स्थिति — नक्षत्र, उप-स्वामी, गति एवं लग्न।')],
    ['📿', t('Remedies', 'उपाय'), t('Classical, grounded remedies tied to what a chart actually shows — never fear, never pressure.', 'कुंडली जो वास्तव में दर्शाती है, उससे जुड़े शास्त्रीय उपाय — कभी भय नहीं, कभी दबाव नहीं।')],
    ['🪔', t('Horoscopes', 'राशिफल'), t('Daily, weekly, monthly and yearly horoscopes for all twelve signs, in eight languages.', 'सभी बारह राशियों हेतु दैनिक, साप्ताहिक, मासिक एवं वार्षिक राशिफल — आठ भाषाओं में।')],
  ];

  const values = [
    [t('Accurate by calculation', 'गणना से सटीक'),
     t('Positions are computed from a precise astronomical engine on the sidereal (Lahiri) zodiac — the same mathematics an ephemeris uses, not a lookup table. What we show is what the sky actually holds.', 'स्थिति एक सटीक खगोलीय इंजन से निरयन (लाहिरी) राशिचक्र पर गणना की जाती है — किसी सूची से नहीं। जो हम दिखाते हैं वही आकाश में वास्तव में है।')],
    [t('Honest about what is known', 'जो ज्ञात है उसमें ईमानदार'),
     t('A public sky is not a private prediction. Where a reading needs your birth chart, we say so; where something cannot be known, we do not invent it.', 'सार्वजनिक आकाश व्यक्तिगत भविष्यवाणी नहीं है। जहाँ फल हेतु आपकी कुंडली चाहिए, हम कहते हैं; जो ज्ञात नहीं, उसे गढ़ते नहीं।')],
    [t('Tradition, carried carefully', 'परंपरा, सावधानी से'),
     t('Classical Jyotish — Parashari principles, nakshatras, dashas, yogas — expressed through modern technology, so the tradition reaches you clearly rather than diluted.', 'शास्त्रीय ज्योतिष — पराशरी सिद्धांत, नक्षत्र, दशा, योग — आधुनिक तकनीक द्वारा, ताकि परंपरा आप तक स्पष्ट पहुँचे।')],
  ];

  return (
    <div className="min-h-screen relative" style={{ background:'linear-gradient(180deg, #0B0E23 0%, #141838 100%)' }}>
      <StarField />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-gold/25 bg-gold/5 rounded-full px-4 py-1.5 mb-5">
            <span style={{ color:'rgba(212,175,55,0.7)', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:600 }}>
              {t('About Us', 'हमारे बारे में')}
            </span>
          </div>
          <h1 className="font-serif" style={{ color:GOLD, fontSize:34, fontWeight:800, lineHeight:1.25 }}>
            {BRAND_NAME}<sup style={{ fontSize:'0.4em', fontWeight:400, verticalAlign:'super', marginLeft:1 }}>{TRADEMARK_SYMBOL}</sup>
          </h1>
          <p className="font-devanagari" style={{ color:MUTED, fontSize:14, marginTop:6, letterSpacing:'0.06em' }}>ज्योतिष स्टैक</p>
          <p style={{ color:IVORY, opacity:0.8, fontSize:16, lineHeight:1.8, maxWidth:620, margin:'18px auto 0' }}>
            {t('The confluence of classical Vedic astrology and modern technology — precise calculation in service of a tradition thousands of years old.',
               'प्राचीन वैदिक ज्योतिष और आधुनिक तकनीक का संगम — हज़ारों वर्ष पुरानी परंपरा की सेवा में सटीक गणना।')}
          </p>
        </motion.div>

        {/* Mission */}
        <section className="card-royal p-6 mb-10">
          <h2 className="font-serif" style={{ color:GOLD, fontSize:20, fontWeight:700, marginBottom:10 }}>
            {t('What we set out to do', 'हमारा उद्देश्य')}
          </h2>
          <p style={{ color:'rgba(245,240,232,0.78)', fontSize:14.5, lineHeight:1.9 }}>
            {t('Jyotish has always been a discipline of careful observation — of the sky, of time, of the moment a life begins. Too much of what is offered online reduces it to vague, frightening one-liners. We built this platform to do the opposite: to compute a chart correctly, read it with restraint, and hand you the reasoning rather than a verdict. Ancient method, modern precision, plain honesty.',
               'ज्योतिष सदैव सूक्ष्म अवलोकन का शास्त्र रहा है — आकाश का, समय का, जीवन के आरंभ के क्षण का। ऑनलाइन उपलब्ध बहुत-सी सामग्री इसे अस्पष्ट, भयभीत करने वाली पंक्तियों में समेट देती है। हमने यह मंच इसके विपरीत बनाया: कुंडली की सही गणना, संयम से व्याख्या, और निर्णय के बजाय तर्क। प्राचीन पद्धति, आधुनिक सटीकता, सरल ईमानदारी।')}
          </p>
        </section>

        {/* Offerings */}
        <h2 className="font-serif text-center" style={{ color:GOLD, fontSize:22, fontWeight:700, marginBottom:6 }}>
          {t('What you can do here', 'यहाँ आप क्या कर सकते हैं')}
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap:14, marginTop:18, marginBottom:40 }}>
          {offerings.map(([icon, title, body]) => (
            <div key={title} className="card-royal p-5">
              <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
              <h3 style={{ color:IVORY, fontSize:15, fontWeight:700, marginBottom:6 }}>{title}</h3>
              <p style={{ color:MUTED, fontSize:12.5, lineHeight:1.75 }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <h2 className="font-serif text-center" style={{ color:GOLD, fontSize:22, fontWeight:700, marginBottom:18 }}>
          {t('How we work', 'हम कैसे कार्य करते हैं')}
        </h2>
        <div style={{ display:'grid', gap:12, marginBottom:40 }}>
          {values.map(([title, body], i) => (
            <div key={i} className="card-royal p-5" style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <span style={{ color:GOLD, fontSize:22, fontFamily:'Georgia,serif', fontWeight:700, lineHeight:1 }}>{i + 1}</span>
              <div>
                <h3 style={{ color:IVORY, fontSize:15, fontWeight:700, marginBottom:5 }}>{title}</h3>
                <p style={{ color:'rgba(245,240,232,0.72)', fontSize:13, lineHeight:1.8 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Who runs it — the honest legal facts, nothing invented */}
        <section className="card-royal p-6 mb-10" style={{ border:'1px solid rgba(212,175,55,0.25)' }}>
          <h2 className="font-serif" style={{ color:GOLD, fontSize:20, fontWeight:700, marginBottom:10 }}>
            {t('Who runs Jyotish Stack', 'ज्योतिष स्टैक कौन चलाता है')}
          </h2>
          <p style={{ color:'rgba(245,240,232,0.78)', fontSize:14, lineHeight:1.85 }}>
            {t(`${BRAND_NAME} is a product of ${LEGAL_ENTITY}, a proprietorship of ${LEGAL_PROPRIETOR}, based in India.`,
               `${BRAND_NAME}, ${LEGAL_ENTITY} का एक उत्पाद है — जिसके स्वामी ${LEGAL_PROPRIETOR} हैं, भारत में स्थित।`)}
          </p>
          <p style={{ color:MUTED, fontSize:12, lineHeight:1.8, marginTop:10 }}>
            {t(`“${BRAND_NAME}” and the Jyot Chakra logo are trade marks of ${LEGAL_ENTITY} (TM Application No. ${TRADEMARK_APP_NO}, Class ${TRADEMARK_CLASS} — pending).`,
               `“${BRAND_NAME}” एवं ज्योत चक्र लोगो, ${LEGAL_ENTITY} के ट्रेड मार्क हैं (TM आवेदन क्रमांक ${TRADEMARK_APP_NO}, वर्ग ${TRADEMARK_CLASS} — विचाराधीन)।`)}
          </p>
        </section>

        {/* Disclaimer note */}
        <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11.5, lineHeight:1.75, textAlign:'center', marginBottom:32, maxWidth:600, marginInline:'auto' }}>
          {t('Astrology is offered here for guidance and reflection, not as a substitute for professional, medical, legal or financial advice. See our ',
             'ज्योतिष यहाँ मार्गदर्शन एवं चिंतन हेतु है, किसी पेशेवर, चिकित्सा, विधिक या वित्तीय सलाह का विकल्प नहीं। देखें हमारा ')}
          <Link href="/disclaimer" style={{ color:GOLD, textDecoration:'underline', textUnderlineOffset:2 }}>
            {t('Disclaimer', 'अस्वीकरण')}
          </Link>.
        </p>

        {/* CTA */}
        <div className="card-royal p-6 text-center" style={{ border:'1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ color:GOLD, fontSize:17, fontWeight:700, marginBottom:8 }}>
            {t('Begin with your own chart', 'अपनी कुंडली से आरंभ करें')}
          </p>
          <p style={{ color:MUTED, fontSize:13, lineHeight:1.7, marginBottom:16, maxWidth:460, marginInline:'auto' }}>
            {t('Generate a free, accurate kundli in minutes — then explore the panchang, transits and remedies drawn from it.',
               'मिनटों में एक निःशुल्क, सटीक कुंडली बनाएँ — फिर उससे जुड़े पंचांग, गोचर एवं उपाय देखें।')}
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            <Link href="/free-kundli" className="btn-gold" style={{ fontSize:13, padding:'10px 22px', borderRadius:10, textDecoration:'none' }}>
              {t('🔯 Free Kundli', '🔯 निःशुल्क कुंडली')}
            </Link>
            <Link href="/planetary-positions" style={{ fontSize:13, padding:'10px 22px', borderRadius:10, textDecoration:'none', border:`1px solid ${GOLD}66`, color:GOLD, fontWeight:600 }}>
              {t('🌌 Planetary Positions', '🌌 ग्रह स्थिति')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
