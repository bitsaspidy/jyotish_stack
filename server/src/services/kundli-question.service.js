'use strict';

const CHART_META = {
  d1:{ titleEn:'Birth chart (D1)', titleHi:'जन्म कुंडली (D1)', purposeEn:'overall life foundation', purposeHi:'जीवन की मूल दिशा' },
  d2:{ titleEn:'Wealth chart (D2)', titleHi:'धन कुंडली (D2)', purposeEn:'income, savings and resources', purposeHi:'आय, बचत और संसाधन' },
  d4:{ titleEn:'Home and fortune chart (D4)', titleHi:'गृह और भाग्य कुंडली (D4)', purposeEn:'property, home and settled fortune', purposeHi:'संपत्ति, घर और स्थिर भाग्य' },
  d7:{ titleEn:'Children chart (D7)', titleHi:'संतान कुंडली (D7)', purposeEn:'children and parenthood', purposeHi:'संतान और माता-पिता की भूमिका' },
  d9:{ titleEn:'Marriage and maturity chart (D9)', titleHi:'विवाह और परिपक्वता कुंडली (D9)', purposeEn:'partnership, commitment and long-term strength', purposeHi:'साझेदारी, प्रतिबद्धता और दीर्घकालीन बल' },
  d10:{ titleEn:'Career chart (D10)', titleHi:'करियर कुंडली (D10)', purposeEn:'profession, responsibility and recognition', purposeHi:'पेशा, जिम्मेदारी और प्रतिष्ठा' },
  d12:{ titleEn:'Parents chart (D12)', titleHi:'माता-पिता कुंडली (D12)', purposeEn:'parents, ancestry and family support', purposeHi:'माता-पिता, वंश और पारिवारिक सहयोग' },
  d16:{ titleEn:'Comforts chart (D16)', titleHi:'सुख-सुविधा कुंडली (D16)', purposeEn:'vehicles, comforts and quality of living', purposeHi:'वाहन, सुविधाएं और जीवन की गुणवत्ता' },
  d20:{ titleEn:'Spiritual practice chart (D20)', titleHi:'साधना कुंडली (D20)', purposeEn:'spiritual practice and inner discipline', purposeHi:'साधना और आंतरिक अनुशासन' },
  d24:{ titleEn:'Education chart (D24)', titleHi:'शिक्षा कुंडली (D24)', purposeEn:'learning, examinations and mastery', purposeHi:'अध्ययन, परीक्षा और विद्या' },
  d27:{ titleEn:'Strength chart (D27)', titleHi:'बल कुंडली (D27)', purposeEn:'resilience and capacity to recover', purposeHi:'सहनशक्ति और सुधार की क्षमता' },
  d30:{ titleEn:'Challenge chart (D30)', titleHi:'चुनौती कुंडली (D30)', purposeEn:'obstacles, strain and risk management', purposeHi:'बाधाएं, दबाव और जोखिम प्रबंधन' },
};

