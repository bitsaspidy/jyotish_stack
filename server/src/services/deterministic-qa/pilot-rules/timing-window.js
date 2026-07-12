'use strict';
/**
 * Shared timing-window rule for the timing-heavy pilot questions (Q041 marriage
 * timing, Q081 house-purchase timing). Frames the most supportive upcoming
 * slow-planet window together with the current Dasha — as a PERIOD OF EMPHASIS,
 * never a guaranteed event date.
 */

const composer = require('../answer-composer');
const PLANET_HI = composer.PLANET_HI;

function bestSupportiveWindow(transit) {
  if (!transit || !transit.available) return null;
  const rel = transit.transits.filter((t) => t.relevant_to_question && t.classification === 'supportive');
  const scope = rel.length ? rel : transit.transits.filter((t) => t.classification === 'supportive');
  if (!scope.length) return null;
  // earliest-ending supportive window = the nearest actionable emphasis
  return scope.sort((a, b) => String(a.transit_end).localeCompare(String(b.transit_end)))[0];
}

module.exports = function timingWindow(topic) {
  const T = {
    marriage: {
      en: 'marriage', hi: 'विवाह',
      head_en: 'Marriage-timing outlook', head_hi: 'विवाह समय का दृष्टिकोण',
      act_en: 'Keep meeting suitable matches and check compatibility seriously when one appears; treat the window below as when effort is best rewarded, not a fixed date.',
      act_hi: 'उपयुक्त रिश्ते देखते रहें और गंभीर रिश्ता आने पर अनुकूलता जांचें; नीचे दी अवधि को प्रयास का सर्वोत्तम समय मानें, निश्चित तिथि नहीं।',
    },
    property: {
      en: 'buying a house', hi: 'मकान खरीदने',
      head_en: 'House-purchase timing outlook', head_hi: 'मकान खरीद समय का दृष्टिकोण',
      act_en: 'Line up finances and shortlist options now; complete legal and technical due diligence, and aim major action within the supportive window below rather than on a promised date.',
      act_hi: 'अभी वित्त व्यवस्थित करें और विकल्प चुनें; कानूनी-तकनीकी जांच पूरी करें, और बड़ा कदम नीचे दी अनुकूल अवधि में लें, किसी वादा-तिथि पर नहीं।',
    },
  }[topic];

  return function rule(ctx) {
    const stateHi = composer.STATE_FRAME[ctx.state] ? composer.STATE_FRAME[ctx.state].hi : ctx.state;
    const win = bestSupportiveWindow(ctx.transit);
    const maha = ctx.loaded.selected.dasha.available.maha;
    let win_en = '', win_hi = '';
    if (win) {
      win_en = ` A relatively supportive window runs while ${win.planet} transits ${win.transit_sign_en}${win.transit_end ? ` (roughly until ${win.transit_end})` : ''}.`;
      win_hi = ` ${PLANET_HI[win.planet] || win.planet} के ${win.transit_sign_hi} में गोचर के दौरान अपेक्षाकृत अनुकूल अवधि रहती है${win.transit_end ? ` (लगभग ${win.transit_end} तक)` : ''}।`;
    } else {
      win_en = ' No strongly supportive slow-planet window stands out in the near term, so favour steady preparation over forcing timing.';
      win_hi = ' निकट भविष्य में कोई प्रबल अनुकूल धीमे-ग्रह अवधि प्रमुख नहीं दिखती, इसलिए समय को मजबूर करने के बजाय स्थिर तैयारी करें।';
    }
    const dashaEn = maha ? ` Your running ${maha.lord} period sets the background tone.` : '';
    const dashaHi = maha ? ` आपकी वर्तमान ${PLANET_HI[maha.lord] || maha.lord} दशा पृष्ठभूमि का स्वर तय करती है।` : '';

    return {
      rule_keys: ['qa.timing.v1', 'qa.transit.v1', 'qa.state.v1'],
      timing_window: win || null,
      headline_en: T.head_en, headline_hi: T.head_hi,
      direct_en: `On the timing of ${T.en}, your chart's current indication is ${ctx.state.replace(/_/g, ' ')}.${win_en}${dashaEn} This is guidance on likely periods, not a guaranteed event date.`,
      direct_hi: `${T.hi} के समय पर, आपकी कुंडली का वर्तमान संकेत ${stateHi} है।${win_hi}${dashaHi} यह संभावित अवधियों का मार्गदर्शन है, निश्चित घटना-तिथि नहीं।`,
      action_en: T.act_en, action_hi: T.act_hi,
    };
  };
};
