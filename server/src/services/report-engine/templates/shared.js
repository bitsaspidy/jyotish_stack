'use strict';
// Language-agnostic dynamic rule builders. These read from the chosen lexicon
// (LEX) so the SAME logic produces the right language — still no runtime
// translation, because every word comes from the selected language's lexicon.
const { fill } = require('../lexicon');

module.exports = {
  'pers.base': {
    text: (ctx, LEX) => {
      const lag = LEX.SIGN[ctx.lagna];
      const moon = LEX.SIGN[ctx.moonSign] || lag;
      const nak = ctx.moonNak ? LEX.NAKSHATRA[ctx.moonNak] : null;
      let s = fill(LEX.PHRASES.sumNature, { nature: lag.nature, manas: moon.manas });
      if (nak) s += fill(LEX.PHRASES.sumInner, { nak });
      return s;
    },
  },
};
