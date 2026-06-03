'use strict';
// Seed 013 — AstroAnsh Class 3 & 4 Data
// Source: "AstroAnsh Class 3,4 and characteristics of Bhavas Premium Notes.pdf" (21 pages)
// Updates: planets (guna/varna/court_role/deity), zodiac_signs (key_traits + detailed desc),
//          houses (keywords, topics, health_organs, detailed_notes)
// NOTE: Only UPDATEs — no DELETEs to existing rows.

exports.seed = async function (knex) {

  // ══════════════════════════════════════════════════════════════════════════
  // PART 1: PLANET CLASSIFICATION — Guna, Varna, Court Role, Deity (Section 3)
  // Source: "Planetary Classification Table" — BPHS-based
  // ══════════════════════════════════════════════════════════════════════════
  const planetUpdates = [
    {
      id: 1, // Sun / सूर्य
      guna: 'Satvik',
      guna_hi: 'साात्विक',
      varna: 'Kshatriya',
      varna_hi: 'क्षत्रिय',
      court_role: 'King',
      court_role_hi: 'राजा',
      deity: 'Agni',
      deity_hi: 'अग्नि',
    },
    {
      id: 2, // Moon / चन्द्रमा
      guna: 'Satvik',
      guna_hi: 'साात्विक',
      varna: 'Vaishya',
      varna_hi: 'वैश्य',
      court_role: 'Queen',
      court_role_hi: 'रानी',
      deity: 'Varun',
      deity_hi: 'वरुण',
    },
    {
      id: 3, // Mars / मंगल
      guna: 'Tamsik',
      guna_hi: 'तामसिक',
      varna: 'Kshatriya',
      varna_hi: 'क्षत्रिय',
      court_role: 'Commander',
      court_role_hi: 'सेनापति',
      deity: 'Kartikeya',
      deity_hi: 'कार्तिकेय',
    },
    {
      id: 4, // Mercury / बुध
      guna: 'Rajsik',
      guna_hi: 'राजसिक',
      varna: 'Vaishya',
      varna_hi: 'वैश्य',
      court_role: 'Prince',
      court_role_hi: 'युवराज',
      deity: 'Vishnu',
      deity_hi: 'विष्णु',
    },
    {
      id: 5, // Jupiter / बृहस्पति
      guna: 'Satvik',
      guna_hi: 'साात्विक',
      varna: 'Brahmin',
      varna_hi: 'ब्राह्मण',
      court_role: 'Minister',
      court_role_hi: 'मंत्री',
      deity: 'Indra',
      deity_hi: 'इंद्र',
    },
    {
      id: 6, // Venus / शुक्र
      guna: 'Rajsik',
      guna_hi: 'राजसिक',
      varna: 'Brahmin',
      varna_hi: 'ब्राह्मण',
      court_role: 'Minister',
      court_role_hi: 'मंत्री',
      deity: 'Indrani',
      deity_hi: 'इंद्राणी',
    },
    {
      id: 7, // Saturn / शनि
      guna: 'Tamsik',
      guna_hi: 'तामसिक',
      varna: 'Shudra',
      varna_hi: 'शूद्र',
      court_role: 'Servant',
      court_role_hi: 'सेवक',
      deity: 'Brahma',
      deity_hi: 'ब्रह्मा',
    },
    {
      id: 8, // Rahu / राहु
      guna: 'Tamsik',
      guna_hi: 'तामसिक',
      varna: 'Malechha',
      varna_hi: 'म्लेच्छ',
      court_role: 'Army',
      court_role_hi: 'सेना',
      deity: 'Brahma / Laxmi / Ganesh',
      deity_hi: 'ब्रह्मा / लक्ष्मी / गणेश',
    },
    {
      id: 9, // Ketu / केतु
      guna: 'Tamsik',
      guna_hi: 'तामसिक',
      varna: 'Malechha',
      varna_hi: 'म्लेच्छ',
      court_role: 'Army',
      court_role_hi: 'सेना',
      deity: 'Ganesh',
      deity_hi: 'गणेश',
    },
  ];

  for (const row of planetUpdates) {
    const { id, ...data } = row;
    await knex('planets').where({ id }).update(data);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 2: ZODIAC SIGNS — Key Traits + Detailed Descriptions (Section 4)
  // ══════════════════════════════════════════════════════════════════════════
  const zodiacUpdates = [
    {
      id: 1, // Aries / मेष
      key_traits_en: 'Leadership, courage, impulsive, pioneering, bold',
      key_traits_hi: 'नेतृत्व, साहस, आवेगशील, अग्रणी, साहसी',
      detailed_description_en: 'Aries is the first sign of the zodiac and represents the beginning of all things — the first breath of creation, the spark of life, and the pioneering spirit. Symbol: The Ram (Bheda). Element: Fire. Quality: Cardinal. Aries natives are natural leaders, courageous, and driven to take action. They possess an innate boldness and the ability to initiate new ventures. Like a ram that charges forward without hesitation, Aries individuals are fearless in the face of challenge. However, they can be headstrong, impulsive, and prone to rushing into situations without fully considering the consequences. They must learn patience, foresight, and the art of completing what they begin.',
      detailed_description_hi: 'मेष राशिचक्र की पहली राशि है और सभी चीजों की शुरुआत का प्रतिनिधित्व करती है — सृष्टि की पहली सांस, जीवन की चिंगारी और अग्रणी भावना। प्रतीक: मेढ़ा। तत्त्व: अग्नि। गुण: चर। मेष राशि के जातक स्वाभाविक नेता होते हैं, साहसी होते हैं और कार्य करने के लिए प्रेरित होते हैं। उनमें एक सहज साहस और नए उद्यम शुरू करने की क्षमता होती है। हालाँकि, मेष जिद्दी, आवेगी हो सकते हैं और परिणामों पर पूरी तरह विचार किए बिना किसी भी स्थिति में जल्दबाजी करने के लिए प्रवृत्त होते हैं। उन्हें धैर्य, दूरदर्शिता और जो शुरू करते हैं उसे पूरा करने की कला सीखनी चाहिए।',
    },
    {
      id: 2, // Taurus / वृषभ
      key_traits_en: 'Stability, comfort, stubborn, patient, reliable, sensual',
      key_traits_hi: 'स्थिरता, आराम, जिद्दी, धैर्यशील, विश्वसनीय, संवेदनशील',
      detailed_description_en: 'Taurus represents the stabilization of energy after the initial burst of Aries. It is the sign of material accumulation, sensory pleasure, and enduring values. Symbol: The Bull (Saand). Element: Earth. Quality: Fixed. Taurus natives value stability, comfort, and material security. They are patient, reliable, and possess great physical endurance. Like a bull that plods steadily forward, Taurus individuals are persistent and hardworking. However, they can be stubborn, inflexible, and slow to adapt to new circumstances. They may resist change even when change is necessary, and can become overly attached to material possessions.',
      detailed_description_hi: 'वृषभ मेष की प्रारंभिक ऊर्जा के बाद ऊर्जा के स्थिरीकरण का प्रतिनिधित्व करता है। यह भौतिक संचय, इंद्रिय सुख और स्थायी मूल्यों की राशि है। प्रतीक: बैल (साँड़)। तत्त्व: पृथ्वी। गुण: स्थिर। वृषभ राशि के जातक स्थिरता, आराम और भौतिक सुरक्षा को महत्व देते हैं। वे धैर्यशील, विश्वसनीय होते हैं और महान शारीरिक सहनशक्ति रखते हैं। हालाँकि, वे जिद्दी, अनम्य और नई परिस्थितियों के अनुकूल होने में धीमे हो सकते हैं। वे परिवर्तन का विरोध कर सकते हैं और भौतिक संपत्ति से अत्यधिक आसक्त हो सकते हैं।',
    },
    {
      id: 3, // Gemini / मिथुन
      key_traits_en: 'Intelligence, adaptable, restless, communicative, witty, curious',
      key_traits_hi: 'बुद्धि, अनुकूलनशीलता, बेचैन, संचारशील, चतुर, जिज्ञासु',
      detailed_description_en: 'Gemini represents the duality of the mind — the ability to see multiple perspectives, communicate effectively, and adapt to diverse situations. Symbol: The Twins (Judwa). Element: Air. Quality: Dual/Mutable. Gemini natives are known for their intelligence, communication skills, wit, and adaptability. They are curious and enjoy learning new things, often juggling multiple interests simultaneously. They excel in fields requiring language, writing, and information exchange. However, they can be inconsistent, restless, and prone to changing their minds frequently. The Gemini native must learn focus, depth, and the discipline to follow through on commitments.',
      detailed_description_hi: 'मिथुन मन की द्वैतता का प्रतिनिधित्व करता है — कई दृष्टिकोणों को देखने, प्रभावी ढंग से संवाद करने और विविध परिस्थितियों के अनुकूल होने की क्षमता। प्रतीक: जुड़वाँ। तत्त्व: वायु। गुण: द्विस्वभाव। मिथुन राशि के जातक अपनी बुद्धिमत्ता, संचार कौशल और अनुकूलनशीलता के लिए जाने जाते हैं। वे जिज्ञासु होते हैं और नई चीजें सीखने का आनंद लेते हैं। हालाँकि, वे असंगत, बेचैन और अपना मन बार-बार बदलने की प्रवृत्ति वाले हो सकते हैं। मिथुन जातक को ध्यान, गहराई और प्रतिबद्धताओं पर टिके रहने का अनुशासन सीखना चाहिए।',
    },
    {
      id: 4, // Cancer / कर्क
      key_traits_en: 'Emotional, family-oriented, moody, nurturing, intuitive, protective',
      key_traits_hi: 'भावनात्मक, परिवार-केंद्रित, मूडी, पोषणकारी, अंतर्ज्ञानी, सुरक्षात्मक',
      detailed_description_en: 'Cancer is the most deeply emotional and nurturing sign of the zodiac. It is the sign of home, family, the mother, and the subconscious mind. Symbol: The Crab (Kekada). Element: Water. Quality: Cardinal. Cancer natives are very emotional, sensitive, and place enormous value on home, family, and close relationships. They are deeply empathetic, nurturing, and fiercely protective of those they love. Their intuition is highly developed. However, like a crab, they can be moody, clingy, and retreat into their shells when feeling threatened or vulnerable. Cancer natives must work on emotional regulation, letting go of the past, and developing independence.',
      detailed_description_hi: 'कर्क राशिचक्र की सबसे गहरी भावनात्मक और पोषणकारी राशि है। यह घर, परिवार, माता और अवचेतन मन की राशि है। प्रतीक: केकड़ा। तत्त्व: जल। गुण: चर। कर्क राशि के जातक बहुत भावुक, संवेदनशील होते हैं और घर, परिवार और करीबी रिश्तों को बहुत महत्व देते हैं। वे गहराई से सहानुभूतिपूर्ण, पोषणकारी और जिनसे प्रेम करते हैं उनके प्रति कट्टर रूप से सुरक्षात्मक होते हैं। हालाँकि, एक केकड़े की तरह, वे मूडी, चिपकू हो सकते हैं और खतरा महसूस करने पर अपने खोल में वापस सिमट सकते हैं।',
    },
    {
      id: 5, // Leo / सिंह
      key_traits_en: 'Charisma, leadership, proud, generous, creative, royal',
      key_traits_hi: 'करिश्मा, नेतृत्व, घमंडी, उदार, रचनात्मक, शाही',
      detailed_description_en: 'Leo is the royal sign of the zodiac — the sign of kings, leaders, entertainers, and those who naturally draw attention and admiration. Symbol: The Lion (Sher). Element: Fire. Quality: Fixed. Leo natives are naturally charismatic, generous, warm-hearted, and creative. They enjoy being in the spotlight and have a natural talent for leadership, performance, and inspiring others. The Sun\'s radiance shines most powerfully through Leo. However, like a lion, they can be proud, domineering, and sometimes overly concerned with maintaining their image and status. Leo natives must cultivate humility, listen to others, and use their leadership gifts in service of the greater good.',
      detailed_description_hi: 'सिंह राशिचक्र की राजसी राशि है — राजाओं, नेताओं, मनोरंजनकर्ताओं और उन लोगों की राशि जो स्वाभाविक रूप से ध्यान और प्रशंसा आकर्षित करते हैं। प्रतीक: शेर। तत्त्व: अग्नि। गुण: स्थिर। सिंह राशि के जातक स्वाभाविक रूप से करिश्माई, उदार, गर्म-हृदय और रचनात्मक होते हैं। वे सुर्खियों में रहना पसंद करते हैं और नेतृत्व, प्रदर्शन और दूसरों को प्रेरित करने की स्वाभाविक प्रतिभा रखते हैं। हालाँकि, शेर की तरह, वे घमंडी, दबंग और कभी-कभी अपनी छवि बनाए रखने के लिए अत्यधिक चिंतित हो सकते हैं।',
    },
    {
      id: 6, // Virgo / कन्या
      key_traits_en: 'Analytical, perfectionist, critical, service-oriented, practical',
      key_traits_hi: 'विश्लेषणात्मक, पूर्णतावादी, आलोचनात्मक, सेवामुखी, व्यावहारिक',
      detailed_description_en: 'Virgo represents the analytical, discerning, and service-oriented aspect of the zodiac. It is the sign of healing, refinement, and practical intelligence. Symbol: The Maiden (Kanya). Element: Earth. Quality: Dual/Mutable. Virgo natives are very analytical, organized, detail-oriented, and strive for perfection in all they do. They are excellent at identifying problems and finding practical solutions. Virgo is the sign of the healer, the craftsperson, and the devoted servant. However, they can be overly critical — of themselves and others — cautious to the point of paralysis, and sometimes unable to see the beauty in imperfection. Virgo natives must learn to accept imperfection, cultivate self-compassion, and trust the process of life.',
      detailed_description_hi: 'कन्या राशिचक्र के विश्लेषणात्मक, विवेकशील और सेवा-उन्मुख पहलू का प्रतिनिधित्व करती है। यह उपचार, परिष्करण और व्यावहारिक बुद्धि की राशि है। प्रतीक: कन्या। तत्त्व: पृथ्वी। गुण: द्विस्वभाव। कन्या राशि के जातक बहुत विश्लेषणात्मक, संगठित, विवरण-उन्मुख होते हैं और जो कुछ भी करते हैं उसमें पूर्णता के लिए प्रयास करते हैं। कन्या चिकित्सक, शिल्पकार और समर्पित सेवक की राशि है। हालाँकि, वे अत्यधिक आलोचनात्मक हो सकते हैं — स्वयं और दूसरों की। कन्या जातकों को अपूर्णता को स्वीकार करना और आत्म-करुणा विकसित करना सीखना चाहिए।',
    },
    {
      id: 7, // Libra / तुला
      key_traits_en: 'Peaceful, diplomatic, artistic, justice-seeking, indecisive at times',
      key_traits_hi: 'शांतिप्रिय, कूटनीतिक, कलात्मक, न्यायप्रिय, कभी-कभी अनिर्णायक',
      detailed_description_en: 'Libra is the only inanimate sign in the zodiac — its symbol is an object (scales), not a living being, reflecting its tendency to view life through the lens of fairness, measurement, and equilibrium. Ruling Planet: Venus (Shukra). Symbol: Scales (Tarazu). Element: Air. Quality: Cardinal. Librans are excellent at seeing both sides of an argument, which makes them gifted mediators but sometimes unable to take swift decisions. Key Traits: Peaceful, diplomatic, artistic, justice-seeking, relationship-oriented. Libra natives thrive in partnerships, law, art, and diplomacy. They seek harmony and beauty in all areas of life.',
      detailed_description_hi: 'तुला राशिचक्र की एकमात्र निर्जीव राशि है — इसका प्रतीक एक वस्तु (तराजू) है, कोई जीवित प्राणी नहीं। यह तुला की निष्पक्षता, माप और संतुलन के चश्मे से जीवन देखने की प्रवृत्ति को दर्शाता है। स्वामी: शुक्र। प्रतीक: तराजू। तत्त्व: वायु। गुण: चर। तुला राशि के जातक किसी भी तर्क के दोनों पक्षों को देखने में उत्कृष्ट होते हैं, जो उन्हें अच्छे मध्यस्थ बनाता है लेकिन कभी-कभी त्वरित निर्णय लेने में असमर्थ बनाता है। वे भागीदारी, कानून, कला और कूटनीति में फलते-फूलते हैं।',
    },
    {
      id: 8, // Scorpio / वृश्चिक
      key_traits_en: 'Intense, investigative, secretive, transformative, powerful memory',
      key_traits_hi: 'तीव्र, जांचकर्ता, रहस्यमय, परिवर्तनकारी, शक्तिशाली स्मृति',
      detailed_description_en: 'Scorpio is the most intensely complex sign. It represents depth — of emotion, of purpose, and of the subconscious mind. Ruling Planet: Mars (Mangal). Symbol: Scorpion (Bichchhu). Element: Water. Quality: Fixed. Unlike other signs, Scorpio natives have an innate radar for deception and are rarely fooled. They excel in research, investigation, forensics, psychology, occult sciences, and all fields requiring deep focus. Their memory is extraordinary and their capacity for loyalty — and vengeance — equally powerful. Scorpio natives are deeply transformative: they rise from their own ashes like a phoenix.',
      detailed_description_hi: 'वृश्चिक सबसे गहन और जटिल राशि है। यह गहराई का प्रतिनिधित्व करती है — भावनाओं की, उद्देश्य की, और अवचेतन मन की। स्वामी: मंगल। प्रतीक: बिच्छू। तत्त्व: जल। गुण: स्थिर। अन्य राशियों के विपरीत, वृश्चिक जातकों में धोखे की स्वाभाविक पहचान होती है और उन्हें शायद ही कभी मूर्ख बनाया जा सकता है। वे अनुसंधान, जांच, फोरेंसिक, मनोविज्ञान, गूढ़ विज्ञान में उत्कृष्ट होते हैं। उनकी स्मरण शक्ति असाधारण होती है।',
    },
    {
      id: 9, // Sagittarius / धनु
      key_traits_en: 'Philosophical, optimistic, adventurous, truth-seeking, teaching',
      key_traits_hi: 'दार्शनिक, आशावादी, साहसी, सत्य-खोजी, शिक्षण',
      detailed_description_en: 'Sagittarius is the sign of the philosopher and the explorer. Ruling Planet: Jupiter (Brihaspati). Element: Fire. Quality: Mutable. Dhanu natives are eternally optimistic, truth-seeking, and enthusiastic about life\'s possibilities. They are natural teachers, preachers, travellers, and spiritual seekers. Every experience is a learning opportunity. They excel in law, academia, religion, philosophy, and long-distance travel. However, they may become preachy and overconfident if Jupiter\'s energy is not channelled constructively. The key is to balance their love of freedom with responsibility.',
      detailed_description_hi: 'धनु दार्शनिक और खोजकर्ता की राशि है। स्वामी: बृहस्पति। तत्त्व: अग्नि। गुण: द्विस्वभाव। धनु जातक शाश्वत आशावादी, सत्य के साधक और जीवन की संभावनाओं के बारे में उत्साहित रहते हैं। वे स्वाभाविक शिक्षक, उपदेशक, यात्री और आध्यात्मिक साधक होते हैं। प्रत्येक अनुभव एक सीखने का अवसर है। हालाँकि, यदि बृहस्पति की ऊर्जा को रचनात्मक रूप से प्रसारित नहीं किया गया तो वे उपदेशात्मक और अत्यधिक आत्मविश्वासी हो सकते हैं।',
    },
    {
      id: 10, // Capricorn / मकर
      key_traits_en: 'Disciplined, career-focused, responsible, traditional, ambitious',
      key_traits_hi: 'अनुशासित, करियर-केंद्रित, जिम्मेदार, परंपरागत, महत्वाकांक्षी',
      detailed_description_en: 'Capricorn is the most career-focused sign. Ruling Planet: Saturn (Shani). Element: Earth. Quality: Cardinal. Saturn\'s influence gives Makara natives an unmatched work ethic. They are the builders of society — slow but steady, conventional but deeply capable. One critical insight from BPHS: Makara is the exaltation sign of Mars (at 28°), meaning that the raw energy of Mars gets beautifully channelled into disciplined, focused, and productive work when placed in Capricorn. Capricorn natives are patient, responsible, and achieve lasting success through sustained effort over time.',
      detailed_description_hi: 'मकर सबसे अधिक करियर-केंद्रित राशि है। स्वामी: शनि। तत्त्व: पृथ्वी। गुण: चर। शनि का प्रभाव मकर जातकों को अद्वितीय कार्य नीति देता है। वे समाज के निर्माता हैं — धीमे लेकिन स्थिर, पारंपरिक लेकिन गहराई से सक्षम। BPHS से एक महत्वपूर्ण अंतर्दृष्टि: मकर मंगल की उच्च राशि है (28° पर)। इसका अर्थ है कि मकर में स्थित होने पर मंगल की कच्ची ऊर्जा अनुशासित, केंद्रित और उत्पादक कार्य में सुंदर रूप से प्रसारित होती है।',
    },
    {
      id: 11, // Aquarius / कुम्भ
      key_traits_en: 'Humanitarian, visionary, reformist, independent, innovative',
      key_traits_hi: 'मानवतावादी, दूरदर्शी, सुधारवादी, स्वतंत्र, नवाचारी',
      detailed_description_en: 'Aquarius is ruled by Saturn (Shani) — the same ruler as Capricorn but a very different expression. While Capricorn uses Saturn\'s energy for personal achievement, Aquarius directs it toward collective welfare and social reform. Element: Air. Quality: Fixed. Kumbha natives are the rebels and visionaries of the zodiac — they challenge the status quo in service of a larger ideal. They are deeply humanitarian, innovative, and committed to universal progress. Aquarius natives excel in science, technology, social work, mass movements, and all fields that serve humanity at large.',
      detailed_description_hi: 'कुम्भ का स्वामी शनि है — मकर के समान स्वामी लेकिन बहुत अलग अभिव्यक्ति। जहाँ मकर शनि की ऊर्जा को व्यक्तिगत उपलब्धि के लिए उपयोग करता है, वहीं कुम्भ इसे सामूहिक कल्याण और सामाजिक सुधार की ओर निर्देशित करता है। तत्त्व: वायु। गुण: स्थिर। कुम्भ जातक राशिचक्र के विद्रोही और दूरदर्शी हैं — वे एक बड़े आदर्श की सेवा में यथास्थिति को चुनौती देते हैं। वे गहराई से मानवतावादी, नवाचारी और सार्वभौमिक प्रगति के प्रति प्रतिबद्ध हैं।',
    },
    {
      id: 12, // Pisces / मीन
      key_traits_en: 'Empathetic, intuitive, creative, spiritual, compassionate, dreamy',
      key_traits_hi: 'सहानुभूतिपूर्ण, अंतर्ज्ञानी, रचनात्मक, आध्यात्मिक, दयालु, स्वप्निल',
      detailed_description_en: 'Pisces is the final sign of the zodiac and therefore carries the wisdom — and burdens — of all 11 signs before it. Ruling Planet: Jupiter (Brihaspati). Element: Water. Quality: Mutable. Meena natives are deeply empathetic, intuitive, and creative. They are often found in arts, healing, spirituality, and research. Pisces is the sign most connected to the divine and the transcendent. Their imagination is boundless and their compassion is universal. However, they must guard against escapism, over-idealism, and losing themselves in others. A strong Pisces chart indicates potential for great spiritual attainment.',
      detailed_description_hi: 'मीन राशिचक्र की अंतिम राशि है और इसलिए अपने पहले की 11 राशियों का ज्ञान — और बोझ — वहन करती है। स्वामी: बृहस्पति। तत्त्व: जल। गुण: द्विस्वभाव। मीन जातक गहराई से सहानुभूतिपूर्ण, अंतर्ज्ञानी और रचनात्मक होते हैं। वे अक्सर कला, उपचार, आध्यात्मिकता और शोध में पाए जाते हैं। मीन दिव्य और अतिक्रमणीय से सबसे अधिक जुड़ी राशि है। उनकी कल्पना असीमित और उनकी करुणा सार्वभौमिक है। हालाँकि, उन्हें पलायनवाद और अति-आदर्शवाद से बचना चाहिए।',
    },
  ];

  for (const row of zodiacUpdates) {
    const { id, ...data } = row;
    await knex('zodiac_signs').where({ id }).update(data);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PART 3: HOUSES — Keywords, Topics, Health Organs, Detailed Notes (Part 4)
  // Source: Pages 15–20 of the PDF
  // ══════════════════════════════════════════════════════════════════════════
  const houseUpdates = [
    {
      id: 1,
      keywords_en: 'Self, Personality, Physical Appearance, Life Purpose',
      keywords_hi: 'स्वयं, व्यक्तित्व, शारीरिक बनावट, जीवन उद्देश्य',
      topics_en: 'Self, Body, Appearance, Personality, Health, Fame, Character, Lagna Lord strength, Overall life quality',
      topics_hi: 'स्वयं, शरीर, रूप, व्यक्तित्व, स्वास्थ्य, यश, चरित्र, लग्नेश की शक्ति, समग्र जीवन गुणवत्ता',
      health_organs_en: 'Brain, Head, Overall body constitution',
      health_organs_hi: 'मस्तिष्क, सिर, समग्र शरीर संरचना',
      detailed_notes_en: 'The First House (Lagna) is the single most important factor in any horoscope. It represents the native\'s entire personality construct, psychological orientation, physical appearance, and fundamental life purpose. The sign rising at birth and any planets placed here profoundly shape who we are. BPHS Teaching: The strength of the Lagna lord (the planet ruling the Ascendant sign) and any planet conjunct or aspecting the Lagna determines the overall quality of the life. A strong Lagna gives vitality, confidence, and the ability to overcome obstacles. Health Linkage: The 1st House governs the head, brain, and overall constitution of the body. Mars or Saturn influencing the Lagna may give a more muscular or lean physique, while Jupiter\'s influence can expand the body and give a broad, commanding presence.',
      detailed_notes_hi: 'प्रथम भाव (लग्न) किसी भी कुंडली में एकमात्र सबसे महत्वपूर्ण कारक है। यह जातक के संपूर्ण व्यक्तित्व निर्माण, मनोवैज्ञानिक अभिविन्यास, शारीरिक बनावट और मौलिक जीवन उद्देश्य का प्रतिनिधित्व करता है। जन्म के समय उदित राशि और यहाँ स्थित कोई भी ग्रह गहराई से यह आकार देते हैं कि हम कौन हैं। BPHS शिक्षण: लग्नेश की शक्ति और लग्न से युक्त या दृष्टि डालने वाले किसी भी ग्रह से जीवन की समग्र गुणवत्ता निर्धारित होती है। मजबूत लग्न जीवन शक्ति, आत्मविश्वास और बाधाओं को दूर करने की क्षमता देता है। स्वास्थ्य संबंध: प्रथम भाव सिर, मस्तिष्क और शरीर की समग्र संरचना को नियंत्रित करता है।',
    },
    {
      id: 2,
      keywords_en: 'Wealth, Family, Speech, Food, Savings',
      keywords_hi: 'धन, परिवार, वाणी, भोजन, बचत',
      topics_en: 'Assets, Savings, Jewelry, Precious metals, Bank deposits, Food, Voice quality, Early childhood, Family values, Kula (family lineage)',
      topics_hi: 'संपत्ति, बचत, आभूषण, कीमती धातुएँ, बैंक जमा, भोजन, वाणी की गुणवत्ता, प्रारंभिक बचपन, पारिवारिक मूल्य, कुल (वंश)',
      health_organs_en: 'Mouth, Face, Throat, Right Eye',
      health_organs_hi: 'मुँह, चेहरा, गला, दाहिनी आँख',
      detailed_notes_en: 'The 2nd House (Dhana Bhava) governs all forms of accumulated wealth — savings, land assets, bank deposits, jewelry, precious metals, and gemstones. It also reveals family background, the family one is born into (Kula), and primary education up to early school years. Voice Quality: A very significant and often overlooked signification — the 2nd House governs the quality, tone, and sweetness of one\'s voice. Jupiter here gives a naturally melodious and authoritative voice. Rahu here may create an unusual or nasal quality. The 2nd House is also the house of family values, dietary habits, and the manner of speech. Mercury strong here gives articulate expression; Saturn here may restrict speech or create a harsh quality.',
      detailed_notes_hi: 'द्वितीय भाव (धन भाव) संचित धन के सभी रूपों को नियंत्रित करता है — बचत, भूमि संपत्ति, बैंक जमा, आभूषण, कीमती धातुएँ और रत्न। यह परिवार की पृष्ठभूमि और प्रारंभिक विद्यालय वर्षों तक प्राथमिक शिक्षा भी प्रकट करता है। वाणी की गुणवत्ता: एक बहुत महत्वपूर्ण और अक्सर अनदेखा संकेत — द्वितीय भाव किसी की आवाज की गुणवत्ता, स्वर और मधुरता को नियंत्रित करता है। यहाँ बृहस्पति स्वाभाविक रूप से मधुर और अधिकारपूर्ण आवाज देता है। यहाँ राहु असामान्य या नासिकीय गुण उत्पन्न कर सकता है।',
    },
    {
      id: 3,
      keywords_en: 'Courage, Communication, Siblings, Self-efforts',
      keywords_hi: 'साहस, संचार, भाई-बहन, स्व-प्रयास',
      topics_en: 'Bravery, Personal initiative, Self-reliance, Media, Journalism, Short travel, Hobbies, Siblings, Writing, Digital communication, Blogging, Podcasting, YouTube',
      topics_hi: 'वीरता, व्यक्तिगत पहल, आत्मनिर्भरता, मीडिया, पत्रकारिता, लघु यात्रा, शौक, भाई-बहन, लेखन, डिजिटल संचार, ब्लॉगिंग, पॉडकास्टिंग, यूट्यूब',
      health_organs_en: 'Arms, Hands, Right Ear, Shoulders, Lungs',
      health_organs_hi: 'भुजाएँ, हाथ, दाहिना कान, कंधे, फेफड़े',
      detailed_notes_en: 'The 3rd House (Sahaja / Parakrama Bhava) is the house of personal initiative and self-reliance. It governs courage (Parakrama), willpower, and the ability to start things independently. Those with a strong 3rd House often become successful entrepreneurs and self-made individuals. Media and Communication: In the modern age, the 3rd House has expanded to include all forms of digital communication — blogging, podcasting, social media content creation, YouTube, and online education. A strong 3rd House combined with Jupiter\'s influence makes excellent astrology teachers and public educators. The 3rd House also governs younger siblings, short journeys, hobbies, and fine motor skills.',
      detailed_notes_hi: 'तृतीय भाव (सहज / पराक्रम भाव) व्यक्तिगत पहल और आत्मनिर्भरता का भाव है। यह साहस (पराक्रम), इच्छाशक्ति और स्वतंत्र रूप से चीजें शुरू करने की क्षमता को नियंत्रित करता है। मजबूत तृतीय भाव वाले लोग अक्सर सफल उद्यमी और स्वयं सिद्ध व्यक्ति बनते हैं। मीडिया और संचार: आधुनिक युग में, तृतीय भाव का विस्तार डिजिटल संचार के सभी रूपों को शामिल करने के लिए हुआ है — ब्लॉगिंग, पॉडकास्टिंग, सोशल मीडिया कंटेंट क्रिएशन, यूट्यूब और ऑनलाइन शिक्षा। बृहस्पति के प्रभाव के साथ मजबूत तृतीय भाव उत्कृष्ट ज्योतिष शिक्षक और सार्वजनिक शिक्षक बनाता है।',
    },
    {
      id: 4,
      keywords_en: 'Home, Mother, Property, Vehicles, Peace of Mind',
      keywords_hi: 'घर, माता, संपत्ति, वाहन, मानसिक शांति',
      topics_en: 'Home comforts, Domestic peace, Land, Houses, Apartments, Vehicles, Mother\'s influence, Education up to High School, Real estate, Inner contentment',
      topics_hi: 'घर के सुख, घरेलू शांति, भूमि, मकान, अपार्टमेंट, वाहन, माता का प्रभाव, हाई स्कूल तक शिक्षा, अचल संपत्ति, आंतरिक संतोष',
      health_organs_en: 'Heart, Lungs, Esophagus, Trachea',
      health_organs_hi: 'हृदय, फेफड़े, ग्रासनली, श्वासनली',
      detailed_notes_en: 'The 4th House (Sukha / Matri Bhava) is the house of emotional foundations. It represents the home environment, domestic peace, and the mother\'s influence. A strong 4th House gives a person inner contentment regardless of external circumstances. Real Estate and Vehicles: All immovable property — land, houses, apartments — and movable comforts like cars, motorcycles, and household conveniences fall under this house. Saturn in the 4th may delay property acquisition; Jupiter brings multiple properties through grace and fortune. The 4th House also governs school-level education and one\'s relationship with the homeland.',
      detailed_notes_hi: 'चतुर्थ भाव (सुख / मातृ भाव) भावनात्मक आधारों का भाव है। यह घर के वातावरण, पारिवारिक शांति और माता के प्रभाव का प्रतिनिधित्व करता है। मजबूत चतुर्थ भाव बाहरी परिस्थितियों की परवाह किए बिना आंतरिक संतोष देता है। अचल संपत्ति और वाहन: सभी अचल संपत्ति — भूमि, मकान, अपार्टमेंट — और कार, मोटरसाइकिल जैसी चल सुविधाएँ इस भाव के अंतर्गत आती हैं। चतुर्थ भाव में शनि संपत्ति अधिग्रहण में देरी कर सकता है; बृहस्पति अनुग्रह और भाग्य के माध्यम से अनेक संपत्तियाँ दिलाता है।',
    },
    {
      id: 5,
      keywords_en: 'Creativity, Children, Romance, Intelligence, Speculation',
      keywords_hi: 'रचनात्मकता, संतान, प्रेम, बुद्धि, सट्टा',
      topics_en: 'Creative self-expression, Arts, Love affairs, Romance, Children, Speculation, Bachelor\'s degree, Higher intellect, Past life merit (Purva Punya), Mantras and Tantras',
      topics_hi: 'रचनात्मक आत्म-अभिव्यक्ति, कला, प्रेम-संबंध, रोमांस, संतान, सट्टा, स्नातक डिग्री, उच्च बौद्धिकता, पूर्व जन्म के पुण्य, मंत्र और तंत्र',
      health_organs_en: 'Stomach, Liver, Gallbladder, Pancreas',
      health_organs_hi: 'पेट, यकृत, पित्ताशय, अग्न्याशय',
      detailed_notes_en: 'The 5th House (Putra / Vidya Bhava) is one of the most joyful houses in the chart. It governs everything related to creative self-expression, romance, children, and higher intellect. The 5th House is known as a Trikona (trinal house) — one of the most auspicious house types. Children Prediction: According to BPHS, the primary house for children is the 5th. The placement of Jupiter (natural Putrakaraka), the 5th lord, and any planets in the 5th House collectively determine whether children come easily, their number, timing of first child, and their characteristics. The 5th House also represents the accumulated merit from past lives (Purva Punya) and one\'s capacity for deep spiritual practices.',
      detailed_notes_hi: 'पंचम भाव (पुत्र / विद्या भाव) कुंडली के सबसे आनंददायक भावों में से एक है। यह रचनात्मक आत्म-अभिव्यक्ति, प्रेम, संतान और उच्च बौद्धिकता से संबंधित सब कुछ नियंत्रित करता है। पंचम भाव को त्रिकोण (त्रिकोण भाव) के रूप में जाना जाता है — सबसे शुभ भाव प्रकारों में से एक। संतान भविष्यवाणी: BPHS के अनुसार, संतान के लिए प्राथमिक भाव पंचम है। बृहस्पति (प्राकृतिक पुत्रकारक), पंचमेश और पंचम भाव में किसी भी ग्रह की स्थिति सामूहिक रूप से यह निर्धारित करती है कि संतान आसानी से आती है, उनकी संख्या, प्रथम संतान का समय और उनके लक्षण।',
    },
    {
      id: 6,
      keywords_en: 'Work Routine, Enemies, Diseases, Debts, Competition',
      keywords_hi: 'दैनिक कार्य, शत्रु, रोग, ऋण, प्रतिस्पर्धा',
      topics_en: 'Daily work, Colleagues, Challenges, Debts, Health issues, Conflict resolution, Adversaries, Litigation, Service, Competition defeat',
      topics_hi: 'दैनिक कार्य, सहकर्मी, चुनौतियाँ, ऋण, स्वास्थ्य समस्याएँ, संघर्ष समाधान, विरोधी, मुकदमेबाजी, सेवा, प्रतिस्पर्धा को पराजित करना',
      health_organs_en: 'Lower Back, Navel, Hips, Intestines',
      health_organs_hi: 'पीठ का निचला हिस्सा, नाभि, कूल्हे, आँतें',
      detailed_notes_en: 'The 6th House (Rina / Shatru Bhava) is classified as a Dusthana (difficult house) but it is also a powerful house for overcoming obstacles. It governs daily work discipline, conflict resolution, health challenges, debts, and our relationship with adversaries. Key Insight: A powerful 6th lord or Mars in the 6th House can make a person excellent at defeating competition. This is why many great warriors, athletes, lawyers, and doctors (who battle disease) have strong 6th House configurations. The 6th House also governs pets, domestic animals, maternal relatives (mother\'s side), and service professions.',
      detailed_notes_hi: 'षष्ठ भाव (ऋण / शत्रु भाव) को दुःस्थान (कठिन भाव) के रूप में वर्गीकृत किया गया है लेकिन यह बाधाओं को दूर करने के लिए एक शक्तिशाली भाव भी है। यह दैनिक कार्य अनुशासन, संघर्ष समाधान, स्वास्थ्य चुनौतियों, ऋण और विरोधियों के साथ हमारे संबंध को नियंत्रित करता है। मुख्य अंतर्दृष्टि: एक शक्तिशाली षष्ठेश या षष्ठ भाव में मंगल व्यक्ति को प्रतिस्पर्धा को पराजित करने में उत्कृष्ट बना सकता है। यही कारण है कि कई महान योद्धाओं, खिलाड़ियों, वकीलों और डॉक्टरों में मजबूत षष्ठ भाव की संरचना होती है।',
    },
    {
      id: 7,
      keywords_en: 'Marriage, Partnerships, Spouse, Business, Open Enemies',
      keywords_hi: 'विवाह, साझेदारी, जीवनसाथी, व्यापार, प्रकट शत्रु',
      topics_en: 'Spouse quality, Marriage timing, Business partnerships, Clients, Open enemies, All relationships beyond family, Public dealings, Foreign travel',
      topics_hi: 'जीवनसाथी की गुणवत्ता, विवाह का समय, व्यावसायिक साझेदारी, ग्राहक, प्रकट शत्रु, परिवार से परे सभी संबंध, सार्वजनिक व्यवहार, विदेश यात्रा',
      health_organs_en: 'Abdomen, Intestines, Kidney, Veins',
      health_organs_hi: 'पेट, आँतें, गुर्दे, नसें',
      detailed_notes_en: 'The 7th House (Kalatra / Yuvati Bhava) is the Descendant — it sits exactly opposite the Ascendant. It represents all \'others\' in our life — our spouse, our business partners, our clients, and our open enemies. The 7th House is a Kendra (angular house), one of the most powerful house types. Marriage Timing: The 7th lord\'s position, Venus (for males), Jupiter (for females), and any planets aspecting or placed in the 7th House collectively indicate the timing, quality, and nature of marriage. Saturn\'s aspect delays; Jupiter\'s aspect blesses; Rahu here can indicate an unconventional or foreign-origin spouse. A strong 7th House also favors entrepreneurship and long-term business partnerships.',
      detailed_notes_hi: 'सप्तम भाव (कलत्र / युवती भाव) अवरोही है — यह लग्न के बिल्कुल विपरीत बैठता है। यह हमारे जीवन के सभी \'अन्य\' का प्रतिनिधित्व करता है — हमारा जीवनसाथी, व्यावसायिक साझेदार, ग्राहक और प्रकट शत्रु। सप्तम भाव एक केंद्र (कोणीय भाव) है, सबसे शक्तिशाली भाव प्रकारों में से एक। विवाह समय: सप्तमेश की स्थिति, शुक्र (पुरुषों के लिए), बृहस्पति (महिलाओं के लिए) और सप्तम भाव पर दृष्टि डालने वाले किसी भी ग्रह से सामूहिक रूप से विवाह के समय, गुणवत्ता और स्वभाव का संकेत मिलता है। शनि की दृष्टि विलंब करती है; बृहस्पति की दृष्टि आशीर्वाद देती है; यहाँ राहु अपरंपरागत या विदेशी मूल के जीवनसाथी का संकेत दे सकता है।',
    },
    {
      id: 8,
      keywords_en: 'Transformation, Occult, Longevity, Inheritance, Secrets',
      keywords_hi: 'परिवर्तन, गूढ़ ज्ञान, दीर्घायु, विरासत, रहस्य',
      topics_en: 'Hidden matters, Mysteries, Inheritance, Insurance, Joint finances, Underground resources, Past-life karma, Occult sciences, Surgery, Research, Petroleum industry, Mining',
      topics_hi: 'छुपे हुए मामले, रहस्य, विरासत, बीमा, संयुक्त वित्त, भूमिगत संसाधन, पूर्व जन्म कर्म, गूढ़ विज्ञान, शल्य चिकित्सा, अनुसंधान, पेट्रोलियम उद्योग, खनन',
      health_organs_en: 'Reproductive Organs, Sexual Drive, Chronic Diseases',
      health_organs_hi: 'प्रजनन अंग, यौन इच्छा, पुरानी बीमारियाँ',
      detailed_notes_en: 'The 8th House (Ayur / Mrityu Bhava) is the most mystical house in the zodiac. It represents all that is hidden, secret, and transformative. Contrary to fear, the 8th House is the gateway to occult knowledge, deep research, and extraordinary resilience. The 8th House in Modern Context: In contemporary analysis, the 8th House is strongly linked to inheritance, insurance, joint finances with a partner, and windfall gains or losses. The petroleum industry, mining, underground infrastructure, and surgical careers all fall under the 8th House. A strong 8th House can indicate longevity and extraordinary capacity for transformation — like a phoenix rising from the ashes. Malefics here can indicate chronic health issues or sudden unexpected events.',
      detailed_notes_hi: 'अष्टम भाव (आयु / मृत्यु भाव) राशि चक्र का सबसे रहस्यमय भाव है। यह उन सभी का प्रतिनिधित्व करता है जो छुपा हुआ, गुप्त और परिवर्तनकारी है। भय के विपरीत, अष्टम भाव गूढ़ ज्ञान, गहरे अनुसंधान और असाधारण लचीलेपन का प्रवेश द्वार है। आधुनिक संदर्भ में अष्टम भाव: समकालीन विश्लेषण में, अष्टम भाव का संबंध विरासत, बीमा, साझेदार के साथ संयुक्त वित्त और आकस्मिक लाभ या हानि से है। पेट्रोलियम उद्योग, खनन, भूमिगत बुनियादी ढाँचा और शल्य चिकित्सा करियर सभी अष्टम भाव के अंतर्गत आते हैं।',
    },
    {
      id: 9,
      keywords_en: 'Luck, Higher Learning, Dharma, Father, Fortune, Guru',
      keywords_hi: 'भाग्य, उच्च शिक्षा, धर्म, पिता, भाग्य, गुरु',
      topics_en: 'Fortune, Divine grace, Past life merit (Purva Punya), Father, Long-distance travel, Masters degree, Dharma, Spiritual teachers (Guru), Philosophy, Religion, Foreign pilgrimages',
      topics_hi: 'भाग्य, दिव्य अनुग्रह, पूर्व जन्म के पुण्य, पिता, लंबी यात्रा, परास्नातक डिग्री, धर्म, आध्यात्मिक शिक्षक (गुरु), दर्शन, धर्म, विदेश तीर्थयात्रा',
      health_organs_en: 'Hips, Thighs',
      health_organs_hi: 'कूल्हे, जाँघें',
      detailed_notes_en: 'The 9th House (Dharma / Bhagya Bhava) is considered the most auspicious Trikona (trinal house) in the entire chart. It represents one\'s accumulated merit from past lives (Purva Punya), divine grace (Anugraha), and the fortune one is destined to receive in this lifetime. The Guru Connection: Planets in the 9th House or the condition of the 9th lord directly indicate whether one will encounter enlightened teachers in life. A strong 9th House ensures that the right Guru appears at the right time — a supreme blessing in the Jyotish tradition. The 9th House is also the primary house for the father, long journeys, higher education, and publishing.',
      detailed_notes_hi: 'नवम भाव (धर्म / भाग्य भाव) को संपूर्ण कुंडली में सबसे शुभ त्रिकोण (त्रिकोण भाव) माना जाता है। यह पिछले जन्मों के संचित पुण्य (पूर्व पुण्य), दिव्य अनुग्रह और इस जीवनकाल में प्राप्त होने वाले भाग्य का प्रतिनिधित्व करता है। गुरु का संबंध: नवम भाव में ग्रह या नवमेश की स्थिति सीधे यह संकेत देती है कि क्या व्यक्ति जीवन में प्रबुद्ध शिक्षकों से मिलेगा। मजबूत नवम भाव सुनिश्चित करता है कि सही समय पर सही गुरु प्रकट हो — ज्योतिष परंपरा में एक सर्वोच्च आशीर्वाद।',
    },
    {
      id: 10,
      keywords_en: 'Career, Public Image, Status, Authority, Reputation',
      keywords_hi: 'करियर, सार्वजनिक छवि, स्थिति, अधिकार, प्रतिष्ठा',
      topics_en: 'Profession, Work nature, Status, Fame, Government work, Authority, Father\'s financial status, Public standing, Leadership, Social contribution',
      topics_hi: 'पेशा, कार्य की प्रकृति, स्थिति, यश, सरकारी कार्य, अधिकार, पिता की आर्थिक स्थिति, सार्वजनिक स्थान, नेतृत्व, सामाजिक योगदान',
      health_organs_en: 'Knees, Skeletal System, Joints',
      health_organs_hi: 'घुटने, कंकाल प्रणाली, जोड़',
      detailed_notes_en: 'The 10th House (Karma / Rajya Bhava) is the most visible house in the chart — it sits at the Midheaven (the highest point of the chart). Everything related to one\'s public life, career, reputation, authority, and social standing is governed here. Career Determination by Planet: Sun here favors government service and leadership. Moon favors businesses related to public needs and hospitality. Mars brings military, sports, and engineering. Jupiter creates teachers, judges, and advisors. Venus brings creativity, arts, and entertainment. Mercury favors commerce and communication. Saturn creates builders, workers in large organizations, and those who serve long-term. The 10th House is also the strongest Kendra in the chart.',
      detailed_notes_hi: 'दशम भाव (कर्म / राज्य भाव) कुंडली का सबसे दृश्यमान भाव है — यह मिडहेवन (कुंडली के उच्चतम बिंदु) पर बैठता है। किसी के सार्वजनिक जीवन, करियर, प्रतिष्ठा, अधिकार और सामाजिक स्थिति से संबंधित सब कुछ यहाँ नियंत्रित होता है। ग्रह द्वारा करियर निर्धारण: यहाँ सूर्य सरकारी सेवा और नेतृत्व को अनुकूल बनाता है। चंद्र सार्वजनिक जरूरतों और आतिथ्य से संबंधित व्यवसायों को अनुकूल बनाता है। मंगल सैन्य, खेल और इंजीनियरिंग लाता है। बृहस्पति शिक्षक, न्यायाधीश और सलाहकार बनाता है। शुक्र रचनात्मकता, कला और मनोरंजन लाता है। बुध वाणिज्य और संचार को अनुकूल बनाता है। शनि निर्माता और दीर्घकालिक सेवा करने वाले बनाता है।',
    },
    {
      id: 11,
      keywords_en: 'Income, Aspirations, Gains, Social Circle, Fulfillment',
      keywords_hi: 'आय, आकांक्षाएँ, लाभ, सामाजिक दायरा, पूर्णता',
      topics_en: 'Salary, Financial gains, Social circle, Professional network, Elder siblings, Hopes and desires, Social media followers, Online communities, Mass audiences',
      topics_hi: 'वेतन, आर्थिक लाभ, सामाजिक दायरा, व्यावसायिक नेटवर्क, बड़े भाई-बहन, आशाएँ और इच्छाएँ, सोशल मीडिया फॉलोअर्स, ऑनलाइन समुदाय, व्यापक दर्शक',
      health_organs_en: 'Left Ear, Calves, Legs, Ankles',
      health_organs_hi: 'बायाँ कान, पिंडलियाँ, पैर, टखने',
      detailed_notes_en: 'The 11th House (Labha Bhava) is the house of fulfilment. Any desire seen in any other house of the chart ultimately gets fulfilled through the 11th House. It is the house of gains, income, and aspirations materialising. Social Networks and Mass Audiences: In the digital era, the 11th House governs social media followers, YouTube subscribers, online communities, and large professional networks. Strong planets here combined with the 3rd House can indicate viral content creators and influential public figures. The 11th House also governs elder siblings, friends, income from profession, and the realisation of all life goals. A strong 11th House consistently delivers gains from multiple sources.',
      detailed_notes_hi: 'एकादश भाव (लाभ भाव) पूर्णता का भाव है। कुंडली के किसी भी अन्य भाव में दिखाई देने वाली कोई भी इच्छा अंततः एकादश भाव के माध्यम से पूर्ण होती है। यह लाभ, आय और आकांक्षाओं के साकार होने का भाव है। सामाजिक नेटवर्क और व्यापक दर्शक: डिजिटल युग में, एकादश भाव सोशल मीडिया फॉलोअर्स, यूट्यूब सब्सक्राइबर, ऑनलाइन समुदायों और बड़े व्यावसायिक नेटवर्क को नियंत्रित करता है। तृतीय भाव के साथ यहाँ मजबूत ग्रह वायरल कंटेंट क्रिएटर और प्रभावशाली सार्वजनिक हस्तियों का संकेत दे सकते हैं।',
    },
    {
      id: 12,
      keywords_en: 'Spirituality, Losses, Moksha, Foreign Lands, Isolation',
      keywords_hi: 'आध्यात्म, हानि, मोक्ष, विदेश, एकांत',
      topics_en: 'Isolation, Foreign lands, Hospitals, Jails, Expenses, Moksha (Liberation), Meditation, Ashram life, Spiritual retreats, Import-export, Long-term residence abroad, Hidden losses',
      topics_hi: 'एकांत, विदेश, अस्पताल, जेल, व्यय, मोक्ष (मुक्ति), ध्यान, आश्रम जीवन, आध्यात्मिक प्रवास, आयात-निर्यात, विदेश में दीर्घकालिक निवास, छुपी हुई हानियाँ',
      health_organs_en: 'Left Eye, Feet, Toes',
      health_organs_hi: 'बायीं आँख, पैर, पैर की उँगलियाँ',
      detailed_notes_en: 'The 12th House (Moksha / Vyaya Bhava) is the most spiritual house in the chart. It governs liberation (Moksha), the dissolution of ego, and the soul\'s journey beyond the material world. Activities done in solitude, deep meditation, ashram life, and spiritual retreats are all 12th House matters. Foreign Connections: The 12th House governs settlement in foreign lands, import-export businesses, and long-term residence abroad. A strong 12th House with beneficial planets can make one highly successful internationally. Loss and Expenditure: This house also governs all outflows of money. Uncontrolled spending, hospitalisation costs, court fines, and hidden losses are all 12th House phenomena. Careful analysis of the 12th lord helps predict when such losses may occur and how to mitigate them.',
      detailed_notes_hi: 'द्वादश भाव (मोक्ष / व्यय भाव) कुंडली का सबसे आध्यात्मिक भाव है। यह मुक्ति (मोक्ष), अहंकार के विसर्जन और भौतिक दुनिया से परे आत्मा की यात्रा को नियंत्रित करता है। एकांत में की जाने वाली गतिविधियाँ, गहरा ध्यान, आश्रम जीवन और आध्यात्मिक प्रवास सभी द्वादश भाव के मामले हैं। विदेशी संबंध: द्वादश भाव विदेशी भूमि में बसना, आयात-निर्यात व्यवसाय और विदेश में दीर्घकालिक निवास को नियंत्रित करता है। हानि और व्यय: यह भाव धन के सभी बहिर्प्रवाह को भी नियंत्रित करता है। अनियंत्रित खर्च, अस्पताल में भर्ती लागत, अदालती जुर्माना और छुपी हुई हानियाँ सभी द्वादश भाव की घटनाएँ हैं।',
    },
  ];

  for (const row of houseUpdates) {
    const { id, ...data } = row;
    await knex('houses').where({ id }).update(data);
  }
};
