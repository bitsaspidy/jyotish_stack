'use strict';
// Seed 017 — Remedy Class 1 Notes (4th May 2026) by Saiansh Arya
// 1. UPDATE planets: ishta_devata + primary_suktam for all 9 grahas
// 2. INSERT Sun, Rahu, Ketu remedy rows to asta_vakri_library (were missing)
// 3. INSERT puja_sequence rows (Steps 0–3 + T&C Shakti Pujan)
// 4. INSERT sadhana_guidance rows (duration, timing, Vedic vs Pauranik, muhurat)

exports.seed = async (knex) => {
  const J = JSON.stringify;

  // ── 1. Ishta Devata + Primary Suktam for all 9 planets ──────────────────────
  const PLANET_DEVATA = [
    {
      name: 'Sun',
      ishta_devata_en: 'Lord Rama / Surya Narayan',
      ishta_devata_hi: 'भगवान राम / सूर्य नारायण',
      primary_suktam_en: 'Surya Upanishad',
      primary_suktam_hi: 'सूर्य उपनिषद',
    },
    {
      name: 'Moon',
      ishta_devata_en: 'Lord Krishna / Shiva',
      ishta_devata_hi: 'भगवान कृष्ण / शिव',
      primary_suktam_en: 'Sri Rudram — Namakam & Chamakam (~34 min)',
      primary_suktam_hi: 'श्री रुद्रम् — नमकम् और चमकम् (लगभग ३४ मिनट)',
    },
    {
      name: 'Mars',
      ishta_devata_en: 'Hanuman / Kartikeya / Narsimha',
      ishta_devata_hi: 'हनुमान / कार्तिकेय / नरसिंह',
      primary_suktam_en: 'Hanuman Bahuk | Rog Nivaran Suktam | Rinn Mochan Mangal Stotra | Pragya Vivardhan Stotra',
      primary_suktam_hi: 'हनुमान बाहुक | रोग निवारण सूक्तम् | ऋण मोचन मंगल स्तोत्र | प्रज्ञा विवर्धन स्तोत्र',
    },
    {
      name: 'Mercury',
      ishta_devata_en: 'Lord Vishnu',
      ishta_devata_hi: 'भगवान विष्णु',
      primary_suktam_en: 'Vishnu Suktam | Narayan Suktam | Purusha Suktam',
      primary_suktam_hi: 'विष्णु सूक्तम् | नारायण सूक्तम् | पुरुष सूक्तम्',
    },
    {
      name: 'Jupiter',
      ishta_devata_en: 'Vishnu / Brihaspati',
      ishta_devata_hi: 'विष्णु / बृहस्पति',
      primary_suktam_en: 'Vishnu Suktam | Narayan Suktam | Purusha Suktam | Medha Suktam | Navgraha Suktam',
      primary_suktam_hi: 'विष्णु सूक्तम् | नारायण सूक्तम् | पुरुष सूक्तम् | मेधा सूक्तम् | नवग्रह सूक्तम्',
    },
    {
      name: 'Venus',
      ishta_devata_en: 'Lakshmi / Parvati',
      ishta_devata_hi: 'लक्ष्मी / पार्वती',
      primary_suktam_en: 'Sri Suktam | Devi Suktam',
      primary_suktam_hi: 'श्री सूक्तम् | देवी सूक्तम्',
    },
    {
      name: 'Saturn',
      ishta_devata_en: 'Shani / Bhairava / Rudra',
      ishta_devata_hi: 'शनि / भैरव / रुद्र',
      primary_suktam_en: 'Sri Rudram — Namakam & Chamakam',
      primary_suktam_hi: 'श्री रुद्रम् — नमकम् और चमकम्',
    },
    {
      name: 'Rahu',
      ishta_devata_en: 'Durga / Kali',
      ishta_devata_hi: 'दुर्गा / काली',
      primary_suktam_en: 'Durga Suktam | Durga Kavach',
      primary_suktam_hi: 'दुर्गा सूक्तम् | दुर्गा कवच',
    },
    {
      name: 'Ketu',
      ishta_devata_en: 'Ganesha',
      ishta_devata_hi: 'गणेश',
      primary_suktam_en: 'Ganapati Atharva Sheersha | Ganapati Prarthna | Mayuresh Stotra',
      primary_suktam_hi: 'गणपति अथर्वशीर्ष | गणपति प्रार्थना | मयूरेश स्तोत्र',
    },
  ];

  for (const row of PLANET_DEVATA) {
    await knex('planets').where({ name: row.name }).update({
      ishta_devata_en: row.ishta_devata_en,
      ishta_devata_hi: row.ishta_devata_hi,
      primary_suktam_en: row.primary_suktam_en,
      primary_suktam_hi: row.primary_suktam_hi,
    });
  }

  // ── 2. Missing planet remedy rows: Sun, Rahu, Ketu ──────────────────────────
  const newRemedyRows = [
    {
      category: 'remedy', item_key: 'Sun', sort_order: 55,
      title_en: 'Remedies for Sun', title_hi: 'सूर्य के उपाय',
      source: 'Remedy Class 1, AstroAnsh',
      extra_data: J({
        deity: 'Lord Rama, Surya Narayan',
        mantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः | Om Hram Hrim Hraum Sah Suryaya Namah',
        yantra: 'Surya Yantra',
        daan_en: 'Wheat, red cloth, copper on Sunday',
        daan_hi: 'रविवार को गेहूं, लाल वस्त्र, तांबा',
        gemstone: 'Ruby (Manik)',
        primary_suktam: 'Surya Upanishad',
      }),
    },
    {
      category: 'remedy', item_key: 'Rahu', sort_order: 56,
      title_en: 'Remedies for Rahu', title_hi: 'राहु के उपाय',
      source: 'Remedy Class 1, AstroAnsh',
      extra_data: J({
        deity: 'Durga, Kali',
        mantra: 'ॐ रां राहवे नमः | Om Ram Rahave Namah',
        yantra: 'Rahu Yantra',
        daan_en: 'Black sesame, blue cloth on Saturday',
        daan_hi: 'शनिवार को काले तिल, नीला वस्त्र',
        gemstone: 'Hessonite Garnet (Gomed)',
        primary_suktam: 'Durga Suktam | Durga Kavach',
      }),
    },
    {
      category: 'remedy', item_key: 'Ketu', sort_order: 57,
      title_en: 'Remedies for Ketu', title_hi: 'केतु के उपाय',
      source: 'Remedy Class 1, AstroAnsh',
      extra_data: J({
        deity: 'Ganesha',
        mantra: 'ॐ कें केतवे नमः | Om Kem Ketave Namah',
        yantra: 'Ketu Yantra',
        daan_en: "Sesame seeds, blanket, brown fabric on Saturday",
        daan_hi: 'शनिवार को तिल, कंबल, भूरा वस्त्र',
        gemstone: "Cat's Eye (Lehsuniya)",
        primary_suktam: 'Ganapati Atharva Sheersha | Ganapati Prarthna | Mayuresh Stotra',
      }),
    },
  ];

  for (const row of newRemedyRows) {
    const exists = await knex('asta_vakri_library')
      .where({ category: row.category, item_key: row.item_key }).first();
    if (!exists) {
      await knex('asta_vakri_library').insert(row);
    } else {
      await knex('asta_vakri_library')
        .where({ category: row.category, item_key: row.item_key })
        .update({ title_en: row.title_en, title_hi: row.title_hi, extra_data: row.extra_data, source: row.source });
    }
  }

  // ── 3. Puja Sequence — Steps 0–3 + T&C (Section 6) ──────────────────────────
  const pujaRows = [
    {
      category: 'puja_sequence', item_key: 'step_0', sort_order: 60,
      title_en: 'Step 0 — Ganesh Invocation (Before Everything)',
      title_hi: 'चरण ० — गणेश आह्वान (सब से पहले)',
      description_en: 'Always begin every puja with Ganesh Invocation. Ganesha is the Vighnaharta — the remover of obstacles and the lord of all beginnings. Without this first step, any sadhana is incomplete.',
      description_hi: 'प्रत्येक पूजा से पूर्व गणेश आह्वान अनिवार्य है। गणेश विघ्नहर्ता हैं — सभी बाधाओं के हरने वाले और सभी शुभ कार्यों के स्वामी। इस चरण के बिना कोई भी साधना अपूर्ण है।',
      effects_en: J(['Ganapati Prarthna', 'Ganapati Gayatri Mantra × 9 times']),
      effects_hi: J(['गणपति प्रार्थना', 'गणपति गायत्री मंत्र × ९ बार']),
      extra_data: J({ step: 0, mandatory: true, conditional: false }),
      source: 'Remedy Class 1 — §6',
    },
    {
      category: 'puja_sequence', item_key: 'step_1', sort_order: 61,
      title_en: 'Step 1 — Ishta Devata Mantra (Afflicted Planet\'s Deity)',
      title_hi: 'चरण १ — इष्ट देवता मंत्र (पीड़ित ग्रह के देवता)',
      description_en: 'Recite the mantra or suktam of the Ishta Devata corresponding to the planet you are propitiating — the afflicted, debilitated, or unfavourably placed planet in your birth chart.',
      description_hi: 'उस ग्रह के इष्ट देवता का मंत्र/सूक्तम् पाठ करें जिसका आप उपाय कर रहे हैं — पीड़ित, नीच या प्रतिकूल स्थित ग्रह।',
      effects_en: J(['Use the planet\'s Ishta Devata from the Planet Deities table', 'Refer to §7 for problem-specific mantras (e.g., diseases → Mars → Hanuman Bahuk)']),
      effects_hi: J(['ग्रह देवता तालिका से संबंधित इष्ट देवता का उपयोग करें', 'विशिष्ट समस्याओं के लिए §७ देखें (जैसे रोग → मंगल → हनुमान बाहुक)']),
      extra_data: J({ step: 1, mandatory: true, conditional: false }),
      source: 'Remedy Class 1 — §6',
    },
    {
      category: 'puja_sequence', item_key: 'step_2', sort_order: 62,
      title_en: 'Step 2 — Lagna Lord Devata Mantra',
      title_hi: 'चरण २ — लग्नेश देवता मंत्र',
      description_en: 'Recite the mantra of the Ishta Devata corresponding to your Lagna Lord — the planet that rules your Ascendant (Lagna). This strengthens the foundation of your entire chart.',
      description_hi: 'अपने लग्नेश के इष्ट देवता का मंत्र पाठ करें — वह ग्रह जो आपके लग्न (Ascendant) का स्वामी है। यह आपकी पूरी कुंडली की नींव को सुदृढ़ करता है।',
      effects_en: J(['Find your Ascendant (Lagna) sign', 'Identify the ruling planet of that sign', 'Recite that planet\'s Ishta Devata mantra']),
      effects_hi: J(['अपनी लग्न राशि पहचानें', 'उस राशि के स्वामी ग्रह की पहचान करें', 'उस ग्रह के इष्ट देवता का मंत्र जपें']),
      extra_data: J({ step: 2, mandatory: true, conditional: false }),
      source: 'Remedy Class 1 — §6',
    },
    {
      category: 'puja_sequence', item_key: 'step_3', sort_order: 63,
      title_en: 'Step 3 — Atmakarak Graha Mantra',
      title_hi: 'चरण ३ — आत्मकारक ग्रह मंत्र',
      description_en: 'Recite the mantra of the Ishta Devata of your Atmakarak planet — the planet with the highest degree in your chart (excluding Rahu/Ketu). The Atmakarak is the significator of the soul\'s purpose.',
      description_hi: 'अपने आत्मकारक ग्रह के इष्ट देवता का मंत्र पाठ करें — आपकी कुंडली में सर्वाधिक अंश वाला ग्रह (राहु/केतु को छोड़कर)। आत्मकारक आत्मा के उद्देश्य का कारक है।',
      effects_en: J(['The Atmakarak is shown in your Chara Karakas section', 'Use that planet\'s Ishta Devata from the Planet Deities table']),
      effects_hi: J(['आत्मकारक आपकी चर कारक तालिका में दर्शाया गया है', 'उस ग्रह का इष्ट देवता ग्रह देवता तालिका से देखें']),
      extra_data: J({ step: 3, mandatory: true, conditional: false }),
      source: 'Remedy Class 1 — §6',
    },
    {
      category: 'puja_sequence', item_key: 't_c_shakti', sort_order: 64,
      title_en: 'T&C — Shakti Pujan (Conditional)',
      title_hi: 'शर्त — शक्ति पूजन (ऐच्छिक)',
      description_en: 'Perform Shakti Pujan ONLY IF the Divine Feminine (Shakti) has NOT already appeared as the Ishta Devata in Steps 1, 2, or 3. This ensures Shakti is always honoured while avoiding unnecessary repetition.',
      description_hi: 'शक्ति पूजन केवल तभी करें जब दिव्य शक्ति (देवी) पहले से चरण १, २ या ३ में इष्ट देवता के रूप में न आई हो। इससे शक्ति का सम्मान भी होता है और अनावश्यक दोहराव से बचाव भी।',
      effects_en: J(['Durga Suktam', 'Durga Kavach', 'Medha Suktam', 'Devi Suktam']),
      effects_hi: J(['दुर्गा सूक्तम्', 'दुर्गा कवच', 'मेधा सूक्तम्', 'देवी सूक्तम्']),
      extra_data: J({ step: 'T&C', mandatory: false, conditional: true, condition: 'Only if Shakti not already in Steps 1–3' }),
      source: 'Remedy Class 1 — §6',
    },
  ];

  for (const row of pujaRows) {
    const exists = await knex('asta_vakri_library')
      .where({ category: row.category, item_key: row.item_key }).first();
    if (!exists) {
      await knex('asta_vakri_library').insert(row);
    } else {
      await knex('asta_vakri_library')
        .where({ category: row.category, item_key: row.item_key })
        .update({ title_en: row.title_en, title_hi: row.title_hi, description_en: row.description_en, description_hi: row.description_hi, effects_en: row.effects_en, effects_hi: row.effects_hi, extra_data: row.extra_data });
    }
  }

  // ── 4. Sadhana Guidance (Sections 2–5) ───────────────────────────────────────
  const guidanceRows = [
    {
      category: 'sadhana_guidance', item_key: 'duration_43', sort_order: 70,
      title_en: '43 Days — Mandala Period',
      title_hi: '४३ दिन — मंडल अवधि',
      description_en: 'A complete sacred cycle in Vedic tradition. The minimum recommended duration for Pauranik sadhana. Commit to the same mantra, same time, same place for 43 consecutive days.',
      description_hi: 'वैदिक परम्परा का एक सम्पूर्ण पवित्र चक्र। पौराणिक साधना के लिए न्यूनतम अनुशंसित अवधि। ४३ लगातार दिनों तक एक ही मंत्र, एक ही समय, एक ही स्थान पर साधना करें।',
      extra_data: J({ days: 43, type: 'Mandala', for_en: 'Minimum for Pauranik sadhana', for_hi: 'पौराणिक साधना के लिए न्यूनतम' }),
      source: 'Remedy Class 1 — §3',
    },
    {
      category: 'sadhana_guidance', item_key: 'duration_90', sort_order: 71,
      title_en: '90 Days — Full Sadhana Cycle',
      title_hi: '९० दिन — पूर्ण साधना चक्र',
      description_en: 'Required for complex remedies such as Vastu Dosh (1001 Vastu Suktam, East direction) and deep-rooted planetary afflictions. Do not break the cycle — even one missed day requires restarting.',
      description_hi: 'वास्तु दोष (१००१ वास्तु सूक्तम्, पूर्व दिशा) जैसे जटिल उपायों और गहरे ग्रह दोषों के लिए आवश्यक। चक्र न तोड़ें — एक भी दिन छूटने पर पुनः आरंभ करना होगा।',
      extra_data: J({ days: 90, type: 'Full Cycle', for_en: 'Vastu Dosh (1001 Vastu Suktam), deep planetary afflictions', for_hi: 'वास्तु दोष, गहरे ग्रह दोष' }),
      source: 'Remedy Class 1 — §3',
    },
    {
      category: 'sadhana_guidance', item_key: 'vedic_rules', sort_order: 72,
      title_en: 'Vedic Mantras / Suktam — Rules',
      title_hi: 'वैदिक मंत्र / सूक्तम् — नियम',
      description_en: 'Rules for reciting Vedic mantras (from the four Vedas — Rig, Sama, Yajur, Atharva). These are Shruti-based, originating from divine revelation.',
      description_hi: 'वैदिक मंत्रों (चारों वेदों — ऋग, साम, यजुर, अथर्व से) के पाठ के नियम। ये श्रुति-आधारित हैं, दिव्य रहस्योद्घाटन से।',
      effects_en: J([
        'Direction: Always face East (पूर्व दिशा)',
        'Aachman: NOT required before each recitation',
        'Aasan (Seat): Necessary — use Red Wool (लाल ऊन) or Kusha Grass (कुश)',
        'Origin: Four Vedas (Rig, Sama, Yajur, Atharva)',
      ]),
      effects_hi: J([
        'दिशा: सदैव पूर्व की ओर मुख करें',
        'आचमन: प्रत्येक पाठ से पूर्व आवश्यक नहीं',
        'आसन: आवश्यक — लाल ऊन या कुश घास',
        'उद्गम: चारों वेद (ऋग, साम, यजुर, अथर्व)',
      ]),
      extra_data: J({ type: 'vedic', direction: 'East', aachman: false, aasan: 'Red Wool or Kusha Grass' }),
      source: 'Remedy Class 1 — §4',
    },
    {
      category: 'sadhana_guidance', item_key: 'pauranik_rules', sort_order: 73,
      title_en: 'Pauranik Mantras / Stotra — Rules',
      title_hi: 'पौराणिक मंत्र / स्तोत्र — नियम',
      description_en: 'Rules for reciting Pauranik mantras (from Puranas, Smritis, Agamas). These are Smriti-based texts and require a stricter preparation before each recitation.',
      description_hi: 'पौराणिक मंत्रों (पुराणों, स्मृतियों, आगमों से) के पाठ के नियम। ये स्मृति-आधारित ग्रंथ हैं और प्रत्येक पाठ से पूर्व कड़ी तैयारी की आवश्यकता होती है।',
      effects_en: J([
        'Direction: Face the direction of the specific Graha (planet-specific)',
        'Aachman: REQUIRED before each recitation (mandatory)',
        'Aasan (Seat): Necessary — use Red Wool (लाल ऊन) or Kusha Grass (कुश)',
        'Origin: Puranas, Smritis, Agamas',
        'Planet directions — Sun:East · Moon:NW · Mars:South · Mercury:North · Jupiter:NE · Venus:SE · Saturn:West · Rahu:SW · Ketu:NW',
      ]),
      effects_hi: J([
        'दिशा: उस विशेष ग्रह की दिशा में मुख करें',
        'आचमन: प्रत्येक पाठ से पूर्व अनिवार्य',
        'आसन: आवश्यक — लाल ऊन या कुश घास',
        'उद्गम: पुराण, स्मृति, आगम',
        'ग्रह दिशाएं — सूर्य:पूर्व · चंद्र:उत्तर-पश्चिम · मंगल:दक्षिण · बुध:उत्तर · गुरु:उत्तर-पूर्व · शुक्र:दक्षिण-पूर्व · शनि:पश्चिम · राहु:दक्षिण-पश्चिम · केतु:उत्तर-पश्चिम',
      ]),
      extra_data: J({ type: 'pauranik', direction: 'planet-specific', aachman: true, aasan: 'Red Wool or Kusha Grass' }),
      source: 'Remedy Class 1 — §4',
    },
    {
      category: 'sadhana_guidance', item_key: 'time_windows', sort_order: 74,
      title_en: 'Recommended Daily Sadhana Time Windows',
      title_hi: 'अनुशंसित दैनिक साधना काल',
      description_en: 'Four daily time windows aligned with natural Vedic energy cycles. Choose one and maintain it consistently throughout your sadhana cycle.',
      description_hi: 'चार दैनिक समय खिड़कियां जो प्राकृतिक वैदिक ऊर्जा चक्रों के साथ संरेखित हैं। एक चुनें और अपने साधना चक्र में इसे लगातार बनाए रखें।',
      effects_en: J([
        '4:00–5:00 AM — Brahma Muhurat (BEST): Most sacred pre-dawn; ideal for Vedic recitation & deep meditation',
        '8:00–9:00 AM — Morning Session: Second recommended window; suitable for daily mantra sadhana',
        '12:00–1:30 PM — Midday / Abhijeet: Abhijeet Muhurat may occur — extremely auspicious for new beginnings',
        '6:00–7:30 PM — Evening / Sandhya: Sunset sandhya period; effective for Pauranik mantras & deity invocations',
      ]),
      effects_hi: J([
        '४:०० – ५:०० प्रातः — ब्रह्म मुहूर्त (सर्वोत्तम): वैदिक पाठ और ध्यान के लिए सर्वोत्कृष्ट',
        '८:०० – ९:०० प्रातः — प्रातः सत्र: दैनिक मंत्र साधना के लिए उपयुक्त',
        '१२:०० – १:३० अपराह्न — मध्याह्न: अभिजीत मुहूर्त संभव — नई शुरुआत के लिए अत्यंत शुभ',
        '६:०० – ७:३० सायं — सायंकाल संध्या: पौराणिक मंत्र और देवता आह्वान के लिए प्रभावी',
      ]),
      extra_data: J([
        { time:'4:00–5:00 AM', name_en:'Brahma Muhurat', name_hi:'ब्रह्म मुहूर्त', quality:'best' },
        { time:'8:00–9:00 AM', name_en:'Morning Session', name_hi:'प्रातः सत्र', quality:'good' },
        { time:'12:00–1:30 PM', name_en:'Midday / Abhijeet', name_hi:'मध्याह्न / अभिजीत', quality:'auspicious' },
        { time:'6:00–7:30 PM', name_en:'Evening / Sandhya', name_hi:'सायंकाल संध्या', quality:'good' },
      ]),
      source: 'Remedy Class 1 — §5',
    },
    {
      category: 'sadhana_guidance', item_key: 'muhurat_guide', sort_order: 75,
      title_en: 'Muhurat Guide — What to Avoid & Prefer',
      title_hi: 'मुहूर्त मार्गदर्शन — क्या टालें, क्या चुनें',
      description_en: 'Before starting any new mantra sadhana, consult the Panchang for auspicious timing. These Muhurat elements govern whether a sadhana will flourish or be obstructed.',
      description_hi: 'कोई भी नई मंत्र साधना आरंभ करने से पूर्व पंचांग देखें। ये मुहूर्त तत्त्व निर्धारित करते हैं कि साधना फलेगी या बाधित होगी।',
      effects_en: J([
        'AVOID — Rahu Kaal: Period ruled by Rahu — inauspicious for any new work',
        'AVOID — Gulika Kaal: Period of Gulika (son of Saturn) — avoid for auspicious beginnings',
        'AVOID — Yamagandam: Period of Yama — inauspicious for new undertakings',
        'PREFER — Brahma Muhurat (4–5 AM): Most powerful for Vedic recitation and meditation',
        'PREFER — Abhijeet Muhurat (~midday): 8th Muhurat — highly auspicious for important beginnings',
        'PREFER — Amrit Siddhi Yoga: Mantra begun here reaches rapid fruition',
        'PREFER — Sarvartha Siddhi Yoga: Yoga of accomplishment of all goals',
      ]),
      effects_hi: J([
        'टालें — राहु काल: राहु का समय — नए कार्य के लिए अशुभ',
        'टालें — गुलिका काल: गुलिका (शनि-पुत्र) का काल — शुभ आरंभ के लिए वर्जित',
        'टालें — यमगण्डम्: यम का काल — नए कार्यों के लिए अशुभ',
        'चुनें — ब्रह्म मुहूर्त (४-५ बजे): वैदिक पाठ और ध्यान के लिए सर्वाधिक शक्तिशाली',
        'चुनें — अभिजीत मुहूर्त (~मध्याह्न): ८वाँ मुहूर्त — महत्वपूर्ण कार्यों के लिए अत्यंत शुभ',
        'चुनें — अमृत सिद्धि योग: इस योग में आरंभ मंत्र शीघ्र फलदायक',
        'चुनें — सर्वार्थसिद्धि योग: सभी लक्ष्यों की सिद्धि का योग',
      ]),
      extra_data: J({
        avoid: ['Rahu Kaal','Gulika Kaal','Yamagandam'],
        prefer: ['Brahma Muhurat','Abhijeet Muhurat','Amrit Siddhi Yoga','Sarvartha Siddhi Yoga'],
      }),
      source: 'Remedy Class 1 — §2A',
    },
    {
      category: 'sadhana_guidance', item_key: 'chogadiya_guide', sort_order: 76,
      title_en: 'Chogadiya Guide for Mantra Timing',
      title_hi: 'मंत्र के लिए चौघड़िया मार्गदर्शन',
      description_en: 'Chogadiya divides the day into 8 periods (~90 min each). For mantra sadhana, begin during Amrit, Shubh, or Labh Chogadiya. Strictly avoid Rog, Kaal, and Udveg for starting new practice.',
      description_hi: 'चौघड़िया दिन को ८ खंडों में विभाजित करती है (~९० मिनट प्रत्येक)। मंत्र साधना के लिए अमृत, शुभ या लाभ चौघड़िया में आरंभ करें। रोग, काल, उद्वेग चौघड़िया से सदा बचें।',
      effects_en: J([
        'PREFER: Amrit (Nectar) — Highly Auspicious',
        'PREFER: Shubh (Auspicious) — Auspicious',
        'PREFER: Labh (Profit) — Auspicious',
        'NEUTRAL: Char (Moving) — Acceptable',
        'AVOID: Rog (Disease) — Inauspicious',
        'AVOID: Kaal (Death) — Inauspicious',
        'AVOID: Udveg (Anxiety) — Inauspicious',
      ]),
      effects_hi: J([
        'चुनें: अमृत — अति शुभ',
        'चुनें: शुभ — शुभ',
        'चुनें: लाभ — शुभ',
        'सामान्य: चर — स्वीकार्य',
        'टालें: रोग — अशुभ',
        'टालें: काल — अशुभ',
        'टालें: उद्वेग — अशुभ',
      ]),
      extra_data: J({
        prefer: ['Amrit','Shubh','Labh'],
        neutral: ['Char'],
        avoid: ['Rog','Kaal','Udveg'],
      }),
      source: 'Remedy Class 1 — §2B',
    },
  ];

  for (const row of guidanceRows) {
    const exists = await knex('asta_vakri_library')
      .where({ category: row.category, item_key: row.item_key }).first();
    if (!exists) {
      await knex('asta_vakri_library').insert(row);
    } else {
      await knex('asta_vakri_library')
        .where({ category: row.category, item_key: row.item_key })
        .update({
          title_en: row.title_en, title_hi: row.title_hi,
          description_en: row.description_en, description_hi: row.description_hi,
          effects_en: row.effects_en, effects_hi: row.effects_hi,
          extra_data: row.extra_data,
        });
    }
  }
};
