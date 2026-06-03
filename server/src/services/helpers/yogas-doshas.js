'use strict';
// Source: AstroAnsh Class 11 & 12 Premium Notes — Yogas and Doshas (BPHS-based)
const { houseFromSign } = require('./core-helpers');
const { RASHIS } = require('./vedic-data');

// ── Private helpers ───────────────────────────────────────────────────────────
function _signAdd(signNum, delta) { return ((signNum - 1 + delta + 1200) % 12) + 1; }
function _getAspects(name) {
  if (name === 'Mars') return [4, 7, 8];
  if (name === 'Jupiter' || name === 'Rahu' || name === 'Ketu') return [5, 7, 9];
  if (name === 'Saturn') return [3, 7, 10];
  return [7];
}
function _aspects(fromPlanet, fromName, toSignNum) {
  const h = houseFromSign(fromPlanet.rashi_num, toSignNum);
  return _getAspects(fromName).includes(h);
}
function _isConjunct(p1, p2) { return p1.rashi_num === p2.rashi_num; }
function _mutuallyRelated(planets, n1, n2) {
  const p1 = planets[n1], p2 = planets[n2];
  if (!p1 || !p2) return false;
  if (_isConjunct(p1, p2)) return true;
  if (_aspects(p1, n1, p2.rashi_num)) return true;
  if (_aspects(p2, n2, p1.rashi_num)) return true;
  return false;
}
function _isParivartana(planets, n1, n2) {
  const p1 = planets[n1], p2 = planets[n2];
  if (!p1 || !p2) return false;
  return p1.rashi_lord === n2 && p2.rashi_lord === n1;
}
function _houseSignNum(ascRashiNum, houseNum) { return _signAdd(ascRashiNum, houseNum - 1); }
function _houseLord(ascRashiNum, houseNum)    { return RASHIS[_houseSignNum(ascRashiNum, houseNum) - 1].lord; }
function _planetHouse(ascRashiNum, planet)    { return houseFromSign(ascRashiNum, planet.rashi_num); }

function _planetHi(name) {
  return {
    Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
    Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
  }[name] || name || 'ग्रह';
}

function _beneficsInKendra(asc, planets) {
  return ['Jupiter', 'Venus', 'Mercury'].filter((name) => {
    const planet = planets[name];
    return planet && [1, 4, 7, 10].includes(_planetHouse(asc, planet));
  });
}

function _jupiterProtectsAny(planets, involved) {
  const jupiter = planets.Jupiter;
  if (!jupiter) return false;
  return involved.some((name) => planets[name] && _aspects(jupiter, 'Jupiter', planets[name].rashi_num));
}

function _enrichYoga(entry, asc, planets) {
  const involved = Array.isArray(entry.planets_involved) ? entry.planets_involved : [];
  const weak = involved.filter((name) => String(planets[name]?.dignity || '').includes('Debilitation'));
  const dusthana = involved.filter((name) => planets[name] && [6, 8, 12].includes(_planetHouse(asc, planets[name])));
  const isNeechBhanga = /Neech Bhanga/i.test(entry.name || '');
  const reliefs = [];
  if (isNeechBhanga) reliefs.push('Debility cancellation is built into this yoga, so it converts weakness into improvement after effort.');
  if (weak.length) reliefs.push(`${weak.join(', ')} is weak by dignity, so the yoga gives results after maturity and remedy.`);
  if (dusthana.length) reliefs.push(`${dusthana.join(', ')} is placed in 6/8/12, so the yoga is active but works through pressure or delay.`);

  const reliefsHi = [];
  if (isNeechBhanga) reliefsHi.push('इस योग में नीचता का भंग शामिल है, इसलिए कमजोरी प्रयास के बाद सुधार में बदल सकती है।');
  if (weak.length) reliefsHi.push(`${weak.map(_planetHi).join(', ')} राशि बल से कमजोर है, इसलिए योग परिपक्वता और उपाय के बाद फल देगा।`);
  if (dusthana.length) reliefsHi.push(`${dusthana.map(_planetHi).join(', ')} 6/8/12 भाव में है, इसलिए योग दबाव या देरी से काम करेगा।`);

  const weakened = weak.length > 0 || dusthana.length > 0;
  return {
    ...entry,
    is_cancelled: false,
    cancellation_status: weakened ? 'modified' : 'active',
    relief_en: reliefs.length ? reliefs.join(' ') : 'No cancellation is visible; read this yoga as active according to its strength and current dasha.',
    relief_hi: reliefsHi.length ? reliefsHi.join(' ') : 'कोई रद्द संकेत नहीं दिखता; इस योग को इसकी शक्ति और वर्तमान दशा के अनुसार सक्रिय पढ़ें।',
  };
}

