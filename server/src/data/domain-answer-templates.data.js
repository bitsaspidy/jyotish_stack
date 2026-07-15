'use strict';
/**
 * Domain answer content — the language each life area speaks.
 *
 * Seeded into answer_shared_blocks by seed 037. The DB is the runtime source of
 * truth; this module only feeds the idempotent seed (same contract as
 * question-catalogue.data.js and pilot-answer-templates.data.js).
 *
 * Two rules govern everything below:
 *
 *   1. The same answer state does NOT mean the same sentence. `mixed` for finance
 *      is a claim about savings and timing; `mixed` for health is a claim about
 *      routine and recovery. They share a score band and nothing else.
 *   2. A planet's name is not an explanation. Every planet is written as what it
 *      DOES in that specific life area, so "Venus is weak" can be rendered as the
 *      thing the reader can act on.
 *
 * Hindi register: natural Hindi. English words appear only where the English word
 * IS the ordinary Indian usage (loan, EMI, report) — never as a substitute for a
 * Hindi word that a reader would actually use.
 */

const { LIVE_DOMAINS } = require('../services/deterministic-qa/domains');

const STATES = ['highly_favourable', 'favourable', 'moderately_favourable', 'mixed', 'challenging', 'highly_challenging'];

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// Row builder — one block_key, both languages.
const B = (block_key, type, en, hi) => [
  { block_key, type, lang: 'en', version: 1, text: en },
  { block_key, type, lang: 'hi', version: 1, text: hi },
];

