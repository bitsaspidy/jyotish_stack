'use strict';
// Rule text — Hinglish (optional). Spreads Hindi as the base, then overrides the
// common lines in natural Hinglish. Dynamic builders (e.g. pers.base) already
// produce Hinglish automatically via the Hinglish lexicon. Anything not
// overridden stays pure Hindi (never randomly mixed).
const hi = require('./hi');

module.exports = {
  ...hi,

  'pers.lagnalord.strong': { text: 'Aapke andar self-control, firmness aur khud ko sambhalne ki achhi capacity dikhti hai.' },
  'pers.lagnalord.weak': { text: 'Kabhi-kabhi confidence aur mann ki stability me ups-downs aa sakte hain; khud par bharosa badhane par kaam karein.', advice: 'Roz thoda time khud ko samajhne aur calm rehne me dein.' },
  'pers.sun.strong': { text: 'Leadership, self-respect aur responsibility lene ka gun aapme strong hai.' },
  'pers.saturn.lagna': { text: 'Aap serious, responsible aur practical hain, par kabhi over-thinking ya khud par zyada sakhti se bachein.' },

  'fam.base': { text: 'Family aur ghar aapki life me emotional support jaise hain. Time ke saath responsibilities aur bonds dono badhte hain.' },
  'fam.benefic4': { text: 'Ghar me aam taur par peace aur apno ka support bana rehta hai.' },
  'fam.rahuketu2': { text: 'Family me paise ya baat-cheet ko lekar kabhi misunderstanding ho sakti hai; vaani me control rakhein.', caution: 'Paise ke len-den aur teekhi baaton se family me doori na aane dein.' },

  'car.base': { text: 'Career me aage badhne ki capacity aapme hai; sahi direction aur lagatar mehnat se pehchaan banti hai.' },
  'car.benefic10': { text: 'Kaam me growth aur achhe opportunities milne ki achhi possibility hai.' },
  'car.saturn': { text: 'Job aur responsibility wale kaam aapko suit karte hain; success dheere par strong aur lasting milti hai.', advice: 'Jaldbaazi ki jagah patience aur lagatar mehnat rakhein.' },
  'car.ego': { text: 'Senior ya authority se ego clash se bachein — isse bane kaam bigad sakte hain.', caution: 'Gusse aur ego me job/kaam ka nuksan na karein.' },

  'mon.base': { text: 'Paisa kamane ki samajh aapme hai; income ke saath saving aur sahi planning par dhyan dena faydemand rahega.' },
  'mon.rahu2': { text: 'Paisa kabhi suddenly bhi aa sakta hai, par bina soche investment ya udhaari se bachein.', caution: 'Laalach me quick-money risky deals se door rahein.' },

  'mar.base': { text: 'Shaadi aur partnership aapki life ka important hissa rahenge; samajhdari aur communication se rishte strong bante hain.' },
  'mar.benefic7': { text: 'Life partner ka swabhav achha aur supportive rehne ki possibility hai; married life me pyaar aur samajh bani rehti hai.' },
  'mar.mars7': { text: 'Life partner energetic aur outspoken ho sakta hai; rishte me patience aur ek-doosre ko samajhna zaroori rahega.', caution: 'Choti baat par argument ko badhne na dein; gusse me kahi baat rishte ko hurt karti hai.' },

  'chl.base': { text: 'Santaan aur bachhon se जुड़ा sukh aapki life ka beautiful hissa rahega.' },
  'chl.jupiter5': { text: 'Santaan sukh aur bachhon se khushiyon ki achhi possibility dikhti hai.' },
  'chl.delay': { text: 'Santaan sukh me thodi delay ya zyada effort ki possibility dikhti hai. Sahi time, medical advice aur spiritual upaay dono saath lekar chalna better rahega.', advice: 'Patience rakhein aur zaroorat ho to time par achhi medical advice lein.' },

  'sib.base': { text: 'Bhai-behen aur friends aapki life me support aur connection ka zariya rahenge.' },
  'hea.base': { text: 'Overall health manage ki ja sakti hai; achhi routine aur balanced lifestyle sabse bada upaay hai.' },
  'hea.mind': { text: 'Mann kabhi over-thinking ya zyada emotional hone lagta hai; mental peace ka khaas dhyan rakhein.', advice: 'Roz kuch minute deep breathing ya meditation karein.' },
  'deb.base': { text: 'Mushkilon aur competition ko face karne ki capacity aapme hai; samajhdari se chalein to problems sambhal jaati hain.' },
  'pro.base': { text: 'Time ke saath ghar, vehicle aur comfort ke saadhan judne ki possibility hai.' },
  'spi.base': { text: 'Luck aur mehnat dono ka saath aapki life ko aage badhate hain; dharm-karm me interest mann ko peace deta hai.' },
};