const STEPS = {
  career_general:[
    ['List the work you do well, the problems you enjoy solving and the environments where you perform best.','जिन कामों में आप अच्छे हैं, जिन समस्याओं को हल करना पसंद करते हैं और जिस वातावरण में अच्छा प्रदर्शन करते हैं, उन्हें लिखें।'],
    ['Compare two or three realistic roles through conversations, short projects or skill tests.','बातचीत, छोटे प्रोजेक्ट या कौशल परीक्षण से दो या तीन व्यावहारिक भूमिकाओं की तुलना करें।'],
    ['Build one marketable skill that supports the strongest direction shown here.','यहां दिखी मजबूत दिशा से जुड़ा एक उपयोगी और मांग वाला कौशल विकसित करें।'],
  ],
  career_job_offer:[
    ['Compare the written role, fixed pay, variable pay, manager, location and probation—not just the title.','लिखित भूमिका, निश्चित वेतन, परिवर्तनीय वेतन, मैनेजर, स्थान और प्रोबेशन की तुलना करें—केवल पदनाम की नहीं।'],
    ['Speak to one future colleague before accepting, if possible.','संभव हो तो स्वीकार करने से पहले भावी टीम के किसी सदस्य से बात करें।'],
    ['Keep the existing option open until the joining terms are confirmed.','जॉइनिंग की शर्तें पक्की होने तक मौजूदा विकल्प खुला रखें।'],
  ],
  career_job_change:[
    ['Do not resign until the new offer and joining date are confirmed in writing.','नई पेशकश और जॉइनिंग तिथि लिखित में पक्की होने से पहले इस्तीफा न दें।'],
    ['Compare learning, stability and manager quality with the salary difference.','वेतन के अंतर के साथ सीख, स्थिरता और मैनेजर की गुणवत्ता की तुलना करें।'],
    ['Keep a transition fund for unexpected delay.','अप्रत्याशित देरी के लिए बदलाव अवधि की बचत रखें।'],
  ],
  career_promotion:[
    ['Ask for measurable expectations and the actual decision date.','मापने योग्य अपेक्षाएं और वास्तविक निर्णय तिथि पूछें।'],
    ['Document recent results that support the promotion.','पदोन्नति के समर्थन में हाल के परिणाम लिखित में रखें।'],
    ['Prepare a growth alternative if the decision is delayed.','निर्णय टलने पर विकास का वैकल्पिक मार्ग तैयार रखें।'],
  ],
  career_business_start:[
    ['Validate demand with paying customers before making a large investment.','बड़ा निवेश करने से पहले भुगतान करने वाले ग्राहकों से मांग की पुष्टि करें।'],
    ['Keep at least six months of operating cash and define a stop-loss point.','कम से कम छह महीने की कार्यशील पूंजी और नुकसान रोकने की सीमा तय रखें।'],
    ['Put ownership, duties and exit terms in writing with every partner.','हर साझेदार के साथ स्वामित्व, जिम्मेदारियां और अलग होने की शर्तें लिखित रखें।'],
  ],
  marriage_proposal:[
    ['Discuss values, money, family expectations, children and location directly.','मूल्य, धन, परिवार की अपेक्षाएं, संतान और रहने के स्थान पर सीधे बात करें।'],
    ['Judge consistency between promises and behaviour over time.','समय के साथ वादों और व्यवहार की निरंतरता देखें।'],
    ['Use compatibility and real conversations; do not decide from one chart alone.','मिलान और वास्तविक बातचीत दोनों उपयोग करें; केवल एक कुंडली से निर्णय न लें।'],
  ],
  marriage_timing:[
    ['Keep introductions and conversations active instead of waiting passively.','निष्क्रिय प्रतीक्षा के बजाय परिचय और बातचीत सक्रिय रखें।'],
    ['Review compatibility carefully when a serious match appears.','गंभीर रिश्ता आने पर अनुकूलता की सावधानी से समीक्षा करें।'],
    ['Treat timing as a window for effort, not a guaranteed event date.','समय को प्रयास की अवधि मानें, घटना की गारंटीकृत तारीख नहीं।'],
  ],
  marriage_general:[
    ['Notice which relationship patterns repeatedly create trust or strain.','देखें कि रिश्तों में कौन से व्यवहार बार-बार विश्वास या तनाव पैदा करते हैं।'],
    ['State your expectations about commitment, family, money and boundaries clearly.','प्रतिबद्धता, परिवार, धन और सीमाओं पर अपनी अपेक्षाएं स्पष्ट रखें।'],
    ['Use honest conversation and compatibility checks alongside the chart.','कुंडली के साथ ईमानदार बातचीत और अनुकूलता की जांच भी करें।'],
  ],
  finance_general:[
    ['Track income, fixed costs, debt and savings before choosing the next financial goal.','अगला आर्थिक लक्ष्य चुनने से पहले आय, निश्चित खर्च, ऋण और बचत दर्ज करें।'],
    ['Build emergency savings before taking a high-risk financial step.','उच्च जोखिम वाला आर्थिक कदम उठाने से पहले आपातकालीन बचत बनाएं।'],
    ['Use a regulated professional for tax, insurance or material investment decisions.','कर, बीमा या महत्वपूर्ण निवेश निर्णयों के लिए पंजीकृत विशेषज्ञ की सलाह लें।'],
  ],
  finance_investment:[
    ['Check downside, liquidity, fees and tax before expected returns.','अपेक्षित लाभ से पहले नुकसान, नकदी उपलब्धता, शुल्क और कर जांचें।'],
    ['Avoid borrowing or using emergency savings for a speculative decision.','सट्टात्मक निर्णय के लिए ऋण या आपातकालीन बचत उपयोग न करें।'],
    ['Use a regulated financial professional for material investment decisions.','महत्वपूर्ण निवेश निर्णय के लिए पंजीकृत वित्तीय विशेषज्ञ की सलाह लें।'],
  ],
  property_purchase:[
    ['Verify title, approvals, dues, construction quality and total ownership cost.','टाइटल, स्वीकृतियां, बकाया, निर्माण गुणवत्ता और कुल स्वामित्व लागत जांचें।'],
    ['Keep the loan payment comfortable after emergency savings.','आपातकालीन बचत के बाद भी ऋण भुगतान सहज रखें।'],
    ['Use independent legal and technical due diligence before paying a large amount.','बड़ी राशि देने से पहले स्वतंत्र कानूनी और तकनीकी जांच कराएं।'],
  ],
  education_exam:[
    ['Convert the goal into a weekly study and revision schedule.','लक्ष्य को साप्ताहिक अध्ययन और पुनरावृत्ति योजना में बदलें।'],
    ['Use timed mock tests to find the weakest topics early.','कमजोर विषय जल्दी पहचानने के लिए समयबद्ध मॉक टेस्ट दें।'],
    ['Keep a practical second option while pursuing the main target.','मुख्य लक्ष्य के साथ एक व्यावहारिक दूसरा विकल्प रखें।'],
  ],
  education_general:[
    ['Match the study path to your strongest interests, aptitude and realistic opportunities.','अध्ययन की दिशा को अपनी रुचि, योग्यता और वास्तविक अवसरों से मिलाएं।'],
    ['Test the subject through a short course or project before a long commitment.','लंबी प्रतिबद्धता से पहले छोटे कोर्स या प्रोजेक्ट से विषय को परखें।'],
    ['Build a weekly learning routine with measurable milestones.','मापने योग्य लक्ष्यों के साथ साप्ताहिक अध्ययन दिनचर्या बनाएं।'],
  ],
  travel_relocation:[
    ['Compare income after rent, tax, commute and family costs.','किराया, कर, यात्रा और पारिवारिक खर्च के बाद बचने वाली आय की तुलना करें।'],
    ['Confirm visa, contract, housing and return options before moving.','जाने से पहले वीजा, अनुबंध, आवास और वापसी के विकल्प पक्के करें।'],
    ['If possible, test the location with a short visit first.','संभव हो तो पहले छोटी यात्रा से स्थान को परखें।'],
  ],
  health_recovery:[
    ['Use this reading only for reflection; follow a qualified clinician for diagnosis and treatment.','इस फल का उपयोग केवल चिंतन के लिए करें; जांच और उपचार के लिए योग्य चिकित्सक का अनुसरण करें।'],
    ['Track symptoms, sleep, medication and follow-up dates consistently.','लक्षण, नींद, दवा और फॉलो-अप तारीखें नियमित रूप से दर्ज करें।'],
    ['Seek urgent medical help for severe or rapidly worsening symptoms.','गंभीर या तेजी से बिगड़ते लक्षणों में तुरंत चिकित्सा सहायता लें।'],
  ],
  health_general:[
    ['Use this reading only for reflection; use qualified medical care for symptoms, diagnosis or treatment.','इस फल का उपयोग केवल चिंतन के लिए करें; लक्षण, जांच या उपचार के लिए योग्य चिकित्सकीय देखभाल लें।'],
    ['Strengthen the basics you can control: sleep, movement, nutrition, stress and regular check-ups.','जिन बुनियादी बातों को नियंत्रित कर सकते हैं उन्हें मजबूत करें: नींद, गतिविधि, पोषण, तनाव और नियमित जांच।'],
    ['Seek medical help promptly for new, severe or worsening symptoms.','नए, गंभीर या बिगड़ते लक्षणों में तुरंत चिकित्सा सहायता लें।'],
  ],
  legal_dispute:[
    ['Preserve documents, dates and written communication.','दस्तावेज, तारीखें और लिखित बातचीत सुरक्षित रखें।'],
    ['Ask a qualified lawyer about deadlines, evidence and settlement options.','समय-सीमा, सबूत और समझौते के विकल्प पर योग्य वकील से पूछें।'],
    ['Do not take irreversible action from an astrology reading.','ज्योतिष फल के आधार पर कोई अपरिवर्तनीय कदम न उठाएं।'],
  ],
  family_children:[
    ['Separate medical facts, practical readiness and emotional expectations.','चिकित्सकीय तथ्य, व्यावहारिक तैयारी और भावनात्मक अपेक्षाएं अलग-अलग समझें।'],
    ['For conception or child health, follow qualified medical guidance.','गर्भधारण या बच्चे के स्वास्थ्य के लिए योग्य चिकित्सकीय सलाह लें।'],
    ['Build the support, time and financial plan the family will need.','परिवार के लिए आवश्यक सहयोग, समय और आर्थिक योजना बनाएं।'],
  ],
};