// ── Part 1 — domain-specific direct answers ──────────────────────────────────
// Six states × ten live domains. No sentence is shared between two domains.
const DIRECT = {
  finance: {
    highly_favourable: [
      'Your chart supports wealth building strongly. Earning capacity, the ability to hold on to what comes in, and growth over time all point the same way — this is a position to use deliberately rather than assume.',
      'आपकी कुंडली धन-निर्माण का प्रबल समर्थन करती है। कमाने की क्षमता, आए हुए धन को टिकाए रखने की शक्ति और समय के साथ वृद्धि — तीनों एक ही दिशा में हैं। इस स्थिति का सोच-समझकर उपयोग करें, इसे अपने-आप चलने वाला न मानें।'],
    favourable: [
      'Wealth prospects are good. Income has room to grow and savings can hold, provided spending keeps pace with earning rather than ahead of it.',
      'धन के योग अच्छे हैं। आय बढ़ने की गुंजाइश है और बचत भी टिक सकती है, बशर्ते खर्च आय के साथ चले, उससे आगे नहीं।'],
    moderately_favourable: [
      'Money matters are workable. Steady income is indicated, but real accumulation comes from consistent saving habits rather than from any single large gain.',
      'धन के मामले साध्य हैं। स्थिर आय के संकेत हैं, पर वास्तविक संचय किसी एक बड़े लाभ से नहीं, नियमित बचत की आदत से बनेगा।'],
    mixed: [
      'Your chart shows earning potential, but wealth accumulation is not automatic. Income can improve, while savings, spending control and timing remain important.',
      'आपकी कुंडली में कमाई की क्षमता मौजूद है, लेकिन धन का स्थिर संचय अपने-आप नहीं होगा। आय बढ़ सकती है, पर बचत, खर्च नियंत्रण और सही समय बहुत महत्वपूर्ण रहेंगे।'],
    challenging: [
      'Money needs careful handling in this phase. Earning is not the weak point so much as retention — outflow, obligations and timing are where the pressure sits.',
      'इस दौर में धन को सावधानी से संभालने की ज़रूरत है। कमज़ोरी कमाई में उतनी नहीं, जितनी धन को रोक पाने में है — खर्च, ज़िम्मेदारियाँ और समय ही असली दबाव के बिंदु हैं।'],
    highly_challenging: [
      'This is a period for financial protection rather than expansion. Secure what exists, avoid new exposure, and rebuild the base before reaching for growth.',
      'यह दौर आर्थिक विस्तार का नहीं, बचाव का है। जो है उसे सुरक्षित करें, नया जोखिम न लें, और वृद्धि की ओर बढ़ने से पहले आधार दोबारा मज़बूत करें।'],
  },

  business: {
    highly_favourable: [
      'Business potential is strong. Independent judgement, the appetite to execute, and the ability to hold a market position all support each other here.',
      'व्यवसाय की संभावना प्रबल है। स्वतंत्र निर्णय, काम को अंजाम तक ले जाने की क्षमता और बाज़ार में जगह बनाए रखने की शक्ति — तीनों एक-दूसरे का साथ देते हैं।'],
    favourable: [
      'Business potential is supportive, especially for independent action, leadership and growth-oriented work. Capital discipline and market validation remain essential.',
      'व्यवसाय की संभावना सामान्यतः अच्छी है, विशेषकर स्वतंत्र निर्णय, नेतृत्व और विकास-केंद्रित काम में। फिर भी पूँजी पर संयम और बाज़ार से माँग की पुष्टि ज़रूरी रहेगी।'],
    moderately_favourable: [
      'Business is workable for you, but it will reward patience over speed. Build proof of demand first; scale is a later decision, not an opening move.',
      'व्यवसाय आपके लिए साध्य है, पर यह गति से अधिक धैर्य को फल देगा। पहले माँग का प्रमाण बनाएँ; विस्तार बाद का निर्णय है, शुरुआत का कदम नहीं।'],
    mixed: [
      'Business is possible but not effortless for you. The chart favours a tested, funded start over an ambitious one — demand, working capital and partner choice decide the outcome more than enthusiasm.',
      'व्यवसाय संभव है, पर आपके लिए सहज नहीं। कुंडली महत्वाकांक्षी शुरुआत के बजाय परखी हुई और पूँजी-समर्थित शुरुआत का पक्ष लेती है — उत्साह से अधिक माँग, कार्यशील पूँजी और साझेदार का चुनाव परिणाम तय करेंगे।'],
    challenging: [
      'Business asks for caution right now. The difficulty is less about ability and more about cash-flow strain and the cost of a wrong commitment — keep scale small and reversible.',
      'अभी व्यवसाय सावधानी माँगता है। कठिनाई क्षमता की नहीं, नकदी के दबाव और ग़लत प्रतिबद्धता की क़ीमत की है — काम छोटा रखें और ऐसा रखें कि पीछे हटा जा सके।'],
    highly_challenging: [
      'This is not a phase to expand or start something new. Protect existing operations, cut avoidable exposure, and let the ground settle before committing capital.',
      'यह दौर विस्तार या नई शुरुआत का नहीं है। चल रहे काम को सुरक्षित रखें, टाला जा सकने वाला जोखिम घटाएँ, और पूँजी लगाने से पहले स्थिति को स्थिर होने दें।'],
  },

  career: {
    highly_favourable: [
      'Your chart supports professional growth strongly. Capability, visibility and the willingness to carry responsibility line up — senior roles are a realistic aim, not a stretch.',
      'आपकी कुंडली व्यावसायिक प्रगति का प्रबल समर्थन करती है। योग्यता, पहचान और ज़िम्मेदारी उठाने की तत्परता — तीनों साथ हैं। बड़े पद यहाँ दूर की बात नहीं, वास्तविक लक्ष्य हैं।'],
    favourable: [
      'Career prospects are favourable. Progress comes through demonstrated work rather than repositioning, and recognition tends to follow rather than lead.',
      'करियर के योग अनुकूल हैं। प्रगति जगह बदलने से नहीं, किए हुए काम के प्रमाण से आएगी, और पहचान आगे-आगे नहीं, काम के पीछे चलेगी।'],
    moderately_favourable: [
      'Your career is workable and can improve steadily. Growth is real but gradual — skill depth and a reputation for reliability move you further than a change of employer.',
      'आपका करियर साध्य है और धीरे-धीरे बेहतर हो सकता है। वृद्धि वास्तविक है पर क्रमिक — नियोक्ता बदलने से अधिक, कौशल की गहराई और भरोसेमंद होने की छवि आपको आगे ले जाएगी।'],
    mixed: [
      'Your chart shows professional capability, but progress is uneven. Ability is not the constraint — recognition, timing and the fit of your current role carry more weight here.',
      'आपकी कुंडली में व्यावसायिक योग्यता है, पर प्रगति एक-सी नहीं रहेगी। रुकावट क्षमता की नहीं है — पहचान, सही समय और वर्तमान भूमिका का मेल यहाँ अधिक भारी पड़ते हैं।'],
    challenging: [
      'Career needs patience in this phase. Friction with authority, unclear recognition or an ill-fitting role can drain more energy than the work itself — respond with evidence, not exit.',
      'इस दौर में करियर धैर्य माँगता है। वरिष्ठों से टकराव, पहचान का अभाव या भूमिका का बेमेल होना काम से अधिक ऊर्जा खींच सकता है — जवाब नौकरी छोड़कर नहीं, काम के प्रमाण से दें।'],
    highly_challenging: [
      'Professional matters ask for extra care right now. Hold your position, document your work, and avoid an impulsive move — this phase passes, and a decision made inside it tends not to.',
      'अभी व्यावसायिक मामले अधिक सावधानी माँगते हैं। अपनी जगह बनाए रखें, अपने काम का लेखा रखें, और आवेश में कोई कदम न उठाएँ — यह दौर बीत जाता है, इसमें लिया गया निर्णय प्रायः साथ रह जाता है।'],
  },

  health: {
    highly_favourable: [
      'Your chart indicates good constitutional strength. Energy, recovery and resilience are well supported — the main risk here is complacency, not weakness.',
      'आपकी कुंडली अच्छी शारीरिक क्षमता दर्शाती है। ऊर्जा, रोग से उबरने की शक्ति और सहनशीलता — तीनों को अच्छा समर्थन है। यहाँ असली जोखिम कमज़ोरी नहीं, लापरवाही है।'],
    favourable: [
      'Health tendencies are favourable. Your baseline is sound, and routine care is enough to keep it that way — it does not need to be earned back.',
      'स्वास्थ्य की प्रवृत्तियाँ अनुकूल हैं। आपका मूल आधार ठीक है, और नियमित देखभाल इसे बनाए रखने के लिए पर्याप्त है — इसे दोबारा अर्जित करने की ज़रूरत नहीं।'],
    moderately_favourable: [
      'Health is reasonably placed. Nothing structural stands out as a problem, though energy tends to reflect your habits fairly directly — sleep and routine show up quickly.',
      'स्वास्थ्य ठीक स्थिति में है। कोई गहरी समस्या प्रमुख नहीं दिखती, पर ऊर्जा आपकी आदतों को सीधे दर्शाती है — नींद और दिनचर्या का असर जल्दी दिखता है।'],
    mixed: [
      'Your chart shows reasonable recovery and stamina, but long-term stability depends heavily on routine, sleep, stress control and timely medical care.',
      'आपकी कुंडली में रोग से उबरने की क्षमता और सहनशक्ति ठीक है, लेकिन लंबे समय की स्थिरता दिनचर्या, नींद, तनाव-नियंत्रण और समय पर इलाज पर बहुत हद तक निर्भर रहेगी।'],
    challenging: [
      'Health asks for real attention in this phase. The pattern points to strain accumulating quietly rather than to a sudden event — which is precisely why small symptoms deserve early attention.',
      'इस दौर में स्वास्थ्य वास्तविक ध्यान माँगता है। संकेत किसी अचानक घटना का नहीं, चुपचाप जमा होते दबाव का है — इसीलिए छोटे लक्षणों पर भी समय रहते ध्यान देना ज़रूरी है।'],
    highly_challenging: [
      'This period calls for extra care with your health. This describes a demanding phase, not a fixed outcome — prioritise rest, keep medical guidance close, and do not carry symptoms silently.',
      'यह दौर स्वास्थ्य के प्रति अधिक सावधानी माँगता है। यह एक कठिन चरण दर्शाता है, कोई तय परिणाम नहीं — विश्राम को प्राथमिकता दें, चिकित्सकीय मार्गदर्शन साथ रखें, और लक्षणों को चुपचाप न सहें।'],
  },

  marriage: {
    highly_favourable: [
      'Marriage prospects are strong in your chart. The capacity for commitment, mutual understanding and a settled married life are all well indicated.',
      'आपकी कुंडली में विवाह के योग प्रबल हैं। निभाने की क्षमता, आपसी समझ और स्थिर वैवाहिक जीवन — तीनों के अच्छे संकेत हैं।'],
    favourable: [
      'Marriage prospects are favourable. A suitable match and a workable married life are both indicated, with the usual early adjustment that most marriages ask for.',
      'विवाह के योग अनुकूल हैं। उपयुक्त जीवनसाथी और सहज वैवाहिक जीवन — दोनों के संकेत हैं, शुरुआती तालमेल के साथ, जो लगभग हर विवाह माँगता है।'],
    moderately_favourable: [
      'Marriage is well indicated, though it may take its own time. The promise is not in question; the pace is what asks for patience.',
      'विवाह के संकेत ठीक हैं, यद्यपि इसमें अपना समय लग सकता है। योग पर संदेह नहीं है; धैर्य गति को लेकर चाहिए।'],
    mixed: [
      'Marriage is indicated, but the chart points to adjustment as much as to promise. Expectations, temperament and family circumstances shape the outcome more than the match alone.',
      'विवाह के संकेत हैं, पर कुंडली योग के साथ-साथ तालमेल की ओर भी संकेत करती है। परिणाम केवल रिश्ते से नहीं — अपेक्षाएँ, स्वभाव और पारिवारिक परिस्थितियाँ अधिक तय करती हैं।'],
    challenging: [
      'Married life asks for conscious effort in this phase. The difficulty tends to sit in communication and expectation rather than in affection — that is the workable part.',
      'इस दौर में वैवाहिक जीवन सचेत प्रयास माँगता है। कठिनाई प्रायः स्नेह में नहीं, संवाद और अपेक्षाओं में होती है — और यही वह हिस्सा है जिस पर काम किया जा सकता है।'],
    highly_challenging: [
      'This is a demanding phase for marriage, not a verdict on it. Give the relationship room, avoid decisions taken in anger, and seek qualified counselling before any irreversible step.',
      'यह विवाह के लिए कठिन दौर है, उस पर कोई अंतिम निर्णय नहीं। रिश्ते को समय दें, क्रोध में निर्णय न लें, और कोई भी न लौटने वाला कदम उठाने से पहले योग्य परामर्श लें।'],
  },

  children: {
    highly_favourable: [
      'Prospects for children are strong in your chart, and the indications for a warm, supportive bond with them are equally clear.',
      'आपकी कुंडली में संतान के योग प्रबल हैं, और उनके साथ स्नेहपूर्ण, सहयोगी संबंध के संकेत भी उतने ही स्पष्ट हैं।'],
    favourable: [
      'Prospects for children are favourable. The chart supports both the possibility and a settled family life around it.',
      'संतान के योग अनुकूल हैं। कुंडली संभावना और उसके साथ स्थिर पारिवारिक जीवन — दोनों का समर्थन करती है।'],
    moderately_favourable: [
      'Children are indicated, though timing may take its own course. Practical readiness and patience matter more here than any single indication.',
      'संतान के संकेत हैं, यद्यपि समय अपनी गति से चलेगा। यहाँ किसी एक संकेत से अधिक व्यावहारिक तैयारी और धैर्य महत्वपूर्ण हैं।'],
    mixed: [
      'The chart indicates possibility alongside some delay or responsibility. This describes tendencies only — for anything concerning conception or a child’s health, medical guidance is the right authority, not astrology.',
      'कुंडली संभावना के साथ कुछ देरी या ज़िम्मेदारी भी दर्शाती है। यह केवल प्रवृत्तियाँ बताती है — गर्भधारण या बच्चे के स्वास्थ्य से जुड़ी किसी भी बात में सही मार्गदर्शन चिकित्सा का है, ज्योतिष का नहीं।'],
    challenging: [
      'This area asks for patience and support. Astrological indications describe tendencies, never certainty, and they are not a substitute for medical assessment where that is relevant.',
      'यह क्षेत्र धैर्य और सहयोग माँगता है। ज्योतिषीय संकेत प्रवृत्तियाँ बताते हैं, निश्चितता नहीं, और जहाँ चिकित्सकीय जाँच की बात हो, वहाँ वे उसका विकल्प नहीं हैं।'],
    highly_challenging: [
      'This is a phase that asks for care and realistic support, not resignation. Astrology cannot determine this matter — qualified medical guidance can address what it cannot.',
      'यह दौर देखभाल और व्यावहारिक सहयोग माँगता है, हार मान लेना नहीं। ज्योतिष इस विषय को तय नहीं कर सकता — जो वह नहीं कर सकता, उसका उत्तर योग्य चिकित्सकीय मार्गदर्शन के पास है।'],
  },

  education: {
    highly_favourable: [
      'Your chart strongly supports learning. Grasp, memory and the discipline to stay with a subject long enough to master it all work in your favour.',
      'आपकी कुंडली अध्ययन का प्रबल समर्थन करती है। समझ, स्मरण-शक्ति और किसी विषय के साथ महारत तक टिके रहने का अनुशासन — तीनों आपके पक्ष में हैं।'],
    favourable: [
      'Education prospects are favourable. You learn well when the subject genuinely interests you, and that interest is a reliable guide to the right field.',
      'शिक्षा के योग अनुकूल हैं। जिस विषय में सच्ची रुचि हो, उसे आप अच्छी तरह सीखते हैं — और वही रुचि सही क्षेत्र चुनने की भरोसेमंद कसौटी है।'],
    moderately_favourable: [
      'Education is workable for you. Results follow method rather than raw ability — structured study closes the gap faster than extra hours do.',
      'शिक्षा आपके लिए साध्य है। परिणाम कच्ची योग्यता से नहीं, तरीके से आते हैं — अतिरिक्त घंटों से अधिक, व्यवस्थित अध्ययन अंतर को जल्दी पाटता है।'],
    mixed: [
      'Your chart shows learning ability, but consistency is the variable. Interest and concentration fluctuate more than capability does — structure matters more for you than for most.',
      'आपकी कुंडली में सीखने की क्षमता है, पर निरंतरता अस्थिर है। योग्यता से अधिक रुचि और एकाग्रता ऊपर-नीचे होती हैं — इसलिए व्यवस्था आपके लिए औरों से अधिक मायने रखती है।'],
    challenging: [
      'Studies ask for extra structure in this phase. Interruptions and scattered focus are the pattern here, not lack of intelligence — the fix is environment and routine.',
      'इस दौर में पढ़ाई अतिरिक्त व्यवस्था माँगती है। यहाँ प्रवृत्ति रुकावट और बिखरे ध्यान की है, बुद्धि की कमी की नहीं — समाधान वातावरण और दिनचर्या में है।'],
    highly_challenging: [
      'This is a difficult phase for formal study, not a statement about your ability. Reduce the load, rebuild the habit, and re-attempt from a steadier base.',
      'यह औपचारिक अध्ययन के लिए कठिन दौर है, आपकी योग्यता पर टिप्पणी नहीं। भार घटाएँ, आदत दोबारा बनाएँ, और अधिक स्थिर आधार से पुनः प्रयास करें।'],
  },

  property: {
    highly_favourable: [
      'Property prospects are strong. Ownership, a settled home and the means to hold it are all well indicated — the remaining work is verification, not possibility.',
      'संपत्ति के योग प्रबल हैं। स्वामित्व, स्थिर घर और उसे बनाए रखने का सामर्थ्य — तीनों के अच्छे संकेत हैं। शेष काम जाँच का है, संभावना का नहीं।'],
    favourable: [
      'Property prospects are favourable. Ownership is realistic, and the chart supports a purchase made on preparation rather than on impulse.',
      'संपत्ति के योग अनुकूल हैं। स्वामित्व वास्तविक लक्ष्य है, और कुंडली आवेश में नहीं, तैयारी के साथ की गई खरीद का समर्थन करती है।'],
    moderately_favourable: [
      'Property is achievable for you, though likely in stages. The first purchase tends to be modest; the chart favours building up rather than starting large.',
      'संपत्ति आपके लिए संभव है, यद्यपि संभवतः चरणों में। पहली खरीद प्रायः सामान्य रहती है; कुंडली बड़े से शुरू करने के बजाय क्रमशः बढ़ने का पक्ष लेती है।'],
    mixed: [
      'Property ownership is possible, but the chart favours careful preparation over rushed purchase. Finance, legal verification and timing need to align.',
      'मकान या संपत्ति लेने की संभावना मौजूद है, लेकिन कुंडली जल्दबाज़ी के बजाय तैयारी पर ज़ोर देती है। पैसे की व्यवस्था, काग़ज़ों की क़ानूनी जाँच और सही समय — तीनों का साथ आना ज़रूरी है।'],
    challenging: [
      'Property matters need caution in this phase. Documentation, disputes and loan terms are where trouble tends to enter — not the purchase price.',
      'इस दौर में संपत्ति के मामले सावधानी माँगते हैं। दिक्कत प्रायः क़ीमत से नहीं, काग़ज़ात, विवाद और loan की शर्तों से आती है।'],
    highly_challenging: [
      'This is not a phase to commit to property. Delay is far cheaper than a disputed title or an unaffordable loan — prepare now, act when the ground is clear.',
      'यह दौर संपत्ति में प्रतिबद्धता का नहीं है। विवादित मालिकाना हक़ या न चुका पाने वाले loan से कहीं सस्ती देरी है — अभी तैयारी करें, स्थिति साफ़ होने पर कदम उठाएँ।'],
  },

  general: {
    highly_favourable: [
      'Your chart is strongly placed overall. Your natural strengths reinforce one another rather than pull in different directions, which is what makes them dependable.',
      'आपकी कुंडली समग्र रूप से प्रबल है। आपकी स्वाभाविक शक्तियाँ अलग-अलग दिशाओं में नहीं खींचतीं, बल्कि एक-दूसरे को बल देती हैं — यही उन्हें भरोसेमंद बनाता है।'],
    favourable: [
      'Your chart is well placed overall. Your strengths are clear and usable, and the areas needing attention are ordinary rather than structural.',
      'आपकी कुंडली समग्र रूप से अच्छी स्थिति में है। आपकी शक्तियाँ स्पष्ट और उपयोगी हैं, और जिन पक्षों पर ध्यान चाहिए वे सामान्य हैं, गहरे नहीं।'],
    moderately_favourable: [
      'Your chart is reasonably placed. There is a workable base here, and conscious habits do more to shape the outcome than the placements themselves.',
      'आपकी कुंडली ठीक स्थिति में है। यहाँ एक उपयोगी आधार मौजूद है, और परिणाम को ग्रह-स्थिति से अधिक सचेत आदतें आकार देती हैं।'],
    mixed: [
      'Your chart carries clear strengths alongside traits that need conscious balancing. The two are not in conflict — they simply ask for self-awareness rather than effort alone.',
      'आपकी कुंडली में स्पष्ट शक्तियाँ हैं, और साथ ही कुछ पक्ष जो सचेत संतुलन चाहते हैं। दोनों में टकराव नहीं है — वे केवल प्रयास नहीं, आत्म-जागरूकता माँगते हैं।'],
    challenging: [
      'Your chart shows real pressure in this phase. Self-awareness and steady routine matter more for you than for most right now — and they are within your control.',
      'इस दौर में आपकी कुंडली वास्तविक दबाव दर्शाती है। अभी आत्म-जागरूकता और नियमित दिनचर्या आपके लिए औरों से अधिक महत्वपूर्ण हैं — और ये आपके नियंत्रण में हैं।'],
    highly_challenging: [
      'Your chart is under strain right now. This describes a phase, not a nature — gentle consistency will serve you better than any large corrective effort.',
      'अभी आपकी कुंडली दबाव में है। यह एक दौर दर्शाता है, आपका स्वभाव नहीं — किसी बड़े सुधारात्मक प्रयास से अधिक, सहज निरंतरता आपके काम आएगी।'],
  },

  timing: {
    highly_favourable: [
      'The current planetary period is strongly supportive. This is a window to act deliberately rather than wait — such phases are not indefinite.',
      'वर्तमान ग्रह-दशा प्रबल रूप से सहायक है। यह प्रतीक्षा का नहीं, सोच-समझकर कार्य करने का समय है — ऐसे दौर सदा नहीं रहते।'],
    favourable: [
      'The current planetary period is favourable. Effort applied now tends to carry further than the same effort applied later.',
      'वर्तमान ग्रह-दशा अनुकूल है। अभी लगाया गया प्रयास बाद के उसी प्रयास से अधिक दूर तक ले जाता है।'],
    moderately_favourable: [
      'The current period is workable. Progress is available through steady effort, though it will not feel effortless.',
      'वर्तमान समय साध्य है। निरंतर प्रयास से प्रगति संभव है, यद्यपि यह सहज अनुभव नहीं होगा।'],
    mixed: [
      'The current period is genuinely mixed — some areas support you while others resist. Use it to prepare and consolidate rather than to force a single big outcome.',
      'वर्तमान समय वास्तव में मिश्रित है — कुछ क्षेत्र साथ देते हैं, कुछ रोकते हैं। इसका उपयोग किसी एक बड़े परिणाम पर ज़ोर लगाने के बजाय तैयारी और मज़बूती के लिए करें।'],
    challenging: [
      'The current period asks for patience. Pressure here is a phase rather than a direction — protect what you control and avoid forcing outcomes.',
      'वर्तमान समय धैर्य माँगता है। यहाँ दबाव एक दौर है, दिशा नहीं — जो नियंत्रण में है उसे सुरक्षित रखें और परिणाम पर ज़ोर न लगाएँ।'],
    highly_challenging: [
      'The current period is demanding and asks for extra care. Move gradually, keep commitments reversible, and review again once the phase turns.',
      'वर्तमान समय कठिन है और अधिक सावधानी माँगता है। धीरे-धीरे बढ़ें, प्रतिबद्धताएँ ऐसी रखें जिनसे लौटा जा सके, और दौर बदलने पर पुनः समीक्षा करें।'],
  },
};

