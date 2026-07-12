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
  // — kundli_indicates section bodies (condition-specific) —
  ...B('sec.kundli_indicates.support_and_caution','section',
    'In your birth chart, {{support_factors}} give the main support in this area, while {{caution_factor}} is comparatively weaker and needs conscious effort.',
    'आपकी जन्म कुंडली में {{support_factors}} इस विषय में मुख्य सहारा देते हैं, जबकि {{caution_factor}} तुलनात्मक रूप से कमज़ोर है और सचेत प्रयास चाहता है।'),
  ...B('sec.kundli_indicates.support_only','section',
    'In your birth chart, {{support_factors}} give the main support in this area.',
    'आपकी जन्म कुंडली में {{support_factors}} इस विषय में मुख्य सहारा देते हैं।'),
  ...B('sec.kundli_indicates.caution_only','section',
    'In your birth chart, the relevant factors are modest, and {{caution_factor}} in particular needs conscious effort.',
    'आपकी जन्म कुंडली में संबंधित कारक सामान्य हैं, और विशेष रूप से {{caution_factor}} सचेत प्रयास चाहता है।'),
  ...B('sec.kundli_indicates.neutral','section',
    'In your birth chart, the factors relevant to this question are balanced — neither strongly supportive nor strongly adverse.',
    'आपकी जन्म कुंडली में इस प्रश्न से जुड़े कारक संतुलित हैं — न अत्यधिक सहायक, न अत्यधिक प्रतिकूल।'),

  // — divisional-chart section bodies —
  ...B('sec.dchart.supports','section',
    'The divisional chart view ({{dchart_support}}) reinforces this reading.',
    'विभाजन चार्ट ({{dchart_support}}) इस विश्लेषण को पुष्ट करता है।'),
  ...B('sec.dchart.contradicts','section',
    'However, the divisional chart view ({{dchart_against}}) points the other way, so the picture is not one-sided.',
    'किंतु विभाजन चार्ट ({{dchart_against}}) विपरीत संकेत देता है, इसलिए स्थिति एकतरफ़ा नहीं है।'),
  ...B('sec.dchart.mixed_signals','section',
    'The divisional charts give mixed signals here: {{dchart_support}} supports the reading while {{dchart_against}} points the other way — treat the conclusion as balanced rather than one-sided.',
    'विभाजन चार्ट यहाँ मिश्रित संकेत देते हैं: {{dchart_support}} विश्लेषण का समर्थन करता है जबकि {{dchart_against}} विपरीत दिशा दिखाता है — निष्कर्ष को एकतरफ़ा नहीं, संतुलित मानें।'),
  ...B('sec.dchart.agrees','section',
    'The relevant divisional chart broadly agrees with the birth chart.',
    'संबंधित विभाजन चार्ट मोटे तौर पर जन्म कुंडली से सहमत है।'),

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
  ...B('frag.window_line','fragment',
    ' A relatively supportive window runs while {{planet}} transits {{sign}} (roughly until {{date}}).',
    ' {{planet}} के {{sign}} में गोचर के दौरान अपेक्षाकृत अनुकूल अवधि रहती है (लगभग {{date}} तक)।'),
  ...B('frag.window_line_open','fragment',
    ' A relatively supportive window runs while {{planet}} transits {{sign}}.',
    ' {{planet}} के {{sign}} में गोचर के दौरान अपेक्षाकृत अनुकूल अवधि रहती है।'),
  ...B('frag.no_window_line','fragment',
    ' No strongly supportive slow-planet window stands out in the near term, so favour steady preparation over forcing timing.',
    ' निकट भविष्य में कोई प्रबल अनुकूल धीमे-ग्रह अवधि प्रमुख नहीं दिखती, इसलिए समय पर ज़ोर देने के बजाय स्थिर तैयारी करें।'),
  ...B('frag.dasha_line','fragment',
    ' Your running {{maha_lord}} period sets the background tone.',
    ' आपकी वर्तमान {{maha_lord}} दशा पृष्ठभूमि का स्वर तय करती है।'),
  ...B('frag.role_maha','fragment',
    ' (also your running Mahadasha lord)', ' (जो आपकी वर्तमान महादशा स्वामी भी है)'),
  ...B('frag.role_antar','fragment',
    ' (your running Antardasha lord)', ' (आपकी वर्तमान अंतर्दशा स्वामी)'),

  // — positive / caution section bodies —
  ...B('sec.positive.factors','section',
    'Your strongest support comes from {{positive_factors}}. Building deliberately on this raises the odds in your favour.',
    'आपका सबसे बड़ा सहारा {{positive_factors}} से आता है। इस पर सोच-समझकर निर्माण करने से संभावना आपके पक्ष में बढ़ती है।'),
  ...B('sec.positive.no_factors','section',
    'No single factor stands out strongly, but a steady, workable base is present — deliberate, consistent effort builds on it.',
    'कोई एक कारक विशेष रूप से प्रबल नहीं है, फिर भी एक स्थिर, उपयोगी आधार मौजूद है — नियोजित और निरंतर प्रयास इसे बढ़ाता है।'),
  ...B('sec.caution.factors','section',
    'Keep a realistic watch on {{caution_factors}}; avoid rushed, irreversible commitments in this area.',
    '{{caution_factors}} पर वास्तविक ध्यान रखें; इस क्षेत्र में जल्दबाज़ी में अपरिवर्तनीय निर्णय न लें।'),
  ...B('sec.caution.no_factors','section',
    'No single factor is strongly adverse; the main caution is simply to avoid over-confidence and verify facts before big steps.',
    'कोई एक कारक अत्यधिक प्रतिकूल नहीं है; मुख्य सावधानी यही है कि अति-आत्मविश्वास से बचें और बड़े कदम से पहले तथ्य जाँचें।'),

  // — timing outlook section bodies —
  ...B('sec.timing_outlook.supportive','section',
    'The current slow-planet window is broadly supportive — a reasonable period to prepare and act deliberately.',
    'वर्तमान धीमे-ग्रह अवधि मोटे तौर पर सहायक है — तैयारी और सोच-समझकर कार्य के लिए उपयुक्त समय।'),
  ...B('sec.timing_outlook.mixed','section',
    'The current window is mixed — progress is realistic through steady preparation and follow-up.',
    'वर्तमान अवधि मिश्रित है — निरंतर तैयारी और अनुवर्तन से प्रगति संभव है।'),
  ...B('sec.timing_outlook.caution','section',
    'The current slow-planet window asks for patience — use it to prepare rather than to force outcomes.',
    'वर्तमान धीमे-ग्रह अवधि धैर्य मांगती है — परिणाम पर ज़ोर देने के बजाय तैयारी में इसका उपयोग करें।'),

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

