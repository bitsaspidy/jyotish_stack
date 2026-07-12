'use strict';
/**
 * Default pilot rule — generic favourability framing for pilot questions whose
 * shape is "are the prospects for X favourable / indicated" (Q012, Q021, Q031,
 * Q051, Q061, Q071). Produces a bilingual headline + direct answer keyed off the
 * computed state and the question's own short title. No LLM.
 */

const STATE_HEAD = {
  highly_favourable:     ['The prospects here are strong',        'यहाँ संभावनाएँ मजबूत हैं'],
  favourable:            ['The prospects here are favourable',    'यहाँ संभावनाएँ अनुकूल हैं'],
  moderately_favourable: ['The prospects here are workable',      'यहाँ संभावनाएँ ठीक-ठाक हैं'],
  mixed:                 ['The prospects here are mixed',         'यहाँ संभावनाएँ मिश्रित हैं'],
  challenging:           ['This area needs careful effort',       'इस क्षेत्र में सतर्क प्रयास चाहिए'],
  highly_challenging:    ['This area asks for extra care',        'इस क्षेत्र में अधिक सावधानी चाहिए'],
  insufficient_data:     ['Not enough chart data to answer yet',  'उत्तर के लिए पर्याप्त कुंडली डेटा नहीं'],
};

// clean Hindi adjective phrase per state (avoids grammatically-broken splicing)
const STATE_ADJ_HI = {
  highly_favourable:     'अत्यधिक अनुकूल',
  favourable:            'अनुकूल',
  moderately_favourable: 'सामान्यतः अनुकूल',
  mixed:                 'मिश्रित',
  challenging:           'चुनौतीपूर्ण',
  highly_challenging:    'अधिक सावधानी वाला',
  insufficient_data:     'अभी अनिश्चित',
};

module.exports = function defaultRule(ctx) {
  const [he, hh] = STATE_HEAD[ctx.state] || STATE_HEAD.mixed;
  const adjHi = STATE_ADJ_HI[ctx.state] || STATE_ADJ_HI.mixed;
  return {
    rule_keys: ['qa.lens.v1', 'qa.strength.v1', 'qa.state.v1'],
    headline_en: he,
    headline_hi: hh,
    direct_en: `On "${ctx.question.short_title_en.toLowerCase()}", the balance of your chart is ${ctx.state.replace(/_/g, ' ')}. This is a tendency to work with, not a fixed verdict.`,
    direct_hi: `"${ctx.question.short_title_hi}" के संबंध में, आपकी कुंडली का समग्र संतुलन ${adjHi} है। यह प्रवृत्ति है, निश्चित निर्णय नहीं।`,
  };
};
