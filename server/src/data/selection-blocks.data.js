'use strict';
/**
 * Selection answer content — the language a ranked answer speaks.
 *
 * Seeded into answer_shared_blocks by seed 038. Field titles/reasons/examples come
 * from education-fields.data.js (one source for the taxonomy); this module adds
 * the surrounding language: fit labels, primary directions, the Varga note, the
 * practical plan, and the section titles.
 *
 * Hindi register matches the rest of the engine: natural Hindi, English only where
 * the English word IS the ordinary usage (software, IT, course, project).
 */

const { FIELDS } = require('./education-fields.data');

const B = (block_key, type, en, hi) => [
  { block_key, type, lang: 'en', version: 1, text: en },
  { block_key, type, lang: 'hi', version: 1, text: hi },
];

// ── Fit labels ───────────────────────────────────────────────────────────────
const FIT = [
  ...B('sel.fit.best_fit', 'label', 'Best fit', 'सबसे उपयुक्त'),
  ...B('sel.fit.strong', 'label', 'Strong option', 'मजबूत विकल्प'),
  ...B('sel.fit.supportive', 'label', 'Supportive option', 'अच्छा विकल्प'),
  ...B('sel.fit.conditional', 'label', 'Conditional option', 'कुछ शर्तों के साथ'),
  ...B('sel.fit.lower_fit', 'label', 'Lower fit', 'अपेक्षाकृत कम उपयुक्त'),
];

// ── Primary direction, by the planet carrying the top options ────────────────
// This is a summary OF the ranking, so it can never contradict it.
const DIRECTION = [
  ...B('sel.direction.education.mercury', 'section',
    'Technical, analytical and problem-solving study.',
    'तकनीकी, विश्लेषणात्मक और समस्या-समाधान आधारित शिक्षा।'),
  ...B('sel.direction.education.mars', 'section',
    'Technical, hands-on study with a competitive edge.',
    'तकनीकी, व्यावहारिक और प्रतिस्पर्धी प्रकृति की शिक्षा।'),
  ...B('sel.direction.education.jupiter', 'section',
    'Academic, advisory and principle-led study.',
    'अकादमिक, परामर्श-प्रधान और सिद्धांत-आधारित शिक्षा।'),
  ...B('sel.direction.education.sun', 'section',
    'Authority-led study — administration, public service and leadership.',
    'अधिकार-प्रधान शिक्षा — प्रशासन, लोक सेवा और नेतृत्व।'),
  ...B('sel.direction.education.venus', 'section',
    'Creative and aesthetic study — design, media and presentation.',
    'रचनात्मक और सौंदर्य-प्रधान शिक्षा — डिज़ाइन, मीडिया और प्रस्तुति।'),
  ...B('sel.direction.education.moon', 'section',
    'People-centred study — care, psychology and public dealing.',
    'व्यक्ति-केंद्रित शिक्षा — देखभाल, मनोविज्ञान और जन-व्यवहार।'),
  ...B('sel.direction.education.saturn', 'section',
    'Structured, long-horizon study — systems, operations and infrastructure.',
    'व्यवस्थित और दीर्घकालिक शिक्षा — प्रणालियाँ, संचालन और अधोसंरचना।'),
  ...B('sel.direction.education.rahu', 'section',
    'Unconventional and technology-led study, including foreign options.',
    'अपरंपरागत और तकनीक-प्रधान शिक्षा, विदेश के विकल्पों सहित।'),
  ...B('sel.direction.education.ketu', 'section',
    'Deep, specialised study — research and classical subjects.',
    'गहन और विशेषज्ञता-प्रधान शिक्षा — शोध और शास्त्रीय विषय।'),
  ...B('sel.direction.education.default', 'section',
    'A broad base with no single dominant leaning — interest should decide the direction.',
    'कोई एक प्रबल झुकाव नहीं, आधार व्यापक है — दिशा रुचि से तय होनी चाहिए।'),
];

