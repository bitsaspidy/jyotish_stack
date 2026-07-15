'use strict';
/**
 * Pilot answer templates (Stage 1) — the user-facing Hindi/English content for
 * the 10 pilot questions, seeded into answer_templates + answer_shared_blocks
 * by seed 035. From Stage 1 onward the DB is the source of user-facing answer
 * text; code only evaluates evidence, selects condition keys and interpolates
 * {{placeholders}}. Only minimal emergency fallback text remains in code.
 *
 * Placeholders filled by the template composer:
 *   {{support_factors}} {{caution_factor}} {{caution_factors}} {{positive_factors}}
 *   {{dchart_support}} {{dchart_against}} {{maha_lord}} {{antar_lord}}
 *   {{transit_lines}} {{window_line}} {{dasha_line}} {{planet}} {{active_role}}
 *   {{lagna_sign}} {{lagna_lord}} {{moon_sign}} {{dominant_planet}} {{date}} {{sign}}
 *   {{classification}} {{until}}
 */

const PILOT_CODES = ['Q001','Q012','Q021','Q031','Q041','Q051','Q061','Q071','Q081','Q093'];
const STATES = ['highly_favourable','favourable','moderately_favourable','mixed','challenging','highly_challenging'];

// ── Shared blocks (block_key → en/hi), all version 1 ─────────────────────────
// Sections, fragments and labels shared across questions live here (no
// question_code column); question-specific text lives in answer_templates.
const B = (block_key, type, en, hi) => [
  { block_key, type, lang:'en', version:1, text:en },
  { block_key, type, lang:'hi', version:1, text:hi },
];

