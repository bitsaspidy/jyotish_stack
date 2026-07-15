'use strict';
/**
 * Knowledge store seed data (Stage 3) — the FIRST managed domain, proving the
 * database-first architecture end to end. "Life-area advice" is generic, bilingual
 * guidance that would otherwise be hardcoded in JS; here it is DB-managed so an
 * admin can edit + approve it with no code deployment.
 *
 * Six items are seeded APPROVED (user-visible) and one DRAFT (must stay hidden
 * from users until approved) so the visibility rules are demonstrable.
 */

const CATEGORIES = [
  { code: 'life_area_advice', order: 1, label_en: 'Life-Area Advice', label_hi: 'जीवन-क्षेत्र मार्गदर्शन',
    description: 'General, reusable guidance snippets per life area, surfaced by the humanizer.' },
];

// helper to keep rows compact
const item = (key, area, status, priority, en, hi, keywords) => ({
  stable_key: `life_area.${key}`, category: 'life_area_advice', status, priority,
  visibility: 'public', source: 'JyotishStack editorial', search_keywords: keywords,
  translations: {
    en: { title: en.title, body: en.body, summary: en.summary },
    hi: { title: hi.title, body: hi.body, summary: hi.summary },
  },
  tags: [{ type: 'life_area', value: area }, ...keywords.split(',').map((k) => ({ type: 'keyword', value: k.trim() }))],
});

const ITEMS = [
  item('career', 'career', 'approved', 90,
    { title: 'Career', summary: 'Steady, visible effort compounds.',
      body: 'Focus on consistent, visible contribution rather than dramatic moves. Build one marketable skill deeply, keep a written record of measurable results, and make major changes only after the next step is confirmed in writing.' },
    { title: 'करियर', summary: 'निरंतर, दृश्य प्रयास फल देता है।',
      body: 'नाटकीय बदलावों के बजाय निरंतर, दृश्य योगदान पर ध्यान दें। एक उपयोगी कौशल को गहराई से विकसित करें, मापने योग्य परिणाम लिखित रखें, और बड़े बदलाव तभी करें जब अगला कदम लिखित रूप से पक्का हो।' },
    'job, work, promotion, growth'),
  item('finance', 'finance', 'approved', 80,
    { title: 'Finance', summary: 'Stability before speculation.',
      body: 'Track income, fixed costs and savings each month, build an emergency fund first, and avoid speculative decisions made under pressure. For material investments, consult a regulated professional rather than acting on impulse.' },
    { title: 'वित्त', summary: 'सट्टे से पहले स्थिरता।',
      body: 'हर माह आय, निश्चित खर्च और बचत दर्ज करें, पहले आपातकालीन निधि बनाएं, और दबाव में सट्टात्मक निर्णय से बचें। महत्वपूर्ण निवेश के लिए आवेग में नहीं, पंजीकृत विशेषज्ञ की सलाह लें।' },
    'money, wealth, savings, investment'),
  item('health', 'health', 'approved', 70,
    { title: 'Health', summary: 'Protect the basics you control.',
      body: 'Strengthen sleep, movement, nutrition, stress management and regular check-ups — the fundamentals you can control. Seek qualified medical help promptly for new, severe or worsening symptoms; astrology is reflective guidance, not diagnosis.' },
    { title: 'स्वास्थ्य', summary: 'जो नियंत्रण में है उसे संभालें।',
      body: 'नींद, गतिविधि, पोषण, तनाव प्रबंधन और नियमित जांच — जो बुनियादी बातें नियंत्रण में हैं उन्हें मजबूत करें। नए, गंभीर या बिगड़ते लक्षणों में तुरंत योग्य चिकित्सकीय सहायता लें; ज्योतिष चिंतन का मार्गदर्शन है, निदान नहीं।' },
    'wellbeing, energy, stress, sleep'),
  item('relationships', 'relationships', 'approved', 70,
    { title: 'Relationships', summary: 'Clarity and honest communication.',
      body: 'State expectations about commitment, family and boundaries clearly, and judge consistency between words and behaviour over time. A chart shows tendencies; mutual understanding and honest conversation matter most.' },
    { title: 'संबंध', summary: 'स्पष्टता और ईमानदार संवाद।',
      body: 'प्रतिबद्धता, परिवार और सीमाओं पर अपनी अपेक्षाएं स्पष्ट रखें, और समय के साथ शब्दों व व्यवहार की निरंतरता देखें। कुंडली प्रवृत्तियां दिखाती है; आपसी समझ और ईमानदार बातचीत सबसे महत्वपूर्ण हैं।' },
    'marriage, partner, family, love'),
  item('education', 'education', 'approved', 60,
    { title: 'Education', summary: 'Match the path to real aptitude.',
      body: 'Match the study path to your strongest interests, aptitude and realistic opportunities. Test a subject with a short course before a long commitment, and build a weekly routine with measurable milestones.' },
    { title: 'शिक्षा', summary: 'मार्ग को वास्तविक योग्यता से मिलाएं।',
      body: 'अध्ययन की दिशा को अपनी सबसे प्रबल रुचि, योग्यता और वास्तविक अवसरों से मिलाएं। लंबी प्रतिबद्धता से पहले छोटे कोर्स से विषय परखें, और मापने योग्य लक्ष्यों के साथ साप्ताहिक दिनचर्या बनाएं।' },
    'study, learning, exam, skill'),
  item('spiritual', 'spiritual', 'approved', 50,
    { title: 'Spiritual Growth', summary: 'Consistency over intensity.',
      body: 'A simple, consistent practice — a few minutes of daily stillness, gratitude or chanting — serves growth better than occasional intensity. Align effort with your own tradition and temperament rather than copying others.' },
    { title: 'आध्यात्मिक विकास', summary: 'तीव्रता से अधिक निरंतरता।',
      body: 'एक सरल, नियमित साधना — प्रतिदिन कुछ मिनट का मौन, कृतज्ञता या जप — कभी-कभार की तीव्रता से अधिक विकास में सहायक है। दूसरों की नकल के बजाय अपनी परंपरा और स्वभाव के अनुरूप प्रयास करें।' },
    'practice, meditation, dharma, peace'),
  // A DRAFT item — must remain hidden from users until approved.
  item('career_review_demo', 'career', 'draft', 40,
    { title: 'Career (draft)', summary: 'Draft — not yet approved.',
      body: 'This is a draft life-area note used to demonstrate that unapproved content is never shown to users.' },
    { title: 'करियर (मसौदा)', summary: 'मसौदा — अभी स्वीकृत नहीं।',
      body: 'यह एक मसौदा जीवन-क्षेत्र नोट है जो दर्शाता है कि अस्वीकृत सामग्री उपयोगकर्ताओं को कभी नहीं दिखाई जाती।' },
    'draft, demo'),
];

module.exports = { CATEGORIES, ITEMS };