// ── Part 7 — topic-specific cautions ─────────────────────────────────────────
// One caution per life area. Deliberately not interchangeable: a property caution
// that could be pasted into a health answer is not a caution, it is filler.
const CAUTION = {
  finance: ['Avoid high-risk shortcuts and unverified investments, keep borrowing within what your income can service, and build an emergency fund before committing money you may need back.',
    'जोखिम भरे शॉर्टकट और बिना जाँचे निवेश से बचें, उधार उतना ही लें जितना आपकी आय संभाल सके, और जो पैसा वापस चाहिए हो उसे लगाने से पहले आपातकालीन निधि बनाएँ।'],
  business: ['Validate demand with paying customers before scaling, protect working capital, keep partnerships based on written terms rather than goodwill, and define your loss limit in advance.',
    'विस्तार से पहले भुगतान करने वाले ग्राहकों से माँग की पुष्टि करें, कार्यशील पूँजी बचाकर रखें, साझेदारी भरोसे पर नहीं लिखित शर्तों पर करें, और हानि की सीमा पहले से तय करें।'],
  career: ['Avoid an impulsive resignation, keep a record of your work and results, and handle friction with authority through evidence rather than confrontation.',
    'आवेश में इस्तीफ़ा न दें, अपने काम और परिणामों का लेखा रखें, और वरिष्ठों से मतभेद टकराव के बजाय काम के प्रमाण से सुलझाएँ।'],
  health: ['Do not ignore persistent or worsening symptoms, avoid self-medication, protect sleep and regular meals, and consult a qualified doctor rather than waiting for a symptom to settle on its own.',
    'लगातार बने रहने या बढ़ने वाले लक्षणों को अनदेखा न करें, अपने मन से दवा न लें, नींद और समय पर भोजन बनाए रखें, और लक्षण के अपने-आप ठीक होने की प्रतीक्षा करने के बजाय योग्य डॉक्टर से सलाह लें।'],
  marriage: ['Avoid letting ego decide a conversation, say what you actually expect instead of assuming it is understood, involve families carefully, and give a serious disagreement time before treating it as a conclusion.',
    'बातचीत को अहंकार से न चलने दें, अपेक्षा को समझा हुआ मानने के बजाय स्पष्ट कहें, परिवार को सोच-समझकर शामिल करें, और किसी गंभीर मतभेद को निष्कर्ष मानने से पहले उसे समय दें।'],
  children: ['Approach this area with patience and practical support. Where conception or a child’s health is involved, follow qualified medical guidance — and avoid treating any astrological indication as a settled outcome.',
    'इस क्षेत्र को धैर्य और व्यावहारिक सहयोग के साथ देखें। जहाँ गर्भधारण या बच्चे के स्वास्थ्य की बात हो, वहाँ योग्य चिकित्सकीय मार्गदर्शन का पालन करें — और किसी ज्योतिषीय संकेत को तय परिणाम न मानें।'],
  education: ['Protect concentration by fixing the environment before blaming the effort, avoid taking on more subjects than you can sustain, and test a field with a short course before a long commitment.',
    'प्रयास को दोष देने से पहले वातावरण ठीक करके एकाग्रता बचाएँ, जितना संभाल सकें उससे अधिक विषय न लें, और लंबी प्रतिबद्धता से पहले किसी क्षेत्र को छोटे कोर्स से परखें।'],
  property: ['Verify the title independently, read the loan terms in full including the reset clauses, inspect construction quality yourself, and never let a booking deadline replace due diligence.',
    'मालिकाना हक़ की स्वतंत्र रूप से जाँच कराएँ, loan की शर्तें पूरी पढ़ें — दर बदलने वाले खंड सहित, निर्माण की गुणवत्ता स्वयं देखें, और booking की समय-सीमा को जाँच का विकल्प कभी न बनने दें।'],
  general: ['Avoid over-correcting a trait that is also a strength, verify important assumptions before acting on them, and be wary of large decisions taken during a low phase.',
    'जो पक्ष शक्ति भी है उसे अति-सुधारने से बचें, महत्वपूर्ण मान्यताओं पर कार्य करने से पहले उन्हें जाँचें, और निचले दौर में लिए जाने वाले बड़े निर्णयों से सतर्क रहें।'],
  timing: ['Treat a favourable window as when effort is best rewarded, not as a guarantee, and avoid staking an irreversible decision on a date alone.',
    'अनुकूल अवधि को प्रयास के सर्वोत्तम फल का समय मानें, कोई गारंटी नहीं, और किसी न लौटने वाले निर्णय को केवल तिथि के भरोसे न रखें।'],
};

