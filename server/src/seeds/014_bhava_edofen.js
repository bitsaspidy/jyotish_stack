'use strict';
// Seed 014 — Bhava Classifications + EDOFEN Data
// Source: "Name of Bhavas and EDOFEN.pdf"
// Safe to re-run: uses UPDATE for houses, DELETE+INSERT for friendship table,
// INSERT OR IGNORE pattern for planet_dignity (Rahu/Ketu rows)

exports.seed = async function (knex) {

  // ── 1. BHAVA CLASSIFICATION (Page 1 of PDF) ──────────────────────────────
  // Houses: Kendra(1,4,7,10) | Trikona(1,5,9) | Upachaya(3,6,10,11)
  //         Dusthana/Trik(6,8,12) | Maarak(2,7)

  const bhavaData = [
    {
      id: 1,
      bhava_type: 'kendra',
      bhava_groups: JSON.stringify(['kendra', 'trikona']),
      bhava_nature_en: 'Very Auspicious',
      bhava_nature_hi: 'अत्यंत शुभ',
      is_kendra: true, is_trikona: true, is_dusthana: false, is_upachaya: false, is_maarak: false,
    },
    {
      id: 2,
      bhava_type: 'neutral',
      bhava_groups: JSON.stringify(['maarak']),
      bhava_nature_en: 'Death Causing (Maarak)',
      bhava_nature_hi: 'मारक',
      is_kendra: false, is_trikona: false, is_dusthana: false, is_upachaya: false, is_maarak: true,
    },
    {
      id: 3,
      bhava_type: 'upachaya',
      bhava_groups: JSON.stringify(['upachaya']),
      bhava_nature_en: 'Grows with Age',
      bhava_nature_hi: 'उपचय — वृद्धिकारक',
      is_kendra: false, is_trikona: false, is_dusthana: false, is_upachaya: true, is_maarak: false,
    },
    {
      id: 4,
      bhava_type: 'kendra',
      bhava_groups: JSON.stringify(['kendra']),
      bhava_nature_en: 'Auspicious (Kendra)',
      bhava_nature_hi: 'शुभ — केंद्र',
      is_kendra: true, is_trikona: false, is_dusthana: false, is_upachaya: false, is_maarak: false,
    },
    {
      id: 5,
      bhava_type: 'trikona',
      bhava_groups: JSON.stringify(['trikona']),
      bhava_nature_en: 'Auspicious (Trikona)',
      bhava_nature_hi: 'शुभ — त्रिकोण',
      is_kendra: false, is_trikona: true, is_dusthana: false, is_upachaya: false, is_maarak: false,
    },
    {
      id: 6,
      bhava_type: 'dusthana',
      bhava_groups: JSON.stringify(['dusthana', 'upachaya']),
      bhava_nature_en: 'Challenging (Dusthana + Upachaya)',
      bhava_nature_hi: 'चुनौतीपूर्ण — दुस्थान व उपचय',
      is_kendra: false, is_trikona: false, is_dusthana: true, is_upachaya: true, is_maarak: false,
    },
    {
      id: 7,
      bhava_type: 'kendra',
      bhava_groups: JSON.stringify(['kendra', 'maarak']),
      bhava_nature_en: 'Auspicious (Kendra + Maarak)',
      bhava_nature_hi: 'शुभ केंद्र — मारक भी',
      is_kendra: true, is_trikona: false, is_dusthana: false, is_upachaya: false, is_maarak: true,
    },
    {
      id: 8,
      bhava_type: 'dusthana',
      bhava_groups: JSON.stringify(['dusthana']),
      bhava_nature_en: 'Evil / Dusthana (Mrityu)',
      bhava_nature_hi: 'दुस्थान — मृत्यु भाव',
      is_kendra: false, is_trikona: false, is_dusthana: true, is_upachaya: false, is_maarak: false,
    },
    {
      id: 9,
      bhava_type: 'trikona',
      bhava_groups: JSON.stringify(['trikona']),
      bhava_nature_en: 'Very Auspicious (Bhagya Trikona)',
      bhava_nature_hi: 'अत्यंत शुभ — भाग्य त्रिकोण',
      is_kendra: false, is_trikona: true, is_dusthana: false, is_upachaya: false, is_maarak: false,
    },
    {
      id: 10,
      bhava_type: 'kendra',
      bhava_groups: JSON.stringify(['kendra', 'upachaya']),
      bhava_nature_en: 'Auspicious (Kendra + Upachaya)',
      bhava_nature_hi: 'शुभ केंद्र — उपचय कर्म भाव',
      is_kendra: true, is_trikona: false, is_dusthana: false, is_upachaya: true, is_maarak: false,
    },
    {
      id: 11,
      bhava_type: 'upachaya',
      bhava_groups: JSON.stringify(['upachaya']),
      bhava_nature_en: 'Grows with Age (Labha)',
      bhava_nature_hi: 'उपचय — लाभ भाव',
      is_kendra: false, is_trikona: false, is_dusthana: false, is_upachaya: true, is_maarak: false,
    },
    {
      id: 12,
      bhava_type: 'dusthana',
      bhava_groups: JSON.stringify(['dusthana']),
      bhava_nature_en: 'Evil / Dusthana (Vyaya)',
      bhava_nature_hi: 'दुस्थान — व्यय भाव',
      is_kendra: false, is_trikona: false, is_dusthana: true, is_upachaya: false, is_maarak: false,
    },
  ];

  for (const row of bhavaData) {
    await knex('houses')
      .where('id', row.id)
      .update({
        bhava_type:      row.bhava_type,
        bhava_groups:    row.bhava_groups,
        bhava_nature_en: row.bhava_nature_en,
        bhava_nature_hi: row.bhava_nature_hi,
        is_kendra:       row.is_kendra,
        is_trikona:      row.is_trikona,
        is_dusthana:     row.is_dusthana,
        is_upachaya:     row.is_upachaya,
        is_maarak:       row.is_maarak,
      });
  }

  // ── 2. RAHU / KETU DIGNITY (Page 2 — EDOFEN Table) ───────────────────────
  // Rahu: Exaltation = Taurus (sign_id=2), Debilitation = Scorpio (sign_id=8)
  // Ketu: Exaltation = Scorpio (sign_id=8), Debilitation = Taurus (sign_id=2)
  // Planet IDs: Rahu=8, Ketu=9 (from seed 002_planets.js order)

  // Remove existing Rahu/Ketu dignity rows (if any) then re-insert
  await knex('planet_dignity').whereIn('planet_id', [8, 9]).delete();

  await knex('planet_dignity').insert([
    // Rahu exaltation — Taurus
    {
      planet_id:     8,
      dignity_type:  'exaltation',
      zodiac_sign_id: 2,
      exact_degree:  null,
      degree_from:   null,
      degree_to:     null,
      notes:         'Rahu exalted in Taurus (Vrishabh) — 100% strength. Source: EDOFEN PDF.',
      notes_hi:      'राहु उच्च — वृषभ राशि में (100% बल)',
    },
    // Rahu debilitation — Scorpio
    {
      planet_id:     8,
      dignity_type:  'debilitation',
      zodiac_sign_id: 8,
      exact_degree:  null,
      degree_from:   null,
      degree_to:     null,
      notes:         'Rahu debilitated in Scorpio (Vrishchik) — 10% strength.',
      notes_hi:      'राहु नीच — वृश्चिक राशि में (10% बल)',
    },
    // Ketu exaltation — Scorpio
    {
      planet_id:     9,
      dignity_type:  'exaltation',
      zodiac_sign_id: 8,
      exact_degree:  null,
      degree_from:   null,
      degree_to:     null,
      notes:         'Ketu exalted in Scorpio (Vrishchik) — 100% strength.',
      notes_hi:      'केतु उच्च — वृश्चिक राशि में (100% बल)',
    },
    // Ketu debilitation — Taurus
    {
      planet_id:     9,
      dignity_type:  'debilitation',
      zodiac_sign_id: 2,
      exact_degree:  null,
      degree_from:   null,
      degree_to:     null,
      notes:         'Ketu debilitated in Taurus (Vrishabh) — 10% strength.',
      notes_hi:      'केतु नीच — वृषभ राशि में (10% बल)',
    },
  ]);

  // ── 3. PERMANENT FRIENDSHIP TABLE (Page 3 — Naisargika Maitri) ───────────
  // Complete 9×9 matrix including Rahu & Ketu
  // "Set" in the PDF = Saturn

  await knex('planet_naisargika_maitri').delete();

  await knex('planet_naisargika_maitri').insert([
    {
      planet:   'Sun',
      friends:  JSON.stringify(['Moon', 'Mars', 'Jupiter']),
      neutral:  JSON.stringify(['Mercury']),
      enemies:  JSON.stringify(['Venus', 'Saturn', 'Rahu', 'Ketu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Moon',
      friends:  JSON.stringify(['Sun', 'Mercury']),
      neutral:  JSON.stringify(['Mars', 'Jupiter', 'Venus', 'Saturn']),
      enemies:  JSON.stringify(['Rahu', 'Ketu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Mars',
      friends:  JSON.stringify(['Sun', 'Moon', 'Jupiter', 'Ketu']),
      neutral:  JSON.stringify(['Venus', 'Saturn']),
      enemies:  JSON.stringify(['Mercury', 'Rahu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Mercury',
      friends:  JSON.stringify(['Sun', 'Venus']),
      neutral:  JSON.stringify(['Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']),
      enemies:  JSON.stringify(['Moon']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Jupiter',
      friends:  JSON.stringify(['Sun', 'Moon', 'Mars']),
      neutral:  JSON.stringify(['Saturn', 'Rahu', 'Ketu']),
      enemies:  JSON.stringify(['Mercury', 'Venus']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Venus',
      friends:  JSON.stringify(['Mercury', 'Saturn', 'Rahu', 'Ketu']),
      neutral:  JSON.stringify(['Mars', 'Jupiter']),
      enemies:  JSON.stringify(['Sun', 'Moon']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Saturn',
      friends:  JSON.stringify(['Mercury', 'Venus', 'Rahu']),
      neutral:  JSON.stringify(['Jupiter']),
      enemies:  JSON.stringify(['Sun', 'Moon', 'Mars', 'Ketu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Rahu',
      friends:  JSON.stringify(['Venus', 'Saturn']),
      neutral:  JSON.stringify(['Mercury', 'Jupiter']),
      enemies:  JSON.stringify(['Sun', 'Moon', 'Mars', 'Ketu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
    {
      planet:   'Ketu',
      friends:  JSON.stringify(['Mars', 'Venus']),
      neutral:  JSON.stringify(['Mercury', 'Jupiter']),
      enemies:  JSON.stringify(['Sun', 'Moon', 'Saturn', 'Rahu']),
      notes:    'Source: EDOFEN PDF Page 3',
    },
  ]);
};