// ── Varga note + blocked caveat + plan ───────────────────────────────────────
const SUPPORT = [
  ...B('sel.varga.education', 'section',
    'D24 is the divisional chart for formal learning, so it speaks to whether a course gets completed and a qualification is actually earned — not to which subject you enjoy.',
    'D24 औपचारिक शिक्षा का विभाजन चार्ट है, इसलिए यह बताता है कि कोई पाठ्यक्रम पूरा होगा या नहीं और योग्यता वास्तव में अर्जित होगी या नहीं — यह नहीं कि कौन-सा विषय आपको रुचिकर लगेगा।'),

  ...B('sel.blocked.education', 'section',
    'This field depends on {{planet}}, which is weak in your chart — so it stays possible, but it would ask for noticeably more effort than the options above.',
    'यह क्षेत्र {{planet}} पर निर्भर है, जो आपकी कुंडली में कमज़ोर है — इसलिए यह संभव तो है, पर ऊपर बताए विकल्पों की तुलना में स्पष्ट रूप से अधिक प्रयास माँगेगा।'),
  ...B('sel.blocked.default', 'section',
    'This option depends on {{planet}}, which is weak in your chart, so it would ask for more effort than the options above.',
    'यह विकल्प {{planet}} पर निर्भर है, जो आपकी कुंडली में कमज़ोर है, इसलिए यह ऊपर बताए विकल्पों से अधिक प्रयास माँगेगा।'),

  ...B('sel.test_plan.education', 'section',
    'Shortlist the top three fields. Take a 2–4 week beginner course in each, and build one small project in each. Then compare three things honestly: which held your interest, which you were actually good at, and which has real demand where you want to work. Decide on that evidence — this reading points at a leaning, it cannot measure your aptitude.',
    'ऊपर बताए तीन क्षेत्र चुनें। हर एक में 2–4 सप्ताह का शुरुआती course करें और एक छोटा project बनाएँ। फिर तीन बातों की ईमानदारी से तुलना करें: किसमें रुचि बनी रही, किसमें आप वास्तव में अच्छे थे, और जहाँ आप काम करना चाहते हैं वहाँ किसकी वास्तविक माँग है। निर्णय इसी प्रमाण पर लें — यह विश्लेषण झुकाव बताता है, आपकी योग्यता नहीं माप सकता।'),
  ...B('sel.test_plan.default', 'section',
    'Test the top options before committing to one. Try each in the smallest way that produces real evidence, then compare interest, performance and opportunity. This reading indicates a leaning, not an aptitude measurement.',
    'किसी एक पर प्रतिबद्ध होने से पहले ऊपर बताए विकल्पों को परखें। हर एक को उतने छोटे रूप में आज़माएँ जिससे वास्तविक प्रमाण मिले, फिर रुचि, प्रदर्शन और अवसर की तुलना करें। यह विश्लेषण झुकाव दर्शाता है, योग्यता का माप नहीं।'),

  // Non-fatalistic by construction: a leaning, never a promise of success.
  ...B('sel.disclaimer.education', 'note',
    'This describes an astrological leaning, not a prediction of success. It is not an aptitude test and should not replace career counselling, your own results, or an honest look at what the job market wants.',
    'यह ज्योतिषीय झुकाव दर्शाता है, सफलता की भविष्यवाणी नहीं। यह योग्यता परीक्षण नहीं है और इसे करियर परामर्श, आपके अपने परिणामों, या नौकरी बाज़ार की वास्तविक माँग के विश्लेषण का विकल्प नहीं बनाना चाहिए।'),
];

// ── Section titles ───────────────────────────────────────────────────────────
const TITLES = [
  ...B('label.sec.primary_direction', 'label', 'Primary direction', 'मुख्य दिशा'),
  ...B('label.sec.recommended_options', 'label', 'Most suitable fields', 'सबसे उपयुक्त क्षेत्र'),
  ...B('label.sec.secondary_options', 'label', 'Supporting options', 'सहायक विकल्प'),
  ...B('label.sec.lower_options', 'label', 'Less suitable right now', 'अभी अपेक्षाकृत कम उपयुक्त'),
  ...B('label.sec.test_plan', 'label', 'How to test this', 'इसे कैसे परखें'),
];