// ── Part 8 — topic-specific practical next steps ─────────────────────────────
// Each must answer the concern the reader actually arrived with.
const ACTION = {
  finance: ['Track income, fixed expenses and savings monthly so the leak becomes visible, build an emergency fund before any major investing, and use a regulated professional for material decisions.',
    'आय, निश्चित खर्च और बचत हर महीने दर्ज करें ताकि रिसाव दिखे, किसी बड़े निवेश से पहले आपातकालीन निधि बनाएँ, और महत्वपूर्ण निर्णयों के लिए पंजीकृत विशेषज्ञ की सलाह लें।'],
  business: ['Validate demand with paying customers, keep six months of working capital, and define a clear stop-loss point before you need it.',
    'भुगतान करने वाले ग्राहकों से माँग की पुष्टि करें, छह महीने की कार्यशील पूँजी रखें, और हानि-सीमा ज़रूरत पड़ने से पहले ही तय कर लें।'],
  career: ['Build a 6–12 month skill and opportunity plan instead of making an impulsive move, and let your next role be chosen rather than escaped into.',
    'आवेश में कदम उठाने के बजाय 6–12 महीने की कौशल और अवसर की योजना बनाएँ, और अगली भूमिका भागकर नहीं, चुनकर लें।'],
  health: ['Strengthen sleep, nutrition, movement and stress management before anything else, and seek medical help promptly for new or worsening symptoms rather than waiting.',
    'सबसे पहले नींद, पोषण, गतिविधि और तनाव-प्रबंधन मज़बूत करें, और नए या बढ़ते लक्षणों में प्रतीक्षा करने के बजाय तुरंत चिकित्सकीय सहायता लें।'],
  marriage: ['Improve communication and clarify expectations before commitment, and use careful matching and timing rather than pressure from either family.',
    'प्रतिबद्धता से पहले संवाद सुधारें और अपेक्षाएँ स्पष्ट करें, और किसी भी पक्ष के दबाव के बजाय सावधानीपूर्वक मिलान और सही समय का सहारा लें।'],
  children: ['Separate medical facts, practical readiness and emotional expectations, and follow qualified medical guidance for anything concerning conception or a child’s health.',
    'चिकित्सकीय तथ्य, व्यावहारिक तैयारी और भावनात्मक अपेक्षाएँ अलग-अलग देखें, और गर्भधारण या बच्चे के स्वास्थ्य से जुड़ी हर बात में योग्य चिकित्सकीय मार्गदर्शन का पालन करें।'],
  education: ['Match the study path to genuine interest and realistic opportunity, and test the subject with a short course before a long commitment.',
    'अध्ययन की दिशा सच्ची रुचि और वास्तविक अवसर से मिलाएँ, और लंबी प्रतिबद्धता से पहले विषय को छोटे कोर्स से परखें।'],
  property: ['Organise finance, shortlist options, complete legal and technical due diligence, and then act during a supportive period rather than on a promised date.',
    'पैसे की व्यवस्था करें, विकल्प छाँटें, क़ानूनी और तकनीकी जाँच पूरी करें, और फिर किसी वादा-तिथि पर नहीं, अनुकूल अवधि में कदम उठाएँ।'],
  general: ['Lean on the strengths named above and balance the weaker trait consciously, rather than trying to remake your whole temperament.',
    'ऊपर बताई गई शक्तियों का सहारा लें और कमज़ोर पक्ष को सचेत रूप से संतुलित करें, पूरे स्वभाव को बदलने का प्रयास न करें।'],
  timing: ['Schedule important starts and follow-ups within the supportive window described above, and align effort with the period rather than against it.',
    'महत्वपूर्ण शुरुआत और अनुवर्तन ऊपर बताई अनुकूल अवधि में रखें, और प्रयास को समय के विरुद्ध नहीं, उसके अनुरूप रखें।'],
};

