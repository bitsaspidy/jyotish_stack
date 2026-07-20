'use strict';
/**
 * Public Grah Gochar content — the astrology behind /planetary-positions.
 *
 * ⚖️ OWNER-REVIEWED CONTENT. Every string here is astrology the owner is the
 * authority on. Drafted for review; nothing reaches users until the owner reads
 * the rendered page and deploys.
 *
 * ⚠️ HONESTY CONSTRAINT — READ BEFORE ADDING ANYTHING
 * This page has NO birth chart. The visitor is anonymous. So everything here must
 * be true of the SKY, not of a person:
 *   - which sign a planet occupies, its dignity there, retrograde, nakshatra,
 *     and how long the transit lasts are FACTS about the sky;
 *   - "this will affect your career" is NOT — that depends on the visitor's Moon
 *     and Lagna, which we do not have.
 * The page therefore reads the sky accurately and says plainly that where it lands
 * depends on the individual chart. That gap is the honest reason to sign up; it
 * does not need to be manufactured with fear or false urgency, and the product's
 * own disclaimer ("focus on the remedies, not on fear") rules that out anyway.
 *
 * Composition, not 108 hand-written paragraphs: planet nature × sign nature ×
 * dignity, assembled by the service. Same approach as the transit engine.
 */

// ── What each planet governs — VALENCE-NEUTRAL noun phrases ─────────────────
// Neutral because the same phrase is composed under a strong dignity AND a weak
// one; a phrase carrying its own verdict makes one of the two absurd.
const PLANET_SIGNIFIES = {
  Sun:     { en: 'authority, confidence, health and the father',        hi: 'अधिकार, आत्मविश्वास, स्वास्थ्य और पिता' },
  Moon:    { en: 'the mind, emotions, the mother and daily comfort',    hi: 'मन, भावनाएँ, माता और दैनिक सुख' },
  Mars:    { en: 'energy, courage, land, disputes and siblings',        hi: 'ऊर्जा, साहस, भूमि, विवाद और भाई-बहन' },
  Mercury: { en: 'speech, trade, learning, analysis and paperwork',     hi: 'वाणी, व्यापार, शिक्षा, विश्लेषण और दस्तावेज़' },
  Jupiter: { en: 'wisdom, teachers, wealth, children and dharma',       hi: 'ज्ञान, गुरु, धन, संतान और धर्म' },
  Venus:   { en: 'relationships, comfort, art, vehicles and beauty',    hi: 'संबंध, सुख, कला, वाहन और सौंदर्य' },
  Saturn:  { en: 'discipline, labour, delay, structure and longevity',  hi: 'अनुशासन, परिश्रम, विलंब, व्यवस्था और आयु' },
  Rahu:    { en: 'ambition, foreign matters, technology and sudden rise', hi: 'महत्वाकांक्षा, विदेश, तकनीक और अचानक उन्नति' },
  Ketu:    { en: 'detachment, research, spirituality and letting go',   hi: 'वैराग्य, शोध, आध्यात्म और त्याग' },
};

/**
 * The temperament each sign imposes on whatever transits it.
 *
 * Split into `manner` (how it acts — an adverbial phrase) and `wants` (a complete
 * clause). Keeping them together forced the Hindi frame into "विषय इस समय
 * भावनात्मक रूप से — यह घर की ओर मुड़ता है", which has no verb. Hindi needs its
 * verb after the adverbial, so the composer supplies one and `wants` becomes its
 * own sentence.
 */