function _enrichDosha(entry, asc, planets) {
  const involved = Array.isArray(entry.planets_involved) ? entry.planets_involved : [];
  const reliefs = [];
  const reliefsHi = [];
  if (/partially relieved by Jupiter/i.test(entry.trigger_en || '') || _jupiterProtectsAny(planets, involved)) {
    reliefs.push('Jupiter protection is present, which reduces harshness and gives guidance.');
    reliefsHi.push('गुरु का संरक्षण है, जिससे कठोरता घटती है और मार्गदर्शन मिलता है।');
  }
  const beneficKendra = _beneficsInKendra(asc, planets);
  if (beneficKendra.length) {
    reliefs.push(`${beneficKendra.join(', ')} in kendra supports recovery and reduces the dosha impact.`);
    reliefsHi.push(`${beneficKendra.map(_planetHi).join(', ')} केंद्र में है, जिससे सुधार और दोष प्रभाव में कमी मिलती है।`);
  }
  if (entry.severity === 'mild') {
    reliefs.push('Severity is mild, so this is a caution signal rather than a severe blockage.');
    reliefsHi.push('तीव्रता हल्की है, इसलिए यह भारी अवरोध नहीं बल्कि सावधानी संकेत है।');
  }

  const isCancelled = entry.severity === 'mild' && reliefs.length >= 2;
  return {
    ...entry,
    is_cancelled: isCancelled,
    cancellation_status: isCancelled ? 'relieved' : reliefs.length ? 'active_with_relief' : 'active',
    relief_en: reliefs.length ? reliefs.join(' ') : 'No clear cancellation is visible; use remedies and watch the involved planets during dasha.',
    relief_hi: reliefsHi.length ? reliefsHi.join(' ') : 'कोई स्पष्ट रद्द संकेत नहीं दिखता; उपाय करें और दशा में जुड़े ग्रहों पर ध्यान रखें।',
  };
}