// ── Part 5 — planet → practical meaning, per life area ───────────────────────
// The full 9×10 grid. A relevant house lord can be ANY planet, and a house lord is
// primary evidence, so every (planet, domain) pair must have a real meaning — a
// fallback to general significations on a primary factor is exactly the "planet
// name without meaning" failure this table exists to remove.
//
// AUTHORING RULES (both are load-bearing — breaking either produces nonsense):
//
//  1. NEUTRAL. A theme names what the planet GOVERNS in this life area, never how
//     it fails. The same theme is rendered by the strong frame ("...which supports
//     {theme}") and the weak frame ("...so {theme} need conscious discipline"), so
//     a theme carrying its own verdict makes one of the two absurd — a strong Moon
//     "supporting spending driven by mood rather than plan" reads as an
//     endorsement of the failure. Strength/weakness is the frame's job, not the
//     theme's.
//  2. NOUN PHRASES ONLY. No embedded clauses. "record-keeping" works in both
//     languages; "how well money is tracked" produces ungrammatical Hindi when the
//     frame appends its verb ("...सचेत प्रयास से बेहतर होते हैं").
const MEANING = {
  general: {
    Sun: ['confidence, authority and recognition', 'आत्मविश्वास, अधिकार और पहचान'],
    Moon: ['emotional balance, receptivity and steadiness of mind', 'भावनात्मक संतुलन, ग्रहणशीलता और मन की स्थिरता'],
    Mars: ['courage, initiative and decisiveness', 'साहस, पहल और निर्णय-क्षमता'],
    Mercury: ['intelligence, communication and adaptability', 'बुद्धि, संवाद और परिस्थिति के अनुसार ढलने की क्षमता'],
    Jupiter: ['wisdom, ethics, optimism and guidance', 'विवेक, नैतिकता, आशावाद और मार्गदर्शन'],
    Venus: ['charm, relationships, taste and comfort', 'आकर्षण, संबंध, रुचि और आराम'],
    Saturn: ['discipline, patience, responsibility and endurance', 'अनुशासन, धैर्य, ज़िम्मेदारी और सहनशीलता'],
    Rahu: ['ambition, unconventional drive and appetite for change', 'महत्वाकांक्षा, लीक से हटकर चलने की चाह और बदलाव की भूख'],
    Ketu: ['detachment, introspection and inner focus', 'वैराग्य, आत्ममंथन और भीतरी एकाग्रता'],
  },
  finance: {
    Sun: ['status-linked income, authority-linked sources and standing', 'पद से जुड़ी आय, उच्च-अधिकार वाले स्रोत और प्रतिष्ठा'],
    Moon: ['cash flow, liquidity and day-to-day money habits', 'नकदी का प्रवाह, तरलता और रोज़मर्रा की धन-संबंधी आदतें'],
    Mars: ['earning drive, risk appetite and decisiveness with money', 'कमाने का जोश, जोखिम लेने की क्षमता और धन-संबंधी निर्णय-क्षमता'],
    Mercury: ['accounting, trade, negotiation and record-keeping', 'हिसाब-किताब, व्यापार, मोल-भाव और लेखा रखना'],
    Jupiter: ['growth, sound advice, ethical gain and savings sense', 'वृद्धि, सही सलाह, नैतिक लाभ और बचत की समझ'],
    Venus: ['comfort, lifestyle and discretionary spending', 'आराम, जीवनशैली और शौक़ पर होने वाला खर्च'],
    Saturn: ['financial discipline, long-term saving and debt management', 'आर्थिक अनुशासन, दीर्घकालिक बचत और कर्ज़ का प्रबंधन'],
    Rahu: ['speculation, leverage and sudden financial swings', 'सट्टा, उधार का उपयोग और अचानक आर्थिक उतार-चढ़ाव'],
    Ketu: ['financial detachment, record-keeping and expense leakage', 'धन से उदासीनता, लेखा रखना और खर्च का रिसाव'],
  },
  business: {
    Sun: ['ownership, authority over the venture and market reputation', 'स्वामित्व, उद्यम पर अधिकार और बाज़ार में साख'],
    Moon: ['customer understanding, demand sensing and composure under pressure', 'ग्राहक की समझ, माँग को भाँपना और दबाव में संयम'],
    Mars: ['initiative, competition, risk-taking and execution', 'पहल, प्रतिस्पर्धा, जोखिम लेना और कार्यान्वयन'],
    Mercury: ['trade sense, pricing, negotiation and systems', 'व्यापारिक समझ, मूल्य-निर्धारण, मोल-भाव और व्यवस्था'],
    Jupiter: ['expansion, mentors, credibility and judgement', 'विस्तार, मार्गदर्शक, विश्वसनीयता और विवेक'],
    Venus: ['branding, partnerships and customer appeal', 'ब्रांडिंग, साझेदारी और ग्राहक-आकर्षण'],
    Saturn: ['structure, persistence and cost control', 'ढाँचा, दृढ़ता और लागत-नियंत्रण'],
    Rahu: ['scaling, unconventional markets and leverage', 'विस्तार, अपरंपरागत बाज़ार और उधार का उपयोग'],
    Ketu: ['follow-through, sustained interest and day-to-day operations', 'अनुवर्तन, रुचि का बना रहना और रोज़मर्रा का संचालन'],
  },
  career: {
    Sun: ['authority, visibility and relationships with seniors', 'अधिकार, पहचान और वरिष्ठों से संबंध'],
    Moon: ['workplace comfort, team relationships and composure', 'कार्यस्थल में सहजता, टीम से संबंध और संयम'],
    Mars: ['drive, competitiveness and technical execution', 'जोश, प्रतिस्पर्धा और तकनीकी कार्यान्वयन'],
    Mercury: ['analysis, communication, documentation and adaptability', 'विश्लेषण, संवाद, प्रलेखन और नए के अनुसार ढलना'],
    Jupiter: ['mentors, ethics and growth through trust', 'मार्गदर्शक, नैतिकता और विश्वास से मिलने वाली वृद्धि'],
    Venus: ['workplace harmony, creative or client-facing work and influence', 'कार्यस्थल में सामंजस्य, रचनात्मक या ग्राहक-सम्मुख काम और प्रभाव'],
    Saturn: ['long-term growth, responsibility, structure and persistence', 'दीर्घकालिक वृद्धि, ज़िम्मेदारी, ढाँचा और दृढ़ता'],
    Rahu: ['ambition, unconventional roles and foreign or emerging fields', 'महत्वाकांक्षा, अपरंपरागत भूमिकाएँ और विदेशी या नए क्षेत्र'],
    Ketu: ['specialist depth and sustained engagement with a role', 'विशेषज्ञता की गहराई और भूमिका से लगातार जुड़ाव'],
  },
  health: {
    Sun: ['vitality, bones, eyes and baseline energy', 'जीवन-शक्ति, हड्डियाँ, नेत्र और मूल ऊर्जा'],
    Moon: ['emotional balance, sleep, stress response and hydration', 'भावनात्मक संतुलन, नींद, तनाव पर प्रतिक्रिया और जल की मात्रा'],
    Mars: ['blood, inflammation, injury and physical exertion', 'रक्त, सूजन, चोट और शारीरिक श्रम'],
    Mercury: ['nerves, skin, speech and mental load', 'स्नायु, त्वचा, वाणी और मानसिक भार'],
    Jupiter: ['liver, metabolism and weight', 'यकृत, चयापचय और वज़न'],
    Venus: ['reproductive health, diet quality and rest', 'प्रजनन स्वास्थ्य, आहार की गुणवत्ता और विश्राम'],
    Saturn: ['chronic patterns, stamina, bones and joints, and recovery through consistency', 'पुरानी प्रवृत्तियाँ, सहनशक्ति, हड्डियाँ और जोड़, और निरंतरता से मिलने वाला सुधार'],
    Rahu: ['routine, diagnosis and freedom from dependence', 'दिनचर्या, रोग की पहचान और व्यसन से मुक्ति'],
    Ketu: ['bodily awareness and attention to early symptoms', 'शरीर के प्रति सजगता और शुरुआती लक्षणों पर ध्यान'],
  },
  marriage: {
    Sun: ['mutual respect and balance of authority at home', 'परस्पर सम्मान और घर में अधिकार का संतुलन'],
    Moon: ['emotional closeness, care and everyday warmth', 'भावनात्मक निकटता, देखभाल और रोज़मर्रा की आत्मीयता'],
    Mars: ['passion, patience and the handling of disagreement', 'आवेग, धैर्य और मतभेद को संभालने का ढंग'],
    Mercury: ['communication, humour and clarity between partners', 'संवाद, हास्य और दोनों के बीच स्पष्टता'],
    Jupiter: ['values, trust, family blessing and commitment', 'मूल्य, विश्वास, परिवार का आशीर्वाद और निभाव'],
    Venus: ['harmony, attraction, expectations, comfort and emotional reciprocity', 'सामंजस्य, आकर्षण, अपेक्षाएँ, आराम और भावनात्मक आदान-प्रदान'],
    Saturn: ['duty, patience and a bond that deepens slowly', 'कर्तव्य, धैर्य और धीरे-धीरे गहरा होने वाला बंधन'],
    Rahu: ['settled expectations and freedom from outside influence', 'स्थिर अपेक्षाएँ और बाहरी प्रभाव से मुक्ति'],
    Ketu: ['emotional presence and willingness to stay engaged', 'भावनात्मक उपस्थिति और जुड़े रहने की तत्परता'],
  },
  children: {
    Sun: ['a child’s confidence and your steadiness as a parent', 'संतान का आत्मविश्वास और अभिभावक के रूप में आपकी स्थिरता'],
    Moon: ['emotional bonding, nurture and the mother’s wellbeing', 'भावनात्मक जुड़ाव, पालन-पोषण और माता का कुशल-क्षेम'],
    Mars: ['a child’s energy and your patience with it', 'संतान की ऊर्जा और उसके प्रति आपका धैर्य'],
    Mercury: ['a child’s learning, speech and your communication with them', 'संतान की सीखने की क्षमता, वाणी और उनसे आपका संवाद'],
    Jupiter: ['guidance, wisdom and support for children', 'मार्गदर्शन, विवेक और संतान का सहारा'],
    Venus: ['affection, comfort and warmth at home', 'स्नेह, आराम और घर की ऊष्मा'],
    Saturn: ['responsibility, patience and endurance in parenting', 'ज़िम्मेदारी, धैर्य और पालन-पोषण में सहनशीलता'],
    Rahu: ['calm expectations and steadiness through uncertainty', 'शांत अपेक्षाएँ और अनिश्चितता में स्थिरता'],
    Ketu: ['emotional closeness and presence', 'भावनात्मक निकटता और उपस्थिति'],
  },
  education: {
    Sun: ['confidence in a subject and drive for results', 'विषय में आत्मविश्वास और परिणाम की चाह'],
    Moon: ['memory, receptivity and steady mood while studying', 'स्मरण-शक्ति, ग्रहणशीलता और अध्ययन के दौरान स्थिर मन'],
    Mars: ['technical aptitude and competitive drive', 'तकनीकी योग्यता और प्रतिस्पर्धी जोश'],
    Mercury: ['grasp, analysis, expression and speed of learning', 'समझ, विश्लेषण, अभिव्यक्ति और सीखने की गति'],
    Jupiter: ['depth, teachers and higher study', 'गहराई, शिक्षक और उच्च अध्ययन'],
    Venus: ['creative and artistic subjects, and enjoyment of study', 'रचनात्मक व कलात्मक विषय, और अध्ययन में रुचि'],
    Saturn: ['discipline, structure and steady mastery', 'अनुशासन, ढाँचा और क्रमिक महारत'],
    Rahu: ['focus, unconventional fields and technology', 'एकाग्रता, अपरंपरागत क्षेत्र और तकनीक'],
    Ketu: ['deep specialisation and consistency across the syllabus', 'गहरी विशेषज्ञता और पूरे पाठ्यक्रम में निरंतरता'],
  },
  property: {
    Sun: ['ownership in your own name and property tied to family standing', 'अपने नाम पर स्वामित्व और पारिवारिक प्रतिष्ठा से जुड़ी संपत्ति'],
    Moon: ['a settled home and attachment to place', 'बसा-बसाया घर और स्थान से लगाव'],
    Mars: ['land, construction and decisiveness on a purchase', 'भूमि, निर्माण और खरीद पर निर्णय-क्षमता'],
    Mercury: ['documentation, agreements and contract terms', 'काग़ज़ात, अनुबंध और शर्तें'],
    Jupiter: ['sound counsel, fair dealing and affordability', 'सही सलाह, उचित लेन-देन और वहन करने की क्षमता'],
    Venus: ['comfort, décor and the appeal of a place', 'आराम, सजावट और स्थान का आकर्षण'],
    Saturn: ['structural quality, older property and loan burden', 'ढाँचे की गुणवत्ता, पुरानी संपत्ति और loan का भार'],
    Rahu: ['clear title and freedom from pressure to book quickly', 'स्पष्ट मालिकाना हक़ और जल्दी booking के दबाव से मुक्ति'],
    Ketu: ['paperwork and resolution of inherited property', 'काग़ज़ी काम और पैतृक संपत्ति का निपटारा'],
  },
  timing: {
    Sun: ['recognition, authority and dealings with government or seniors', 'पहचान, अधिकार और सरकार या वरिष्ठों से व्यवहार'],
    Moon: ['mental steadiness, public dealings and daily rhythm', 'मानसिक स्थिरता, जन-व्यवहार और दैनिक लय'],
    Mars: ['action, property and technical matters', 'कार्य, संपत्ति और तकनीकी मामले'],
    Mercury: ['communication, trade, paperwork and short travel', 'संवाद, व्यापार, काग़ज़ी काम और छोटी यात्रा'],
    Jupiter: ['growth, guidance, children and matters of trust', 'वृद्धि, मार्गदर्शन, संतान और विश्वास के विषय'],
    Venus: ['relationships, comfort, vehicles and creative work', 'संबंध, आराम, वाहन और रचनात्मक काम'],
    Saturn: ['responsibility, endurance and matters that reward patience', 'ज़िम्मेदारी, सहनशीलता और ऐसे विषय जो धैर्य को फल देते हैं'],
    Rahu: ['adaptability to sudden change and foreign matters', 'अचानक बदलाव के अनुसार ढलना और विदेश से जुड़े मामले'],
    Ketu: ['completion, detachment and inner focus', 'समापन, वैराग्य और भीतरी एकाग्रता'],
  },
};

