'use strict';
/**
 * Gochar (transit) configuration — the ONLY source for the astrological content
 * and rules the transit engine composes from.
 *
 * ⚖️ OWNER-REVIEWED CONTENT. Every string and every favourability rule below is
 * astrology that the owner is the authority on. It is drafted here for review, and
 * nothing reaches users until the owner has read the rendered output and deployed.
 *
 * DESIGN NOTES (learned the hard way on this codebase — see the qa-humanization
 * and render-before-claiming memories):
 *
 * - Planet transit meanings are VALENCE-NEUTRAL NOUN PHRASES. The same phrase is
 *   dropped into a "favourable" frame and a "challenging" frame, so it must not
 *   carry its own verdict. "discipline and structure" works in both; "hardship"
 *   does not.
 * - Two reference points, on purpose (owner's choice): the house counted FROM THE
 *   ASCENDANT says which life AREA is lit up; the house counted FROM THE MOON is
 *   the classical Gochar seat that decides FAVOURABLE vs CHALLENGING. Both are
 *   shown. Sade Sati, Dhaiyya and the classical benefic/malefic house tables are
 *   all Moon-referenced by definition.
 * - The chart itself is not "active" or "inactive" — a transit is a passing
 *   influence over a chart that is always live. Language stays "at this time",
 *   never "your chart turns on".
 */

// ── House life-areas — same 12 whether counted from Lagna or Moon ─────────────
// `area` is the machine key; en/hi are what the user reads.
const HOUSE_AREA = {
  1:  { area: 'self',        en: 'self, body and overall direction',        hi: 'स्वयं, शरीर और समग्र दिशा' },
  2:  { area: 'wealth',      en: 'money, family and speech',                hi: 'धन, परिवार और वाणी' },
  3:  { area: 'effort',      en: 'courage, effort and siblings',            hi: 'साहस, प्रयास और भाई-बहन' },
  4:  { area: 'home',        en: 'home, mother, property and peace of mind', hi: 'घर, माता, संपत्ति और मानसिक शांति' },
  5:  { area: 'creativity',  en: 'children, learning and creativity',       hi: 'संतान, शिक्षा और रचनात्मकता' },
  6:  { area: 'health',      en: 'health, debts, competition and service',  hi: 'स्वास्थ्य, ऋण, प्रतिस्पर्धा और सेवा' },
  7:  { area: 'partnership', en: 'marriage, partnership and business',      hi: 'विवाह, साझेदारी और व्यापार' },
  8:  { area: 'change',      en: 'sudden change, depth and shared resources', hi: 'अचानक परिवर्तन, गहराई और साझा संसाधन' },
  9:  { area: 'fortune',     en: 'fortune, dharma, higher learning and travel', hi: 'भाग्य, धर्म, उच्च शिक्षा और यात्रा' },
  10: { area: 'career',      en: 'career, status and public life',          hi: 'करियर, प्रतिष्ठा और सार्वजनिक जीवन' },
  11: { area: 'gains',       en: 'income, gains and friendships',           hi: 'आय, लाभ और मित्रता' },
  12: { area: 'release',     en: 'expenses, travel abroad, rest and spirituality', hi: 'व्यय, विदेश यात्रा, विश्राम और आध्यात्म' },
};

// ── Planet transit meanings — VALENCE-NEUTRAL noun phrases ────────────────────
// What quality this planet brings as it passes through an area. Neutral so the
// same phrase reads correctly under a favourable OR a challenging placement.
const PLANET_TRANSIT = {
  Sun:     { en: 'focus, authority and visibility',            hi: 'ध्यान, अधिकार और प्रकटता' },
  Moon:    { en: 'mood, emotional attention and daily rhythm', hi: 'मन, भावनात्मक ध्यान और दैनिक लय' },
  Mars:    { en: 'drive, action and assertiveness',            hi: 'ऊर्जा, कर्म और आत्मबल' },
  Mercury: { en: 'thinking, communication and dealings',       hi: 'विचार, संवाद और लेन-देन' },
  Jupiter: { en: 'growth, guidance and expansion',             hi: 'वृद्धि, मार्गदर्शन और विस्तार' },
  Venus:   { en: 'relationships, comfort and value',           hi: 'संबंध, सुख और मूल्य' },
  Saturn:  { en: 'discipline, responsibility and slow work',   hi: 'अनुशासन, उत्तरदायित्व और धीमा कार्य' },
  Rahu:    { en: 'ambition, obsession and the unconventional',  hi: 'महत्वाकांक्षा, तीव्र इच्छा और असामान्य' },
  Ketu:    { en: 'detachment, review and letting go',          hi: 'वैराग्य, पुनरावलोकन और त्याग' },
};