// ── Main detection ────────────────────────────────────────────────────────────
function detectYogasAndDoshas(chart) {
  const { ascendant, planets: p } = chart;
  const asc = ascendant.rashi_num;
  const yogas = [], doshas = [];

  function yoga(name, name_hi, strength, trigger_en, trigger_hi, involved) {
    yogas.push({ name, name_hi, strength, trigger_en, trigger_hi, planets_involved: involved });
  }
  function dosha(name, name_hi, severity, trigger_en, trigger_hi, involved) {
    doshas.push({ name, name_hi, severity, trigger_en, trigger_hi, planets_involved: involved });
  }

  // 1. Gajakesari
  { const jup=p.Jupiter,moon=p.Moon; if(jup&&moon){const h=houseFromSign(moon.rashi_num,jup.rashi_num);if([1,4,7,10].includes(h)){const jupH=_planetHouse(asc,jup),moonH=_planetHouse(asc,moon);const debil=jup.dignity?.includes('Debilitation')||moon.dignity?.includes('Debilitation');const dust=[6,8,12].includes(jupH)||[6,8,12].includes(moonH);const str=debil||dust?'weak':(jup.dignity?.includes('Exaltation')||jup.dignity?.includes('Own Sign')?'strong':'moderate');yoga('Gajakesari Yoga','गजकेसरी योग',str,`Jupiter (H${jupH}) and Moon (H${moonH}) are in Kendra from each other.`,`गुरु (भाव ${jupH}) और चंद्र (भाव ${moonH}) एक-दूसरे से केंद्र में।`,['Jupiter','Moon']);}}}

  // 2. Budh-Aditya
  { const sun=p.Sun,mer=p.Mercury; if(sun&&mer&&_isConjunct(sun,mer)){const h=_planetHouse(asc,sun);const diff=Math.abs(sun.degree_in_sign-mer.degree_in_sign);const cmb=diff<3;const str=cmb?'weak':([3,5,6].includes(sun.rashi_num)?'strong':'moderate');yoga('Budh-Aditya Yoga','बुध-आदित्य योग',str,`Sun and Mercury conjunct in ${sun.rashi_en} (H${h})${cmb?' — Mercury combust (<3°)':''}.`,`सूर्य और बुध ${sun.rashi_hi} (भाव ${h}) में युत${cmb?' — बुध अस्त':''}।`,['Sun','Mercury']);}}

  // 3. Neech Bhanga Raj Yoga
  { const debilMap={Sun:7,Moon:8,Mars:4,Mercury:12,Jupiter:10,Venus:6,Saturn:1};const debilLord={Sun:'Venus',Moon:'Mars',Mars:'Moon',Mercury:'Jupiter',Jupiter:'Saturn',Venus:'Mercury',Saturn:'Mars'};const exaltInD={Sun:'Saturn',Moon:null,Mars:'Jupiter',Mercury:'Venus',Jupiter:'Mars',Venus:'Mercury',Saturn:'Sun'};
    for(const[pn,ds]of Object.entries(debilMap)){const pl=p[pn];if(!pl||pl.rashi_num!==ds)continue;const h=_planetHouse(asc,pl);const cancels=[];const dl=debilLord[pn],dlp=p[dl];if(dlp){if([1,4,7,10].includes(_planetHouse(asc,dlp)))cancels.push(`${dl} (debil-sign lord) in Kendra from Lagna`);else if(p.Moon&&[1,4,7,10].includes(houseFromSign(p.Moon.rashi_num,dlp.rashi_num)))cancels.push(`${dl} in Kendra from Moon`);}const ep=exaltInD[pn];if(ep&&p[ep]&&[1,4,7,10].includes(_planetHouse(asc,p[ep])))cancels.push(`${ep} (exalted in debil-sign) in Kendra`);const disp=pl.rashi_lord,dispp=p[disp];if(dispp&&(_isConjunct(pl,dispp)||_aspects(dispp,disp,pl.rashi_num)))cancels.push(`Dispositor ${disp} conjuncts/aspects ${pn}`);if(cancels.length>0)yoga('Neech Bhanga Raj Yoga','नीच भंग राज योग',cancels.length>=2?'strong':'moderate',`${pn} debilitated in ${pl.rashi_en} (H${h}) — cancelled by: ${cancels.join('; ')}.`,`${pn} ${pl.rashi_hi} (भाव ${h}) में नीच — रद्द: ${cancels.join('; ')}।`,[pn,dl].filter(Boolean));}}

  // 4. Saraswati
  { const jup=p.Jupiter,ven=p.Venus,mer=p.Mercury; if(jup&&ven&&mer){const good=[1,2,4,5,7,9,10];const jH=_planetHouse(asc,jup),vH=_planetHouse(asc,ven),mH=_planetHouse(asc,mer);if(good.includes(jH)&&good.includes(vH)&&good.includes(mH)){const rel=_mutuallyRelated(p,'Jupiter','Venus')||_mutuallyRelated(p,'Jupiter','Mercury')||_mutuallyRelated(p,'Venus','Mercury');if(rel){const str=[jup,ven,mer].some(pl=>pl.dignity?.includes('Debilitation'))?'moderate':'strong';yoga('Saraswati Yoga','सरस्वती योग',str,`Jupiter (H${jH}), Venus (H${vH}), Mercury (H${mH}) — all in Kendra/Trikona/2nd, mutually related.`,`गुरु (भाव ${jH}), शुक्र (भाव ${vH}), बुध (भाव ${mH}) — केंद्र/त्रिकोण/2 में, परस्पर संबंधित।`,['Jupiter','Venus','Mercury']);}}}}

  // 5. Kalaneedhi
  { const mer=p.Mercury; for(const pn of['Venus','Jupiter']){const pl=p[pn];if(!pl||!mer)continue;const h=_planetHouse(asc,pl);if([2,5].includes(h)&&(_isConjunct(pl,mer)||_aspects(mer,'Mercury',pl.rashi_num)))yoga('Kalaneedhi Yoga','कलानीधि योग',pl.dignity?.includes('Debilitation')?'weak':'moderate',`${pn} in H${h} receives Mercury's ${_isConjunct(pl,mer)?'conjunction':'aspect'}.`,`${pn} भाव ${h} में — बुध की ${_isConjunct(pl,mer)?'युति':'दृष्टि'}।`,[pn,'Mercury']);}}

  // 6. Chandra-Mangal Laxmi
  { const moon=p.Moon,mars=p.Mars; if(moon&&mars&&_mutuallyRelated(p,'Moon','Mars')){const moonH=_planetHouse(asc,moon),marsH=_planetHouse(asc,mars);const debil=moon.rashi_num===8||mars.rashi_num===4;const dust=[6,8,12].includes(moonH)||[6,8,12].includes(marsH);yoga('Chandra-Mangal Laxmi Yoga','चंद्र-मंगल लक्ष्मी योग',dust||debil?'weak':'moderate',`Moon (H${moonH}) and Mars (H${marsH}) ${_isConjunct(moon,mars)?'conjunct':'in mutual aspect'}.`,`चंद्र (भाव ${moonH}) और मंगल (भाव ${marsH}) ${_isConjunct(moon,mars)?'युत':'परस्पर दृष्टि'}।`,['Moon','Mars']);}}

  // 7. Dhan Yoga group
  { const dhanLords=[...new Set([2,5,9,11].map(h=>_houseLord(asc,h)))];const dhanPairs=[];for(let i=0;i<dhanLords.length;i++)for(let j=i+1;j<dhanLords.length;j++){const n1=dhanLords[i],n2=dhanLords[j];if(_mutuallyRelated(p,n1,n2)||_isParivartana(p,n1,n2))dhanPairs.push(`${n1}+${n2}`);}if(dhanPairs.length>=2)yoga('Dhan Yoga','धन योग',dhanPairs.length>=3?'strong':'moderate',`Wealth house lords (2,5,9,11) connected: ${dhanPairs.join(', ')}.`,`धन भावों (2,5,9,11) के स्वामी संबंधित: ${dhanPairs.join(', ')}।`,dhanLords);
    const l9=_houseLord(asc,9),p9=p[l9];if(p9&&p9.dignity?.includes('Exaltation')){const h9=_planetHouse(asc,p9);if([1,4,5,7,9,10].includes(h9)){const ll=_houseLord(asc,1),pll=p[ll];if(pll&&!pll.dignity?.includes('Debilitation'))yoga('Laxmi Yoga','लक्ष्मी योग','strong',`9th lord ${l9} exalted in H${h9} with strong Lagna lord ${ll}.`,`नवमेश ${l9} उच्च में भाव ${h9}, बलवान लग्नेश ${ll}।`,[l9,ll]);}}
    if(p.Moon){const beneficsIn=['Jupiter','Venus','Mercury'].filter(n=>{const pl=p[n];return pl&&[6,7,8].includes(houseFromSign(p.Moon.rashi_num,pl.rashi_num));});if(beneficsIn.length>=2)yoga('Adhi Yoga','अधि योग',beneficsIn.length===3?'strong':'moderate',`${beneficsIn.join(', ')} in 6th/7th/8th from Moon.`,`${beneficsIn.join(', ')} चंद्र से 6/7/8वें भाव में।`,[...beneficsIn,'Moon']);}}

  // 8. Raj Yoga
  { const kendraLords=[...new Set([1,4,7,10].map(h=>_houseLord(asc,h)))];const trikonaLords=[...new Set([1,5,9].map(h=>_houseLord(asc,h)))];const rajPairs=[];for(const kl of kendraLords)for(const tl of trikonaLords){if(kl!==tl&&p[kl]&&p[tl]&&_mutuallyRelated(p,kl,tl))rajPairs.push({kl,tl,kH:_planetHouse(asc,p[kl]),tH:_planetHouse(asc,p[tl])});}if(rajPairs.length>0)yoga('Raj Yoga','राज योग',rajPairs.length>=2?'strong':'moderate',`Kendra-Trikona lord connection: ${rajPairs.map(r=>`${r.kl}(H${r.kH})+${r.tl}(H${r.tH})`).join(', ')}.`,`केंद्र-त्रिकोण स्वामी संबंध: ${rajPairs.map(r=>`${r.kl}(भाव ${r.kH})+${r.tl}(भाव ${r.tH})`).join(', ')}।`,[...new Set(rajPairs.flatMap(r=>[r.kl,r.tl]))]);}

  // 9. Vipreet Raj Yoga
  { const vr=[{ln:6,valid:[8,12],sub:'Harsha Yoga',sub_hi:'हर्ष योग'},{ln:8,valid:[6,12],sub:'Sarala Yoga',sub_hi:'सरल योग'},{ln:12,valid:[6,8],sub:'Vimala Yoga',sub_hi:'विमल योग'}];for(const{ln,valid,sub,sub_hi}of vr){const lord=_houseLord(asc,ln),pl=p[lord];if(pl&&valid.includes(_planetHouse(asc,pl)))yoga('Vipreet Raj Yoga','विपरीत राज योग','moderate',`${sub}: ${ln}th lord (${lord}) in H${_planetHouse(asc,pl)}.`,`${sub_hi}: ${ln}वें भाव का स्वामी (${lord}) भाव ${_planetHouse(asc,pl)} में।`,[lord]);}}

  // 10. Parivartan Yoga
  { const pNames=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];for(let i=0;i<pNames.length;i++)for(let j=i+1;j<pNames.length;j++){const n1=pNames[i],n2=pNames[j];if(!_isParivartana(p,n1,n2))continue;const h1=_planetHouse(asc,p[n1]),h2=_planetHouse(asc,p[n2]);const d1=[6,8,12].includes(h1),d2=[6,8,12].includes(h2);const k1=[1,4,7,10].includes(h1)||[5,9].includes(h1);const k2=[1,4,7,10].includes(h2)||[5,9].includes(h2);const sub=(d1||d2)?'Dusthana Parivartan Yoga':(k1&&k2)?'Raj Parivartan Yoga':'Parivartan Yoga';yoga(sub,'परिवर्तन योग',sub==='Dusthana Parivartan Yoga'?'weak':sub==='Raj Parivartan Yoga'?'strong':'moderate',`${n1} (H${h1}) ↔ ${n2} (H${h2}) sign exchange — ${sub}.`,`${n1} (भाव ${h1}) ↔ ${n2} (भाव ${h2}) राशि विनिमय।`,[n1,n2]);}}

  // 11. Guru-Aditya
  { const jup=p.Jupiter,sun=p.Sun; if(jup&&sun&&_isConjunct(jup,sun)){const h=_planetHouse(asc,sun);const str=(sun.dignity?.includes('Debilitation')||jup.dignity?.includes('Debilitation'))?'weak':([5,9,12,4].includes(sun.rashi_num)?'strong':'moderate');yoga('Guru-Aditya Yoga','गुरु-आदित्य योग',str,`Jupiter and Sun conjunct in ${sun.rashi_en} (H${h}).`,`गुरु और सूर्य ${sun.rashi_hi} (भाव ${h}) में युत।`,['Jupiter','Sun']);}}

  // 12. Shatru Hanta
  { const l6=_houseLord(asc,6),pl6=p[l6],mars=p.Mars,sun=p.Sun;const conds=[];if(pl6&&_planetHouse(asc,pl6)===12)conds.push(`6th lord (${l6}) in H12`);if(mars&&_planetHouse(asc,mars)===6&&[1,8,10].includes(mars.rashi_num))conds.push('Mars in H6 own/exalted');if(sun&&_planetHouse(asc,sun)===6&&sun.rashi_num===5)conds.push('Sun in H6 in Leo');if(pl6&&mars&&l6!=='Mars'&&_mutuallyRelated(p,l6,'Mars'))conds.push(`6th lord (${l6}) conjunct/aspected by Mars`);if(conds.length>0)yoga('Shatru Hanta Yoga','शत्रु हंत योग',conds.length>=2?'strong':'moderate',conds.join('; '),`शत्रु हंत योग: ${conds.join('; ')}`,[l6,'Mars'].filter(Boolean));}

  // ── DOSHAS ───────────────────────────────────────────────────────────────────
  const MALEFICS = ['Saturn','Mars','Rahu','Ketu'];

  // 1. Pitru
  { const rahu=p.Rahu,ketu=p.Ketu,sun=p.Sun;const sign9=_houseSignNum(asc,9);const triggers=[];if(rahu&&rahu.rashi_num===sign9)triggers.push('Rahu in 9th house');if(ketu&&ketu.rashi_num===sign9)triggers.push('Ketu in 9th house');if(sun&&sun.dignity?.includes('Debilitation'))triggers.push('Sun debilitated');for(const n of['Saturn','Mars']){const pl=p[n];if(pl&&pl.rashi_num===sign9)triggers.push(`${n} in 9th house`);}if(triggers.length>0)dosha('Pitru Dosha','पितृ दोष',triggers.length>=3?'strong':triggers.length>=2?'moderate':'mild',`Triggers: ${triggers.join('; ')}.`,`कारण: ${triggers.join('; ')}।`,['Sun',...MALEFICS.filter(n=>triggers.some(t=>t.includes(n)))]);}

  // 2-3. Vish Doshas (Sun-Saturn, Mars-Saturn, Moon-Saturn)
  { const sun=p.Sun,sat=p.Saturn; if(sun&&sat&&_isConjunct(sun,sat)){const h=_planetHouse(asc,sun);dosha('Surya-Shani Vish Dosha','सूर्य-शनि विष दोष',[1,9,10].includes(h)?'strong':'moderate',`Sun and Saturn conjunct in ${sun.rashi_en} (H${h}).`,`सूर्य और शनि ${sun.rashi_hi} (भाव ${h}) में युत।`,['Sun','Saturn']);}}
  { const mars=p.Mars,sat=p.Saturn; if(mars&&sat&&_isConjunct(mars,sat)){const h=_planetHouse(asc,mars);dosha('Mangal-Shani Vish Dosha','मंगल-शनि विष दोष',([1,5,9].includes(mars.rashi_num)||[1,3,10].includes(h))?'strong':'moderate',`Mars and Saturn conjunct in ${mars.rashi_en} (H${h}).`,`मंगल और शनि ${mars.rashi_hi} (भाव ${h}) में युत।`,['Mars','Saturn']);}}
  { const moon=p.Moon,sat=p.Saturn; if(moon&&sat&&_isConjunct(moon,sat)){const h=_planetHouse(asc,moon);dosha('Moon-Shani Vish Dosha','चंद्र-शनि विष दोष',moon.rashi_num===8?'strong':'moderate',`Moon and Saturn conjunct in ${moon.rashi_en} (H${h}).`,`चंद्र और शनि ${moon.rashi_hi} (भाव ${h}) में युत।`,['Moon','Saturn']);}}

  // 5. Amavasya
  { const sun=p.Sun,moon=p.Moon; if(sun&&moon&&_isConjunct(sun,moon)){const diff=Math.abs(sun.degree_in_sign-moon.degree_in_sign);if(diff<=12){const h=_planetHouse(asc,sun);const sev=[6,8,12].includes(h)?'strong':diff<=3?'strong':diff<=6?'moderate':'mild';const jupRelief=p.Jupiter&&_aspects(p.Jupiter,'Jupiter',sun.rashi_num);dosha('Amavasya Dosha','अमावस्या दोष',jupRelief&&sev!=='strong'?'mild':sev,`Sun-Moon Amavasya conjunction in ${sun.rashi_en} (H${h}), ${diff.toFixed(1)}° apart${jupRelief?' — partially relieved by Jupiter aspect':''}.`,`सूर्य-चंद्र अमावस्या युति ${sun.rashi_hi} (भाव ${h}) में, ${diff.toFixed(1)}° अंतर${jupRelief?' — गुरु दृष्टि से आंशिक राहत':''}।`,['Sun','Moon']);}}}

  // 6. Angarak
  { const mars=p.Mars,rahu=p.Rahu; if(mars&&rahu&&_isConjunct(mars,rahu)){const h=_planetHouse(asc,mars);dosha('Angarak Dosha','अंगारक दोष',([1,5,9].includes(mars.rashi_num)||[1,4,7].includes(h))?'strong':'moderate',`Mars and Rahu conjunct in ${mars.rashi_en} (H${h}).`,`मंगल और राहु ${mars.rashi_hi} (भाव ${h}) में युत।`,['Mars','Rahu']);}}

  // 7. Shaapit
  { const sat=p.Saturn,rahu=p.Rahu; if(sat&&rahu&&_isConjunct(sat,rahu)){const h=_planetHouse(asc,sat);dosha('Shaapit Dosha','शापित दोष',[1,4,7,9,10].includes(h)?'strong':'moderate',`Saturn and Rahu conjunct in ${sat.rashi_en} (H${h}).`,`शनि और राहु ${sat.rashi_hi} (भाव ${h}) में युत।`,['Saturn','Rahu']);}}

  // 8. Grahan Doshas
  { const sun=p.Sun,moon=p.Moon,rahu=p.Rahu,ketu=p.Ketu;for(const shadow of[rahu,ketu].filter(Boolean)){const shadowName=shadow===rahu?'Rahu':'Ketu';if(sun&&_isConjunct(sun,shadow))dosha('Surya Grahan Dosha','सूर्य ग्रहण दोष','moderate',`Sun eclipsed by ${shadowName} in ${sun.rashi_en} (H${_planetHouse(asc,sun)}).`,`सूर्य ${shadowName} द्वारा ग्रहण ${sun.rashi_hi} में।`,['Sun',shadowName]);if(moon&&_isConjunct(moon,shadow))dosha('Chandra Grahan Dosha','चंद्र ग्रहण दोष','moderate',`Moon eclipsed by ${shadowName} in ${moon.rashi_en} (H${_planetHouse(asc,moon)}).`,`चंद्र ${shadowName} द्वारा ग्रहण ${moon.rashi_hi} में।`,['Moon',shadowName]);}}

  // 9. Guru Chandaal
  { const jup=p.Jupiter;for(const shadowName of['Rahu','Ketu']){const shadow=p[shadowName];if(jup&&shadow&&_isConjunct(jup,shadow)){const h=_planetHouse(asc,jup);dosha('Guru Chandaal Dosha','गुरु चांडाल दोष',[1,5,9,12].includes(h)?'strong':'moderate',`Jupiter conjunct ${shadowName} in ${jup.rashi_en} (H${h}).`,`गुरु ${shadowName} के साथ ${jup.rashi_hi} (भाव ${h}) में युत।`,['Jupiter',shadowName]);}}}

  // 10. Venus-Mangal / Venus-Rahu Vish
  { const ven=p.Venus,mars=p.Mars,rahu=p.Rahu;if(ven&&mars&&_isConjunct(ven,mars))dosha('Venus-Mangal Vish Dosha','शुक्र-मंगल विष दोष','moderate',`Venus and Mars conjunct in ${ven.rashi_en} (H${_planetHouse(asc,ven)}).`,`शुक्र और मंगल ${ven.rashi_hi} (भाव ${_planetHouse(asc,ven)}) में युत।`,['Venus','Mars']);if(ven&&rahu&&_isConjunct(ven,rahu))dosha('Venus-Rahu Vish Dosha','शुक्र-राहु विष दोष','moderate',`Venus and Rahu conjunct in ${ven.rashi_en} (H${_planetHouse(asc,ven)}).`,`शुक्र और राहु ${ven.rashi_hi} (भाव ${_planetHouse(asc,ven)}) में युत।`,['Venus','Rahu']);}

  // 11. Kemdrum
  { const moon=p.Moon; if(moon){const s2=_signAdd(moon.rashi_num,1),s12=_signAdd(moon.rashi_num,-1);const pList=['Sun','Mars','Mercury','Jupiter','Venus','Saturn'];const has2=pList.some(n=>p[n]&&p[n].rashi_num===s2);const has12=pList.some(n=>p[n]&&p[n].rashi_num===s12);if(!has2&&!has12){const jupAspect=p.Jupiter&&_aspects(p.Jupiter,'Jupiter',moon.rashi_num);const benKendra=['Jupiter','Venus','Mercury'].some(n=>{const pl=p[n];return pl&&[1,4,5,7,9,10].includes(_planetHouse(asc,pl));});const sev=jupAspect||benKendra?'mild':moon.rashi_num===8?'strong':'moderate';dosha('Kemdrum Dosha','केमद्रुम दोष',sev,`Moon (H${_planetHouse(asc,moon)}) has no planets in 2nd (sign ${s2}) or 12th (sign ${s12}) from it${jupAspect?' — partially relieved by Jupiter':''}.`,`चंद्र (भाव ${_planetHouse(asc,moon)}) के 2 और 12 में कोई ग्रह नहीं${jupAspect?' — गुरु दृष्टि से राहत':''}।`,['Moon']);}}}

  // 12. Paap Kartari
  { const classicalMalefics=['Saturn','Mars','Rahu','Ketu'];for(const houseNum of[1,4,7,10]){const hSign=_houseSignNum(asc,houseNum);const sBefore=_signAdd(hSign,-1),sAfter=_signAdd(hSign,1);const mBefore=classicalMalefics.filter(n=>p[n]&&p[n].rashi_num===sBefore);const mAfter=classicalMalefics.filter(n=>p[n]&&p[n].rashi_num===sAfter);if(mBefore.length>0&&mAfter.length>0){const allHemming=[...new Set([...mBefore,...mAfter])];dosha('Paap Kartari Dosha','पाप कर्तरी दोष',houseNum===1?'strong':'moderate',`H${houseNum} hemmed — ${mBefore.join(',')} before and ${mAfter.join(',')} after.`,`भाव ${houseNum} घिरा — ${mBefore.join(',')} पहले और ${mAfter.join(',')} बाद।`,allHemming);}}}

  const enrichedYogas = yogas.map((entry) => _enrichYoga(entry, asc, p));
  const enrichedDoshas = doshas.map((entry) => _enrichDosha(entry, asc, p));
  return { yogas: enrichedYogas, doshas: enrichedDoshas, yoga_count: enrichedYogas.length, dosha_count: enrichedDoshas.length };
}

module.exports = { detectYogasAndDoshas };