const GENERIC_STEPS = [
  ['Write down the decision, deadline and facts that would change your answer.','निर्णय, समय-सीमा और वे तथ्य लिखें जो आपका उत्तर बदल सकते हैं।'],
  ['Take one small reversible step before making a large commitment.','बड़ी प्रतिबद्धता से पहले एक छोटा और वापस लिया जा सकने वाला कदम उठाएं।'],
  ['Review the result alongside real-world evidence and trusted professional advice.','फल को वास्तविक प्रमाण और विश्वसनीय विशेषज्ञ सलाह के साथ मिलाकर देखें।'],
];

const STATUS_SCORE = { very_favorable:82, favorable:74, supportive:72, neutral:56, mixed:54, challenging:36, caution:34 };

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function safeText(value, max = 700) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function lensStatus(reading) {
  const status = String(reading?.overall_status || 'neutral').toLowerCase();
  return STATUS_SCORE[status] ? status : 'neutral';
}

function timingWindow(chart, timingKey) {
  const windows = chart?.reports?.event_timing?.windows;
  if (!Array.isArray(windows)) return null;
  return windows.find((item) => item.key === timingKey) || null;
}

function friendlyTiming(timing) {
  if (!timing) return null;
  const messages = {
    favorable:[
      'The current period supports steady action in this area. Use the window to prepare, verify the facts and move deliberately.',
      'वर्तमान समय इस क्षेत्र में स्थिर प्रयास का समर्थन करता है। तैयारी करें, तथ्य जांचें और सोच-समझकर आगे बढ़ें।',
    ],
    moderate:[
      'The current period is mixed rather than blocked. Progress is more likely through preparation, follow-up and realistic expectations.',
      'वर्तमान समय रुकावट वाला नहीं, बल्कि मिश्रित है। तैयारी, लगातार प्रयास और वास्तविक अपेक्षाओं से प्रगति की संभावना बढ़ती है।',
    ],
    caution:[
      'The current period calls for extra care. Avoid rushed commitments and use this time to improve the conditions you can control.',
      'वर्तमान समय अतिरिक्त सावधानी मांगता है। जल्दबाजी में प्रतिबद्धता न करें और जिन परिस्थितियों को नियंत्रित कर सकते हैं उन्हें बेहतर बनाएं।',
    ],
  };
  const [textEn, textHi] = messages[timing.tone] || messages.moderate;
  return { tone:timing.tone || 'moderate', dateFrom:timing.date_from || null, dateTo:timing.date_to || null, textEn, textHi };
}