const PLANET_HI = {
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
  Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

/**
 * Classical Gochar favourability — the houses FROM THE MOON in which each planet
 * gives good results. This is the traditional benefic-transit table (Brihat
 * Samhita / standard Gochar phala). Houses not listed are treated as challenging;
 * the neutral set softens a few that are genuinely mixed rather than bad.
 *
 * These are the seats that decide the verdict, so they are the load-bearing rule
 * of the whole feature. Owner review matters most here.
 */
const GOCHAR_FAVORABLE = {
  Sun:     [3, 6, 10, 11],
  Moon:    [1, 3, 6, 7, 10, 11],
  Mars:    [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus:   [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn:  [3, 6, 11],
  Rahu:    [3, 6, 10, 11],
  Ketu:    [3, 6, 10, 11],
};
// A few houses read as "mixed" rather than outright challenging.
const GOCHAR_NEUTRAL = {
  Sun:     [1],
  Moon:    [2],
  Mars:    [10],
  Mercury: [1],
  Jupiter: [1],
  Venus:   [10],
  Saturn:  [1, 2, 12], // 12/1/2 = Sade Sati — flagged separately, kept out of "good"
  Rahu:    [1],
  Ketu:    [1],
};

const FAVOUR_LABEL = {
  favorable:   { en: 'a supportive placement', hi: 'सहायक स्थिति' },
  neutral:     { en: 'a mixed placement',      hi: 'मिश्रित स्थिति' },
  challenging: { en: 'a demanding placement',  hi: 'चुनौतीपूर्ण स्थिति' },
};

/**
 * Sade Sati — Saturn transiting the 12th, 1st or 2nd from the Moon (~7½ years).
 * Dhaiyya (Kantaka/Ashtama Shani) — Saturn in the 4th or 8th from the Moon.
 * Both are Moon-referenced and both are the questions users actually ask about,
 * so they are surfaced explicitly rather than left inside the per-planet line.
 */
const SADE_SATI_PHASE = {
  12: { key: 'rising',  en: 'first phase (rising)',  hi: 'पहला चरण (आरंभ)' },
  1:  { key: 'peak',    en: 'peak phase',            hi: 'शिखर चरण' },
  2:  { key: 'setting', en: 'final phase (setting)', hi: 'अंतिम चरण (समापन)' },
};
const DHAIYYA_HOUSE = {
  4: { key: 'kantaka', en: 'Kantaka Shani (4th from Moon)', hi: 'कंटक शनि (चंद्र से चौथा)' },
  8: { key: 'ashtama', en: 'Ashtama Shani (8th from Moon)', hi: 'अष्टम शनि (चंद्र से आठवां)' },
};

// ── Fixed copy ────────────────────────────────────────────────────────────────
const COPY = {
  retrograde: {
    en: 'Currently retrograde — its themes turn inward and revisit unfinished matters rather than pushing forward.',
    hi: 'इस समय वक्री — इसके विषय बाहर बढ़ने के बजाय भीतर की ओर मुड़ते हैं और अधूरे मामलों को दोहराते हैं।',
  },
  // Never imply the chart itself switches on/off — a transit passes over a chart
  // that is always live.
  disclaimer: {
    en: 'Transits are passing influences read over your birth chart, which is always active. They show where attention naturally moves at this time — they do not change the chart itself.',
    hi: 'गोचर आपकी जन्म कुंडली पर पड़ने वाले क्षणिक प्रभाव हैं, और कुंडली सदैव सक्रिय रहती है। ये दर्शाते हैं कि इस समय ध्यान स्वाभाविक रूप से किस ओर जाता है — ये कुंडली को बदलते नहीं।',
  },
};

const INSUFFICIENT = {
  missing_chart: { en: 'Chart calculation is unavailable. Please recalculate the kundli.', hi: 'कुंडली गणना उपलब्ध नहीं है। कृपया कुंडली पुनः गणना करें।' },
  missing_moon:  { en: 'The Moon or Ascendant position is missing, so transits cannot be mapped to your chart.', hi: 'चंद्र या लग्न की स्थिति अनुपलब्ध है, इसलिए गोचर को आपकी कुंडली से नहीं जोड़ा जा सकता।' },
  calculation_failed: { en: 'The transit calculation could not be completed.', hi: 'गोचर गणना पूरी नहीं हो सकी।' },
};

const RULE_VERSION = 'transit-v1';

module.exports = {
  HOUSE_AREA,
  PLANET_TRANSIT,
  PLANET_HI,
  GOCHAR_FAVORABLE,
  GOCHAR_NEUTRAL,
  FAVOUR_LABEL,
  SADE_SATI_PHASE,
  DHAIYYA_HOUSE,
  COPY,
  INSUFFICIENT,
  RULE_VERSION,
};
