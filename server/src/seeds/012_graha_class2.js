'use strict';
// Source: AstroAnsh Class 2 Premium Notes — A Comprehensive Bilingual Study Guide on the Nine Grahas
// Applies corrections to existing planet rows and fills new columns from migration 015

exports.seed = async function (knex) {

  // ─────────────────────────────────────────────────────────────────────────────
  // SUN — SURYA (सूर्य)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Sun').update({
    color: 'Golden/Saffron',            // PDF p.12: "Golden / Saffron / स्वर्णिम / केसरिया"  (was: Copper/Red-Orange)
    season: 'Summer (Grishma / ग्रीष्म)',
    season_hi: 'ग्रीष्म (गर्मी)',
    health_conditions_en: JSON.stringify([
      { area: 'Heart (Hridaya)',        conditions: 'Heart disease, arrhythmia' },
      { area: 'Bones (Haddi)',          conditions: 'Osteoporosis, fractures' },
      { area: 'Right Eye',             conditions: 'Vision problems, cataracts' },
      { area: 'Vitality',              conditions: 'Chronic fatigue, low immunity' },
      { area: 'Bile / Gall Bladder',   conditions: 'Gallstones, jaundice' },
      { area: 'Stomach',               conditions: 'Digestive fire disorders' },
      { area: 'Scalp / Hair',          conditions: 'Baldness, scalp diseases' },
      { area: 'Fevers',                conditions: 'High fever, heat strokes' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'हृदय',        conditions: 'हृदय रोग, अतालता' },
      { area: 'हड्डियाँ',   conditions: 'ऑस्टियोपोरोसिस, फ्रैक्चर' },
      { area: 'दाहिनी आँख', conditions: 'दृष्टि समस्याएँ, मोतियाबिंद' },
      { area: 'जीवन शक्ति', conditions: 'दीर्घकालिक थकान, कम रोग प्रतिरोधक क्षमता' },
      { area: 'पित्त / पित्ताशय', conditions: 'पथरी, पीलिया' },
      { area: 'पेट / उदर',  conditions: 'पाचन अग्नि विकार' },
      { area: 'खोपड़ी / बाल', conditions: 'गंजापन, खोपड़ी रोग' },
      { area: 'बुखार',       conditions: 'तेज बुखार, लू लगना' },
    ]),
    professions_en: JSON.stringify([
      'Government servants', 'Politicians & ministers',
      'Doctors (esp. Cardiologists & Eye Specialists)',
      'Administrators & IAS/IPS officers', 'Military officers',
    ]),
    professions_hi: JSON.stringify([
      'सरकारी सेवक', 'राजनेता और मंत्री',
      'डॉक्टर (हृदय और नेत्र विशेषज्ञ)',
      'प्रशासक और IAS/IPS अधिकारी', 'सैन्य अधिकारी',
    ]),
    key_relations_en: JSON.stringify([
      'Father (Pita) — primary karaka', 'Authority figures', 'Senior officials', 'Paternal relatives',
    ]),
    key_relations_hi: JSON.stringify([
      'पिता — प्राथमिक कारक', 'अधिकारी', 'वरिष्ठ अधिकारी', 'पितृ कुल',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Heat and Fire — source of all heat on Earth',
      'Stones and Mountains — hard, enduring structures',
      'Leadership roles — CEO, administrator, decision-maker',
      'Medical professions — healing and diagnosis',
      'Gold — most precious metal, associated with solar energy',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'गर्मी और आग — पृथ्वी पर सभी गर्मी का स्रोत',
      'पत्थर और पर्वत — कठोर, स्थायी संरचनाएँ',
      'नेतृत्व भूमिकाएँ — CEO, प्रशासक',
      'चिकित्सा व्यवसाय — उपचार और निदान',
      'सोना — सबसे मूल्यवान धातु, सौर ऊर्जा से जुड़ा',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MOON — CHANDRA (चन्द्रमा)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Moon').update({
    season: 'Rainy (Varsha / वर्षा)',
    season_hi: 'वर्षा (मानसून)',
    health_conditions_en: JSON.stringify([
      { area: 'Mental Health',    conditions: 'Depression, anxiety, bipolar disorder, mood swings' },
      { area: 'Sleep',            conditions: 'Insomnia, sleepwalking, disturbed sleep cycles' },
      { area: 'Respiratory',      conditions: 'Breathing difficulties, asthma, bronchitis' },
      { area: 'Left Eye',         conditions: 'Left eye problems, vision impairment' },
      { area: 'Acidity',          conditions: 'Hyperacidity, GERD, gastric issues' },
      { area: 'Ulcer',            conditions: 'Stomach, intestinal ulcers' },
      { area: 'Colitis',          conditions: 'Inflammatory bowel conditions' },
      { area: 'Epilepsy',         conditions: 'Neurological disorders, seizures' },
      { area: 'Menstrual Issues', conditions: 'Irregular cycles, hormonal imbalance' },
      { area: 'Water Phobia',     conditions: 'Fear of water bodies, drowning anxiety' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'मानसिक स्वास्थ्य', conditions: 'अवसाद, चिंता, द्विध्रुवी विकार, मूड स्विंग' },
      { area: 'नींद',             conditions: 'अनिद्रा, नींद में चलना, नींद चक्र विकार' },
      { area: 'श्वसन',            conditions: 'श्वास कठिनाइयाँ, दमा, ब्रोंकाइटिस' },
      { area: 'बाईं आँख',         conditions: 'बाईं आँख की समस्याएँ' },
      { area: 'अम्लता',           conditions: 'हाइपरएसिडिटी, GERD' },
      { area: 'अल्सर',            conditions: 'पेट, आँत के अल्सर' },
      { area: 'कोलाइटिस',         conditions: 'सूजन आँत संबंधी स्थितियाँ' },
      { area: 'मिर्गी',           conditions: 'तंत्रिका संबंधी विकार, दौरे' },
      { area: 'मासिक समस्याएँ',   conditions: 'अनियमित चक्र, हार्मोनल असंतुलन' },
      { area: 'जल भय',            conditions: 'जल से भय, डूबने की चिंता' },
    ]),
    professions_en: JSON.stringify([
      'Jewelry designer', 'Hospitality (hotels, restaurants)',
      'Dairy industry (milkmen, dairy farmers)',
      'Nurses, midwives, caregivers',
      'Psychology, counseling',
      'Sailors, fishermen, navy',
      'Travel & Tourism',
    ]),
    professions_hi: JSON.stringify([
      'आभूषण डिजाइनर', 'आतिथ्य सेवा (होटल, रेस्तराँ)',
      'डेयरी उद्योग (दूधवाला, किसान)',
      'नर्सें, दाइयाँ, देखभालकर्ता',
      'मनोविज्ञान, परामर्श',
      'नाविक, मछुआरे, नौसेना',
      'यात्रा और पर्यटन',
    ]),
    key_relations_en: JSON.stringify([
      'Mother (Mata) — primary karaka', 'Maternal figures, caregivers',
      'Women in general', 'Public / the masses',
    ]),
    key_relations_hi: JSON.stringify([
      'माता — प्राथमिक कारक', 'मातृस्वरूप, देखभालकर्ता',
      'महिलाएँ सामान्य', 'जनता / जनसमूह',
    ]),
    physical_manifestations_en: JSON.stringify([
      'All water animals (fish, dolphins, whales)',
      'Reptiles — turtles, crocodiles',
      'Liquids — water, milk, juices, all flowing substances',
      'Fruits — especially juicy, water-rich fruits',
      'Pilgrimages — sacred journeys to holy water bodies',
      'Fine clothes — soft, silky, flowing fabrics',
      'Silver and Pearls — metals/gems of the Moon',
      'All water bodies — oceans, rivers, lakes, ponds, wells',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'सभी जलचर — मछली, डॉल्फिन, व्हेल',
      'सरीसृप — कछुए, मगरमच्छ',
      'तरल पदार्थ — पानी, दूध, रस, प्रवाहमान पदार्थ',
      'फल — रसदार, पानी से भरपूर फल',
      'तीर्थयात्राएँ — पवित्र जल निकायों की यात्राएँ',
      'सुंदर वस्त्र — कोमल, रेशमी कपड़े',
      'चाँदी और मोती',
      'सभी जल स्रोत — महासागर, नदियाँ, झीलें, तालाब, कुएँ',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MARS — MANGAL (मंगल)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Mars').update({
    season: 'Summer (Grishma / ग्रीष्म)',
    season_hi: 'ग्रीष्म (तीव्र गर्मी)',
    health_conditions_en: JSON.stringify([
      { area: 'Haemoglobin',        conditions: 'Anemia, blood disorders' },
      { area: 'Muscle Tear',        conditions: 'Muscle tears, muscular diseases' },
      { area: 'Menstrual Cycle',    conditions: 'Irregular periods, heavy bleeding' },
      { area: 'Accidents & Injuries', conditions: 'Sudden injuries, fractures' },
      { area: 'Burns',              conditions: 'Fire injuries, chemical burns' },
      { area: 'Surgical Operations', conditions: 'Need for surgery' },
      { area: 'Blood Disorders',    conditions: 'Leukemia, hemophilia' },
      { area: 'Cuts and Wounds',    conditions: 'Sharp instrument injuries' },
      { area: 'Physical Fitness',   conditions: 'Overall vitality and stamina' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'हीमोग्लोबिन',    conditions: 'रक्ताल्पता, रक्त विकार' },
      { area: 'मांसपेशी टूटना', conditions: 'मांसपेशी टूटना, मांसपेशी रोग' },
      { area: 'मासिक चक्र',    conditions: 'अनियमित माहवारी, अधिक रक्तस्राव' },
      { area: 'दुर्घटनाएँ और चोटें', conditions: 'अचानक चोटें, फ्रैक्चर' },
      { area: 'जलन',            conditions: 'अग्नि चोटें, रासायनिक जलन' },
      { area: 'शल्य चिकित्सा',  conditions: 'शल्य चिकित्सा की आवश्यकता' },
      { area: 'रक्त विकार',     conditions: 'ल्यूकेमिया, हीमोफिलिया' },
      { area: 'कट और घाव',     conditions: 'तेज उपकरण की चोटें' },
      { area: 'शारीरिक फिटनेस', conditions: 'समग्र जीवन शक्ति और सहनशक्ति' },
    ]),
    professions_en: JSON.stringify([
      'Police officers', 'Military (Army, Navy, Air Force)',
      'Engineering (civil, mechanical)', 'Surgery and medicine',
      'Athletes and sportspeople', 'Fire department',
      'Real estate agents', 'Chefs, butchers',
    ]),
    professions_hi: JSON.stringify([
      'पुलिस अधिकारी', 'सैन्य बल (थल, जल, वायु सेना)',
      'इंजीनियरिंग (सिविल, मैकेनिकल)', 'शल्य चिकित्सा और चिकित्सा',
      'खिलाड़ी', 'अग्निशमन विभाग',
      'रियल एस्टेट एजेंट', 'रसोइया, कसाई',
    ]),
    key_relations_en: JSON.stringify([
      'Younger sister (Choti Behan)', 'Younger brother (Chota Bhai)',
      'Brother-in-law (Sala)', 'Sister-in-law (Sali)', 'Co-warriors, comrades',
    ]),
    key_relations_hi: JSON.stringify([
      'छोटी बहन', 'छोटा भाई',
      'साला', 'साली', 'सहयोद्धा, साथी',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Red colour — colour of blood, fire, and passion',
      'Sword, axe, knife — all sharp cutting instruments',
      'Controlling wild animals — lions, tigers, aggressive creatures',
      'Non-vegetarian food — meat, especially red meat',
      'Fire and Heat — Mars rules fire in all its forms',
      'Built-up houses, properties, real estate, soil and land',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'लाल रंग — रक्त, अग्नि और जुनून का रंग',
      'तलवार, कुल्हाड़ी, चाकू — तीखे उपकरण',
      'जंगली जानवरों को नियंत्रित करना — शेर, बाघ',
      'मांसाहारी भोजन — मांस, विशेष रूप से लाल मांस',
      'अग्नि और गर्मी — मंगल सभी रूपों में अग्नि पर शासन करता है',
      'निर्मित मकान, संपत्तियाँ, रियल एस्टेट, मिट्टी और भूमि',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MERCURY — BUDHA (बुध)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Mercury').update({
    metal: 'Bronze/Kansa',             // PDF p.21: "Bronze / Kansa (कांसा — copper + tin alloy)"  (was: Brass/Bronze)
    season: 'Autumn (Sharad / शरद)',
    season_hi: 'शरद (स्वच्छ आकाश, ताजी हवा)',
    health_conditions_en: JSON.stringify([
      { area: 'Skin (Tvacha)',        conditions: 'Eczema, psoriasis, skin allergies, rashes' },
      { area: 'Navel (Nabhi)',        conditions: 'Digestive center, navel displacement' },
      { area: 'Sexual organs',        conditions: 'STI, sexual health issues' },
      { area: 'Neck & Throat',        conditions: 'Thyroid, tonsils, throat infections' },
      { area: 'Nose (Nak)',           conditions: 'Sinus problems, nasal polyps' },
      { area: 'Lungs (Fefde)',        conditions: 'Respiratory issues, vocal chord problems' },
      { area: 'Nervous System',       conditions: 'Nervous breakdown, anxiety attacks' },
      { area: 'Speech (Bhashan)',     conditions: 'Stammering, speech disorders, lisp' },
      { area: 'Vertigo (Chakkar)',    conditions: 'Dizziness, balance disorders' },
      { area: 'Impotence',           conditions: 'Sexual dysfunction in males' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'त्वचा',         conditions: 'एक्जिमा, सोरायसिस, त्वचा एलर्जी, रैशेज' },
      { area: 'नाभि',          conditions: 'पाचन केंद्र, नाभि स्थानांतरण' },
      { area: 'यौन अंग',       conditions: 'यौन संचारित संक्रमण' },
      { area: 'गर्दन और गला',  conditions: 'थायरॉइड, टॉन्सिल, गले में संक्रमण' },
      { area: 'नाक',           conditions: 'साइनस समस्याएँ, नेजल पॉलिप' },
      { area: 'फेफड़े',         conditions: 'श्वसन समस्याएँ, स्वर रज्जु की समस्याएँ' },
      { area: 'तंत्रिका तंत्र', conditions: 'तंत्रिका टूटना, चिंता दौरे' },
      { area: 'वाणी (भाषण)',   conditions: 'हकलाना, भाषण विकार' },
      { area: 'चक्कर',         conditions: 'चक्कर, संतुलन विकार' },
      { area: 'नपुंसकता',      conditions: 'पुरुषों में यौन रोग' },
    ]),
    professions_en: JSON.stringify([
      'Journalist / writer', 'Editor / editor-in-chief',
      'Business and commerce', 'Accountant / financial analyst',
      'Teacher / tutor', 'Lawyer (document drafting)',
      'Translator / interpreter', 'IT professional / software developer',
      'Mathematician / statistician',
    ]),
    professions_hi: JSON.stringify([
      'पत्रकार / लेखक', 'संपादक',
      'व्यापार और वाणिज्य', 'लेखाकार / वित्त विश्लेषक',
      'शिक्षक / ट्यूटर', 'वकील (दस्तावेज़ लेखन)',
      'अनुवादक / दुभाषिया', 'IT पेशेवर / सॉफ्टवेयर डेवलपर',
      'गणितज्ञ / सांख्यिकीविद',
    ]),
    key_relations_en: JSON.stringify([
      'Maternal uncle (Mama)', 'Maternal aunt (Mami)',
      'All maternal relatives', 'Cousins on mother\'s side',
    ]),
    key_relations_hi: JSON.stringify([
      'मामा (मातृ पक्ष का चाचा)', 'मामी',
      'सभी मातृ पक्ष के रिश्तेदार', 'ममेरे भाई-बहन',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Green colour — colour of Mercury in Jyotish',
      'Skill in Mantras — knowledge of sacred sounds',
      'Yantras — geometric sacred diagrams',
      'Tantric pursuits — esoteric practices',
      'Skin moisture — Mercury rules the moisture and health of skin',
      'Birds — especially parrots (can imitate speech)',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'हरा रंग — ज्योतिष में बुध का रंग',
      'मंत्रों में कौशल — पवित्र ध्वनियों का ज्ञान',
      'यंत्र — पूजा में प्रयुक्त ज्यामितीय आरेख',
      'तांत्रिक साधनाएँ',
      'त्वचा की नमी — बुध त्वचा स्वास्थ्य पर शासन करता है',
      'पक्षी — विशेष रूप से तोते (भाषण की नकल)',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // JUPITER — BRIHASPATI (बृहस्पति)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Jupiter').update({
    season: 'Early Winter (Hemanta / हेमंत)',
    season_hi: 'हेमंत (सुखद, फसल का समय)',
    health_conditions_en: JSON.stringify([
      { area: 'Thyroid Gland',        conditions: 'Hypothyroidism, hyperthyroidism, goiter' },
      { area: 'Hormonal Imbalance',   conditions: 'Endocrine disorders, growth hormone issues' },
      { area: 'Liver (Yakrit)',       conditions: 'Hepatitis, liver cirrhosis, fatty liver' },
      { area: 'Gall Bladder',         conditions: 'Gallstones, cholecystitis' },
      { area: 'Obesity (Motapa)',      conditions: 'Weight gain, metabolic syndrome' },
      { area: 'Diabetes (Madhumeh)',   conditions: 'Type 2 diabetes, blood sugar regulation' },
      { area: 'Pancreas',             conditions: 'Pancreatitis, digestive enzyme issues' },
      { area: 'Digestive System',     conditions: 'IBS, malabsorption, bloating' },
      { area: 'Knee (Ghutna)',        conditions: 'Knee pain, arthritis' },
      { area: 'Ear Troubles',         conditions: 'Hearing loss, tinnitus' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'थायरॉइड',      conditions: 'हाइपोथायरॉइडिज्म, हाइपरथायरॉइडिज्म, घेंघा' },
      { area: 'हार्मोनल असंतुलन', conditions: 'अंतःस्रावी विकार, वृद्धि हार्मोन समस्याएँ' },
      { area: 'यकृत',          conditions: 'हेपेटाइटिस, लिवर सिरोसिस, फैटी लिवर' },
      { area: 'पित्ताशय',      conditions: 'पित्त की पथरी, कोलेसिस्टाइटिस' },
      { area: 'मोटापा',        conditions: 'वजन बढ़ना, मेटाबॉलिक सिंड्रोम' },
      { area: 'मधुमेह',        conditions: 'टाइप 2 मधुमेह, रक्त शर्करा नियमन' },
      { area: 'अग्न्याशय',     conditions: 'अग्नाशयशोथ, पाचन एंजाइम समस्याएँ' },
      { area: 'पाचन तंत्र',    conditions: 'IBS, कुअवशोषण, पेट फूलना' },
      { area: 'घुटना',         conditions: 'घुटने का दर्द, गठिया' },
      { area: 'कान',           conditions: 'श्रवण हानि, टिनिटस' },
    ]),
    professions_en: JSON.stringify([
      'Teacher / Professor', 'Astrologer',
      'Lawyer / Judge', 'Finance professional',
      'Head of educational institutions',
      'CEO / senior strategist', 'Philosopher / author',
      'Priest / clergy',
    ]),
    professions_hi: JSON.stringify([
      'शिक्षक / प्रोफेसर', 'ज्योतिषी',
      'वकील / न्यायाधीश', 'वित्त पेशेवर',
      'शैक्षणिक संस्थान प्रमुख',
      'CEO / वरिष्ठ रणनीतिकार', 'दार्शनिक / लेखक',
      'पुजारी / धर्माचार्य',
    ]),
    key_relations_en: JSON.stringify([
      'Husband (for female chart) — primary karaka',
      'Children (Santan)', 'Guru / Teacher',
      'Wise elders', 'Religious advisors',
    ]),
    key_relations_hi: JSON.stringify([
      'पति (महिला कुंडली में) — प्राथमिक कारक',
      'संतान', 'गुरु / शिक्षक',
      'बुद्धिमान बुजुर्ग', 'धार्मिक सलाहकार',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Wealth and Treasure — Jupiter is the planet of abundance',
      'Yellow colour — golden yellow, colour of knowledge and prosperity',
      'Honey — sweetness, healing properties, abundance',
      'Turmeric (Haldi) — purification, sacred in Hindu rituals',
      'Herbivorous animals — cows, buffaloes, elephants (sacred)',
      'Sacred deeds, charities, and philanthropic activities',
      'Fat in the body — Jupiter governs adipose tissue',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'संपत्ति और खज़ाना — बृहस्पति प्रचुरता का ग्रह है',
      'पीला रंग — सुनहरा पीला, ज्ञान और समृद्धि का रंग',
      'शहद — मिठास, उपचार गुण, प्रचुरता',
      'हल्दी — शुद्धि, हिंदू अनुष्ठानों में पवित्र',
      'शाकाहारी जानवर — गाय, भैंस, हाथी (पवित्र)',
      'पवित्र कार्य, दान और परोपकारी गतिविधियाँ',
      'शरीर में वसा — बृहस्पति वसा ऊतक पर शासन करता है',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // VENUS — SHUKRA (शुक्र)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Venus').update({
    metal: 'Silver',                   // PDF p.28: "Silver (Chandi)"  (was: Silver/Platinum)
    season: 'Spring (Vasanta / वसंत)',
    season_hi: 'वसंत (सबसे सुंदर मौसम)',
    health_conditions_en: JSON.stringify([
      { area: 'Sexual diseases (STDs)', conditions: 'HIV, gonorrhea, syphilis, herpes' },
      { area: 'Urinary system',         conditions: 'UTI, kidney stones, urethritis' },
      { area: 'Intestinal issues',      conditions: 'Constipation, IBS, intestinal infections' },
      { area: 'Kidney problems',        conditions: 'Nephritis, renal failure' },
      { area: 'Diabetes (Madhumeh)',    conditions: 'Blood sugar regulation issues' },
      { area: 'Typhoid',               conditions: 'Systemic bacterial infection' },
      { area: 'Appendicitis',          conditions: 'Inflammation of the appendix' },
      { area: 'Exhaustion (Thakavat)', conditions: 'Chronic fatigue, adrenal exhaustion' },
      { area: 'Hormones (Male)',        conditions: 'Testosterone imbalance' },
      { area: 'Hormones (Female)',      conditions: 'Oestrogen, progesterone imbalance' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'यौन रोग (STDs)',  conditions: 'HIV, गोनोरिया, सिफलिस, हर्पीस' },
      { area: 'मूत्र तंत्र',    conditions: 'UTI, गुर्दे की पथरी, यूरेथ्राइटिस' },
      { area: 'आँतों की समस्याएँ', conditions: 'कब्ज, IBS, आँतों में संक्रमण' },
      { area: 'गुर्दे की समस्याएँ', conditions: 'नेफ्राइटिस, गुर्दे की विफलता' },
      { area: 'मधुमेह',          conditions: 'रक्त शर्करा नियमन समस्याएँ' },
      { area: 'टाइफॉइड',        conditions: 'प्रणालीगत जीवाणु संक्रमण' },
      { area: 'अपेंडिसाइटिस',   conditions: 'अपेंडिक्स की सूजन' },
      { area: 'थकान (थकावट)',    conditions: 'दीर्घकालिक थकान, अधिवृक्क थकावट' },
      { area: 'हार्मोन (पुरुष)', conditions: 'टेस्टोस्टेरोन असंतुलन' },
      { area: 'हार्मोन (महिला)', conditions: 'एस्ट्रोजन, प्रोजेस्टेरोन असंतुलन' },
    ]),
    professions_en: JSON.stringify([
      'Singer / musician', 'Actor / entertainer',
      'Fashion designer', 'Beautician / cosmetologist',
      'Luxury brand professional', 'Jewelry designer',
      'Poet / artist / painter', 'Interior decorator',
      'Automobile industry',
    ]),
    professions_hi: JSON.stringify([
      'गायक / संगीतकार', 'अभिनेता / मनोरंजनकर्ता',
      'फैशन डिज़ाइनर', 'सौंदर्य विशेषज्ञ',
      'विलासिता ब्रांड पेशेवर', 'आभूषण डिजाइनर',
      'कवि / कलाकार / चित्रकार', 'इंटीरियर डेकोरेटर',
      'ऑटोमोबाइल उद्योग',
    ]),
    key_relations_en: JSON.stringify([
      'Wife (Patni) — primary karaka',
      'Female companions', 'Romantic partners',
      'Business partners (legal)', 'Creative collaborators',
    ]),
    key_relations_hi: JSON.stringify([
      'पत्नी — प्राथमिक कारक',
      'महिला साथी', 'प्रेमी/प्रेमिका',
      'व्यावसायिक साझेदार', 'रचनात्मक सहयोगी',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Cars and luxury vehicles — Venus governs all vehicles',
      'Cosmetics, makeup, and beauty products',
      'Perfumes and fragrances of all kinds',
      'Fine clothes, fashion, designer wear',
      'Ornaments and jewelry — especially diamonds',
      'Artistic talents — music, dance, painting, sculpture',
      'Diamonds and pearls — precious stones of Venus',
      'Physical comforts — all luxuries that please the senses',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'कारें और लग्जरी वाहन — शुक्र सभी वाहनों पर शासन करता है',
      'सौंदर्य प्रसाधन, मेकअप और ब्यूटी उत्पाद',
      'सभी प्रकार के इत्र और सुगंध',
      'सुंदर वस्त्र, फैशन, डिजाइनर परिधान',
      'आभूषण और ज़ेवर — विशेष रूप से हीरे',
      'कलात्मक प्रतिभाएँ — संगीत, नृत्य, चित्रकला, मूर्तिकला',
      'हीरे और मोती — शुक्र के कीमती रत्न',
      'शारीरिक सुख-सुविधाएँ — इंद्रियों को प्रसन्न करने वाली विलासिताएँ',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SATURN — SHANI (शनि)
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Saturn').update({
    metal: 'Iron/Lead',                // PDF p.32: Iron (primary) + Lead (secondary)  (was: Iron only)
    season: 'Late Winter (Shishira / शिशिर)',
    season_hi: 'शिशिर (सबसे ठंडा, सबसे चुनौतीपूर्ण)',
    health_conditions_en: JSON.stringify([
      { area: 'Chronic Diseases',    conditions: 'Long-lasting, difficult to cure conditions' },
      { area: 'Incurable Diseases',  conditions: 'Degenerative conditions, autoimmune disorders' },
      { area: 'Legs & Feet',         conditions: 'Lameness, foot disorders, varicose veins' },
      { area: 'Skin (Tvacha)',       conditions: 'Dry skin, eczema, skin diseases' },
      { area: 'Hair',                conditions: 'Alopecia, premature graying, baldness' },
      { area: 'Mutilated Limbs',     conditions: 'Birth defects, deformities' },
      { area: 'Amputation',          conditions: 'Need for limb removal' },
      { area: 'Depression (Avasad)', conditions: 'Clinical depression, melancholy' },
      { area: 'Insanity',            conditions: 'Severe mental illness, psychosis' },
      { area: 'Exhaustion & Fatigue', conditions: 'CFS (Chronic Fatigue Syndrome)' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'दीर्घकालिक रोग',   conditions: 'कठिन-उपचार, लंबे समय तक चलने वाली स्थितियाँ' },
      { area: 'असाध्य रोग',       conditions: 'अपक्षयी स्थितियाँ, स्वप्रतिरक्षी विकार' },
      { area: 'पैर और पाँव',      conditions: 'लंगड़ापन, पैर विकार, वैरिकोज वेन्स' },
      { area: 'त्वचा',            conditions: 'शुष्क त्वचा, एक्जिमा, त्वचा रोग' },
      { area: 'बाल',              conditions: 'खालित्य, समय से पहले सफेद बाल, गंजापन' },
      { area: 'विकृत अंग',        conditions: 'जन्म दोष, विकृतियाँ' },
      { area: 'अंग विच्छेदन',     conditions: 'अंग हटाने की आवश्यकता' },
      { area: 'अवसाद',            conditions: 'नैदानिक अवसाद, उदासी' },
      { area: 'पागलपन',           conditions: 'गंभीर मानसिक बीमारी, मनोविकृति' },
      { area: 'थकान',             conditions: 'CFS (दीर्घकालिक थकान सिंड्रोम)' },
    ]),
    professions_en: JSON.stringify([
      'Factory workers', 'Farmers, agricultural laborers',
      'Miners', 'Heavy industry workers',
      'Real estate (land, property)',
      'Sanitation workers', 'Jailers, disciplinary officers',
      'Oil industry professionals', 'Gerontologists (elderly care)',
    ]),
    professions_hi: JSON.stringify([
      'कारखाना मजदूर', 'किसान, कृषि मजदूर',
      'खनन श्रमिक', 'भारी उद्योग कर्मी',
      'रियल एस्टेट (भूमि, संपत्ति)',
      'स्वच्छता कर्मी', 'जेलर, अनुशासन अधिकारी',
      'तेल उद्योग पेशेवर', 'वृद्ध देखभाल विशेषज्ञ',
    ]),
    key_relations_en: JSON.stringify([
      'Older people (Vriddha jan)', 'Bosses, supervisors',
      'Servants, employees', 'The poor and downtrodden',
      'Paternal uncle (Chacha/Tau)', 'Step-relatives',
    ]),
    key_relations_hi: JSON.stringify([
      'वृद्धजन', 'बॉस, पर्यवेक्षक',
      'नौकर, कर्मचारी', 'गरीब और पीड़ित',
      'चाचा / ताऊ', 'सौतेले रिश्तेदार',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Income earned through hard work and service',
      'The servant class, laborers, working class',
      'Oil — engine oil, petroleum, sesame oil',
      'Wood — timber, furniture, structural wood',
      'Black grains — urad (black lentils), sesame, mustard',
      'Ashes — remnants of fire, transformation',
      'Agriculture and farming — patient, season-long labor',
      'Construction — structures that last for generations',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'कठिन परिश्रम और सेवा से अर्जित आय',
      'नौकर वर्ग, मजदूर, कामकाजी वर्ग',
      'तेल — इंजन तेल, पेट्रोलियम, तिल का तेल',
      'लकड़ी — इमारती लकड़ी, फर्नीचर',
      'काले अनाज — उड़द, तिल, सरसों',
      'राख — अग्नि के अवशेष, परिवर्तन का प्रतीक',
      'कृषि और खेती — धैर्यपूर्ण, मौसम भर का श्रम',
      'निर्माण — पीढ़ियों तक चलने वाली संरचनाएँ',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // RAHU (राहु) — CORRECTIONS + NEW DATA
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Rahu').update({
    direction: 'North-West',           // PDF p.5: "North-West / उत्तर-पश्चिम"  (was: South-West — WRONG)
    color: 'Blue-Black',               // PDF p.5: "Blue-Black / नीला-काला"  (was: Smoky/Black)
    weekday: 'Saturday',               // PDF p.5 + p.33 summary table  (was: null)
    season: 'N/A — shadow planet',
    season_hi: 'लागू नहीं — छाया ग्रह',
    health_conditions_en: JSON.stringify([
      { area: 'Hiccups',              conditions: 'Sudden, uncontrollable diaphragm spasms' },
      { area: 'Phobias',             conditions: 'Irrational fears, anxiety disorders' },
      { area: 'Weeping/oozing wounds', conditions: 'Injuries producing excessive fluid during healing' },
      { area: 'Poisoning',           conditions: 'Accidental or deliberate, including food poisoning' },
      { area: 'Snake bites',         conditions: 'Snake bites and other venomous bites' },
      { area: 'Malignant tumors',    conditions: 'Aggressive cancers' },
      { area: 'Breathing disorders', conditions: 'Asthma, hyperventilation' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'हिचकी',          conditions: 'अचानक, अनियंत्रित डायाफ्राम की ऐंठन' },
      { area: 'फोबिया',         conditions: 'अतार्किक भय, चिंता विकार' },
      { area: 'बहते घाव',       conditions: 'उपचार के दौरान अत्यधिक तरल उत्पन्न करने वाली चोटें' },
      { area: 'विषाक्तता',      conditions: 'आकस्मिक या जानबूझकर, खाद्य विषाक्तता सहित' },
      { area: 'साँप का काटना',  conditions: 'साँप के काटने और अन्य जहरीले काटने' },
      { area: 'घातक ट्यूमर',   conditions: 'आक्रामक कैंसर' },
      { area: 'श्वास विकार',    conditions: 'दमा, हाइपरवेंटिलेशन' },
    ]),
    professions_en: JSON.stringify([
      'Politics & Diplomacy (power games, mass influence)',
      'Research & Investigation (uncovering hidden truths)',
      'Foreign Trade / International Relations',
      'Technology & AI (new frontiers, innovation)',
      'Unconventional fields (astrology, occult, alternative medicine)',
      'Film & Media (illusion, mass communication)',
    ]),
    professions_hi: JSON.stringify([
      'राजनीति और कूटनीति (सत्ता का खेल, जनसमूह पर प्रभाव)',
      'अनुसंधान और जाँच (छिपे सत्य को उजागर करना)',
      'विदेश व्यापार / अंतर्राष्ट्रीय संबंध',
      'प्रौद्योगिकी और AI (नए क्षितिज, नवाचार)',
      'अपरंपरागत क्षेत्र (ज्योतिष, गूढ़ विद्या, वैकल्पिक चिकित्सा)',
      'फिल्म और मीडिया (भ्रम, जनसंचार)',
    ]),
    key_relations_en: JSON.stringify([
      'Shadow planet — no physical body',
      'Governs masses, foreigners, and technology users',
      'Paternal grandfather (some traditions)',
    ]),
    key_relations_hi: JSON.stringify([
      'छाया ग्रह — कोई भौतिक शरीर नहीं',
      'जनसमूह, विदेशी, और प्रौद्योगिकी उपयोगकर्ताओं पर शासन',
      'पितृ पक्ष के दादा (कुछ परंपराओं में)',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Air, Space, and the act of Breathing',
      'Mountains — high altitudes and remote places',
      'Gambling and risk-taking in all forms',
      'Blue cloth, dark-colored flowers',
      'Dense forests, wildernesses, unexplored territories',
      'Sudden disasters — natural or man-made',
      'Technical education — engineering, computers, sciences',
      'Internet, social media, digital technology',
      'Taboos — things considered forbidden or controversial',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'वायु, आकाश और श्वास लेने की क्रिया',
      'पहाड़ — ऊँचाई और दूरस्थ स्थानों की यात्रा',
      'जुआ और सभी प्रकार के जोखिम भरे कार्य',
      'नीला वस्त्र, गहरे रंग के फूल',
      'घने जंगल, जंगली क्षेत्र, अनन्वेषित भूखंड',
      'अचानक आपदाएँ — प्राकृतिक या मानव-निर्मित',
      'तकनीकी शिक्षा — इंजीनियरिंग, कंप्यूटर, विज्ञान',
      'इंटरनेट, सोशल मीडिया, डिजिटल तकनीक',
      'वर्जनाएँ — समाज में निषिद्ध या विवादास्पद मानी जाने वाली बातें',
    ]),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // KETU (केतु) — CORRECTIONS + NEW DATA
  // ─────────────────────────────────────────────────────────────────────────────
  await knex('planets').where('name', 'Ketu').update({
    direction: 'South-West',           // PDF p.8: "South-West / दक्षिण-पश्चिम"  (was: North-East — WRONG)
    color: 'Multi-colored',            // PDF p.9: "Multi-colored / बहुरंगी"  (was: Grey/Spotted)
    metal: 'Iron',                     // PDF p.9: "Iron / लोहा"  (was: Mixed Metals)
    weekday: 'Tuesday',                // PDF p.9 + p.33 summary table  (was: null)
    element: 'Fire & Earth',           // PDF p.8: "Fire & Earth / अग्नि और पृथ्वी"  (was: Fire only)
    season: 'N/A — shadow planet',
    season_hi: 'लागू नहीं — छाया ग्रह',
    health_conditions_en: JSON.stringify([
      { area: 'Tuberculosis (TB)',             conditions: 'Chronic respiratory wasting disease' },
      { area: 'Viral diseases',               conditions: 'Including rare and emerging viruses' },
      { area: 'Eruptive fevers',              conditions: 'Sudden high fevers with skin manifestations' },
      { area: 'Epidemics',                    conditions: 'Mass-spreading diseases' },
      { area: 'Worm infestations',            conditions: 'Intestinal parasites' },
      { area: 'Non-healing wounds',           conditions: 'Wounds that resist normal healing' },
      { area: 'Mental instability',           conditions: 'Psychosis, dissociation, identity confusion' },
      { area: 'Diagnostic confusion diseases', conditions: 'Symptoms change frequently' },
    ]),
    health_conditions_hi: JSON.stringify([
      { area: 'तपेदिक (टीबी)',        conditions: 'दीर्घकालिक श्वसन रोग' },
      { area: 'वायरल रोग',           conditions: 'दुर्लभ और उभरते वायरस सहित' },
      { area: 'उद्भासी बुखार',       conditions: 'त्वचा पर चकत्ते सहित अचानक तेज बुखार' },
      { area: 'महामारी',             conditions: 'जन-प्रसार वाली बीमारियाँ' },
      { area: 'कृमि संक्रमण',        conditions: 'आँतों के परजीवी' },
      { area: 'न ठीक होने वाले घाव', conditions: 'सामान्य उपचार का विरोध करने वाले घाव' },
      { area: 'मानसिक अस्थिरता',    conditions: 'मनोविकृति, विच्छेदन, पहचान भ्रम' },
      { area: 'निदान में भ्रम उत्पन्न करने वाले रोग', conditions: 'लक्षण बार-बार बदलते हैं' },
    ]),
    professions_en: JSON.stringify([
      'Spiritual teacher / Guru',
      'Yoga instructor / Meditation guide',
      'Alternative healing (Reiki, Pranic, Ayurveda)',
      'Occult practitioner / Astrologer',
      'Charity / NGO work / Social service',
      'Research in ancient sciences',
      'Surgeon (use of sharp instruments)',
    ]),
    professions_hi: JSON.stringify([
      'आध्यात्मिक शिक्षक / गुरु',
      'योग प्रशिक्षक / ध्यान मार्गदर्शक',
      'वैकल्पिक उपचार (रेकी, प्राणिक, आयुर्वेद)',
      'गूढ़ साधक / ज्योतिषी',
      'दान कार्य / NGO / सामाजिक सेवा',
      'प्राचीन विज्ञानों में अनुसंधान',
      'शल्य चिकित्सक (तीखे उपकरणों का उपयोग)',
    ]),
    key_relations_en: JSON.stringify([
      'Shadow planet — no physical body',
      'Governs ascetics, monks, and spiritual seekers',
      'Maternal grandfather (some traditions)',
    ]),
    key_relations_hi: JSON.stringify([
      'छाया ग्रह — कोई भौतिक शरीर नहीं',
      'तपस्वी, संन्यासी और आध्यात्मिक साधकों पर शासन',
      'नाना / मातृ पक्ष के दादा (कुछ परंपराओं में)',
    ]),
    physical_manifestations_en: JSON.stringify([
      'Suffering and pain — both physical and emotional',
      'Injury and wounds — especially sharp or sudden injuries',
      'Surgical treatment — Ketu governs the scalpel and surgical blade',
      'Horned animals — cattle, goats, deer, rhinoceros',
      'Trouble from enemies — sudden attacks and betrayals',
      'Occult sciences, mysticism, and tantric practices',
      'Meditation, yoga, and ascetic practices',
    ]),
    physical_manifestations_hi: JSON.stringify([
      'पीड़ा और दर्द — शारीरिक और भावनात्मक दोनों',
      'चोट और घाव — विशेष रूप से तीखी या अचानक चोटें',
      'शल्य चिकित्सा — केतु शल्य उपकरणों पर शासन करता है',
      'सींग वाले जानवर — मवेशी, बकरी, हिरण, गैंडा',
      'शत्रुओं से परेशानी — अचानक आक्रमण और विश्वासघात',
      'गूढ़ विज्ञान, रहस्यवाद और तांत्रिक साधनाएँ',
      'ध्यान, योग और तपस्वी साधनाएँ',
    ]),
  });

};