const SHARED_BLOCKS = [
  // REMOVED (humanization upgrade), and deactivated in the DB by seed 037:
  //
  //   sec.kundli_indicates.*  — listed factor LABELS ("11th-lord Mars and Mars"),
  //     which both duplicated the entity and told the reader nothing about what
  //     the planet does in their life area. Replaced by per-factor rendering:
  //     merged roles + `meaning.<planet>.<domain>` + a polarity frame.
  //
  //   sec.dchart.*  — "विभाजन चार्ट (D10) इस विश्लेषण को पुष्ट करता है।" A chart
  //     name plus a status word is not a perspective. Replaced by
  //     `varga.<chart>.<domain>.<polarity>`, which states what the chart actually
  //     contributes.
  //
  //   sec.positive.factors / sec.caution.* — one caution sentence for finance,
  //     health, property and marriage alike, and the source of "वास्तविक ध्यान
  //     रखें" and "अपरिवर्तनीय निर्णय". Replaced by `caution.<domain>`.
  //
  //   sec.timing_outlook.* / frag.window_line* / frag.no_window_line /
  //   frag.dasha_line — a single sentence about the current window. Replaced by
  //     the timing framework (`timing.<domain>.<phase>`).

  // — dasha section bodies —
  ...B('sec.dasha.maha_antar','section',
    'You are currently in the {{maha_lord}} major period with a {{antar_lord}} sub-period, which shapes how these tendencies express right now.',
    'वर्तमान में आप {{maha_lord}} की महादशा और {{antar_lord}} की अंतर्दशा में हैं, जो इन प्रवृत्तियों की वर्तमान अभिव्यक्ति तय करती है।'),
  ...B('sec.dasha.maha_only','section',
    'You are currently in the {{maha_lord}} major period, which shapes how these tendencies express right now.',
    'वर्तमान में आप {{maha_lord}} की महादशा में हैं, जो इन प्रवृत्तियों की वर्तमान अभिव्यक्ति तय करती है।'),

  // — transit section body + fragments —
  ...B('sec.transit.default','section',
    'Major slow-planet transits now: {{transit_lines}}. These mark periods of emphasis, not guaranteed dated events.',
    'प्रमुख धीमे ग्रहों का वर्तमान गोचर: {{transit_lines}}। ये बल के समय दर्शाते हैं, निश्चित तिथि की घटनाएँ नहीं।'),
  ...B('frag.transit_line','fragment',
    '{{planet}} in {{sign}} ({{classification}}{{until}})',
    '{{planet}} {{sign}} में ({{classification}}{{until}})'),
  ...B('frag.transit_until','fragment', ', until ~{{date}}', ', ~{{date}} तक'),
  ...B('frag.role_maha','fragment',
    ' (also your running Mahadasha lord)', ' (जो आपकी वर्तमान महादशा स्वामी भी है)'),
  ...B('frag.role_antar','fragment',
    ' (your running Antardasha lord)', ' (आपकी वर्तमान अंतर्दशा स्वामी)'),

  // — positive fallback (used only when no factor has a seeded meaning) —
  ...B('sec.positive.no_factors','section',
    'No single factor stands out strongly, but a steady, workable base is present — deliberate, consistent effort builds on it.',
    'कोई एक कारक विशेष रूप से प्रबल नहीं है, फिर भी एक स्थिर, उपयोगी आधार मौजूद है — नियोजित और निरंतर प्रयास इसे बढ़ाता है।'),

  // — challenging-state review note (appended after caution for both caution states) —
  ...B('note.challenging_review','note',
    'This points to a demanding phase, not a fixed negative outcome. Review the situation again in about 3 months, focus on what you can control, and seek qualified guidance for any major decision.',
    'यह एक कठिन चरण दर्शाता है, कोई निश्चित नकारात्मक परिणाम नहीं। लगभग 3 महीने बाद स्थिति की पुनः समीक्षा करें, जो नियंत्रण में है उस पर ध्यान दें, और किसी बड़े निर्णय के लिए योग्य मार्गदर्शन लें।'),

  // — section titles —
  ...B('label.sec.direct_answer','label','Direct answer','सीधा उत्तर'),
  ...B('label.sec.kundli_indicates','label','What your Kundli indicates','आपकी कुंडली क्या दर्शाती है'),
  ...B('label.sec.dchart_indication','label','Divisional-chart view','विभाजन चार्ट का दृष्टिकोण'),
  ...B('label.sec.dasha_influence','label','Current Dasha influence','वर्तमान दशा प्रभाव'),
  ...B('label.sec.transit_influence','label','Current transit influence','वर्तमान गोचर प्रभाव'),
  ...B('label.sec.positive','label','Positive potential','सकारात्मक संभावना'),
  ...B('label.sec.caution','label','Caution','सावधानी'),
  ...B('label.sec.timing_outlook','label','Timing outlook','समय का दृष्टिकोण'),
  ...B('label.sec.practical_guidance','label','Practical next step','व्यावहारिक अगला कदम'),
  ...B('label.sec.remedy','label','Suggested remedy','सुझाया गया उपाय'),
  ...B('label.sec.important_note','label','Important note','महत्वपूर्ण सूचना'),
  ...B('label.sec.review_period','label','Perspective & review','दृष्टिकोण व समीक्षा'),

  // — answer-state labels (7) —
  ...B('label.state.highly_favourable','label','Strongly supportive','अत्यधिक अनुकूल'),
  ...B('label.state.favourable','label','Favourable','अनुकूल'),
  ...B('label.state.moderately_favourable','label','Moderately favourable','सामान्यतः अनुकूल'),
  ...B('label.state.mixed','label','Mixed','मिश्रित'),
  ...B('label.state.challenging','label','Challenging','चुनौतीपूर्ण'),
  ...B('label.state.highly_challenging','label','Needs extra care','अधिक सावधानी आवश्यक'),
  ...B('label.state.insufficient_data','label','Not yet determinable','अभी निर्धारित नहीं'),

  // — confidence labels —
  ...B('label.conf.high','label','High','उच्च'),
  ...B('label.conf.medium','label','Medium','मध्यम'),
  ...B('label.conf.low','label','Low','निम्न'),

  // — transit classification words —
  ...B('label.class.supportive','label','supportive','सहायक'),
  ...B('label.class.mixed','label','mixed','मिश्रित'),
  ...B('label.class.caution','label','caution','सावधानी'),

  // — generic per-state headlines (used by the 6 favourability pilots) —
  ...B('label.headline.highly_favourable','label','The prospects here are strong','यहाँ संभावनाएँ मजबूत हैं'),
  ...B('label.headline.favourable','label','The prospects here are favourable','यहाँ संभावनाएँ अनुकूल हैं'),
  ...B('label.headline.moderately_favourable','label','The prospects here are workable','यहाँ संभावनाएँ ठीक-ठाक हैं'),
  ...B('label.headline.mixed','label','The prospects here are mixed','यहाँ संभावनाएँ मिश्रित हैं'),
  ...B('label.headline.challenging','label','This area needs careful effort','इस क्षेत्र में सतर्क प्रयास चाहिए'),
  ...B('label.headline.highly_challenging','label','This area asks for extra care','इस क्षेत्र में अधिक सावधानी चाहिए'),
];