// ── Part 4 — factor frames + role labels ─────────────────────────────────────
// The frames turn a (planet, meaning, polarity) into a sentence. The multi_role
// frames are what replace the merged duplicate — "Mars and Mars" becomes one
// sentence that states BOTH roles, which is the stronger and truer claim.
// Hindi frames use a colon construction on purpose. The natural-sounding form
// ("जो {{theme}} को सहारा देता है") requires the theme to be in the oblique case
// and to agree in gender and number with the verb — but {{theme}} is a mixed list
// of nouns that varies per planet and domain, so no single inflection is correct
// for all of them ("आदतें को" is simply wrong, and "रहते/रहती" cannot be chosen in
// advance). Naming the themes after a colon leaves them in the direct case, where
// no agreement is required, and reads naturally. English keeps its flowing form,
// which has no such constraint — the two languages get the construction each one
// actually wants rather than a translation of the other's.
const FRAMES = [
  ...B('frag.factor.strong', 'fragment',
    '{{planet}} is well placed here, which supports {{theme}}.',
    '{{planet}} यहाँ अच्छी स्थिति में है। इसका सहारा इन बातों को मिलता है: {{theme}}।'),
  ...B('frag.factor.moderate', 'fragment',
    '{{planet}} is moderately placed, so {{theme}} respond to conscious effort.',
    '{{planet}} मध्यम स्थिति में है। इन बातों में सचेत प्रयास से सुधार आता है: {{theme}}।'),
  ...B('frag.factor.weak', 'fragment',
    '{{planet}} is comparatively weak here, so {{theme}} need conscious discipline.',
    '{{planet}} यहाँ तुलनात्मक रूप से कमज़ोर है। इन बातों में सचेत अनुशासन ज़रूरी है: {{theme}}।'),
  // "in more than one way" rather than "in two ways": a planet can hold three or
  // more roles (Venus ruling both the 4th and the 11th while also being the
  // property karaka is ordinary, not exotic), and a hardcoded "two"/"both" would
  // then contradict the list printed immediately after it.
  ...B('frag.factor.multi_role.strong', 'fragment',
    '{{planet}} supports this matter in more than one way — as {{roles}} — which strengthens {{theme}}.',
    '{{planet}} इस विषय को एक से अधिक तरह से सहारा देता है — {{roles}} के रूप में। इसका असर इन बातों पर दिखता है: {{theme}}।'),
  ...B('frag.factor.multi_role.moderate', 'fragment',
    '{{planet}} touches this matter in more than one way — as {{roles}} — so {{theme}} reward steady attention.',
    '{{planet}} इस विषय को एक से अधिक तरह से प्रभावित करता है — {{roles}} के रूप में। इन बातों में निरंतर ध्यान से सुधार आता है: {{theme}}।'),
  ...B('frag.factor.multi_role.weak', 'fragment',
    '{{planet}} affects this matter in more than one way — as {{roles}} — and is weak in each, so {{theme}} need real attention.',
    '{{planet}} इस विषय को एक से अधिक तरह से प्रभावित करता है — {{roles}} के रूप में — और हर भूमिका में कमज़ोर है। इन बातों पर विशेष ध्यान दें: {{theme}}।'),

  // Role labels are bare noun phrases; the frame supplies the connector ("as
  // {{roles}}" / "{{roles}} के रूप में"), so a two-role list reads "the 11th lord
  // and its natural significations" instead of repeating the connector each time.
  ...B('frag.role.house_lord', 'fragment', 'the {{house}}', '{{house}}'),
  ...B('frag.role.karaka', 'fragment', 'its natural significations', 'नैसर्गिक कारक'),
  ...B('frag.role.domain_anchor', 'fragment', 'the overall indicator for this area', 'इस क्षेत्र का समग्र संकेतक'),
  ...B('frag.role.overall', 'fragment', 'an influence on the chart as a whole', 'समग्र कुंडली पर प्रभाव'),
  ...B('frag.role.varga', 'fragment', 'a divisional-chart signal', 'विभाजन चार्ट का संकेत'),
  ...B('frag.role.maha', 'fragment', 'your running Mahadasha lord', 'आपकी वर्तमान महादशा स्वामी'),
  ...B('frag.role.antar', 'fragment', 'your running Antardasha lord', 'आपकी वर्तमान अंतर्दशा स्वामी'),
  ...B('frag.role.transit', 'fragment', 'a current transit', 'वर्तमान गोचर'),
];

// ── Part 6 — Varga meaning ───────────────────────────────────────────────────
// Each entry states what the chart CONTRIBUTES to that life area, never that it
// "confirms the analysis". Only (chart, domain) pairs the pilot questions actually
// load are seeded; the `.general` rows catch anything else.
const VARGA = [
  // D2 — wealth division
  ...B('varga.d2.finance.supports', 'section',
    'D2 supports earning and resource-building potential, though saving behaviour and spending patterns still need to be read alongside the birth chart.',
    'D2 कमाई और साधन बनाने की क्षमता का समर्थन करता है, यद्यपि बचत की आदत और खर्च का ढंग अब भी जन्म कुंडली के साथ मिलाकर देखना होगा।'),
  ...B('varga.d2.finance.challenges', 'section',
    'D2 points to strain in holding on to what is earned — the difficulty sits in accumulation and outflow rather than in income itself.',
    'D2 कमाए हुए धन को रोक पाने में दबाव दर्शाता है — कठिनाई आय में नहीं, संचय और खर्च में है।'),
  ...B('varga.d2.finance.mixed', 'section',
    'D2 is balanced on wealth: resources can build, but not steadily enough to rely on without a savings discipline.',
    'D2 धन के विषय में संतुलित है: साधन बन सकते हैं, पर इतने स्थिर रूप से नहीं कि बचत के अनुशासन के बिना उन पर निर्भर रहा जा सके।'),

  // D10 — profession
  ...B('varga.d10.career.supports', 'section',
    'D10 supports professional standing and growth, which strengthens the career indication of the birth chart.',
    'D10 व्यावसायिक स्थिति और प्रगति का समर्थन करता है, जो जन्म कुंडली के करियर संकेत को और बल देता है।'),
  ...B('varga.d10.career.challenges', 'section',
    'D10 shows pressure in the professional sphere — recognition and role fit are likelier friction points than capability.',
    'D10 व्यावसायिक क्षेत्र में दबाव दर्शाता है — योग्यता से अधिक पहचान और भूमिका का मेल टकराव के बिंदु हैं।'),
  ...B('varga.d10.career.mixed', 'section',
    'D10 is mixed on profession: the work itself is supported more clearly than the recognition attached to it.',
    'D10 व्यवसाय के विषय में मिश्रित है: काम को उससे जुड़ी पहचान की तुलना में अधिक स्पष्ट समर्थन है।'),
  ...B('varga.d10.business.supports', 'section',
    'D10 supports professional independence and growth-oriented work, which strengthens the business indication.',
    'D10 व्यावसायिक स्वतंत्रता और विकास-केंद्रित काम का समर्थन करता है, जो व्यवसाय के संकेत को बल देता है।'),
  ...B('varga.d10.business.challenges', 'section',
    'D10 shows strain around independent work — the chart is friendlier to a structured role than to carrying the risk yourself.',
    'D10 स्वतंत्र काम में दबाव दर्शाता है — कुंडली स्वयं जोखिम उठाने की तुलना में व्यवस्थित भूमिका के प्रति अधिक अनुकूल है।'),
  ...B('varga.d10.business.mixed', 'section',
    'D10 is mixed on independent work: it is workable, but it will demand more structure than the enthusiasm alone suggests.',
    'D10 स्वतंत्र काम के विषय में मिश्रित है: यह साध्य है, पर केवल उत्साह से लगने वाली अपेक्षा से अधिक व्यवस्था माँगेगा।'),

  // D9 — marriage / dharma
  ...B('varga.d9.marriage.supports', 'section',
    'D9 strengthens the long-term marriage promise, even where the birth chart shows early adjustment.',
    'D9 विवाह के दीर्घकालिक योग को बल देता है, भले ही जन्म कुंडली शुरुआती तालमेल दिखाए।'),
  ...B('varga.d9.marriage.challenges', 'section',
    'D9 adds caution to the marriage reading — the long-term settling asks for more work than the initial match suggests.',
    'D9 विवाह के विश्लेषण में सावधानी जोड़ता है — दीर्घकालिक स्थिरता शुरुआती मेल से अधिक प्रयास माँगती है।'),
  ...B('varga.d9.marriage.mixed', 'section',
    'D9 is balanced on marriage: the promise holds, but the depth of it depends on adjustment rather than on the match alone.',
    'D9 विवाह के विषय में संतुलित है: योग टिकता है, पर उसकी गहराई केवल रिश्ते से नहीं, तालमेल से तय होगी।'),
  ...B('varga.d9.general.supports', 'section',
    'D9 supports the overall strength of the chart, which lends durability to the reading.',
    'D9 कुंडली की समग्र शक्ति का समर्थन करता है, जो इस विश्लेषण को टिकाऊपन देता है।'),
  ...B('varga.d9.general.challenges', 'section',
    'D9 shows underlying strain, so the strengths above rest on a less settled base than they appear to.',
    'D9 भीतरी दबाव दर्शाता है, इसलिए ऊपर बताई शक्तियाँ जितनी स्थिर दिखती हैं, उतनी स्थिर नींव पर नहीं हैं।'),
  ...B('varga.d9.general.mixed', 'section',
    'D9 is balanced overall, neither reinforcing nor undercutting the birth-chart reading.',
    'D9 समग्र रूप से संतुलित है, जो जन्म कुंडली के विश्लेषण को न बल देता है न कमज़ोर करता है।'),

  // D4 — property / fixed assets
  ...B('varga.d4.property.supports', 'section',
    'D4 supports ownership and the stability of a settled home, which strengthens the property indication.',
    'D4 स्वामित्व और बसे-बसाए घर की स्थिरता का समर्थन करता है, जो संपत्ति के संकेत को बल देता है।'),
  ...B('varga.d4.property.challenges', 'section',
    'D4 shows pressure around property stability, ownership timing or documentation, so purchase decisions need careful verification.',
    'D4 संपत्ति की स्थिरता, स्वामित्व के समय या काग़ज़ात को लेकर दबाव दर्शाता है, इसलिए खरीद के निर्णय सावधानीपूर्वक जाँच माँगते हैं।'),
  ...B('varga.d4.property.mixed', 'section',
    'D4 is balanced on property: ownership is achievable, but it will not settle quickly or without paperwork.',
    'D4 संपत्ति के विषय में संतुलित है: स्वामित्व संभव है, पर वह जल्दी या काग़ज़ी काम के बिना स्थिर नहीं होगा।'),

  // D16 — comfort / vehicle
  ...B('varga.d16.property.supports', 'section',
    'D16 supports comfort and enjoyment of what you own, so the home is likely to feel worth what it costs.',
    'D16 आराम और अपनी वस्तु के सुख का समर्थन करता है, इसलिए घर अपनी क़ीमत के योग्य अनुभव होने की संभावना है।'),
  ...B('varga.d16.property.challenges', 'section',
    'D16 adds caution around comfort, vehicle and home-related expenses — the running cost may outpace the purchase decision.',
    'D16 आराम, वाहन और घर से जुड़े खर्चों को लेकर सावधानी जोड़ता है — चलाने का खर्च खरीद के निर्णय से आगे निकल सकता है।'),
  ...B('varga.d16.property.mixed', 'section',
    'D16 is balanced on comfort: what you acquire will serve, without being the source of ease you may be picturing.',
    'D16 आराम के विषय में संतुलित है: जो लेंगे वह काम आएगा, पर वह सुख का वैसा स्रोत नहीं होगा जैसा आप सोच रहे हों।'),

  // D30 — vulnerability
  ...B('varga.d30.health.supports', 'section',
    'D30 is reassuring on vulnerability and recovery, so the constitution has more reserve than the birth chart alone suggests.',
    'D30 संवेदनशीलता और रोग से उबरने के विषय में आश्वस्त करता है, इसलिए शरीर में केवल जन्म कुंडली से लगने वाली अपेक्षा से अधिक क्षमता है।'),
  ...B('varga.d30.health.challenges', 'section',
    'D30 adds caution around vulnerability and recovery, so preventive care and a disciplined routine should not be treated as optional.',
    'D30 संवेदनशीलता और रोग से उबरने को लेकर सावधानी जोड़ता है, इसलिए बचाव और अनुशासित दिनचर्या को वैकल्पिक न मानें।'),
  ...B('varga.d30.health.mixed', 'section',
    'D30 is balanced on vulnerability: nothing is flagged strongly, though recovery still depends on how consistently you look after the basics.',
    'D30 संवेदनशीलता के विषय में संतुलित है: कुछ भी प्रबल रूप से चिह्नित नहीं है, फिर भी सुधार इस पर निर्भर है कि आप बुनियादी बातों का कितनी निरंतरता से ध्यान रखते हैं।'),

  // D7 — children
  ...B('varga.d7.children.supports', 'section',
    'D7 supports children-related potential, adding weight to the birth-chart indication.',
    'D7 संतान से जुड़ी संभावना का समर्थन करता है, जो जन्म कुंडली के संकेत को और बल देता है।'),
  ...B('varga.d7.children.challenges', 'section',
    'D7 shows timing or responsibility-related pressure in this area. This describes a tendency only, and medical guidance remains the right authority.',
    'D7 इस क्षेत्र में समय या ज़िम्मेदारी से जुड़ा दबाव दर्शाता है। यह केवल प्रवृत्ति बताता है, और सही मार्गदर्शन चिकित्सा का ही रहेगा।'),
  ...B('varga.d7.children.mixed', 'section',
    'D7 supports children-related potential but may still show timing or responsibility-related pressure.',
    'D7 संतान से जुड़ी संभावना का समर्थन करता है, पर समय या ज़िम्मेदारी से जुड़ा दबाव भी दिखा सकता है।'),

  // D12 — parents / lineage (family questions load it)
  ...B('varga.d12.children.supports', 'section',
    'D12 supports the family foundation around this matter, which helps the wider situation settle.',
    'D12 इस विषय से जुड़े पारिवारिक आधार का समर्थन करता है, जिससे समग्र स्थिति स्थिर होने में सहायता मिलती है।'),
  ...B('varga.d12.children.challenges', 'section',
    'D12 shows strain in the family background around this matter, which can add pressure that is not about the child at all.',
    'D12 इस विषय से जुड़ी पारिवारिक पृष्ठभूमि में दबाव दर्शाता है, जिससे ऐसा दबाव जुड़ सकता है जिसका संतान से कोई संबंध नहीं।'),
  ...B('varga.d12.children.mixed', 'section',
    'D12 is balanced on the family background here, neither easing nor worsening the main indication.',
    'D12 यहाँ पारिवारिक पृष्ठभूमि के विषय में संतुलित है, जो मुख्य संकेत को न सरल बनाता है न कठिन।'),

  // D24 — learning
  ...B('varga.d24.education.supports', 'section',
    'D24 supports formal learning and the ability to complete what you start, which strengthens the education reading.',
    'D24 औपचारिक शिक्षा और शुरू किए हुए को पूरा करने की क्षमता का समर्थन करता है, जो शिक्षा के विश्लेषण को बल देता है।'),
  ...B('varga.d24.education.challenges', 'section',
    'D24 shows interruption or inconsistency in formal study — the constraint is continuity rather than capability.',
    'D24 औपचारिक अध्ययन में रुकावट या अनियमितता दर्शाता है — बाधा योग्यता की नहीं, निरंतरता की है।'),
  ...B('varga.d24.education.mixed', 'section',
    'D24 is balanced on learning: study is workable, though results will track method more than ability.',
    'D24 अध्ययन के विषय में संतुलित है: पढ़ाई साध्य है, यद्यपि परिणाम योग्यता से अधिक तरीके पर चलेंगे।'),

  // generic fallbacks for any (chart, domain) pair not seeded above
  ...B('varga.d1.general.supports', 'section', 'The birth chart supports this reading.', 'जन्म कुंडली इस विश्लेषण का समर्थन करती है।'),
  ...B('varga.d1.general.challenges', 'section', 'The birth chart shows caution on this matter.', 'जन्म कुंडली इस विषय में सावधानी दर्शाती है।'),
  ...B('varga.d1.general.mixed', 'section', 'The birth chart is balanced on this matter.', 'जन्म कुंडली इस विषय में संतुलित है।'),
];

