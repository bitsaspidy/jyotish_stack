// Seed 005 — 27 Nakshatras (Lunar Mansions)
// Each Nakshatra = 13°20' (800 arcminutes). 27 × 13.333° = 360°
// Lord sequence: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury (repeating)
// planet_id: 1=Sun,2=Moon,3=Mars,4=Mercury,5=Jupiter,6=Venus,7=Saturn,8=Rahu,9=Ketu
// zodiac_sign_id: 1=Aries ... 12=Pisces

const SPAN = 13 + 1 / 3; // 13.3333° each nakshatra

exports.seed = async function (knex) {
  await knex('nakshatras').del();

  const nakshatras = [
    // id, name, name_hi, lord_planet_id, zodiac_sign_id, start_in_sign, end_in_sign, deity, deity_hi, guna, gender, caste, varna, animal, tree, general_nature
    [1,  'Ashwini',          'अश्विनी',        9, 1,  0,     13.333, 'Ashwini Kumaras',  'अश्विनी कुमार',  'rajas',  'male',   'merchant', 'vaishya',   'Horse (Male)',             'Strychnine Tree (Kuchla)',  'Quick, energetic, healing, pioneering, travel'],
    [2,  'Bharani',          'भरणी',           6, 1,  13.333, 26.667, 'Yama',             'यम',              'rajas',  'female', 'outcast',  'vaishya',   'Elephant (Female)',        'Indian Gooseberry (Amla)', 'Restrained, carrying burdens, creative, sacrifice'],
    [3,  'Krittika',         'कृत्तिका',       1, 1,  26.667, 30,    'Agni',             'अग्नि',           'rajas',  'female', 'brahmin',  'brahmin',   'Sheep',                    'Cluster Fig (Udumbara)',    'Sharp, cutting, purifying, war-like, leadership'],
    // Krittika spans Aries 26.667°–30° and Taurus 0°–10°
    [4,  'Rohini',           'रोहिणी',         2, 2,  10,     23.333, 'Brahma/Prajapati', 'ब्रह्मा',         'rajas',  'male',   'brahmin',  'brahmin',   'Cobra (Male)',             'Indian Rosewood (Jamun)',   'Fertile, creative, artistic, sensual, growth'],
    [5,  'Mrigashira',       'मृगशीर्षा',      3, 2,  23.333, 30,    'Soma/Moon',        'सोम',             'tamas',  'neutral','farmer',   'kshatriya', 'Cobra (Female)',           'Khadira/Catechu',           'Searching, gentle, curious, artistic, wandering'],
    [6,  'Ardra',            'आर्द्रा',        8, 3,  6.667, 20,    'Rudra',            'रुद्र',           'tamas',  'female', 'butcher',  'kshatriya', 'Female Dog',               'Long Pepper',               'Stormy, sharp, intense, transformative, tearful'],
    [7,  'Punarvasu',        'पुनर्वसु',       5, 3,  20,     30,    'Aditi',            'अदिति',           'rajas',  'male',   'merchant', 'vaishya',   'Female Cat',              'Bamboo',                    'Return to goodness, optimistic, generous, bright'],
    [8,  'Pushya',           'पुष्य',          7, 4,  3.333, 16.667, 'Brihaspati',       'बृहस्पति',        'tamas',  'male',   'kshatriya','kshatriya', 'Male Ram/Goat',            'Peepal Tree',               'Nourishing, protective, devoted, successful, sattvic'],
    [9,  'Ashlesha',         'आश्लेषा',        4, 4,  16.667, 30,   'Nagas/Serpents',   'नाग',             'sattva', 'female', 'outcast',  'kshatriya', 'Male Cat',                 'Naga Champa',               'Clinging, cunning, secretive, transforming, mystical'],
    [10, 'Magha',            'मघा',            9, 5,  0,     13.333, 'Pitrs (Ancestors)','पितृ',            'tamas',  'female', 'kshatriya','shudra',    'Male Rat',                 'Banyan Tree',               'Royal, ancestral, proud, leadership, authority'],
    [11, 'Purva Phalguni',   'पूर्वा फाल्गुनी',6, 5,  13.333, 26.667,'Bhaga',            'भग',              'tamas',  'female', 'brahmin',  'brahmin',   'Female Rat',               'Palash/Flame Tree',         'Pleasure-seeking, creative, relaxed, sensual, wealth'],
    [12, 'Uttara Phalguni',  'उत्तरा फाल्गुनी',1, 5,  26.667, 30,   'Aryaman',          'अर्यमन',          'tamas',  'female', 'kshatriya','kshatriya', 'Bull (Male)',              'Audumbar/Fig Tree',         'Contract, marital, service-oriented, helpful, stable'],
    [13, 'Hasta',            'हस्त',           2, 6,  10,     23.333, 'Savitar/Sun God',  'सवितार',          'rajas',  'male',   'merchant', 'vaishya',   'Buffalo (Male)',           'Henna/Jasmine',             'Skillful hands, wit, persistence, craftsmanship, healing'],
    [14, 'Chitra',           'चित्रा',         3, 6,  23.333, 30,   'Vishwakarma',      'विश्वकर्मा',       'tamas',  'female', 'farmer',   'kshatriya', 'Female Tiger',             'Bel Tree',                  'Artistic, beautiful, technical, architectural, creative'],
    [15, 'Swati',            'स्वाती',         8, 7,  6.667, 20,    'Vayu',             'वायु',            'tamas',  'female', 'butcher',  'kshatriya', 'Male Buffalo',             'Arjuna Tree',               'Independent, flexible, spiritual, social, diplomatic'],
    [16, 'Vishakha',         'विशाखा',         5, 7,  20,     30,    'Indra and Agni',   'इंद्र और अग्नि',  'sattva', 'female', 'outcast',  'kshatriya', 'Male Tiger',              'Vikanta/Wood Apple',        'Goal-oriented, ambitious, passionate, transforming, victory'],
    [17, 'Anuradha',         'अनुराधा',        7, 8,  3.333, 16.667, 'Mitra',            'मित्र',           'tamas',  'male',   'merchant', 'shudra',    'Female Deer',              'Mesua Ferrea/Nagkesar',      'Devotion, friendship, organizational, occult, social'],
    [18, 'Jyeshtha',         'ज्येष्ठा',       4, 8,  16.667, 30,   'Indra',            'इंद्र',           'rajas',  'female', 'farmer',   'kshatriya', 'Male Deer/Hare',           'Shalmali/Cotton Tree',       'Eldest, protective, responsible, leadership, courage'],
    [19, 'Mula',             'मूल',            9, 9,  0,     13.333, 'Nirriti',          'निर्ऋति',         'tamas',  'neutral','butcher',  'kshatriya', 'Male Dog',                 'Sarala/Sal Tree',            'Investigation, foundation-seeking, transforming, occult, truth'],
    [20, 'Purva Ashadha',    'पूर्वाषाढ़ा',    6, 9,  13.333, 26.667,'Apas/Water God',   'अप',              'rajas',  'female', 'brahmin',  'brahmin',   'Male Monkey',              'Rattan/Shatavari',           'Invincible, proud, philosophical, truth-seeking, social'],
    [21, 'Uttara Ashadha',   'उत्तराषाढ़ा',    1, 9,  26.667, 30,   'Vishwadevas',      'विश्वदेव',        'rajas',  'female', 'kshatriya','kshatriya', 'Male Mongoose',            'Jackfruit Tree',             'Universal victory, final success, stable, righteous, honest'],
    [22, 'Shravana',         'श्रवण',          2, 10, 10,     23.333, 'Vishnu',           'विष्णु',          'rajas',  'male',   'outcast',  'kshatriya', 'Female Monkey',            'Arka/Calotropis',            'Listening, learning, connected, preserving, teaching, compassionate'],
    [23, 'Dhanishtha',       'धनिष्ठा',        3, 10, 23.333, 30,   'Ashtavasus',       'अष्टवसु',         'tamas',  'female', 'farmer',   'kshatriya', 'Female Lion',              'Shami/Prosopis',             'Wealth, music, generous, courageous, multi-talented, hollow'],
    [24, 'Shatabhisha',      'शतभिषा',         8, 11, 6.667, 20,    'Varuna',           'वरुण',            'tamas',  'neutral','butcher',  'kshatriya', 'Female Horse',             'Kadamba Tree',               'Healing (100 physicians), mystical, secretive, independent, research'],
    [25, 'Purva Bhadrapada', 'पूर्वा भाद्रपद',  5, 11, 20,     30,    'Aja Ekapad',       'अज एकपाद',        'rajas',  'male',   'brahmin',  'brahmin',   'Male Lion',               'Mango Tree',                 'Two-faced, spiritual, passionate, eccentric, transforming, wealth'],
    [26, 'Uttara Bhadrapada','उत्तरा भाद्रपद',  7, 12, 3.333, 16.667,'Ahir Budhnya',     'अहिर्बुध्न्य',    'tamas',  'male',   'kshatriya','brahmin',   'Female Cow',               'Neem Tree',                  'Depth, wisdom, serpentine, compassionate, renunciation, stability'],
    [27, 'Revati',           'रेवती',          4, 12, 16.667, 30,   'Pushan',           'पूषन',            'sattva', 'female', 'merchant', 'shudra',    'Female Elephant',          'Madhuka/Mahua Tree',         'Nourishing, caring, spiritual, completion, gentle, abundance'],
  ];

  // Build absolute degrees
  const rows = nakshatras.map(([id, name, name_hi, lord, sign, start_sign, end_sign, deity, deity_hi, guna, gender, caste, varna, animal, tree, nature], i) => {
    const absStart = (id - 1) * SPAN;
    const absEnd   = id * SPAN;
    return {
      id, name, name_hi, lord_planet_id: lord, zodiac_sign_id: sign,
      start_degree_in_sign: parseFloat(start_sign.toFixed(4)),
      end_degree_in_sign: parseFloat(Math.min(end_sign, 30).toFixed(4)),
      absolute_start_degree: parseFloat(absStart.toFixed(4)),
      absolute_end_degree: parseFloat(absEnd.toFixed(4)),
      deity, deity_hi, guna, gender, caste, varna,
      animal_symbol: animal, tree, general_nature: nature,
      vimshottari_years: [9, 7, 6, 10, 7, 20, 16, 19, 17][lord - 1],
    };
  });

  await knex('nakshatras').insert(rows);
};