// ── Per-field content, from the taxonomy ─────────────────────────────────────
function fieldRows() {
  const rows = [];
  for (const f of FIELDS) {
    rows.push(...B(`sel.education.${f.key}.title`, 'label', f.en.title, f.hi.title));
    rows.push(...B(`sel.education.${f.key}.reason`, 'section', f.en.reason, f.hi.reason));
    rows.push(...B(`sel.education.${f.key}.examples`, 'fragment', f.en.examples, f.hi.examples));
  }
  return rows;
}

// ── Domain potential — fixes `positive` duplicating the evidence section ─────
// The evidence section already names each supporting planet and what it supports.
// Repeating those same sentences under "Positive potential" was byte-identical
// duplication. Potential is a different claim: what the support MAKES POSSIBLE.
const POTENTIAL = [
  ...B('potential.finance', 'section',
    'The realistic upside here is steady accumulation rather than a windfall — income that compounds because it is tracked, not because it is large.',
    'यहाँ वास्तविक संभावना किसी अचानक लाभ की नहीं, स्थिर संचय की है — ऐसी आय जो बड़ी होने के कारण नहीं, हिसाब में रहने के कारण बढ़ती है।'),
  ...B('potential.business', 'section',
    'The realistic upside is a venture that grows on proof rather than optimism — small, tested, and funded from what it earns.',
    'वास्तविक संभावना ऐसे उद्यम की है जो आशावाद पर नहीं, प्रमाण पर बढ़े — छोटा, परखा हुआ, और अपनी कमाई से चलने वाला।'),
  ...B('potential.career', 'section',
    'The realistic upside is advancement earned through demonstrated work — slower than a move, but it holds.',
    'वास्तविक संभावना उस प्रगति की है जो किए हुए काम के प्रमाण से मिले — नौकरी बदलने से धीमी, पर टिकाऊ।'),
  ...B('potential.health', 'section',
    'The realistic upside is that the things which most affect you here are the ones you control — sleep, routine, and acting early on a symptom.',
    'वास्तविक संभावना यह है कि यहाँ आपको सबसे अधिक प्रभावित करने वाली बातें वही हैं जो आपके नियंत्रण में हैं — नींद, दिनचर्या, और लक्षण पर समय रहते ध्यान।'),
  ...B('potential.marriage', 'section',
    'The realistic upside is a bond that deepens with understanding rather than one that arrives complete.',
    'वास्तविक संभावना ऐसे संबंध की है जो बना-बनाया न मिले, बल्कि समझ के साथ गहरा होता जाए।'),
  ...B('potential.children', 'section',
    'The realistic upside is a warm and supportive bond, with patience doing more of the work than planning.',
    'वास्तविक संभावना स्नेहपूर्ण और सहयोगी संबंध की है, जिसमें योजना से अधिक धैर्य काम आएगा।'),
  ...B('potential.education', 'section',
    'The realistic upside is real mastery in a chosen subject — reached through structure rather than through raw ability.',
    'वास्तविक संभावना किसी चुने हुए विषय में वास्तविक महारत की है — जो कच्ची योग्यता से नहीं, व्यवस्था से मिलेगी।'),
  ...B('potential.property', 'section',
    'The realistic upside is ownership that settles cleanly, because the paperwork was done before the payment.',
    'वास्तविक संभावना ऐसे स्वामित्व की है जो बिना विवाद टिके, क्योंकि भुगतान से पहले काग़ज़ात पूरे किए गए।'),
  ...B('potential.general', 'section',
    'The realistic upside is that your strengths here are usable rather than latent — they respond to being applied deliberately.',
    'वास्तविक संभावना यह है कि यहाँ आपकी शक्तियाँ सुप्त नहीं, उपयोग योग्य हैं — वे सोच-समझकर लगाए जाने पर फल देती हैं।'),
  ...B('potential.timing', 'section',
    'The realistic upside is that this period rewards preparation, which is the part that does not depend on timing at all.',
    'वास्तविक संभावना यह है कि यह समय तैयारी को फल देता है — और तैयारी वह हिस्सा है जो समय पर निर्भर ही नहीं करता।'),
];

function buildSelectionBlocks() {
  return [...FIT, ...DIRECTION, ...SUPPORT, ...TITLES, ...POTENTIAL, ...fieldRows()];
}

module.exports = { buildSelectionBlocks, FIT, DIRECTION, SUPPORT, TITLES, POTENTIAL, fieldRows };