// ── Part 9 — confidence reasons ──────────────────────────────────────────────
// Confidence never travels without the reason it holds. {{varga}} names a chart the
// reader can look up; no score, weight or rule key ever appears.
const CONFIDENCE = [
  ...B('confidence.high.agreement', 'note',
    'Confidence is high because the birth chart, the relevant house lord and {{varga}} point in the same direction, with no major contradiction between them.',
    'विश्वसनीयता उच्च है क्योंकि जन्म कुंडली, संबंधित भाव स्वामी और {{varga}} एक ही दिशा में संकेत देते हैं, और इनमें कोई बड़ा विरोध नहीं है।'),
  ...B('confidence.high.default', 'note',
    'Confidence is high because the main indicators agree with one another.',
    'विश्वसनीयता उच्च है क्योंकि मुख्य संकेतक आपस में सहमत हैं।'),
  ...B('confidence.medium.conflict', 'note',
    'Confidence is medium because the birth chart is supportive while {{varga}} shows caution, so the two do not fully agree.',
    'विश्वसनीयता मध्यम है क्योंकि जन्म कुंडली सहायक है जबकि {{varga}} सावधानी दर्शाता है, इसलिए दोनों पूरी तरह सहमत नहीं हैं।'),
  ...B('confidence.medium.partial', 'note',
    'Confidence is medium because the chart indicates the tendency clearly, but the timing of it is less certain.',
    'विश्वसनीयता मध्यम है क्योंकि कुंडली प्रवृत्ति स्पष्ट दर्शाती है, पर उसका समय उतना निश्चित नहीं है।'),
  ...B('confidence.medium.default', 'note',
    'Confidence is medium because the supporting and cautioning indicators carry similar weight.',
    'विश्वसनीयता मध्यम है क्योंकि सहायक और सावधानी वाले संकेतक लगभग बराबर भार रखते हैं।'),
  ...B('confidence.low.thin', 'note',
    'Confidence is low because some of the inputs this question depends on are incomplete — a more precise birth time would sharpen it.',
    'विश्वसनीयता निम्न है क्योंकि इस प्रश्न के लिए आवश्यक कुछ जानकारी अधूरी है — जन्म समय अधिक सटीक हो तो यह बेहतर हो सकती है।'),
  ...B('confidence.low.contradiction', 'note',
    'Confidence is low because the relevant indicators contradict each other, so no single direction can be stated with certainty.',
    'विश्वसनीयता निम्न है क्योंकि संबंधित संकेतक आपस में विरोध करते हैं, इसलिए किसी एक दिशा को निश्चित रूप से नहीं कहा जा सकता।'),
  ...B('confidence.low.default', 'note',
    'Confidence is low because the available indicators do not settle into a clear direction.',
    'विश्वसनीयता निम्न है क्योंकि उपलब्ध संकेतक किसी स्पष्ट दिशा पर नहीं टिकते।'),
];

