'use strict';
/**
 * Tests for varga-purpose-filter — Session 56
 * Run: node --test tests/varga-purpose-filter.test.js
 */
const test   = require('node:test');
const assert = require('node:assert/strict');
const { VARGA_PURPOSE, D30_PLANET_RISK_ROLE, applyPurposeFilter, getPurposeFocus } = require('../src/services/helpers/varga-purpose-filter');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlanetReading(planet, overrides = {}) {
  return {
    planet,
    planet_hi: { Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'बृहस्पति', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु' }[planet] || planet,
    icon: '●',
    house: overrides.house ?? 5,
    house_domain_en: overrides.house_domain_en ?? 'Intellectual trials',
    house_domain_hi: overrides.house_domain_hi ?? 'बौद्धिक परीक्षण',
    rashi_en: 'Aries',
    rashi_hi: 'मेष',
    dignity: 'Neutral',
    dignity_score: 3,
    planet_role_en: overrides.planet_role_en ?? 'generic karakatva role',
    planet_role_hi: overrides.planet_role_hi ?? 'सामान्य कारकत्व',
    impact: overrides.impact ?? 'favorable',
    is_challenged: overrides.is_challenged ?? false,
    is_strong: overrides.is_strong ?? false,
    positives_en: overrides.positives_en ?? [],
    positives_hi: overrides.positives_hi ?? [],
    negatives_en: overrides.negatives_en ?? [],
    negatives_hi: overrides.negatives_hi ?? [],
    remedy: null,
  };
}

const D30_FORBIDDEN_PHRASES = [
  'beauty, love, luxury, arts',
  'career and reputation building',
  'results arrive with relatively less effort',
  'visibility and social recognition',
  'authority, vitality, self-confidence, father, career',
  'wisdom, grace, wealth, children',
];

// ── Tests ─────────────────────────────────────────────────────────────────────

test('VP-01: VARGA_PURPOSE has entries for all 18 Varga slugs', () => {
  const EXPECTED = ['d1','d2','d3','d4','d5','d7','d8','d9','d10','d12','d16','d20','d24','d27','d30','d40','d45','d60'];
  for (const slug of EXPECTED) {
    assert.ok(VARGA_PURPOSE[slug], `VARGA_PURPOSE missing slug '${slug}'`);
    assert.ok(typeof VARGA_PURPOSE[slug].focus === 'string', `VARGA_PURPOSE.${slug}.focus must be a string`);
    assert.ok(Array.isArray(VARGA_PURPOSE[slug].allowedThemes), `VARGA_PURPOSE.${slug}.allowedThemes must be an array`);
  }
});

test('VP-02: D30_PLANET_RISK_ROLE has entries for all 9 planets', () => {
  const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  for (const p of PLANETS) {
    assert.ok(D30_PLANET_RISK_ROLE[p], `D30_PLANET_RISK_ROLE missing planet '${p}'`);
    assert.ok(typeof D30_PLANET_RISK_ROLE[p].en === 'string', `D30_PLANET_RISK_ROLE.${p}.en must be string`);
    assert.ok(typeof D30_PLANET_RISK_ROLE[p].hi === 'string', `D30_PLANET_RISK_ROLE.${p}.hi must be string`);
    assert.ok(/[ऀ-ॿ]/.test(D30_PLANET_RISK_ROLE[p].hi), `D30_PLANET_RISK_ROLE.${p}.hi should contain Devanagari`);
  }
});

test('VP-03: D30 Venus planet_role_en uses risk/trouble language after filter', () => {
  const reading = makePlanetReading('Venus', {
    positives_en: ['Venus supports beauty, love, luxury, arts in this chart.'],
    positives_hi: ['शुक्र सौंदर्य, प्रेम, विलास को समर्थन देता है।'],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  const role = filtered.planet_role_en.toLowerCase();
  assert.ok(
    role.includes('trouble') || role.includes('comfort') || role.includes('vulnerability') || role.includes('over-indulgence'),
    `Venus D30 role should use risk language, got: ${filtered.planet_role_en}`
  );
});

test('VP-04: D30 Venus positives_en do not contain "beauty, love, luxury" after filter', () => {
  const reading = makePlanetReading('Venus', {
    positives_en: [
      'Venus supports beauty, love, luxury, arts in this area.',
      'Venus in a Trikona house gives natural support.',
    ],
    positives_hi: [
      'शुक्र सौंदर्य, प्रेम, विलास को समर्थन देता है।',
      'शुक्र त्रिकोण भाव में है।',
    ],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  for (const txt of filtered.positives_en) {
    assert.ok(
      !txt.toLowerCase().includes('beauty, love, luxury'),
      `D30 Venus positives_en still contains forbidden phrase: ${txt}`
    );
  }
});

test('VP-05: D30 Sun positives_en do not contain "career" or "authority" phrases from generic karakatva', () => {
  const reading = makePlanetReading('Sun', {
    positives_en: [
      'Sun supports authority, vitality, self-confidence, father, career in this zone.',
      'career and reputation building.',
    ],
    positives_hi: [
      'सूर्य अधिकार, ओज, आत्मविश्वास को समर्थन देता है।',
      'करियर और प्रतिष्ठा निर्माण।',
    ],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  for (const txt of filtered.positives_en) {
    for (const forbidden of D30_FORBIDDEN_PHRASES) {
      assert.ok(
        !txt.toLowerCase().includes(forbidden.toLowerCase()),
        `D30 Sun positives_en still contains forbidden phrase "${forbidden}": ${txt}`
      );
    }
  }
});

test('VP-06: D30 Jupiter planet_role_en mentions protection/resilience', () => {
  const reading = makePlanetReading('Jupiter', {
    positives_en: ['Jupiter supports wisdom, grace, wealth, children in this chart.'],
    positives_hi: ['बृहस्पति ज्ञान, कृपा, धन को समर्थन देता है।'],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  const role = filtered.planet_role_en.toLowerCase();
  assert.ok(
    role.includes('protection') || role.includes('resilience') || role.includes('reduce'),
    `Jupiter D30 role should mention protection, got: ${filtered.planet_role_en}`
  );
});

test('VP-07: D30 filter adds soft fallback when all positives are filtered and planet is not challenged', () => {
  const reading = makePlanetReading('Venus', {
    impact: 'favorable',
    is_challenged: false,
    positives_en: ['Venus supports beauty, love, luxury, arts.'],
    positives_hi: ['शुक्र सौंदर्य, प्रेम, विलास को समर्थन देता है।'],
    negatives_en: [],
    negatives_hi: [],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  assert.ok(filtered.positives_en.length > 0, 'Should have a fallback positive after filtering');
  const fallback = filtered.positives_en[0].toLowerCase();
  assert.ok(
    fallback.includes('awareness') || fallback.includes('care') || fallback.includes('caution') || fallback.includes('mindful'),
    `Fallback should use soft language, got: ${filtered.positives_en[0]}`
  );
});

test('VP-08: D30 Jupiter fallback mentions "protection" when positives are filtered', () => {
  const reading = makePlanetReading('Jupiter', {
    impact: 'favorable',
    is_challenged: false,
    positives_en: ['Jupiter supports wisdom, grace, wealth, children.'],
    positives_hi: ['बृहस्पति ज्ञान, धन को समर्थन देता है।'],
  });
  const [filtered] = applyPurposeFilter('d30', [reading]);
  assert.ok(filtered.positives_en.length > 0, 'Jupiter should have a fallback positive');
  assert.ok(
    filtered.positives_en[0].toLowerCase().includes('protection') || filtered.positives_en[0].toLowerCase().includes('resilience'),
    `Jupiter D30 fallback should mention protection: ${filtered.positives_en[0]}`
  );
});

test('VP-09: D10 readings pass through applyPurposeFilter unchanged', () => {
  const reading = makePlanetReading('Sun', {
    positives_en: ['H10 (Career & reputation) gives Sun strong visibility and projective power in career.'],
    positives_hi: ['10वें भाव में सूर्य को करियर में शक्ति मिलती है।'],
  });
  const [filtered] = applyPurposeFilter('d10', [reading]);
  assert.deepEqual(filtered.positives_en, reading.positives_en, 'D10 should not filter career phrases');
});

test('VP-10: getPurposeFocus returns meaningful string for d30', () => {
  const focus = getPurposeFocus('d30');
  assert.ok(typeof focus === 'string' && focus.length > 5, 'Should return non-empty string');
  assert.ok(
    focus.toLowerCase().includes('misfortune') || focus.toLowerCase().includes('karmic') || focus.toLowerCase().includes('hidden'),
    `D30 focus should mention misfortune/karmic, got: ${focus}`
  );
});

test('VP-11: VARGA_PURPOSE themes are chart-appropriate (d2=wealth, d7=children, d9=marriage, d10=career)', () => {
  assert.ok(VARGA_PURPOSE.d2.allowedThemes.some(t => t.includes('wealth') || t.includes('money')), 'D2 should allow wealth themes');
  assert.ok(VARGA_PURPOSE.d7.allowedThemes.some(t => t.includes('children') || t.includes('progeny')), 'D7 should allow children themes');
  assert.ok(VARGA_PURPOSE.d9.allowedThemes.some(t => t.includes('marriage') || t.includes('spouse')), 'D9 should allow marriage themes');
  assert.ok(VARGA_PURPOSE.d10.allowedThemes.some(t => t.includes('career') || t.includes('profession')), 'D10 should allow career themes');
  assert.ok(!VARGA_PURPOSE.d30.allowedThemes.some(t => t.includes('career') || t.includes('luxury') || t.includes('beauty')), 'D30 should not allow career/luxury themes');
});
