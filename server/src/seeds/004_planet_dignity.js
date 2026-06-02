// Seed 004 — Planet Dignity (Uccha / Neecha / Moolatrikona / Own Sign)
// Source: mooltrikone-and-actual-ed-sign.pdf (verified from PDF image)
// planet_id: 1=Sun, 2=Moon, 3=Mars, 4=Mercury, 5=Jupiter, 6=Venus, 7=Saturn, 8=Rahu, 9=Ketu
// zodiac_sign_id: 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, 5=Leo, 6=Virgo,
//                7=Libra, 8=Scorpio, 9=Sagittarius, 10=Capricorn, 11=Aquarius, 12=Pisces

exports.seed = async function (knex) {
  await knex('planet_dignity').del();

  await knex('planet_dignity').insert([

    // ── SUN (1) ──────────────────────────────────────────────────────
    // Exaltation: Aries 10° | PDF: "Aries 10° (मेष 10°)"
    { planet_id: 1, dignity_type: 'exaltation',   zodiac_sign_id: 1,  exact_degree: 10.00, degree_from: null, degree_to: null, notes: 'Sun is most powerful at Aries 10°', notes_hi: 'सूर्य मेष राशि के 10° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Libra 10° | PDF: "Libra 10° (तुला 10°)"
    { planet_id: 1, dignity_type: 'debilitation', zodiac_sign_id: 7,  exact_degree: 10.00, degree_from: null, degree_to: null, notes: 'Sun is weakest at Libra 10°', notes_hi: 'सूर्य तुला राशि के 10° पर सबसे कमजोर होता है' },
    // Moolatrikona: Leo 0°–20° | PDF: "Leo 0°–20° (सिंह 0°–20°)"
    { planet_id: 1, dignity_type: 'moolatrikona',  zodiac_sign_id: 5,  exact_degree: null,  degree_from: 0.00, degree_to: 20.00, notes: 'Sun Moolatrikona in Leo 0–20°', notes_hi: 'सूर्य का मूलत्रिकोण सिंह राशि में 0°–20° तक' },
    // Own Sign: Leo 20°–30° (remaining degrees are own sign)
    { planet_id: 1, dignity_type: 'own_sign',      zodiac_sign_id: 5,  exact_degree: null,  degree_from: 20.00, degree_to: 30.00, notes: 'Sun own sign Leo 20°–30°', notes_hi: 'सूर्य की अपनी राशि सिंह 20°–30°' },

    // ── MOON (2) ─────────────────────────────────────────────────────
    // Exaltation: Taurus 3° | PDF: "Taurus 3° (वृषभ 3°)"
    { planet_id: 2, dignity_type: 'exaltation',   zodiac_sign_id: 2,  exact_degree: 3.00,  degree_from: null, degree_to: null, notes: 'Moon is most powerful at Taurus 3°', notes_hi: 'चन्द्रमा वृषभ राशि के 3° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Scorpio 3° | PDF: "Scorpio 3° (वृश्चिक 3°)"
    { planet_id: 2, dignity_type: 'debilitation', zodiac_sign_id: 8,  exact_degree: 3.00,  degree_from: null, degree_to: null, notes: 'Moon is weakest at Scorpio 3°', notes_hi: 'चन्द्रमा वृश्चिक राशि के 3° पर सबसे कमजोर होता है' },
    // Moolatrikona: Taurus 4°–20° | PDF: "Taurus 4°–20° (वृषभ 4°–20°)"
    { planet_id: 2, dignity_type: 'moolatrikona',  zodiac_sign_id: 2,  exact_degree: null,  degree_from: 4.00, degree_to: 20.00, notes: 'Moon Moolatrikona in Taurus 4°–20°', notes_hi: 'चन्द्रमा का मूलत्रिकोण वृषभ राशि में 4°–20° तक' },
    // Own Sign: Cancer
    { planet_id: 2, dignity_type: 'own_sign',      zodiac_sign_id: 4,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Moon own sign Cancer', notes_hi: 'चन्द्रमा की अपनी राशि कर्क' },

    // ── MARS (3) ─────────────────────────────────────────────────────
    // Exaltation: Capricorn 28° | PDF: "Capricorn 28° (मकर 28°)"
    { planet_id: 3, dignity_type: 'exaltation',   zodiac_sign_id: 10, exact_degree: 28.00, degree_from: null, degree_to: null, notes: 'Mars is most powerful at Capricorn 28°', notes_hi: 'मंगल मकर राशि के 28° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Cancer 28° | PDF: "Cancer 28° (कर्क 28°)"
    { planet_id: 3, dignity_type: 'debilitation', zodiac_sign_id: 4,  exact_degree: 28.00, degree_from: null, degree_to: null, notes: 'Mars is weakest at Cancer 28°', notes_hi: 'मंगल कर्क राशि के 28° पर सबसे कमजोर होता है' },
    // Moolatrikona: Aries 0°–12° | PDF: "Aries 0°–12° (मेष 0°–12°)"
    { planet_id: 3, dignity_type: 'moolatrikona',  zodiac_sign_id: 1,  exact_degree: null,  degree_from: 0.00, degree_to: 12.00, notes: 'Mars Moolatrikona in Aries 0°–12°', notes_hi: 'मंगल का मूलत्रिकोण मेष राशि में 0°–12° तक' },
    // Own Sign 1: Aries 12°–30°
    { planet_id: 3, dignity_type: 'own_sign',      zodiac_sign_id: 1,  exact_degree: null,  degree_from: 12.00, degree_to: 30.00, notes: 'Mars own sign Aries 12°–30°', notes_hi: 'मंगल की अपनी राशि मेष 12°–30°' },
    // Own Sign 2: Scorpio
    { planet_id: 3, dignity_type: 'own_sign',      zodiac_sign_id: 8,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Mars own sign Scorpio', notes_hi: 'मंगल की अपनी राशि वृश्चिक' },

    // ── MERCURY (4) ──────────────────────────────────────────────────
    // Exaltation: Virgo 15° | PDF: "Virgo 15° (कन्या 15°)"
    { planet_id: 4, dignity_type: 'exaltation',   zodiac_sign_id: 6,  exact_degree: 15.00, degree_from: null, degree_to: null, notes: 'Mercury is most powerful at Virgo 15°', notes_hi: 'बुध कन्या राशि के 15° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Pisces 15° | PDF: "Pisces 15° (मीन 15°)"
    { planet_id: 4, dignity_type: 'debilitation', zodiac_sign_id: 12, exact_degree: 15.00, degree_from: null, degree_to: null, notes: 'Mercury is weakest at Pisces 15°', notes_hi: 'बुध मीन राशि के 15° पर सबसे कमजोर होता है' },
    // Moolatrikona: Virgo 16°–20° | PDF: "Virgo 16°–20° (कन्या 16°–20°)"
    { planet_id: 4, dignity_type: 'moolatrikona',  zodiac_sign_id: 6,  exact_degree: null,  degree_from: 16.00, degree_to: 20.00, notes: 'Mercury Moolatrikona in Virgo 16°–20°', notes_hi: 'बुध का मूलत्रिकोण कन्या राशि में 16°–20° तक' },
    // Own Sign 1: Gemini
    { planet_id: 4, dignity_type: 'own_sign',      zodiac_sign_id: 3,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Mercury own sign Gemini', notes_hi: 'बुध की अपनी राशि मिथुन' },
    // Own Sign 2: Virgo (remaining)
    { planet_id: 4, dignity_type: 'own_sign',      zodiac_sign_id: 6,  exact_degree: null,  degree_from: 20.00, degree_to: 30.00, notes: 'Mercury own sign Virgo 20°–30°', notes_hi: 'बुध की अपनी राशि कन्या 20°–30°' },

    // ── JUPITER (5) ──────────────────────────────────────────────────
    // Exaltation: Cancer 5° | PDF: "Cancer 5° (कर्क 5°)"
    { planet_id: 5, dignity_type: 'exaltation',   zodiac_sign_id: 4,  exact_degree: 5.00,  degree_from: null, degree_to: null, notes: 'Jupiter is most powerful at Cancer 5°', notes_hi: 'बृहस्पति कर्क राशि के 5° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Capricorn 5° | PDF: "Capricorn 5° (मकर 5°)"
    { planet_id: 5, dignity_type: 'debilitation', zodiac_sign_id: 10, exact_degree: 5.00,  degree_from: null, degree_to: null, notes: 'Jupiter is weakest at Capricorn 5°', notes_hi: 'बृहस्पति मकर राशि के 5° पर सबसे कमजोर होता है' },
    // Moolatrikona: Sagittarius 0°–10° | PDF: "Sagittarius 0°–10° (धनु 0°–10°)"
    { planet_id: 5, dignity_type: 'moolatrikona',  zodiac_sign_id: 9,  exact_degree: null,  degree_from: 0.00, degree_to: 10.00, notes: 'Jupiter Moolatrikona in Sagittarius 0°–10°', notes_hi: 'बृहस्पति का मूलत्रिकोण धनु राशि में 0°–10° तक' },
    // Own Sign 1: Sagittarius 10°–30°
    { planet_id: 5, dignity_type: 'own_sign',      zodiac_sign_id: 9,  exact_degree: null,  degree_from: 10.00, degree_to: 30.00, notes: 'Jupiter own sign Sagittarius 10°–30°', notes_hi: 'बृहस्पति की अपनी राशि धनु 10°–30°' },
    // Own Sign 2: Pisces
    { planet_id: 5, dignity_type: 'own_sign',      zodiac_sign_id: 12, exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Jupiter own sign Pisces', notes_hi: 'बृहस्पति की अपनी राशि मीन' },

    // ── VENUS (6) ────────────────────────────────────────────────────
    // Exaltation: Pisces 27° | PDF: "Pisces 27° (मीन 27°)"
    { planet_id: 6, dignity_type: 'exaltation',   zodiac_sign_id: 12, exact_degree: 27.00, degree_from: null, degree_to: null, notes: 'Venus is most powerful at Pisces 27°', notes_hi: 'शुक्र मीन राशि के 27° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Virgo 27° | PDF: "Virgo 27° (कन्या 27°)"
    { planet_id: 6, dignity_type: 'debilitation', zodiac_sign_id: 6,  exact_degree: 27.00, degree_from: null, degree_to: null, notes: 'Venus is weakest at Virgo 27°', notes_hi: 'शुक्र कन्या राशि के 27° पर सबसे कमजोर होता है' },
    // Moolatrikona: Libra 0°–15° | PDF: "Libra 0°–15° (तुला 0°–15°)"
    { planet_id: 6, dignity_type: 'moolatrikona',  zodiac_sign_id: 7,  exact_degree: null,  degree_from: 0.00, degree_to: 15.00, notes: 'Venus Moolatrikona in Libra 0°–15°', notes_hi: 'शुक्र का मूलत्रिकोण तुला राशि में 0°–15° तक' },
    // Own Sign 1: Taurus
    { planet_id: 6, dignity_type: 'own_sign',      zodiac_sign_id: 2,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Venus own sign Taurus', notes_hi: 'शुक्र की अपनी राशि वृषभ' },
    // Own Sign 2: Libra 15°–30°
    { planet_id: 6, dignity_type: 'own_sign',      zodiac_sign_id: 7,  exact_degree: null,  degree_from: 15.00, degree_to: 30.00, notes: 'Venus own sign Libra 15°–30°', notes_hi: 'शुक्र की अपनी राशि तुला 15°–30°' },

    // ── SATURN (7) ───────────────────────────────────────────────────
    // Exaltation: Libra 20° | PDF: "Libra 20° (तुला 20°)"
    { planet_id: 7, dignity_type: 'exaltation',   zodiac_sign_id: 7,  exact_degree: 20.00, degree_from: null, degree_to: null, notes: 'Saturn is most powerful at Libra 20°', notes_hi: 'शनि तुला राशि के 20° पर सर्वाधिक शक्तिशाली होता है' },
    // Debilitation: Aries 20° | PDF: "Aries 20° (मेष 20°)"
    { planet_id: 7, dignity_type: 'debilitation', zodiac_sign_id: 1,  exact_degree: 20.00, degree_from: null, degree_to: null, notes: 'Saturn is weakest at Aries 20°', notes_hi: 'शनि मेष राशि के 20° पर सबसे कमजोर होता है' },
    // Moolatrikona: Aquarius 0°–20° | PDF: "Aquarius 0°–20° (कुम्भ 0°–20°)"
    { planet_id: 7, dignity_type: 'moolatrikona',  zodiac_sign_id: 11, exact_degree: null,  degree_from: 0.00, degree_to: 20.00, notes: 'Saturn Moolatrikona in Aquarius 0°–20°', notes_hi: 'शनि का मूलत्रिकोण कुम्भ राशि में 0°–20° तक' },
    // Own Sign 1: Capricorn
    { planet_id: 7, dignity_type: 'own_sign',      zodiac_sign_id: 10, exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Saturn own sign Capricorn', notes_hi: 'शनि की अपनी राशि मकर' },
    // Own Sign 2: Aquarius 20°–30°
    { planet_id: 7, dignity_type: 'own_sign',      zodiac_sign_id: 11, exact_degree: null,  degree_from: 20.00, degree_to: 30.00, notes: 'Saturn own sign Aquarius 20°–30°', notes_hi: 'शनि की अपनी राशि कुम्भ 20°–30°' },

    // ── RAHU (8) — Shadow planet, debated exaltation/debilitation ────
    // Most accepted: Exaltation Taurus, Debilitation Scorpio (same as Moon's)
    { planet_id: 8, dignity_type: 'exaltation',   zodiac_sign_id: 2,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Rahu exaltation in Taurus (most accepted school)', notes_hi: 'राहु उच्च तुला में (सबसे स्वीकृत मत)' },
    { planet_id: 8, dignity_type: 'debilitation', zodiac_sign_id: 8,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Rahu debilitation in Scorpio', notes_hi: 'राहु नीच वृश्चिक में' },

    // ── KETU (9) — Shadow planet (always opposite Rahu) ──────────────
    { planet_id: 9, dignity_type: 'exaltation',   zodiac_sign_id: 8,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Ketu exaltation in Scorpio', notes_hi: 'केतु उच्च वृश्चिक में' },
    { planet_id: 9, dignity_type: 'debilitation', zodiac_sign_id: 2,  exact_degree: null,  degree_from: 0.00, degree_to: 30.00, notes: 'Ketu debilitation in Taurus', notes_hi: 'केतु नीच वृषभ में' },
  ]);
};