// REMOVED (humanization upgrade): STATE_PHRASE.
//
// One per-state phrase was spliced into the direct answer of eight unrelated
// questions — career, business, money, children, education, health, marriage and
// property all opened with the same sentence, differing only by a topic noun. It
// is the single largest source of the "template with planet names substituted"
// feel, and its `mixed` entry is where "जल्दी हाँ या ना" came from.
//
// Direct answers for those questions now resolve to `direct_answer.<domain>.<state>`
// in answer_shared_blocks (seed 037), so each life area states its own claim.
// Q001 and Q093 keep question-specific direct answers below because theirs are
// genuinely specific — they name your lagna, Moon sign and dominant planet — not
// a generic phrase wearing a topic.

// Q001-specific self-signifier readings per state.
const Q001_STATE = {
  highly_favourable: ['Taken together, your self-signifiers are strong and mutually supportive.','कुल मिलाकर आपके आत्म-कारक बलवान और परस्पर सहायक हैं।'],
  favourable:        ['Taken together, your self-signifiers are well placed and supportive.','कुल मिलाकर आपके आत्म-कारक अच्छी स्थिति में और सहायक हैं।'],
  moderately_favourable: ['Taken together, your self-signifiers are reasonably placed, with room to grow through conscious habits.','कुल मिलाकर आपके आत्म-कारक ठीक स्थिति में हैं, और सचेत आदतों से इन्हें और निखारा जा सकता है।'],
  mixed:             ['Taken together, your self-signifiers are mixed — clear strengths sit alongside traits that need conscious balancing.','कुल मिलाकर आपके आत्म-कारक मिश्रित हैं — स्पष्ट शक्तियों के साथ कुछ पक्ष सचेत संतुलन चाहते हैं।'],
  challenging:       ['Taken together, your self-signifiers face pressure, so self-awareness and steady routines matter more for you than for most.','कुल मिलाकर आपके आत्म-कारक दबाव में हैं, इसलिए आत्म-जागरूकता और नियमित दिनचर्या आपके लिए विशेष महत्वपूर्ण हैं।'],
  highly_challenging:['Taken together, your self-signifiers are under strain right now; gentle, consistent self-care and patient habits will serve you best.','कुल मिलाकर आपके आत्म-कारक अभी दबाव में हैं; सहज, नियमित आत्म-देखभाल और धैर्यपूर्ण आदतें आपके लिए सर्वोत्तम रहेंगी।'],
};

// Q093 per-state nuance suffix.
const Q093_STATE = {
  highly_favourable: ['Its current condition is strong, so this support is dependable right now.','इसकी वर्तमान स्थिति बलवान है, इसलिए यह सहारा अभी भरोसेमंद है।'],
  favourable:        ['Its current condition is good, so this support is reliable.','इसकी वर्तमान स्थिति अच्छी है, इसलिए यह सहारा विश्वसनीय है।'],
  moderately_favourable: ['Its support is moderate, so pair it with practical preparation.','इसका सहारा मध्यम है, इसलिए इसे व्यावहारिक तैयारी के साथ जोड़ें।'],
  mixed:             ['Even so, the overall period is mixed, so use this support with realistic expectations.','फिर भी समग्र समय मिश्रित है, इसलिए इस सहारे का उपयोग यथार्थ अपेक्षाओं के साथ करें।'],
  challenging:       ['The wider period is demanding, so lean on this planet’s significations while keeping commitments conservative.','व्यापक समय कठिन है, इसलिए इस ग्रह की विशेषताओं का सहारा लें और प्रतिबद्धताएँ सीमित रखें।'],
  highly_challenging:['The wider period asks for extra care, so treat this planet as your steadying anchor rather than a green light.','व्यापक समय अधिक सावधानी मांगता है, इसलिए इस ग्रह को हरी झंडी नहीं, बल्कि स्थिरता का सहारा मानें।'],
};

