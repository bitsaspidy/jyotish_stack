'use strict';
/**
 * Seed 008 — Graha Drishti, Bhav Karak, Digbala
 * Source: "Drishti, Bhav Karak and Digbala.pdf" (app.astroansh.in)
 */

exports.seed = async function (knex) {
  // ── 1. Graha Drishti Rules ──────────────────────────────────────────────────
  await knex('graha_drishti_rules').del();
  await knex('graha_drishti_rules').insert([
    // Sun — only 7th aspect
    { planet: 'Sun',     aspect_offset: 7, nature: 'neutral',     description_en: 'Sun aspects the 7th house from its position. Brings authority, ego, and illumination to that house.', description_hi: 'सूर्य अपनी स्थिति से 7वें भाव पर दृष्टि डालता है।' },

    // Moon — only 7th aspect
    { planet: 'Moon',    aspect_offset: 7, nature: 'neutral',     description_en: 'Moon aspects the 7th house from its position. Brings emotions, nurturing, and sensitivity to that house.', description_hi: 'चंद्रमा अपनी स्थिति से 7वें भाव पर दृष्टि डालता है।' },

    // Mercury — only 7th aspect
    { planet: 'Mercury', aspect_offset: 7, nature: 'neutral',     description_en: 'Mercury aspects the 7th house from its position. Brings intellect, communication, and analytical energy to that house.', description_hi: 'बुध अपनी स्थिति से 7वें भाव पर दृष्टि डालता है।' },

    // Venus — only 7th aspect
    { planet: 'Venus',   aspect_offset: 7, nature: 'neutral',     description_en: 'Venus aspects the 7th house from its position. Brings beauty, love, and harmony to that house.', description_hi: 'शुक्र अपनी स्थिति से 7वें भाव पर दृष्टि डालता है।' },

    // Mars — 4th, 7th, 8th
    { planet: 'Mars',    aspect_offset: 4, nature: 'aggressive',  description_en: 'Mars casts its 4th special aspect — aggressive, forceful, conflict-oriented influence on home, mother, vehicles, happiness.', description_hi: 'मंगल की 4थी विशेष दृष्टि — आक्रामक, ऊर्जावान प्रभाव।' },
    { planet: 'Mars',    aspect_offset: 7, nature: 'aggressive',  description_en: 'Mars aspects the 7th house from its position. Brings energy, conflict, and drive to relationships and partnerships.', description_hi: 'मंगल की 7वीं दृष्टि — सप्तम भाव पर।' },
    { planet: 'Mars',    aspect_offset: 8, nature: 'aggressive',  description_en: 'Mars casts its 8th special aspect — intense, transformative, conflict-oriented influence on secrets, longevity, occult matters.', description_hi: 'मंगल की 8वीं विशेष दृष्टि — रहस्य और परिवर्तन पर।' },

    // Jupiter — 5th, 7th, 9th
    { planet: 'Jupiter', aspect_offset: 5, nature: 'auspicious',  description_en: 'Jupiter casts its auspicious 5th aspect — brings wisdom, blessings, and dharmic growth to children, education, and intelligence.', description_hi: 'गुरु की 5वीं शुभ दृष्टि — ज्ञान और आशीर्वाद।' },
    { planet: 'Jupiter', aspect_offset: 7, nature: 'auspicious',  description_en: 'Jupiter aspects the 7th house from its position. Brings expansion, wisdom, and blessings to partnerships and marriage.', description_hi: 'गुरु की 7वीं दृष्टि — सप्तम भाव पर शुभ प्रभाव।' },
    { planet: 'Jupiter', aspect_offset: 9, nature: 'auspicious',  description_en: 'Jupiter casts its auspicious 9th aspect — brings dharma, higher knowledge, and fortune to the 9th house from its placement.', description_hi: 'गुरु की 9वीं शुभ दृष्टि — धर्म और भाग्य पर।' },

    // Saturn — 3rd, 7th, 10th
    { planet: 'Saturn',  aspect_offset: 3, nature: 'restricting', description_en: 'Saturn casts its 3rd special aspect — restricting, delaying, disciplining influence on courage, siblings, and communication.', description_hi: 'शनि की 3री विशेष दृष्टि — विलंब और अनुशासन।' },
    { planet: 'Saturn',  aspect_offset: 7, nature: 'restricting', description_en: 'Saturn aspects the 7th house from its position. Brings delays, discipline, and karmic lessons to partnerships and marriage.', description_hi: 'शनि की 7वीं दृष्टि — सप्तम भाव पर रुकावट।' },
    { planet: 'Saturn',  aspect_offset: 10, nature: 'restricting',description_en: 'Saturn casts its 10th special aspect — restricting, disciplining influence on career, authority, and public image.', description_hi: 'शनि की 10वीं विशेष दृष्टि — कर्म और अधिकार पर।' },

    // Rahu — 5th, 7th, 9th (karmic/obsessive)
    { planet: 'Rahu',    aspect_offset: 5, nature: 'karmic',      description_en: 'Rahu casts its 5th aspect — obsessive, karmic, illusory influence on children, education, and past life credits.', description_hi: 'राहु की 5वीं दृष्टि — मोह और कर्म फल।' },
    { planet: 'Rahu',    aspect_offset: 7, nature: 'karmic',      description_en: 'Rahu aspects the 7th house — sudden, intense, karmic influence on relationships, foreign connections.', description_hi: 'राहु की 7वीं दृष्टि — अचानक और कर्मजनित प्रभाव।' },
    { planet: 'Rahu',    aspect_offset: 9, nature: 'karmic',      description_en: 'Rahu casts its 9th aspect — karmic lessons, illusions, and sudden results related to dharma, father, and higher knowledge.', description_hi: 'राहु की 9वीं दृष्टि — धर्म और भाग्य पर कर्म प्रभाव।' },

    // Ketu — 5th, 7th, 9th (karmic/spiritual)
    { planet: 'Ketu',    aspect_offset: 5, nature: 'karmic',      description_en: 'Ketu casts its 5th aspect — detachment, spiritual insight, and past life influence on children and intelligence.', description_hi: 'केतु की 5वीं दृष्टि — वैराग्य और आध्यात्मिक प्रभाव।' },
    { planet: 'Ketu',    aspect_offset: 7, nature: 'karmic',      description_en: 'Ketu aspects the 7th house — detachment, spirituality, and karmic intensity in partnerships.', description_hi: 'केतु की 7वीं दृष्टि — सप्तम भाव पर वैराग्य।' },
    { planet: 'Ketu',    aspect_offset: 9, nature: 'karmic',      description_en: 'Ketu casts its 9th aspect — spiritual liberation, past life karma, and detachment from dharmic pursuits.', description_hi: 'केतु की 9वीं दृष्टि — मोक्ष और कर्म।' },
  ]);

  // ── 2. Bhav Karak ───────────────────────────────────────────────────────────
  await knex('bhav_karak').del();
  const bhavRows = [
    // House 1 — Sun
    { house_num: 1,  karaka_planet: 'Sun',     karaka_order: 1, signification_en: 'Self, Soul, Vitality, Personality',          signification_hi: 'आत्मा, स्वास्थ्य, व्यक्तित्व',        notes_en: 'Sun signifies soul, health, vitality, personality in the 1st house.' },

    // House 2 — Jupiter
    { house_num: 2,  karaka_planet: 'Jupiter', karaka_order: 1, signification_en: 'Wealth, Family, Speech, Values',              signification_hi: 'धन, परिवार, वाणी, संस्कार',            notes_en: 'Jupiter signifies wealth, family harmony, food, and values.' },

    // House 3 — Mars (primary), Mercury (secondary)
    { house_num: 3,  karaka_planet: 'Mars',    karaka_order: 1, signification_en: 'Courage, Siblings, Communication, Efforts',   signification_hi: 'साहस, भाई-बहन, संचार, पराक्रम',       notes_en: 'Mars represents courage, siblings, and physical efforts.' },
    { house_num: 3,  karaka_planet: 'Mercury', karaka_order: 2, signification_en: 'Communication, Writing, Short Journeys',      signification_hi: 'संचार, लेखन, छोटी यात्राएँ',           notes_en: 'Mercury represents communication, writing, and mental agility.' },

    // House 4 — Moon (primary), Venus (secondary)
    { house_num: 4,  karaka_planet: 'Moon',    karaka_order: 1, signification_en: 'Mother, Home, Property, Happiness',           signification_hi: 'माता, घर, सुख, सम्पत्ति',             notes_en: 'Moon signifies mother, domestic happiness, vehicles, and land.' },
    { house_num: 4,  karaka_planet: 'Venus',   karaka_order: 2, signification_en: 'Comforts, Vehicles, Luxury, Domestic Harmony',signification_hi: 'सुख-सुविधा, वाहन, घरेलू प्रेम',       notes_en: 'Venus represents comforts, vehicles, and domestic pleasures.' },

    // House 5 — Jupiter
    { house_num: 5,  karaka_planet: 'Jupiter', karaka_order: 1, signification_en: 'Children, Education, Intelligence, Past Punya',signification_hi: 'संतान, शिक्षा, बुद्धि, पूर्वपुण्य', notes_en: 'Jupiter signifies children, learning, wisdom, and mantra.' },

    // House 6 — Mars (primary), Saturn (secondary)
    { house_num: 6,  karaka_planet: 'Mars',    karaka_order: 1, signification_en: 'Enemies, Conflicts, Physical Strength',       signification_hi: 'शत्रु, संघर्ष, बल',                   notes_en: 'Mars represents conflicts, health issues, and physical strength.' },
    { house_num: 6,  karaka_planet: 'Saturn',  karaka_order: 2, signification_en: 'Diseases, Service, Debts, Hard Work',         signification_hi: 'रोग, सेवा, ऋण, कठिन परिश्रम',         notes_en: 'Saturn represents service, debts, and chronic health issues.' },

    // House 7 — Venus
    { house_num: 7,  karaka_planet: 'Venus',   karaka_order: 1, signification_en: 'Marriage, Partnership, Spouse, Relationships',signification_hi: 'विवाह, संबंध, जीवनसाथी',              notes_en: 'Venus signifies spouse, marriage, passion, and unions.' },

    // House 8 — Saturn
    { house_num: 8,  karaka_planet: 'Saturn',  karaka_order: 1, signification_en: 'Longevity, Death, Mysteries, Transformation', signification_hi: 'आयु, मृत्यु, रहस्य, परिवर्तन',        notes_en: 'Saturn signifies longevity, obstacles, transformations, and occult.' },

    // House 9 — Sun (primary), Jupiter (secondary)
    { house_num: 9,  karaka_planet: 'Sun',     karaka_order: 1, signification_en: 'Father, Dharma, Fortune, Authority',          signification_hi: 'पिता, धर्म, भाग्य, अधिकार',           notes_en: 'Sun signifies father, authority, dharmic principles.' },
    { house_num: 9,  karaka_planet: 'Jupiter', karaka_order: 2, signification_en: 'Higher Knowledge, Guru, Religion, Luck',      signification_hi: 'गुरु, धर्म, उच्च ज्ञान, भाग्य',       notes_en: 'Jupiter signifies dharma, guru, higher studies, and luck.' },

    // House 10 — Sun (primary), Saturn (secondary), Mercury (tertiary)
    { house_num: 10, karaka_planet: 'Sun',     karaka_order: 1, signification_en: 'Authority, Government, Leadership',           signification_hi: 'अधिकार, सरकार, नेतृत्व',              notes_en: 'Sun represents authority, government connections, and leadership.' },
    { house_num: 10, karaka_planet: 'Saturn',  karaka_order: 2, signification_en: 'Career, Karma, Hard Work, Profession',        signification_hi: 'करियर, कर्म, मेहनत, पेशा',            notes_en: 'Saturn represents karma, hard work, and career discipline.' },
    { house_num: 10, karaka_planet: 'Mercury', karaka_order: 3, signification_en: 'Business, Trade, Communication in Career',    signification_hi: 'व्यापार, संचार, व्यवसाय',             notes_en: 'Mercury represents business acumen and career communication.' },

    // House 11 — Jupiter
    { house_num: 11, karaka_planet: 'Jupiter', karaka_order: 1, signification_en: 'Gains, Desires, Elder Siblings, Prosperity',  signification_hi: 'लाभ, इच्छाएँ, बड़े भाई, समृद्धि',   notes_en: 'Jupiter signifies profits, expansion, and fulfillment of desires.' },

    // House 12 — Saturn
    { house_num: 12, karaka_planet: 'Saturn',  karaka_order: 1, signification_en: 'Loss, Moksha, Bed Pleasures, Foreign Land',   signification_hi: 'हानि, मोक्ष, विदेश, शय्या सुख',      notes_en: 'Saturn signifies detachment, losses, meditation, and salvation.' },
  ];
  await knex('bhav_karak').insert(bhavRows);

  // ── 3. Digbala Rules ─────────────────────────────────────────────────────────
  await knex('digbala_rules').del();
  await knex('digbala_rules').insert([
    { planet: 'Jupiter',  strong_house: 1,  direction_en: 'East',  direction_hi: 'पूर्व',   description_en: 'Jupiter gains maximum directional strength in the 1st house (Lagna / East). Wisdom, expansion, and blessings are fully expressed.' },
    { planet: 'Mercury',  strong_house: 1,  direction_en: 'East',  direction_hi: 'पूर्व',   description_en: 'Mercury gains maximum directional strength in the 1st house (Lagna / East). Intelligence, communication, and analytical skills peak.' },
    { planet: 'Sun',      strong_house: 10, direction_en: 'South', direction_hi: 'दक्षिण', description_en: 'Sun gains maximum directional strength in the 10th house (South). Authority, career, and personal power are at their highest.' },
    { planet: 'Mars',     strong_house: 10, direction_en: 'South', direction_hi: 'दक्षिण', description_en: 'Mars gains maximum directional strength in the 10th house (South). Courage, ambition, and professional drive are fully expressed.' },
    { planet: 'Saturn',   strong_house: 7,  direction_en: 'West',  direction_hi: 'पश्चिम', description_en: 'Saturn gains maximum directional strength in the 7th house (West). Discipline, endurance, and karmic lessons manifest strongly in partnerships.' },
    { planet: 'Moon',     strong_house: 4,  direction_en: 'North', direction_hi: 'उत्तर',  description_en: 'Moon gains maximum directional strength in the 4th house (North). Emotions, nurturing, and domestic happiness are fully expressed.' },
    { planet: 'Venus',    strong_house: 4,  direction_en: 'North', direction_hi: 'उत्तर',  description_en: 'Venus gains maximum directional strength in the 4th house (North). Comforts, beauty, and domestic pleasures are at their highest.' },
  ]);
};