function toneFromScore(score) {
  if (score >= 67) return 'supportive';
  if (score <= 43) return 'caution';
  return 'balanced';
}

function chartLens(chart, slug) {
  const meta = CHART_META[slug];
  if (!meta || !chart?.varga_charts?.[slug]) return null;
  const reading = chart?.varga_analysis?.[slug] || {};
  const status = lensStatus(reading);
  return {
    slug,
    ...meta,
    status,
    summaryEn:safeText(reading.user_summary_en || reading.role_en || `${meta.titleEn} was included for ${meta.purposeEn}.`),
    summaryHi:safeText(reading.user_summary_hi || reading.role_hi || `${meta.titleHi} को ${meta.purposeHi} के लिए देखा गया।`),
  };
}

function safetyNote(key) {
  const notes = {
    health:['Astrology cannot diagnose illness or replace medical care.','ज्योतिष बीमारी की जांच या चिकित्सकीय देखभाल का स्थान नहीं ले सकता।'],
    legal:['Use this as reflective guidance, not legal advice. A qualified lawyer should review the actual matter.','इसे चिंतन के मार्गदर्शन के रूप में लें, कानूनी सलाह के रूप में नहीं। वास्तविक मामले को योग्य वकील से दिखाएं।'],
    finance:['This is not investment advice. Verify risk, regulation, tax and affordability independently.','यह निवेश सलाह नहीं है। जोखिम, नियम, कर और वहन-क्षमता की स्वतंत्र जांच करें।'],
    relationships:['A birth chart shows personal patterns; it cannot replace consent, compatibility and honest conversation.','जन्म कुंडली व्यक्तिगत प्रवृत्तियां दिखाती है; यह सहमति, अनुकूलता और ईमानदार बातचीत का स्थान नहीं ले सकती।'],
    family:['Use the chart as one perspective; family and medical decisions still need real facts and shared consent.','कुंडली को एक दृष्टिकोण मानें; पारिवारिक और चिकित्सकीय निर्णयों में वास्तविक तथ्य और साझा सहमति आवश्यक हैं।'],
    general:['This is a rule-based Jyotish interpretation, not a guaranteed prediction.','यह नियम-आधारित ज्योतिष व्याख्या है, गारंटीकृत भविष्यवाणी नहीं।'],
  };
  return notes[key] || notes.general;
}