const SIGN_STYLE = {
  1:  { manner: { en: 'directly and impatiently',            hi: 'सीधे और अधीरता से' },              wants: { en: 'This sign wants to start things.',            hi: 'यह राशि शुरुआत करना चाहती है।' } },
  2:  { manner: { en: 'slowly and materially',               hi: 'धीरे और भौतिक रूप से' },            wants: { en: 'This sign wants to secure and hold.',          hi: 'यह राशि सुरक्षित करना और थामे रखना चाहती है।' } },
  3:  { manner: { en: 'through words and contacts',          hi: 'शब्दों और संपर्कों के माध्यम से' },  wants: { en: 'This sign wants to discuss and move.',         hi: 'यह राशि बात करना और गतिशील रहना चाहती है।' } },
  4:  { manner: { en: 'emotionally and protectively',        hi: 'भावनात्मक और रक्षात्मक रूप से' },   wants: { en: 'This sign turns towards home and family.',     hi: 'यह राशि घर और परिवार की ओर मुड़ती है।' } },
  // "प्रकट रूप से" would collide with the frame's own verb (प्रकट हो रहे हैं).
  5:  { manner: { en: 'visibly and with pride',              hi: 'खुलकर और गर्व के साथ' },            wants: { en: 'This sign wants recognition.',                 hi: 'यह राशि मान्यता चाहती है।' } },
  6:  { manner: { en: 'analytically and through service',    hi: 'विश्लेषण और सेवा के माध्यम से' },   wants: { en: 'This sign wants to fix the details.',          hi: 'यह राशि बारीकियाँ सुधारना चाहती है।' } },
  7:  { manner: { en: 'through others and negotiation',      hi: 'दूसरों और समझौते के माध्यम से' },   wants: { en: 'This sign seeks balance.',                     hi: 'यह राशि संतुलन खोजती है।' } },
  8:  { manner: { en: 'intensely and privately',             hi: 'तीव्रता और गोपनीयता से' },          wants: { en: 'This sign digs beneath the surface.',          hi: 'यह राशि सतह के नीचे तक जाती है।' } },
  9:  { manner: { en: 'expansively and philosophically',     hi: 'विस्तार और दार्शनिक दृष्टि से' },    wants: { en: 'This sign wants meaning.',                     hi: 'यह राशि अर्थ खोजती है।' } },
  10: { manner: { en: 'practically and ambitiously',         hi: 'व्यावहारिक और महत्वाकांक्षी रूप से' }, wants: { en: 'This sign works towards status.',            hi: 'यह राशि प्रतिष्ठा की ओर बढ़ती है।' } },
  11: { manner: { en: 'through networks and unusual routes', hi: 'समूहों और असामान्य मार्गों से' },    wants: { en: 'This sign wants gain.',                        hi: 'यह राशि लाभ चाहती है।' } },
  12: { manner: { en: 'quietly and inwardly',                hi: 'शांति और अंतर्मुखता से' },          wants: { en: 'This sign dissolves rather than asserts.',     hi: 'यह राशि जोर देने के बजाय विसर्जित करती है।' } },
};

/**
 * Dignity — how well the planet can actually deliver from this sign.
 * Labels match getPlanetDignity() in core-helpers.js exactly; do not re-word them
 * there without updating this map.
 */
const DIGNITY_EFFECT = {
  'Exaltation (उच्च)': {
    key: 'exalted', tone: 'strong',
    label: { en: 'Exalted', hi: 'उच्च' },
    en: 'is at its strongest here — its results come more easily and more fully than usual',
    hi: 'यहाँ अपने सर्वोच्च बल में है — इसके फल सामान्य से अधिक सहजता और पूर्णता से मिलते हैं',
  },
  'Moolatrikona (मूलत्रिकोण)': {
    key: 'moolatrikona', tone: 'strong',
    label: { en: 'Moolatrikona', hi: 'मूलत्रिकोण' },
    en: 'sits in its favourite portion of the zodiac — it acts with confidence and clarity',
    hi: 'राशिचक्र के अपने प्रिय अंश में है — यह आत्मविश्वास और स्पष्टता से कार्य करता है',
  },
  'Own Sign (स्वगृह)': {
    key: 'own', tone: 'strong',
    label: { en: 'Own sign', hi: 'स्वगृह' },
    en: 'is at home here — comfortable, stable, and able to give its natural results',
    hi: 'यहाँ अपने घर में है — सहज, स्थिर, और अपने स्वाभाविक फल देने में सक्षम',
  },
  'Debilitation (नीच)': {
    key: 'debilitated', tone: 'weak',
    label: { en: 'Debilitated', hi: 'नीच' },
    en: 'is in its weakest sign — its results come slowly and need conscious effort to reach',
    hi: 'अपनी सबसे कमज़ोर राशि में है — इसके फल धीरे आते हैं और सचेत प्रयास माँगते हैं',
  },
  Neutral: {
    key: 'neutral', tone: 'neutral',
    label: { en: 'Neutral', hi: 'सम' },
    en: 'is in a neutral sign — it works steadily, neither amplified nor obstructed',
    hi: 'सम राशि में है — यह स्थिर रूप से कार्य करता है, न बढ़ा हुआ न रुका हुआ',
  },
};