// REMOVED (humanization upgrade): TOPIC.
//
// These nouns were the ONLY thing distinguishing six direct answers from one
// another — "On wealth prospects, {phrase}" vs "On your general health tendencies,
// {phrase}". Swapping a noun is not domain-specific language. Each of those six
// questions now draws its answer from its own domain family.

// Practical guidance per question (en, hi).
const PRACTICAL = {
  Q001: ['Lean into the natural strengths named above, and consciously balance the one weaker trait rather than fighting your whole temperament.',
         'ऊपर बताई अपनी स्वाभाविक शक्तियों का उपयोग करें, और पूरे स्वभाव से लड़ने के बजाय एक कमज़ोर पक्ष को सचेत रूप से संतुलित करें।'],
  Q012: ['Test the stronger direction with a small, low-risk step — a side project or a trial engagement — before leaving stable income.',
         'स्थिर आय छोड़ने से पहले मजबूत दिशा को एक छोटे, कम-जोखिम कदम — साइड प्रोजेक्ट या ट्रायल — से परखें।'],
  Q021: ['Validate demand with paying customers before a large investment, keep six months of operating cash, and define a clear stop-loss point.',
         'बड़े निवेश से पहले भुगतान करने वाले ग्राहकों से मांग की पुष्टि करें, छह माह की कार्यशील पूंजी रखें, और हानि-सीमा स्पष्ट तय करें।'],
  Q031: ['Track income, fixed costs and savings monthly, build an emergency fund first, and use a regulated professional for material investment decisions.',
         'आय, निश्चित खर्च और बचत मासिक रूप से दर्ज करें, पहले आपातकालीन निधि बनाएँ, और महत्वपूर्ण निवेश निर्णयों के लिए पंजीकृत विशेषज्ञ की सलाह लें।'],
  Q041: ['Keep meeting suitable matches and check compatibility seriously when one appears; treat the window above as when effort is best rewarded, not a fixed date.',
         'उपयुक्त रिश्ते देखते रहें और गंभीर रिश्ता आने पर अनुकूलता गंभीरता से जाँचें; ऊपर दी अवधि को प्रयास का सर्वोत्तम समय मानें, निश्चित तिथि नहीं।'],
  Q051: ['Separate medical facts, practical readiness and emotional expectations; for conception or child health, follow qualified medical guidance.',
         'चिकित्सकीय तथ्य, व्यावहारिक तैयारी और भावनात्मक अपेक्षाएँ अलग-अलग समझें; गर्भधारण या शिशु स्वास्थ्य के लिए योग्य चिकित्सकीय सलाह लें।'],
  Q061: ['Match the study path to your strongest interests and realistic opportunities, and test the subject with a short course before a long commitment.',
         'अध्ययन की दिशा को अपनी रुचि और वास्तविक अवसरों से मिलाएँ, और लंबी प्रतिबद्धता से पहले छोटे कोर्स से विषय को परखें।'],
  Q071: ['Strengthen the basics you can control — sleep, movement, nutrition, stress and regular check-ups — and seek medical help promptly for new or worsening symptoms.',
         'जो बुनियादी बातें नियंत्रण में हैं उन्हें मजबूत करें — नींद, गतिविधि, पोषण, तनाव और नियमित जाँच — और नए या बिगड़ते लक्षणों में तुरंत चिकित्सकीय सहायता लें।'],
  Q081: ['Line up finances and shortlist options now; complete legal and technical due diligence, and aim major action within the supportive window rather than on a promised date.',
         'अभी वित्त व्यवस्थित करें और विकल्प चुनें; कानूनी-तकनीकी जाँच पूरी करें, और बड़ा कदम वादा-तिथि पर नहीं, अनुकूल अवधि में लें।'],
  Q093: ['Schedule important starts and follow-ups on this planet’s stronger days, and align your effort with its significations rather than against them.',
         'महत्वपूर्ण शुरुआत और अनुवर्तन इस ग्रह के अनुकूल दिनों में रखें, और अपने प्रयास इसकी विशेषताओं के अनुरूप रखें, विपरीत नहीं।'],
};

