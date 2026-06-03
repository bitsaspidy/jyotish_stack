'use strict';
const { houseFromSign, nakExtra, inclusiveNakDistance, varnaForRashi, vashyaForRashi, relationScore } = require('./core-helpers');
const { analyzeMangalDosha } = require('./mangal-dosha');

function calculateAshtakoot(boyChart, girlChart) {
  const boyMoon  = boyChart.planets.Moon;
  const girlMoon = girlChart.planets.Moon;
  const boyNak   = boyChart.nakshatra;
  const girlNak  = girlChart.nakshatra;
  const boyExtra  = nakExtra(boyNak.num);
  const girlExtra = nakExtra(girlNak.num);

  const boyVarna  = varnaForRashi(boyMoon.rashi_num);
  const girlVarna = varnaForRashi(girlMoon.rashi_num);
  const varna = boyVarna.rank >= girlVarna.rank ? 1 : 0;

  const boyVashya  = vashyaForRashi(boyMoon.rashi_num);
  const girlVashya = vashyaForRashi(girlMoon.rashi_num);
  const vashya = boyVashya === girlVashya ? 2 : 1;

  const taraBoyToGirl = inclusiveNakDistance(boyNak.num, girlNak.num) % 9;
  const taraGirlToBoy = inclusiveNakDistance(girlNak.num, boyNak.num) % 9;
  const goodTara = (n) => [0, 2, 4, 6, 8].includes(n);
  const tara = (goodTara(taraBoyToGirl) ? 1.5 : 0) + (goodTara(taraGirlToBoy) ? 1.5 : 0);

  const enemyYoni = new Set(['cat:rat','rat:cat','serpent:mongoose','mongoose:serpent','dog:deer','deer:dog','cow:tiger','tiger:cow','elephant:lion','lion:elephant','horse:buffalo','buffalo:horse']);
  const yoniKey = `${boyExtra.yoni}:${girlExtra.yoni}`;
  const yoni = boyExtra.yoni === girlExtra.yoni ? 4 : enemyYoni.has(yoniKey) ? 0 : 2;

  const graha = relationScore(boyMoon.rashi_lord, girlMoon.rashi_lord);

  let gana = 0;
  if (boyExtra.gana === girlExtra.gana) gana = 6;
  else if ([boyExtra.gana, girlExtra.gana].includes('rakshasa') && [boyExtra.gana, girlExtra.gana].includes('deva')) gana = 0;
  else if ([boyExtra.gana, girlExtra.gana].includes('rakshasa')) gana = 1;
  else gana = 5;

  const boyToGirlSign = houseFromSign(boyMoon.rashi_num, girlMoon.rashi_num);
  const girlToBoySign = houseFromSign(girlMoon.rashi_num, boyMoon.rashi_num);
  const badBhakootPairs = new Set(['2:12','12:2','5:9','9:5','6:8','8:6']);
  const bhakoot = badBhakootPairs.has(`${boyToGirlSign}:${girlToBoySign}`) ? 0 : 7;

  const nadi = boyExtra.nadi === girlExtra.nadi ? 0 : 8;

  const kootas = [
    { name:'Varna',        score:varna,  max:1, details:`${boyVarna.name} / ${girlVarna.name}` },
    { name:'Vashya',       score:vashya, max:2, details:`${boyVashya} / ${girlVashya}` },
    { name:'Tara',         score:tara,   max:3, details:`Tara remainders ${taraBoyToGirl}, ${taraGirlToBoy}` },
    { name:'Yoni',         score:yoni,   max:4, details:`${boyExtra.yoni} / ${girlExtra.yoni}` },
    { name:'Graha Maitri', score:graha,  max:5, details:`${boyMoon.rashi_lord} / ${girlMoon.rashi_lord}` },
    { name:'Gana',         score:gana,   max:6, details:`${boyExtra.gana} / ${girlExtra.gana}` },
    { name:'Bhakoot',      score:bhakoot,max:7, details:`${boyToGirlSign}/${girlToBoySign}` },
    { name:'Nadi',         score:nadi,   max:8, details:`${boyExtra.nadi} / ${girlExtra.nadi}` },
  ];
  const total = +kootas.reduce((sum, k) => sum + k.score, 0).toFixed(2);

  const mangal = {
    boy:  boyChart.mangal_dosha  || analyzeMangalDosha(boyChart),
    girl: girlChart.mangal_dosha || analyzeMangalDosha(girlChart),
  };
  const mangalCompatible = mangal.boy.has_dosha === mangal.girl.has_dosha || mangal.boy.severity === mangal.girl.severity;

  return {
    system: 'Ashtakoot Guna Milan',
    note: 'Rule-based classical implementation with simplified yoni/vashya compatibility tables. Verify against an approved Panchang before production decisions.',
    total, max: 36,
    percentage: +((total / 36) * 100).toFixed(1),
    verdict: total >= 28 ? 'excellent' : total >= 22 ? 'good' : total >= 18 ? 'average' : 'caution',
    kootas, mangal, mangal_compatible: mangalCompatible,
    summary_en: `Guna score is ${total}/36 (${total >= 18 ? 'generally acceptable' : 'needs careful review'}). Mangal compatibility: ${mangalCompatible ? 'balanced' : 'requires remedies or expert review'}.`,
  };
}

module.exports = { calculateAshtakoot };