function buildKundliQuestionAnswer({ chart, profile, question, analysis, includeTechnical = false }) {
  if (!chart?.ascendant || !chart?.planets || !analysis) return null;
  const slugs = Array.isArray(analysis.chartSlugs) && analysis.chartSlugs.length ? analysis.chartSlugs : ['d1'];
  const lenses = slugs.map((slug) => chartLens(chart, slug)).filter(Boolean);
  if (!lenses.length) return null;

  const timing = timingWindow(chart, analysis.timingKey);
  const timingFriendly = friendlyTiming(timing);
  const lensAverage = lenses.reduce((sum, lens) => sum + (STATUS_SCORE[lens.status] || 56), 0) / lenses.length;
  const timingScore = timing ? ({ favorable:76, moderate:56, caution:36 }[timing.tone] || 54) : 54;
  const timingWeight = analysis.decisionMode === 'timing' ? 0.35 : 0.22;
  const score = clamp(Math.round(lensAverage * (1 - timingWeight) + timingScore * timingWeight), 20, 85);
  const tone = toneFromScore(score);
  const focusEn = safeText(analysis.understoodAsEn || 'this question', 240);
  const focusHi = safeText(analysis.understoodAsHi || 'इस प्रश्न', 240);
  const answers = {
    supportive:[
      `Your Kundli supports forward movement regarding ${focusEn}. Proceed thoughtfully after checking the practical conditions below; this is a favorable tendency, not a guarantee.`,
      `आपकी कुंडली ${focusHi} के विषय में आगे बढ़ने का समर्थन करती है। नीचे दी गई व्यावहारिक बातों की जांच करके सोच-समझकर आगे बढ़ें; यह सहायक प्रवृत्ति है, गारंटी नहीं।`,
    ],
    balanced:[
      `Your Kundli gives a conditional answer regarding ${focusEn}. The possibility is present, but preparation, timing and the real terms matter more than a quick yes or no.`,
      `आपकी कुंडली ${focusHi} के विषय में शर्तों वाला उत्तर देती है। संभावना मौजूद है, लेकिन जल्दी हां या ना कहने से अधिक तैयारी, समय और वास्तविक शर्तें महत्वपूर्ण हैं।`,
    ],
    caution:[
      `Your Kundli advises caution regarding ${focusEn}. Strengthen preparation or wait for clearer conditions instead of forcing an immediate result.`,
      `आपकी कुंडली ${focusHi} के विषय में सावधानी की सलाह देती है। तुरंत परिणाम को मजबूर करने के बजाय तैयारी मजबूत करें या परिस्थितियां स्पष्ट होने दें।`,
    ],
  };
  const [answerEn, answerHi] = answers[tone];

  // D1 establishes the foundation, but a question-specific divisional chart
  // gives the user the most relevant explanation (D4/D16 for property, D10
  // for career, D9 for marriage, and so on).
  const specialistLenses = lenses.filter((lens) => lens.slug !== 'd1');
  const evidenceLenses = specialistLenses.length ? specialistLenses.slice(0, 2) : lenses.slice(0, 2);
  const reasons = evidenceLenses.map((lens) => ({
    titleEn:lens.titleEn,
    titleHi:lens.titleHi,
    textEn:lens.summaryEn,
    textHi:lens.summaryHi,
    tone:lens.status,
  }));
  if (timingFriendly) reasons.push({
    titleEn:'Current timing', titleHi:'वर्तमान समय', tone:timingFriendly.tone,
    textEn:timingFriendly.textEn, textHi:timingFriendly.textHi,
  });

  const steps = (STEPS[analysis.actionKey] || GENERIC_STEPS).map(([en, hi]) => ({ en, hi }));
  const [noteEn, noteHi] = safetyNote(analysis.safetyNoteKey);
  const result = {
    version:'kundli-question-v1',
    profile:{ uuid:profile?.uuid || null, name:safeText(profile?.name || 'Your', 120) },
    question:{ text:safeText(question, 500), understoodAsEn:focusEn, understoodAsHi:focusHi, category:analysis.detectedCategory, subtype:analysis.subtype },
    answer:{ tone, score, headlineEn:tone === 'supportive' ? 'The direction is supportive' : tone === 'caution' ? 'Move carefully, not quickly' : 'Possible, with conditions', headlineHi:tone === 'supportive' ? 'दिशा सहायक है' : tone === 'caution' ? 'जल्दी नहीं, सावधानी से बढ़ें' : 'संभावना है, कुछ शर्तों के साथ', textEn:answerEn, textHi:answerHi },
    chartLenses:lenses,
    reasons,
    timing:timingFriendly,
    nextSteps:steps,
    safety:{ textEn:noteEn, textHi:noteHi },
    confidence:{ level:analysis.confidence >= 0.75 && lenses.length > 1 ? 'strong' : 'moderate', question:analysis.confidence, source:analysis.source },
  };
  if (includeTechnical) result.technical = { focusHouses:analysis.focusHouses || [], focusPlanets:analysis.focusPlanets || [], timingKey:analysis.timingKey, rawScore:score };
  return result;
}

module.exports = { buildKundliQuestionAnswer, chartLens, toneFromScore, safetyNote, friendlyTiming, CHART_META };