// ── answer_templates rows ─────────────────────────────────────────────────────
const T = (question_code, section_key, answer_state, lang, text, condition_key = 'default') => ({
  question_code, section_key, answer_state, lang, condition_key,
  block_text: text, display_order: 0, template_version: 1, active: true,
});

/**
 * Question-specific direct answers.
 *
 * ONLY the two questions whose answer genuinely cannot be expressed at domain
 * level keep a row here: Q001 names your ascendant, Moon sign and dominant planet,
 * and Q093 names the planet itself. Everything a template row cannot personalise
 * beyond a topic noun now lives in its domain family instead — the composer falls
 * through to `direct_answer.<domain>.<state>` when no question row exists.
 *
 * Q041 (marriage timing) and Q081 (house timing) deliberately lost their rows: the
 * window/dasha lines they spliced inline are now the job of the timing framework,
 * which gives a real outlook (current phase → caution window → supportive window →
 * triggers) instead of one sentence with a date stapled to it.
 */
function directAnswerRows() {
  const rows = [];
  for (const state of STATES) {
    // Q001 — descriptive personality answer
    rows.push(T('Q001','direct_answer',state,'en',
      `Your personality is shaped by your {{lagna_sign}} ascendant (ruled by {{lagna_lord}}) and a {{moon_sign}} Moon guiding your emotional mind, with {{dominant_planet}} as the dominant influence on how you come across. ${Q001_STATE[state][0]}`));
    rows.push(T('Q001','direct_answer',state,'hi',
      `आपका व्यक्तित्व {{lagna_sign}} लग्न (स्वामी {{lagna_lord}}) और {{moon_sign}} राशि के चंद्र से बनता है, और आपके व्यक्तित्व पर {{dominant_planet}} का प्रमुख प्रभाव है। ${Q001_STATE[state][1]}`));

    // Q093 — planet identification answer
    rows.push(T('Q093','direct_answer',state,'en',
      `Right now, {{planet}}{{active_role}} is the most favourable planet for you. Aligning important efforts with its significations, days and remedies gives the best current support. ${Q093_STATE[state][0]}`));
    rows.push(T('Q093','direct_answer',state,'hi',
      `इस समय {{planet}}{{active_role}} आपके लिए सबसे अनुकूल ग्रह है। महत्वपूर्ण प्रयासों को इसकी विशेषताओं, दिनों और उपायों से जोड़ना वर्तमान में सबसे अच्छा सहारा देता है। ${Q093_STATE[state][1]}`));
  }
  return rows;
}

function headlineRows() {
  // Question-specific headlines; the 6 favourability pilots use the shared
  // per-state headline labels instead (label.headline.<state>).
  return [
    T('Q001','headline','any','en','Your core nature'),
    T('Q001','headline','any','hi','आपका मूल स्वभाव'),
    T('Q093','headline','any','en','Currently most favourable planet: {{planet}}'),
    T('Q093','headline','any','hi','वर्तमान में सर्वाधिक अनुकूल ग्रह: {{planet}}'),
    T('Q041','headline','any','en','Marriage-timing outlook'),
    T('Q041','headline','any','hi','विवाह समय का दृष्टिकोण'),
    T('Q081','headline','any','en','House-purchase timing outlook'),
    T('Q081','headline','any','hi','मकान खरीद समय का दृष्टिकोण'),
  ];
}

function practicalRows() {
  const rows = [];
  for (const [code, [en, hi]] of Object.entries(PRACTICAL)) {
    rows.push(T(code,'practical_guidance','any','en',en));
    rows.push(T(code,'practical_guidance','any','hi',hi));
  }
  return rows;
}

function buildTemplates() {
  return [...directAnswerRows(), ...headlineRows(), ...practicalRows()];
}

module.exports = { PILOT_CODES, STATES, SHARED_BLOCKS, buildTemplates, PRACTICAL };