// ── Per-state assessment phrases (reused inside direct answers) ───────────────
const STATE_PHRASE = {
  highly_favourable: [
    'the indications are strongly supportive',
    'संकेत प्रबल रूप से अनुकूल हैं'],
  favourable: [
    'the indications are favourable',
    'संकेत अनुकूल हैं'],
  moderately_favourable: [
    'the indications are moderately favourable — workable with steady effort',
    'संकेत सामान्यतः अनुकूल हैं — निरंतर प्रयास से साध्य'],
  mixed: [
    'the indications are mixed — the possibility is present, but preparation and timing matter more than a quick yes or no',
    'संकेत मिश्रित हैं — संभावना मौजूद है, लेकिन जल्दी हाँ या ना से अधिक तैयारी और समय महत्वपूर्ण हैं'],
  challenging: [
    'the indications call for careful effort — strengthen preparation instead of forcing an immediate result',
    'संकेत सतर्क प्रयास मांगते हैं — तुरंत परिणाम पर ज़ोर देने के बजाय तैयारी मजबूत करें'],
  highly_challenging: [
    'this area asks for extra care right now — move gradually, protect what you can control, and avoid irreversible steps',
    'यह क्षेत्र अभी अधिक सावधानी मांगता है — धीरे-धीरे बढ़ें, जो नियंत्रण में है उसे संभालें, और अपरिवर्तनीय कदम न उठाएँ'],
};

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

// Favourability-question topics (direct answers embed these).
const TOPIC = {
  Q012: ['the choice between a job and your own business','नौकरी और व्यवसाय के चुनाव'],
  Q021: ['running your own business','व्यवसाय करने'],
  Q031: ['wealth prospects','धन प्राप्ति के योग'],
  Q051: ['the prospects of having children','संतान प्राप्ति के योग'],
  Q061: ['the most suitable field of education','उपयुक्त शिक्षा क्षेत्र'],
  Q071: ['your general health tendencies','आपकी सामान्य स्वास्थ्य प्रवृत्तियों'],
};

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

function directAnswerRows() {
  const rows = [];
  for (const state of STATES) {
    const [phraseEn, phraseHi] = STATE_PHRASE[state];

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

    // Q041 / Q081 — timing answers
    rows.push(T('Q041','direct_answer',state,'en',
      `On the timing of marriage, ${phraseEn}.{{window_line}}{{dasha_line}} This is guidance on likely periods, not a guaranteed event date.`));
    rows.push(T('Q041','direct_answer',state,'hi',
      `विवाह के समय पर, ${phraseHi}।{{window_line}}{{dasha_line}} यह संभावित अवधियों का मार्गदर्शन है, निश्चित घटना-तिथि नहीं।`));
    rows.push(T('Q081','direct_answer',state,'en',
      `On the timing of buying a house, ${phraseEn}.{{window_line}}{{dasha_line}} This is guidance on likely periods, not a guaranteed event date.`));
    rows.push(T('Q081','direct_answer',state,'hi',
      `मकान खरीदने के समय पर, ${phraseHi}।{{window_line}}{{dasha_line}} यह संभावित अवधियों का मार्गदर्शन है, निश्चित घटना-तिथि नहीं।`));

    // Six favourability questions
    for (const [code, [topicEn, topicHi]] of Object.entries(TOPIC)) {
      rows.push(T(code,'direct_answer',state,'en',
        `On ${topicEn}, ${phraseEn}. This is a tendency to work with, not a fixed verdict.`));
      rows.push(T(code,'direct_answer',state,'hi',
        `${topicHi} के संबंध में, ${phraseHi}। यह प्रवृत्ति है, निश्चित निर्णय नहीं।`));
    }
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

module.exports = { PILOT_CODES, STATES, SHARED_BLOCKS, buildTemplates, TOPIC, PRACTICAL };
