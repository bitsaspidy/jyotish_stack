'use strict';
/**
 * Judgement clauses — the Human Conversation layer's words.
 *
 * The CLAIM reuses `direct_answer.<domain>.<state>` (seed 037), which is already
 * written as a plain-speech conclusion. This module adds the three clauses that
 * turn a claim into a reading:
 *
 *   qualifier  why it is not simple — keyed by the verdict's ALIGNMENT, so two
 *              charts in the same state get different judgements when they are in
 *              that state for different reasons
 *   approach   what to do given that pattern
 *   condition  what would move the reading — the sentence that puts something
 *              back in the reader's hands
 *
 * No sentence here may be true of everyone. "Careful effort helps" and "results
 * depend on effort" are banned by construction: every clause below names the
 * specific pattern the chart showed.
 */

const B = (block_key, type, en, hi) => [
  { block_key, type, lang: 'en', version: 1, text: en },
  { block_key, type, lang: 'hi', version: 1, text: hi },
];

// ── Qualifiers, by why the verdict stands ────────────────────────────────────
// {{planet}} / {{varga}} are filled from the verdict's primary_reason, so the
// qualifier names the actual obstacle rather than gesturing at one.
const QUALIFIER = [
  ...B('judgement.qualifier.primary_blocker', 'section',
    'The thing holding it back is specific rather than general: {{planet}} is weak in exactly the part of your chart this depends on, so effort spent elsewhere will not fix it.',
    'इसे रोकने वाली बात सामान्य नहीं, विशिष्ट है: {{planet}} आपकी कुंडली के ठीक उसी हिस्से में कमज़ोर है जिस पर यह विषय निर्भर करता है, इसलिए कहीं और लगाया गया प्रयास इसे ठीक नहीं करेगा।'),
  ...B('judgement.qualifier.varga_contradiction', 'section',
    'Your birth chart is more optimistic here than the deeper {{varga}} reading, and when those two disagree the deeper one usually decides how things actually turn out.',
    'इस विषय में आपकी जन्म कुंडली गहरे {{varga}} विश्लेषण से अधिक आशावादी है, और जब दोनों असहमत हों तो प्रायः गहरा विश्लेषण ही तय करता है कि वास्तव में क्या होगा।'),
  ...B('judgement.qualifier.mixed_primary', 'section',
    'Real support and a real obstacle sit side by side here — this is not a weak chart, it is a divided one, which is why the outcome depends so much on which side you feed.',
    'यहाँ वास्तविक सहारा और वास्तविक बाधा साथ-साथ हैं — यह कमज़ोर कुंडली नहीं, बँटी हुई कुंडली है। इसीलिए परिणाम इस पर निर्भर करता है कि आप किस पक्ष को बल देते हैं।'),
  ...B('judgement.qualifier.timing_gap', 'section',
    'The promise is present but not currently switched on: your chart supports this, and your running period does not yet, which is a delay rather than a denial.',
    'योग मौजूद है पर अभी सक्रिय नहीं: आपकी कुंडली इसका समर्थन करती है, पर वर्तमान दशा अभी नहीं — यह इनकार नहीं, देरी है।'),
  ...B('judgement.qualifier.primary_caution', 'section',
    'The main indicators for this are under pressure right now, so this is a phase to work through rather than a settled fact about your life.',
    'इस विषय के मुख्य संकेतक अभी दबाव में हैं, इसलिए यह आपके जीवन का तय तथ्य नहीं, एक ऐसा दौर है जिससे होकर गुज़रना है।'),
];