/**
 * Friendship with the SIGN LORD — used only when the planet is not exalted,
 * debilitated, in its own sign or in moolatrikona.
 *
 * getPlanetDignity() returns a flat 'Neutral' for every one of those remaining
 * cases, which made six of nine planets read identically on a typical day. A
 * planet in a friend's sign genuinely behaves differently from one in an enemy's,
 * and saying so is the difference between a real reading and filler.
 */
const RELATION_EFFECT = {
  friend: {
    key: 'friend', tone: 'strong',
    label: { en: "Friend's sign", hi: 'मित्र राशि' },
    en: 'is hosted by a friendly sign lord — it gets cooperation and works without much resistance',
    hi: 'मित्र ग्रह की राशि में है — इसे सहयोग मिलता है और यह बिना अधिक बाधा के कार्य करता है',
  },
  enemy: {
    key: 'enemy', tone: 'weak',
    label: { en: "Rival's sign", hi: 'शत्रु राशि' },
    en: 'sits in a rival lord\'s sign — its results meet friction and need patience to hold',
    hi: 'शत्रु ग्रह की राशि में है — इसके फल में रुकावट आती है और उन्हें बनाए रखने में धैर्य चाहिए',
  },
  neutral: {
    key: 'neutral', tone: 'neutral',
    label: { en: 'Neutral sign', hi: 'सम राशि' },
    en: 'is in a neutral sign — it works steadily, neither amplified nor obstructed',
    hi: 'सम राशि में है — यह स्थिर रूप से कार्य करता है, न बढ़ा हुआ न रुका हुआ',
  },
};

const RETROGRADE = {
  en: 'Retrograde now: its themes turn inward. Old matters resurface, decisions get revisited, and progress is better made by reviewing than by launching.',
  hi: 'इस समय वक्री: इसके विषय भीतर की ओर मुड़ते हैं। पुराने मामले फिर उठते हैं, निर्णय दोबारा देखे जाते हैं, और नई शुरुआत से बेहतर है पुनरावलोकन।',
};

// Rahu and Ketu are always retrograde — saying so daily is noise, not insight.
const ALWAYS_RETROGRADE = ['Rahu', 'Ketu'];

const COMBUST_NOTE = {
  en: 'Close to the Sun and combust — its ordinary significations are dimmed while it stays this close.',
  hi: 'सूर्य के निकट और अस्त — जब तक यह इतना निकट है, इसके सामान्य कारकत्व मंद रहते हैं।',
};

/**
 * The honest framing that turns this page into a reason to sign up.
 * It states exactly what the page can and cannot know. No fear, no false urgency —
 * the product's own disclaimer forbids that, and a claim we cannot support would be
 * the fastest way to lose a paying customer's trust.
 */
const PERSONAL_GAP = {
  heading: { en: 'What this means for you', hi: 'आपके लिए इसका क्या अर्थ है' },
  body: {
    en: 'Everything above is the sky as it stands today — it is the same for everyone reading this page. Which part of YOUR life each planet touches depends on where it falls from your Moon sign and your Ascendant, and that needs your birth details. The same Saturn transit that brings promotion to one person brings a change of city to another.',
    hi: 'ऊपर लिखी हर बात आज के आकाश की है — यह इस पृष्ठ को पढ़ने वाले सभी के लिए एक जैसी है। इनमें से कौन-सा ग्रह आपके जीवन के किस हिस्से को छूएगा, यह इस पर निर्भर करता है कि वह आपकी चंद्र राशि और लग्न से किस भाव में पड़ता है — और उसके लिए आपकी जन्म-जानकारी चाहिए। जो शनि गोचर किसी को पदोन्नति देता है, वही किसी और के लिए शहर बदलवा देता है।',
  },
  cta: { en: 'See this in your own chart — free', hi: 'अपनी कुंडली में देखें — निःशुल्क' },
};

const RULE_VERSION = 'gochar-public-v1';

module.exports = {
  PLANET_SIGNIFIES,
  SIGN_STYLE,
  DIGNITY_EFFECT,
  RELATION_EFFECT,
  RETROGRADE,
  ALWAYS_RETROGRADE,
  COMBUST_NOTE,
  PERSONAL_GAP,
  RULE_VERSION,
};