// ── Part 11 — timing language ────────────────────────────────────────────────
// Timing gets phases, not a transit dump. Dates appear only via {{until}}, which
// the composer fills ONLY from a transit boundary the engine actually resolved.
//
// There is deliberately no `later_window` block: the only future date derivable
// from current-transit data is the end of the pressure `preparation` already
// names, so the section could only repeat it. See timing-outlook.js.
const TIMING = [
  // general (fallback for every domain without its own timing voice)
  ...B('timing.general.current.supportive', 'section', 'The current period is broadly supportive — a reasonable phase to prepare and act deliberately.', 'वर्तमान समय मोटे तौर पर सहायक है — तैयारी और सोच-समझकर कार्य करने के लिए उपयुक्त दौर।'),
  ...B('timing.general.current.mixed', 'section', 'The current period is mixed — progress is realistic through steady preparation and follow-up.', 'वर्तमान समय मिश्रित है — निरंतर तैयारी और अनुवर्तन से प्रगति वास्तविक है।'),
  ...B('timing.general.current.caution', 'section', 'The current period asks for patience — use it to prepare rather than to force an outcome.', 'वर्तमान समय धैर्य माँगता है — इसका उपयोग परिणाम पर ज़ोर देने के बजाय तैयारी में करें।'),
  ...B('timing.general.preparation', 'section', '{{planet}} in {{sign}} keeps the pressure on until around {{until}}, so treat this stretch as preparation rather than execution.', '{{planet}} का {{sign}} में रहना लगभग {{until}} तक दबाव बनाए रखता है, इसलिए इस अवधि को कार्यान्वयन नहीं, तैयारी का समय मानें।'),
  ...B('timing.general.supportive_window', 'section', 'A relatively supportive window runs while {{planet}} transits {{sign}}, roughly until {{until}}.', 'अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है, लगभग {{until}} तक।'),
  ...B('timing.general.supportive_window_open', 'section', 'A relatively supportive window runs while {{planet}} transits {{sign}}.', 'अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है।'),
  ...B('timing.general.trigger', 'section', 'A stronger window needs the relevant house lord and your running {{maha_lord}} period to support the matter together.', 'अधिक प्रबल अवधि के लिए संबंधित भाव स्वामी और आपकी वर्तमान {{maha_lord}} दशा — दोनों का साथ मिलकर इस विषय का समर्थन करना आवश्यक है।'),
  ...B('timing.general.no_window', 'section', 'No strong near-term window is visible. Use the current period for preparation rather than forcing a date.', 'निकट भविष्य में कोई प्रबल अनुकूल अवधि नहीं दिखती। वर्तमान समय का उपयोग तिथि पर ज़ोर देने के बजाय तैयारी में करें।'),

  // property — the timing question the pilot actually ships (Q081)
  ...B('timing.property.current.supportive', 'section', 'The current period supports moving on property — finance, shortlisting and verification can all progress together.', 'वर्तमान समय संपत्ति पर आगे बढ़ने का समर्थन करता है — पैसे की व्यवस्था, विकल्प छाँटना और जाँच, तीनों साथ चल सकते हैं।'),
  ...B('timing.property.current.mixed', 'section', 'The current period is better used for financial and legal preparation than for signing.', 'वर्तमान समय हस्ताक्षर करने से अधिक, पैसे और काग़ज़ात की तैयारी के लिए उपयुक्त है।'),
  ...B('timing.property.current.caution', 'section', 'The current period asks for caution on property — verify rather than commit.', 'वर्तमान समय संपत्ति में सावधानी माँगता है — प्रतिबद्धता से पहले जाँच करें।'),
  ...B('timing.property.preparation', 'section', '{{planet}} in {{sign}} keeps pressure on property matters until around {{until}} — use this stretch for finance, title verification and paperwork rather than booking.', '{{planet}} का {{sign}} में रहना लगभग {{until}} तक संपत्ति के मामलों पर दबाव रखता है — इस अवधि का उपयोग booking के बजाय पैसे की व्यवस्था, मालिकाना हक़ की जाँच और काग़ज़ी काम में करें।'),
  ...B('timing.property.supportive_window', 'section', 'A relatively supportive window for acting on property runs while {{planet}} transits {{sign}}, roughly until {{until}}.', 'संपत्ति पर कदम उठाने के लिए अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है, लगभग {{until}} तक।'),
  ...B('timing.property.supportive_window_open', 'section', 'A relatively supportive window for acting on property runs while {{planet}} transits {{sign}}.', 'संपत्ति पर कदम उठाने के लिए अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है।'),
  ...B('timing.property.trigger', 'section', 'A stronger purchase window needs the property-related house lord and your running {{maha_lord}} period to activate together — until they do, preparation is the better use of the time.', 'खरीद के लिए अधिक प्रबल अवधि तब बनेगी जब संपत्ति से जुड़ा भाव स्वामी और आपकी वर्तमान {{maha_lord}} दशा — दोनों एक साथ सक्रिय हों। तब तक समय का बेहतर उपयोग तैयारी है।'),
  ...B('timing.property.no_window', 'section', 'No strong near-term purchase window is visible. Use this period to arrange finance and complete verification rather than forcing a date.', 'निकट भविष्य में खरीद के लिए कोई प्रबल अवधि नहीं दिखती। इस समय का उपयोग तिथि पर ज़ोर देने के बजाय पैसे की व्यवस्था और जाँच पूरी करने में करें।'),

  // marriage — the other shipped timing question (Q041)
  ...B('timing.marriage.current.supportive', 'section', 'The current period supports marriage-related effort — meeting suitable matches now tends to go somewhere.', 'वर्तमान समय विवाह से जुड़े प्रयास का समर्थन करता है — अभी उपयुक्त रिश्ते देखना प्रायः आगे बढ़ता है।'),
  ...B('timing.marriage.current.mixed', 'section', 'The current period is mixed for marriage — keep looking, but judge a match on its merits rather than on urgency.', 'वर्तमान समय विवाह के लिए मिश्रित है — देखते रहें, पर किसी रिश्ते को जल्दबाज़ी से नहीं, उसके गुणों से परखें।'),
  ...B('timing.marriage.current.caution', 'section', 'The current period asks for patience on marriage — pressure to decide quickly is worth resisting.', 'वर्तमान समय विवाह में धैर्य माँगता है — जल्दी निर्णय के दबाव से बचना उचित है।'),
  ...B('timing.marriage.preparation', 'section', '{{planet}} in {{sign}} keeps marriage matters under pressure until around {{until}} — a phase for clarity about what you want rather than for commitment.', '{{planet}} का {{sign}} में रहना लगभग {{until}} तक विवाह के मामलों पर दबाव रखता है — यह प्रतिबद्धता का नहीं, यह स्पष्ट करने का दौर है कि आप क्या चाहते हैं।'),
  ...B('timing.marriage.supportive_window', 'section', 'A relatively supportive window for marriage runs while {{planet}} transits {{sign}}, roughly until {{until}}.', 'विवाह के लिए अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है, लगभग {{until}} तक।'),
  ...B('timing.marriage.supportive_window_open', 'section', 'A relatively supportive window for marriage runs while {{planet}} transits {{sign}}.', 'विवाह के लिए अपेक्षाकृत अनुकूल अवधि {{planet}} के {{sign}} में गोचर के दौरान रहती है।'),
  ...B('timing.marriage.trigger', 'section', 'A stronger marriage window needs the 7th lord and your running {{maha_lord}} period to support the matter together.', 'विवाह के लिए अधिक प्रबल अवधि तब बनेगी जब सप्तम भाव के स्वामी और आपकी वर्तमान {{maha_lord}} दशा — दोनों साथ मिलकर इस विषय का समर्थन करें।'),
  ...B('timing.marriage.no_window', 'section', 'No strong near-term marriage window is visible. Keep meeting suitable matches, and treat this period as preparation rather than a deadline.', 'निकट भविष्य में विवाह के लिए कोई प्रबल अवधि नहीं दिखती। उपयुक्त रिश्ते देखते रहें, और इस समय को समय-सीमा नहीं, तैयारी मानें।'),

  // shared: never a promise
  ...B('timing.no_guarantee', 'note',
    'This describes periods when effort is best rewarded, not a guaranteed event date.',
    'यह उन अवधियों को दर्शाता है जब प्रयास का सर्वोत्तम फल मिलता है, किसी निश्चित घटना-तिथि की गारंटी नहीं।'),
];

// ── Part 13 — legal disclaimer (new: property/vehicle/disputes domains) ───────
const DISCLAIMERS = [
  ...B('disclaimer_legal', 'disclaimer',
    'This is astrological guidance, not legal advice. Verify all documents and title with a qualified legal professional before any property decision.',
    'यह ज्योतिषीय मार्गदर्शन है, कानूनी सलाह नहीं। संपत्ति से जुड़ा कोई भी निर्णय लेने से पहले सभी काग़ज़ात और मालिकाना हक़ की जाँच योग्य कानूनी विशेषज्ञ से कराएँ।'),
];

// ── Section titles for the new sections ──────────────────────────────────────
const TITLES = [
  ...B('label.sec.confidence_reason', 'label', 'Why this confidence', 'यह विश्वसनीयता क्यों'),
  ...B('label.sec.varga_perspective', 'label', 'Divisional-chart perspective', 'विभाजन चार्ट का दृष्टिकोण'),
];

// ── Row assembly ─────────────────────────────────────────────────────────────
function directRows() {
  const rows = [];
  for (const [domain, byState] of Object.entries(DIRECT)) {
    for (const state of STATES) {
      const pair = byState[state];
      if (!pair) continue;
      rows.push(...B(`direct_answer.${domain}.${state}`, 'section', pair[0], pair[1]));
    }
  }
  return rows;
}

function cautionRows() {
  return Object.entries(CAUTION).flatMap(([d, [en, hi]]) => B(`caution.${d}`, 'section', en, hi));
}

function actionRows() {
  return Object.entries(ACTION).flatMap(([d, [en, hi]]) => B(`action.${d}`, 'section', en, hi));
}

function meaningRows() {
  const rows = [];
  for (const [domain, byPlanet] of Object.entries(MEANING)) {
    for (const planet of PLANETS) {
      const pair = byPlanet[planet];
      if (!pair) continue;
      rows.push(...B(`meaning.${planet.toLowerCase()}.${domain}`, 'fragment', pair[0], pair[1]));
    }
  }
  return rows;
}

function buildDomainBlocks() {
  return [
    ...directRows(), ...cautionRows(), ...actionRows(), ...meaningRows(),
    ...FRAMES, ...VARGA, ...CONFIDENCE, ...TIMING, ...DISCLAIMERS, ...TITLES,
  ];
}

module.exports = {
  STATES, PLANETS, LIVE_DOMAINS,
  DIRECT, CAUTION, ACTION, MEANING, FRAMES, VARGA, CONFIDENCE, TIMING, DISCLAIMERS, TITLES,
  buildDomainBlocks,
};