// ── Approach, by pattern ─────────────────────────────────────────────────────
// What to DO given this specific reasoning — not given this domain in general.
const APPROACH = [
  // business
  ...B('judgement.business.approach.primary_blocker', 'section',
    'A gradual, low-risk business run alongside a stable income suits you far better than a full commitment made early.',
    'पूरी तरह से जल्दी कूद पड़ने के बजाय, स्थिर आय के साथ-साथ चलाया गया धीमा और कम-जोखिम वाला व्यवसाय आपके लिए कहीं अधिक उपयुक्त है।'),
  ...B('judgement.business.approach.mixed_primary', 'section',
    'Start small enough that being wrong is survivable, and let the paying customers — not your enthusiasm — decide when to scale.',
    'शुरुआत इतनी छोटी रखें कि ग़लत होने पर भी संभला जा सके, और विस्तार कब करना है यह आपका उत्साह नहीं, भुगतान करने वाले ग्राहक तय करें।'),
  ...B('judgement.business.approach.timing_gap', 'section',
    'Use this period to build the thing quietly — customers, capital and proof — so that when the period turns you are launching, not starting.',
    'इस अवधि का उपयोग चुपचाप आधार बनाने में करें — ग्राहक, पूँजी और प्रमाण — ताकि जब समय बदले तो आप शुरुआत नहीं, शुरू की हुई चीज़ को आगे बढ़ा रहे हों।'),
  ...B('judgement.business.approach.default', 'section',
    'Build on proof rather than optimism: test demand before capital, and keep the first commitment small enough to reverse.',
    'आशावाद पर नहीं, प्रमाण पर बढ़ें: पूँजी लगाने से पहले माँग परखें, और पहली प्रतिबद्धता इतनी छोटी रखें कि उससे लौटा जा सके।'),

  // career
  ...B('judgement.career.approach.primary_blocker', 'section',
    'Growth here comes from removing the one specific obstacle above, not from working harder at everything.',
    'यहाँ प्रगति हर चीज़ में अधिक मेहनत से नहीं, ऊपर बताई उस एक विशिष्ट बाधा को हटाने से आएगी।'),
  ...B('judgement.career.approach.default', 'section',
    'Let your work be the argument: build a record that makes the case for you, rather than moving to escape the current one.',
    'आपका काम ही आपका तर्क बने: वर्तमान से भागने के बजाय ऐसा रिकॉर्ड बनाएँ जो आपके पक्ष में स्वयं बोले।'),

  // finance
  ...B('judgement.finance.approach.primary_blocker', 'section',
    'Money is not your problem here — holding on to it is. Fix the leak before chasing a bigger inflow.',
    'यहाँ समस्या धन की नहीं, उसे रोक पाने की है। बड़ी आय के पीछे भागने से पहले रिसाव बंद करें।'),
  ...B('judgement.finance.approach.default', 'section',
    'Wealth here is built by what you keep rather than what you earn — track it before you try to grow it.',
    'यहाँ धन उससे बनेगा जो आप रोकते हैं, उससे नहीं जो कमाते हैं — बढ़ाने से पहले उसका हिसाब रखें।'),

  // marriage
  ...B('judgement.marriage.approach.primary_blocker', 'section',
    'What needs work is a specific thing between two people, not the match itself — which means it is workable.',
    'जिस पर काम चाहिए वह दो व्यक्तियों के बीच की एक विशिष्ट बात है, रिश्ता स्वयं नहीं — और इसका अर्थ है कि यह सुधारा जा सकता है।'),
  ...B('judgement.marriage.approach.default', 'section',
    'Say what you actually expect rather than assuming it is understood — most of what looks like incompatibility here is unspoken expectation.',
    'अपेक्षा को समझा हुआ मानने के बजाय स्पष्ट कहें — यहाँ जो असंगति जैसा दिखता है, उसका अधिकांश अनकही अपेक्षा है।'),

  // health
  ...B('judgement.health.approach.primary_blocker', 'section',
    'The pressure is in one identifiable area rather than your constitution as a whole, so targeted care will do more than general worry.',
    'दबाव आपकी समग्र शारीरिक क्षमता में नहीं, एक पहचाने जा सकने वाले क्षेत्र में है, इसलिए सामान्य चिंता से अधिक लक्षित देखभाल काम करेगी।'),
  ...B('judgement.health.approach.default', 'section',
    'The things that move this most are the ones you already control — sleep, routine, and acting early rather than waiting.',
    'इसे सबसे अधिक प्रभावित करने वाली बातें वही हैं जो पहले से आपके नियंत्रण में हैं — नींद, दिनचर्या, और प्रतीक्षा के बजाय समय रहते कदम।'),

  // property
  ...B('judgement.property.approach.timing_gap', 'section',
    'Use this stretch to get finance and paperwork finished, so that when the period turns you can act instead of prepare.',
    'इस अवधि का उपयोग पैसे की व्यवस्था और काग़ज़ात पूरे करने में करें, ताकि समय बदलने पर आप तैयारी नहीं, कदम उठा सकें।'),
  ...B('judgement.property.approach.default', 'section',
    'Let the paperwork lead the payment: verification is what decides this, not the price you negotiate.',
    'भुगतान से पहले काग़ज़ात चलें: यहाँ परिणाम मोल-भाव से नहीं, जाँच से तय होता है।'),

  // shared fallbacks
  ...B('judgement.children.approach.default', 'section',
    'Patience will do more here than planning, and medical guidance more than either.',
    'यहाँ योजना से अधिक धैर्य काम आएगा, और दोनों से अधिक चिकित्सकीय मार्गदर्शन।'),
  ...B('judgement.education.approach.default', 'section',
    'Structure beats ability here — the reader who builds a routine will outrun the one who relies on being quick.',
    'यहाँ योग्यता से अधिक व्यवस्था काम करती है — जो दिनचर्या बनाएगा वह तेज़ बुद्धि के भरोसे बैठे व्यक्ति से आगे निकलेगा।'),
  ...B('judgement.general.approach.default', 'section',
    'Work with your temperament rather than against it: the strengths above are usable, and the weaker side needs balancing, not defeating.',
    'अपने स्वभाव के विरुद्ध नहीं, उसके साथ चलें: ऊपर बताई शक्तियाँ उपयोग योग्य हैं, और कमज़ोर पक्ष को हराना नहीं, संतुलित करना है।'),
  ...B('judgement.timing.approach.default', 'section',
    'Match the effort to the period rather than pushing against it — preparation is the part that pays regardless of timing.',
    'प्रयास को समय के विरुद्ध नहीं, उसके अनुरूप रखें — तैयारी वह हिस्सा है जो समय चाहे जैसा हो, फल देता है।'),
];

