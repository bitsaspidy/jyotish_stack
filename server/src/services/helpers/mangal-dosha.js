'use strict';
const { houseFromSign } = require('./core-helpers');

function analyzeMangalDosha(chart) {
  const mars    = chart.planets?.Mars;
  const jupiter = chart.planets?.Jupiter;
  const venus   = chart.planets?.Venus;
  const moon    = chart.planets?.Moon;
  const ascNum  = chart.ascendant?.rashi_num;

  if (!mars) return {
    has_dosha: false, manglik_type: null, manglik_type_hi: null,
    severity: 'none', active_count: 0, score: 0,
    checks: [], cancellations: [], effects_en: [], effects_hi: [],
    summary_en: 'Mars data unavailable.',
    summary_hi: 'मंगल ग्रह की स्थिति उपलब्ध नहीं।',
  };

  // PDF: Mars in 1, 2, 4, 7, 8, 12 houses creates Manglik Dosha
  const doshaHouses = [1, 2, 4, 7, 8, 12];

  const checks = [
    { basis: 'Lagna', basis_hi: 'लग्न',  house: houseFromSign(ascNum, mars.rashi_num) },
    { basis: 'Moon',  basis_hi: 'चंद्र', house: houseFromSign(moon?.rashi_num  || ascNum, mars.rashi_num) },
    { basis: 'Venus', basis_hi: 'शुक्र', house: houseFromSign(venus?.rashi_num || ascNum, mars.rashi_num) },
  ].map((c) => ({ ...c, has_dosha: doshaHouses.includes(c.house) }));

  const active = checks.filter((c) => c.has_dosha);

  // ── Cancellations ───────────────────────────────────────────────────────────
  const cancellations = [];

  // 1. Mars in own sign (Aries=1, Scorpio=8) or exalted (Capricorn=10)
  if ([1, 8, 10].includes(mars.rashi_num)) {
    cancellations.push({
      en: 'Mars is in own or exalted sign — dosha strength is significantly reduced.',
      hi: 'मंगल स्वराशि या उच्च राशि में — दोष की शक्ति काफी कम हो जाती है।',
    });
  }

  // 2. Jupiter aspects Mars (5th, 7th, 9th from Jupiter)
  if (jupiter) {
    const jupToMars = houseFromSign(jupiter.rashi_num, mars.rashi_num);
    if ([5, 7, 9].includes(jupToMars)) {
      cancellations.push({
        en: 'Jupiter aspects Mars — benefic Guru influence neutralises much of the dosha.',
        hi: 'गुरु की दृष्टि मंगल पर — शुभ गुरु का प्रभाव दोष को काफी कम कर देता है।',
      });
    }
  }

  // 3. Venus aspects Mars (7th from Venus)
  if (venus) {
    const venToMars = houseFromSign(venus.rashi_num, mars.rashi_num);
    if (venToMars === 7) {
      cancellations.push({
        en: 'Venus aspects Mars — natural marital harmony counters the aggressive energy.',
        hi: 'शुक्र की दृष्टि मंगल पर — स्वाभाविक वैवाहिक सौहार्द आक्रामकता को संतुलित करता है।',
      });
    }
  }

  // 4. Kumbh Lagna (Aquarius=11) exception: 8th house Mars doesn't give dosha
  if (ascNum === 11 && houseFromSign(ascNum, mars.rashi_num) === 8) {
    cancellations.push({
      en: 'Kumbh (Aquarius) Lagna exception: Mars in the 8th house does not give Manglik Dosha.',
      hi: 'कुंभ लग्न अपवाद: 8वें भाव का मंगल दोष नहीं देता।',
    });
  }

  // 5. Both partners are Manglik — handled at matchmaking level, noted here
  // (not applicable for individual chart; kept for reference)

  // ── Manglik type (from how many reference charts) ──────────────────────────
  let manglik_type = null, manglik_type_hi = null;
  if (active.length === 1) { manglik_type = 'Anshik Manglik';  manglik_type_hi = 'आंशिक मांगलिक'; }
  if (active.length === 2) { manglik_type = 'Poorna Manglik';  manglik_type_hi = 'पूर्ण मांगलिक'; }
  if (active.length === 3) { manglik_type = 'Double Manglik';  manglik_type_hi = 'डबल मांगलिक';  }

  // ── Severity ───────────────────────────────────────────────────────────────
  let severity = 'none';
  if (active.length === 1) severity = 'mild';
  if (active.length === 2) severity = 'moderate';
  if (active.length >= 3) severity = 'strong';
  // Cancellations reduce severity by one level
  if (active.length && cancellations.length) {
    severity = severity === 'strong' ? 'moderate' : 'mild';
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  const effects_en = [], effects_hi = [];
  if (active.length > 0) {
    effects_en.push('Possible delay in marriage');
    effects_hi.push('विवाह में देरी की संभावना');
    effects_en.push('Risk of conflicts or aggression in married life');
    effects_hi.push('वैवाहिक जीवन में कलह की संभावना');
    if (active.length >= 2) {
      effects_en.push('Health concerns for spouse may arise — monitor carefully');
      effects_hi.push('जीवनसाथी के स्वास्थ्य पर ध्यान देना आवश्यक है');
    }
    if (active.length >= 3 && !cancellations.length) {
      effects_en.push('In rare cases, serious marital stress — remedies strongly advised');
      effects_hi.push('दुर्लभ मामलों में गंभीर वैवाहिक तनाव — उपाय अत्यावश्यक');
    }
  }

  // ── Summaries ──────────────────────────────────────────────────────────────
  const summary_en = active.length
    ? `${manglik_type} detected. Activated from: ${active.map((c) => `${c.basis} H${c.house}`).join(', ')}. Severity: ${severity}.${cancellations.length ? ` ${cancellations.length} cancellation(s) reduce the impact.` : ''}`
    : 'No classical Manglik Dosha is indicated from Lagna, Moon, or Venus.';

  const summary_hi = active.length
    ? `${manglik_type_hi} — मंगल ${active.map((c) => `${c.basis_hi} भाव ${c.house}`).join(', ')} से सक्रिय है। प्रभाव: ${severity}।${cancellations.length ? ` ${cancellations.length} उपाय/शांति दोष का प्रभाव कम करते हैं।` : ''}`
    : 'लग्न, चंद्र और शुक्र से कोई प्रमुख मंगल दोष नहीं दिखता।';

  return {
    has_dosha:       active.length > 0,
    manglik_type,
    manglik_type_hi,
    severity,
    active_count:    active.length,
    score:           Math.max(0, active.length * 2 - cancellations.length),
    checked_houses:  doshaHouses,
    checks,
    cancellations,
    effects_en,
    effects_hi,
    summary_en,
    summary_hi,
  };
}

module.exports = { analyzeMangalDosha };