// ── Condition — what would move the reading ─────────────────────────────────
// The sentence that puts something back in the reader's hands.
const CONDITION = [
  ...B('judgement.business.condition', 'section',
    'Once it is producing steady paying customers without your constant push, your odds of long-term success improve markedly.',
    'जब यह आपके लगातार धक्के के बिना नियमित भुगतान करने वाले ग्राहक देने लगे, तब दीर्घकालिक सफलता की संभावना स्पष्ट रूप से बढ़ जाती है।'),
  ...B('judgement.career.condition', 'section',
    'Once your results are visible to the people who decide, the recognition tends to follow on its own.',
    'जब आपके परिणाम निर्णय लेने वालों को दिखने लगें, तब पहचान प्रायः अपने-आप आ जाती है।'),
  ...B('judgement.finance.condition', 'section',
    'Once the outflow is visible and controlled, the same income starts producing savings it never did before.',
    'जब खर्च दिखने और नियंत्रण में आने लगे, तब वही आय ऐसी बचत देने लगती है जो पहले कभी नहीं दी।'),
  ...B('judgement.marriage.condition', 'section',
    'Once expectations are spoken rather than assumed, most of the friction this chart shows tends to settle.',
    'जब अपेक्षाएँ मान लेने के बजाय कही जाने लगें, तब यह कुंडली जो टकराव दिखाती है उसका अधिकांश शांत हो जाता है।'),
  ...B('judgement.health.condition', 'section',
    'Once sleep and routine are steady, the energy this chart shows as unreliable usually becomes reliable.',
    'जब नींद और दिनचर्या स्थिर हो जाएँ, तब यह कुंडली जिस ऊर्जा को अस्थिर दिखाती है वह प्रायः भरोसेमंद हो जाती है।'),
  ...B('judgement.property.condition', 'section',
    'Once finance and title are both clear, this moves from a hope to a decision you can actually make.',
    'जब पैसे की व्यवस्था और मालिकाना हक़ दोनों स्पष्ट हो जाएँ, तब यह आशा से हटकर ऐसा निर्णय बन जाता है जो वास्तव में लिया जा सके।'),
  ...B('judgement.education.condition', 'section',
    'Once you have tested a field with real work rather than imagining it, the right choice usually becomes obvious.',
    'जब आप किसी क्षेत्र को कल्पना से नहीं, वास्तविक काम से परख लेंगे, तब सही चुनाव प्रायः स्वयं स्पष्ट हो जाता है।'),
];

function buildJudgementBlocks() {
  return [...QUALIFIER, ...APPROACH, ...CONDITION];
}

module.exports = { buildJudgementBlocks, QUALIFIER, APPROACH, CONDITION };
