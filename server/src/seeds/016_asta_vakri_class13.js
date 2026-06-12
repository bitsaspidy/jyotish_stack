'use strict';
// Seed 016 — AstroAnsh Class 13: Combustion (Asta/Maudhya) & Retrogression (Vakri)
// Sources: BPHS, Phaladeepika, Saravali, Jataka Parijata, Uttara Kalamrita

exports.seed = async (knex) => {
  await knex('asta_vakri_library').del();
  const J = JSON.stringify;
  const rows = [];
  let i = 0;
  const add = (category, item_key, r) => rows.push({
    category, item_key, sort_order: ++i,
    title_en: r.t, title_hi: r.th || null,
    description_en: r.d || null, description_hi: r.dh || null,
    effects_en: r.e ? J(r.e) : null, effects_hi: r.eh ? J(r.eh) : null,
    extra_data: r.x ? J(r.x) : null, source: r.s || 'AstroAnsh Class 13',
  });

  // ════ COMBUST PLANET EFFECTS (Ch. 6) ════
  add('combust_planet','Moon',{ t:'Combust Moon (Chandra Maudhya)', th:'चंद्र अस्त',
    d:'When the Moon is within 12° of the Sun it creates the Amavasya (new-Moon) condition. The Moon rules mind (Manas), mother, emotions, intuition and nourishment — combustion severely weakens these areas.',
    dh:'जब चंद्रमा सूर्य से 12° के भीतर हो तो अमावस्या की स्थिति बनती है। चंद्र मन, माता, भावनाओं, अंतर्ज्ञान और पोषण का कारक है — अस्त इन क्षेत्रों को गंभीर रूप से कमज़ोर करती है।',
    e:['Mental instability, anxiety and emotional imbalance','Troubled relationship with mother or maternal figures','Poor sleep, insomnia and vivid nightmares','Weakened immunity and digestive issues (Moon rules stomach)','Difficulty reading public mood — important for politicians and teachers'],
    eh:['मानसिक अस्थिरता, चिंता और भावनात्मक असंतुलन','माता या मातृ पक्ष से कठिन संबंध','नींद में गड़बड़ी, अनिद्रा और जीवंत स्वप्न','कमज़ोर प्रतिरक्षा और पाचन समस्याएं (चंद्र पेट का कारक)','जन-मानस की मनोदशा समझने में कठिनाई'],
    x:{ orb:12, deep_orb:6, exception_en:'A combust Moon near the Sun can give tremendous drive and ambition, especially in the 10th house — the native works tirelessly but often at the cost of emotional fulfilment.', exception_hi:'सूर्य के निकट अस्त चंद्र कभी-कभी जबरदस्त उत्साह देता है, विशेषकर दसवें भाव में — जातक अथक परिश्रम करता है किंतु भावनात्मक संतुष्टि की कीमत पर।' }, s:'BPHS, Ch. 3' });
  add('combust_planet','Mars',{ t:'Combust Mars (Mangal Maudhya)', th:'मंगल अस्त',
    d:'Mars combustion (within 17°) weakens courage, drive and the ability to fight adversity. Mars rules energy, brothers, property, blood and military-police matters.',
    dh:'मंगल अस्त (17° के भीतर) साहस, उत्साह और विपरीत परिस्थितियों से लड़ने की क्षमता कमज़ोर करती है। मंगल ऊर्जा, भाई, संपत्ति, रक्त का कारक है।',
    e:['Reduced physical stamina and vitality; blood-related health issues','Conflicts with brothers; difficulties in property matters','Suppressed anger leading to depression or sudden outbursts','Accidents and surgeries possible, especially during Mars dasha','Courage to face enemies weakened; may shy away from confrontation'],
    eh:['शारीरिक सहनशक्ति में कमी; रक्त-संबंधित समस्याएं','भाइयों से विवाद; संपत्ति में कठिनाइयां','दबा क्रोध — अवसाद या अचानक विस्फोट','मंगल दशा में दुर्घटनाएं और ऑपरेशन संभव','शत्रुओं का सामना करने का साहस कमज़ोर'],
    x:{ orb:17, deep_orb:8 }, s:'BPHS, Phaladeepika' });
  add('combust_planet','Mercury',{ t:'Combust Mercury (Budha Maudhya)', th:'बुध अस्त',
    d:'Mercury is the Sun\'s minister and most naturally associates with it, yet within 14° (direct) or 12° (retrograde) its positive significations of intellect, communication and business are reduced.',
    dh:'बुध सूर्य का मंत्री है, फिर भी 14° (सीधा) या 12° (वक्री) के भीतर बुद्धि, संचार और व्यापार के कारकत्व घट जाते हैं।',
    e:['Communication difficulties; misunderstandings in writing and speech','Business judgment clouded; poor commercial decision-making','Learning difficulties possible in early childhood; nervous system issues','Skin conditions and respiratory issues (Mercury rules skin and lungs)'],
    eh:['संचार में कठिनाई; लेखन और वाणी में गलतफहमियां','व्यावसायिक निर्णय धुंधले','बचपन में शिक्षण कठिनाइयां; तंत्रिका तंत्र की समस्याएं','त्वचा और श्वसन समस्याएं'],
    x:{ orb:14, orb_retro:12, deep_orb:5, exception_en:'Phaladeepika: very deep combust Mercury in the 5th or 9th house may produce great scholarly learning — solar energy amplifies the intellectual quest.', exception_hi:'फलदीपिका: पांचवें या नवें भाव में अति गहरी अस्त में बुध महान विद्वान बना सकता है — सौर ऊर्जा बौद्धिक खोज बढ़ाती है।' }, s:'Saravali, BPHS' });
  add('combust_planet','Jupiter',{ t:'Combust Jupiter (Guru Maudhya)', th:'गुरु अस्त',
    d:'Jupiter combustion (within 11°) is highly significant — Jupiter is the greatest natural benefic. When the guru is combust, the native may lack proper guidance, wisdom or spiritual direction.',
    dh:'गुरु अस्त (11° के भीतर) अत्यंत महत्वपूर्ण है — गुरु सर्वोच्च नैसर्गिक शुभ ग्रह है। गुरु अस्त होने पर उचित मार्गदर्शन, ज्ञान या आध्यात्मिक दिशा का अभाव हो सकता है।',
    e:['Lack of authentic spiritual guidance; may follow false teachers','Children may face difficulties; fertility issues for women','Liver, fat metabolism and obesity-related issues','Financial wisdom impaired; poor long-term investments','Religious and philosophical knowledge may be superficial'],
    eh:['प्रामाणिक मार्गदर्शन का अभाव; झूठे गुरुओं का अनुसरण','संतान को कठिनाइयां; प्रजनन समस्याएं','जिगर, वसा चयापचय और मोटापे की समस्याएं','वित्तीय बुद्धि बाधित; निवेश निर्णय कमज़ोर','धार्मिक-दार्शनिक ज्ञान सतही हो सकता है'],
    x:{ orb:11, deep_orb:5 }, s:'Jataka Parijata' });
  add('combust_planet','Venus',{ t:'Combust Venus (Shukra Maudhya)', th:'शुक्र अस्त',
    d:'Venus rules love, beauty, arts, luxury and marital happiness. Combust within 10° (direct) or 8° (retrograde), the capacity for love, enjoyment and aesthetics is greatly reduced — especially significant for marriage.',
    dh:'शुक्र प्रेम, सौंदर्य, कला और वैवाहिक सुख का ग्रह है। 10° (सीधा) या 8° (वक्री) में अस्त होने पर प्रेम और सौंदर्य-बोध की क्षमता घट जाती है — विवाह के लिए विशेष महत्वपूर्ण।',
    e:['Marital disharmony; partner may be domineering or unwell','Artistic talents suppressed; difficulty in creative expression','Reproductive health issues (especially for women)','Financial management difficulties; prone to overspending'],
    eh:['वैवाहिक असामंजस्य; जीवनसाथी दबंग या अस्वस्थ','कलात्मक प्रतिभा दबी','प्रजनन स्वास्थ्य समस्याएं (विशेषकर महिलाओं में)','वित्तीय प्रबंधन कठिन; अत्यधिक खर्च'],
    x:{ orb:10, orb_retro:8, deep_orb:3 }, s:'Phaladeepika, BPHS' });
  add('combust_planet','Saturn',{ t:'Combust Saturn (Shani Maudhya)', th:'शनि अस्त',
    d:'Saturn combustion (within 15°) is challenging because Saturn and the Sun are natural enemies. Saturn rules discipline, karma, servants, longevity and perseverance — a combust Saturn indicates interrupted karmic lessons.',
    dh:'शनि अस्त (15° के भीतर) चुनौतीपूर्ण है क्योंकि शनि और सूर्य नैसर्गिक शत्रु हैं। अस्त शनि बाधित कार्मिक पाठों का संकेत है।',
    e:['Challenges with authority, seniors and government','Joint and bone issues; chronic diseases possible','Servants and employees may prove unreliable','Delayed justice and legal proceedings'],
    eh:['अधिकारियों, वरिष्ठों और सरकार से चुनौतियां','जोड़ों-हड्डियों की समस्याएं; पुरानी बीमारियां','कर्मचारी अविश्वसनीय हो सकते हैं','न्याय और कानूनी कार्यवाही में विलंब'],
    x:{ orb:15, deep_orb:7 }, s:'Uttara Kalamrita' });

  // ════ COMBUSTION HOUSE EFFECTS (Ch. 5) ════
  const CH = [
    ['Personality suppressed; lack of confidence; health issues related to the combust planet\'s body part; may serve authority rather than lead.','व्यक्तित्व दबा; आत्मविश्वास की कमी; अस्त ग्रह के अंगकारकत्व से स्वास्थ्य समस्याएं; नेतृत्व की बजाय सेवा की प्रवृत्ति।'],
    ['Wealth accumulation hindered; family disputes; speech affected; early education struggles.','धन संचय में बाधा; पारिवारिक विवाद; वाणी प्रभावित; प्रारंभिक शिक्षा में कठिनाई।'],
    ['Courage fluctuates; communication and sibling relations affected; short journeys face obstacles; media and writing talents subdued.','साहस में उतार-चढ़ाव; भाई-बहन संबंध प्रभावित; छोटी यात्राओं में बाधा; लेखन प्रतिभा दबी।'],
    ['Home, mother, vehicles and property matters troubled; lack of mental peace; weak academic foundation; real-estate losses possible.','घर, माता, वाहन और संपत्ति के मामले कठिन; मानसिक शांति का अभाव; अचल संपत्ति में हानि संभव।'],
    ['Difficulties in progeny, speculation and creative expression; intelligence not fully expressed; romance troubled.','संतान, सट्टे और रचनात्मकता में कठिनाई; बुद्धि पूर्ण प्रकट नहीं; प्रेम में बाधा।'],
    ['Enemies weakened — a positive effect! Service abilities compromised; planet-related health issues; debts may accumulate.','शत्रु कमज़ोर होते हैं — सकारात्मक प्रभाव! सेवा क्षमता कमज़ोर; ऋण जमा हो सकता है।'],
    ['Partnership and marriage severely affected; spouse may face health issues or a suppressed personality; business partnerships troubled.','साझेदारी और विवाह गंभीर प्रभावित; जीवनसाथी के स्वास्थ्य की समस्या; व्यावसायिक साझेदारी कठिन।'],
    ['Research, occult and inheritance matters complicated; longevity concerns; transformation possible but through hardship.','शोध, गुप्त विद्या और विरासत जटिल; दीर्घायु चिंताएं; कठिनाई से परिवर्तन।'],
    ['Fortune reduced; father, guru or religious inclinations suppressed; higher learning and dharma compromised.','भाग्य कम; पिता, गुरु या धार्मिक प्रवृत्तियां दबीं; उच्च शिक्षा और धर्म में बाधा।'],
    ['Career advancement hindered; authority figures may suppress the native; professional recognition delayed.','करियर उन्नति में बाधा; अधिकारी दबा सकते हैं; प्रतिष्ठा में देरी।'],
    ['Gains and social network affected; elder siblings may suffer; hopes and ambitions suppressed; income diminished.','लाभ और नेटवर्क प्रभावित; बड़े भाई-बहन कष्ट में; आय घटी।'],
    ['Losses, foreign travel and spiritual matters affected; sleep disturbances; expenses increase; moksha path obscured.','हानि, विदेश यात्रा और आध्यात्मिक मामले प्रभावित; नींद में गड़बड़ी; व्यय बढ़ता है।'],
  ];
  CH.forEach(([en, hi], h) => add('combust_house', `house_${h + 1}`, {
    t:`Combustion in House ${h + 1}`, th:`भाव ${h + 1} में अस्त`, d:en, dh:hi, s:'AstroAnsh Class 13, Ch. 5' }));

  // ════ RETROGRADE HOUSE EFFECTS (Ch. 9) ════
  const RH = [
    ['Strong personality but may appear confusing to others; intense inner life; revisiting personal identity; unusual striking appearance.','मजबूत किंतु भ्रमित करने वाला व्यक्तित्व; तीव्र आंतरिक जीवन; पहचान पर पुनर्विचार; प्रभावशाली उपस्थिति।'],
    ['Wealth through unconventional means; revisiting financial decisions; delayed but often substantial wealth; deep family karma.','अपरंपरागत साधनों से धन; वित्तीय निर्णयों पर पुनर्विचार; देर से किंतु पर्याप्त धन; गहरा पारिवारिक कर्म।'],
    ['Unusual communication style; strong writing ability; sibling karma intense; courage expressed unconventionally.','असामान्य संचार शैली; लेखन क्षमता प्रबल; भाई-बहन कर्म तीव्र; साहस की अनोखी अभिव्यक्ति।'],
    ['Deep home and mother karma; revisiting property decisions; rich inner emotional life; may relocate repeatedly.','गहरा घर-माता कर्म; संपत्ति निर्णयों पर पुनर्विचार; समृद्ध भावनात्मक जीवन; बार-बार स्थान परिवर्तन।'],
    ['Intense creative and intellectual potential; past-life karma with children; unconventional romance; deep philosophical thinking.','तीव्र रचनात्मक-बौद्धिक क्षमता; संतान से पूर्वजन्म कर्म; गहरी दार्शनिक सोच।'],
    ['Strong ability to defeat enemies through unconventional strategies; chronic but manageable health issues; excellent for healing professions.','अपरंपरागत रणनीति से शत्रु-विजय; पुरानी किंतु प्रबंधनीय स्वास्थ्य समस्याएं; उपचार व्यवसायों के लिए उत्कृष्ट।'],
    ['Delay in marriage very common; partner from past-life connection; unconventional partnerships requiring careful review.','विवाह में विलंब सामान्य; पिछले जन्म के संबंध से साथी; अपरंपरागत साझेदारियां।'],
    ['Deep interest in occult, mysticism and research; transformation through crisis; complicated inheritance; unusual longevity.','गुप्त विद्या और शोध में गहरी रुचि; संकट से परिवर्तन; विरासत जटिल।'],
    ['Questioning established religion; guru relationships carry past-life karma; fortune through unusual channels; deep spiritual searching.','स्थापित धर्म पर प्रश्न; गुरु संबंधों में पूर्वजन्म कर्म; असामान्य माध्यमों से भाग्य।'],
    ['Career may start late but become outstanding; unconventional profession; authority figures have karmic significance.','करियर देर से किंतु उत्कृष्ट; अपरंपरागत व्यवसाय; अधिकारियों का कार्मिक महत्व।'],
    ['Unusual income sources; friends from different backgrounds; gains through unconventional means.','असामान्य आय स्रोत; विविध मित्र; अपरंपरागत साधनों से लाभ।'],
    ['Excellent for spiritual practice, meditation and moksha; losses possible but deep inner peace; foreign connections through past-life karma.','साधना, ध्यान और मोक्ष के लिए उत्कृष्ट; हानि संभव किंतु गहरी शांति; पूर्वजन्म कर्म से विदेश संबंध।'],
  ];
  RH.forEach(([en, hi], h) => add('retro_house', `house_${h + 1}`, {
    t:`Retrograde Planet in House ${h + 1}`, th:`भाव ${h + 1} में वक्री ग्रह`, d:en, dh:hi, s:'BPHS, Saravali, Phaladeepika' }));

  // ════ RETROGRADE CLASSICAL RULES (Ch. 7, 8, 10-15, 20) ════
  const RULE = (k, r) => add('retro_rule', k, r);
  RULE('bphs_strength',{ t:'BPHS: Retrograde = Exaltation-level Strength', th:'BPHS: वक्री ग्रह उच्च-समान बलवान',
    d:'"Vakri grahah svochasamah phaladaataa" — a retrograde planet gives results equal to a planet in exaltation. Even a debilitated planet in retrograde gives exaltation-like results. Retrograde benefics give excellent results in their dashas.',
    dh:'"वक्री ग्रहः स्वोच्चसमः फलदाता" — वक्री ग्रह उच्च राशि के ग्रह के समान फल देता है। नीच राशि में भी वक्री ग्रह उच्च के समान फल देता है। वक्री शुभ ग्रह अपनी दशाओं में उत्कृष्ट फल देते हैं।', s:'BPHS, Graha Bala Adhyaya' });
  RULE('phaladeepika_motion',{ t:'Phaladeepika: Retrograde Jupiter vs Saturn', th:'फलदीपिका: वक्री गुरु बनाम शनि',
    d:'When Jupiter is retrograde, dharma and religious works get fulfilled. When Saturn is retrograde, legal matters and justice-related work face obstacles.',
    dh:'जब गुरु वक्री होता है, धर्म-कार्य सिद्ध होते हैं। जब शनि वक्री होता है, कानूनी मामलों और न्याय-कार्य में बाधा आती है।', s:'Phaladeepika' });
  RULE('saravali_rules',{ t:'Saravali: Internal Results & Marriage Delay', th:'सारावली: आंतरिक फल एवं विवाह विलंब',
    d:'Retrograde planets are highly powerful in directional strength (Digbala). A retrograde planet in the 7th can delay marriage, but the eventual partner may be highly accomplished. Retrogrades tend to give results internally — spiritually and psychologically rather than materially.',
    dh:'वक्री ग्रह दिग्बल में अत्यंत शक्तिशाली होते हैं। सप्तम में वक्री ग्रह विवाह में विलंब करता है किंतु जीवनसाथी प्रतिभाशाली होता है। वक्री ग्रह आंतरिक — आध्यात्मिक और मनोवैज्ञानिक — फल देते हैं।', s:'Saravali' });
  RULE('jataka_three_phases',{ t:'Jataka Parijata: Three Phases of Retrogression', th:'जातकपारिजात: वक्री गति के तीन चरण',
    d:'Retrogression has three phases — the beginning (Vakra-arambha), the middle (Vakra-madhya), and the end (Marga-arambha when the planet turns direct). Each phase colours results differently.',
    dh:'वक्री गति के तीन चरण — प्रारंभ (वक्र-आरंभ), मध्य (वक्र-मध्य) और अंत (मार्ग-आरंभ)। हर चरण फल को अलग रंग देता है।', s:'Jataka Parijata' });
  RULE('retro_benefics',{ t:'Retrograde Benefics (Jupiter, Venus)', th:'वक्री शुभ ग्रह (गुरु, शुक्र)',
    d:'Retrograde benefics give enhanced positive results — often through delayed but substantial rewards, revisiting and rectifying past mistakes, or unconventional channels. Retrograde Jupiter blesses immense wisdom and spiritual depth; such people often become teachers or philosophers after a period of inner searching.',
    dh:'वक्री शुभ ग्रह उन्नत सकारात्मक फल देते हैं — देरी से किंतु पर्याप्त पुरस्कार, गलतियों के सुधार या अनोखे माध्यमों से। वक्री गुरु अपार ज्ञान और आध्यात्मिक गहराई देता है; ऐसे व्यक्ति आंतरिक खोज के बाद शिक्षक या दार्शनिक बनते हैं।', s:'AstroAnsh Class 13, Ch. 10' });
  RULE('retro_malefics',{ t:'Retrograde Malefics (Saturn, Mars)', th:'वक्री अशुभ ग्रह (शनि, मंगल)',
    d:'Retrograde malefics gain strength but channel it through intensified difficulty. Retrograde Saturn: deep karmic debts must be paid; justice comes but the path is long — excellent for spirituality. Retrograde Mars: intense, sometimes impulsive energy needing careful channeling; accident-prone in the 8th; exceptional courage and investigative ability.',
    dh:'वक्री अशुभ ग्रह बल पाते हैं किंतु तीव्र कठिनाई से व्यक्त करते हैं। वक्री शनि: गहरे कार्मिक ऋण; न्याय आता है पर मार्ग लंबा — आध्यात्मिकता के लिए उत्कृष्ट। वक्री मंगल: तीव्र ऊर्जा जिसे दिशा चाहिए; अष्टम में दुर्घटना-प्रवण; असाधारण साहस।', s:'AstroAnsh Class 13, Ch. 10' });
  RULE('vakri_uchcha',{ t:'Retrograde Exalted Planet (Vakri Uchcha)', th:'वक्री उच्च ग्रह',
    d:'A retrograde exalted planet is "doubly exalted" in inherent power, but this power expresses in unusual, hidden or delayed ways. Retrograde exalted Jupiter is among the most powerful placements for wisdom — yet its greatest insights typically arrive after age 35-40.',
    dh:'वक्री उच्च ग्रह अंतर्निहित शक्ति में "दोगुना उच्च" होता है, किंतु शक्ति असामान्य, छिपे या विलंबित रूप से व्यक्त होती है। वक्री उच्च गुरु ज्ञान का सर्वाधिक शक्तिशाली स्थान है — पर सबसे बड़ी अंतर्दृष्टि 35-40 वर्ष के बाद आती है।', s:'BPHS; AstroAnsh Class 13, Ch. 11' });
  RULE('vakri_neechabhanga',{ t:'Vakri Neechabhanga: Retrograde Cancels Debilitation', th:'वक्री नीचभंग: वक्रता से नीच का खंडन',
    d:'"Neeche vakri gate bhoume raajayogasamam phalam" — a debilitated planet in retrograde motion gives Rajayoga-like results. The debilitation\'s negatives are cancelled or reduced, but results manifest in unusual, non-linear ways and often after considerable struggle. Do not apply mechanically.',
    dh:'"नीचे वक्री गते भौमे राजयोगसमं फलम्" — नीच राशि में वक्री ग्रह राजयोग समान फल देता है। नीच के नकारात्मक प्रभाव रद्द या कम होते हैं, किंतु फल असामान्य रूप से और प्रायः संघर्ष के बाद मिलते हैं। यांत्रिक रूप से लागू न करें।', s:'BPHS' });
  RULE('retro_mahadasha',{ t:'Retrograde Mahadasha / Antardasha Lord', th:'वक्री महादशेश / अंतर्दशेश',
    d:'Results of a retrograde dasha lord are intense and unusual — often starting with delays or setbacks. The breakthrough typically comes in the middle third of the period. Past-life karma surfaces strongly. Benefic retrograde lords ultimately give outstanding results, especially in the last phase; malefic ones intensify challenges that dharmic perseverance resolves.',
    dh:'वक्री दशेश के फल तीव्र और असामान्य — प्रायः देरी या असफलता से शुरू। सफलता दशा के मध्य तृतीयांश में मिलती है। पूर्वजन्म कर्म प्रबल रूप से उभरता है। शुभ वक्री दशेश अंततः उत्कृष्ट फल देते हैं; अशुभ की चुनौतियां धार्मिक दृढ़ता से हल होती हैं।', s:'AstroAnsh Class 13, Ch. 12' });
  RULE('natal_vs_transit',{ t:'Natal Retrograde vs Transit Retrograde', th:'जन्मकालीन बनाम गोचर वक्री',
    d:'A natal retrograde planet indicates deeply ingrained karmic patterns carried from previous lives that must be processed in this lifetime. A transiting retrograde only temporarily activates related themes.',
    dh:'जन्मकालीन वक्री ग्रह पिछले जन्मों से लाए गहरे कार्मिक पैटर्न दर्शाता है। गोचर वक्री केवल अस्थायी रूप से संबंधित विषय सक्रिय करता है।', s:'AstroAnsh Class 13, Ch. 12' });
  RULE('navamsha_d9',{ t:'Retrograde in D-1 vs D-9 (Navamsha)', th:'D-1 बनाम D-9 में वक्री',
    d:'Retrograde in D-1 but direct in D-9: soul-level qualities express straightforwardly while physical manifestation is unusual or delayed. Direct in D-1 but retrograde in D-9: external life seems normal but there is deep inner searching and karmic complexity. Retrograde in BOTH D-1 and D-9 is an extremely powerful karmic signature — that planet\'s dasha is often transformative and life-changing.',
    dh:'D-1 में वक्री, D-9 में सीधा: आत्मा-स्तरीय गुण सीधे व्यक्त, भौतिक प्रकटन विलंबित। D-1 में सीधा, D-9 में वक्री: बाहरी जीवन सामान्य पर गहरी आंतरिक खोज। दोनों में वक्री: अत्यंत शक्तिशाली कार्मिक हस्ताक्षर — उस ग्रह की दशा जीवन-परिवर्तनकारी होती है।', s:'AstroAnsh Class 13, Ch. 13' });
  RULE('five_retro_blessing',{ t:'Five Retrograde Benefics = Royal Fortune', th:'पाँच वक्री शुभ ग्रह = राजसी भाग्य',
    d:'"Yasya janmani vakreebhootaah pancha grahaah shubhaah..." — one with five benefic planets retrograde at birth obtains power, wealth, happiness, fame and glory. Modern research (B.V. Raman school) finds 3+ natal retrogrades correlate with spiritual seeking and unconventional life paths — but also delayed milestones.',
    dh:'जिसकी कुंडली में पाँच शुभ ग्रह वक्री हों, उसे राज्य, धन, सुख, यश और कीर्ति मिलती है। आधुनिक शोध: 3+ वक्री ग्रह आध्यात्मिक खोज और अपरंपरागत जीवन से जुड़े — किंतु मील के पत्थरों में देरी भी।', s:'Jataka Parijata; B.V. Raman school' });
  RULE('stationary_paraspara',{ t:'Stationary Points & Paraspara Vakra', th:'स्थिर बिंदु एवं परस्पर वक्र',
    d:'Planets at their exact stationary points (Vakra-arambha / Marga-arambha) are extremely powerful — energy concentrated like a person pausing before decisive action. Two planets retrograde in the same sign form the rare "Paraspara Vakra" — an intensified karmic field in that house. Mainstream BPHS does NOT support reverse aspects for retrogrades; some commentators consider their aspect "double-loaded".',
    dh:'सटीक स्थिर बिंदुओं पर ग्रह अत्यंत शक्तिशाली होते हैं। एक ही राशि में दो वक्री ग्रह दुर्लभ "परस्पर वक्र" बनाते हैं — तीव्र कार्मिक क्षेत्र। मुख्यधारा BPHS उल्टी दृष्टि का समर्थन नहीं करती।', s:'AstroAnsh Class 13, Ch. 20' });

  // ════ COMBUSTION RULES (Ch. 1, 4, 14, 20) ════
  add('combust_rule','maudhya_meaning',{ t:'Maudhya: The Stupefied Minister', th:'मौध्य: मूढ़ मंत्री',
    d:'"Maudhya" derives from "Mudha" — confused, stupefied. A combust planet loses direction and clarity, like a minister whose counsel goes unheard because the king (Sun) dominates the assembly. Combustion is one of the six major Shadbala defects. Rahu and Ketu never combust — they are shadow planets with no light of their own.',
    dh:'"मौध्य" शब्द "मूढ़" से बना है — भ्रमित। अस्त ग्रह दिशा और स्पष्टता खो देता है, उस मंत्री के समान जिसकी बात राजा (सूर्य) की सभा में नहीं सुनी जाती। राहु-केतु कभी अस्त नहीं होते — वे छाया ग्रह हैं।', s:'BPHS, Graha Maudhya Adhyaya' });
  add('combust_rule','deep_vs_mild',{ t:'Deep vs Mild Combustion', th:'गहरी बनाम साधारण अस्त',
    d:'Deep combustion (within ~50% of the orb): planet almost completely overwhelmed — significations 80-100% damaged, yogas largely cancelled, very difficult dasha, strong remedies needed. Mild combustion (50-100% of orb): planet weakened but not destroyed — 40-60% signification loss, yogas weakened with partial results; it can still perform if in a strong sign or aspected by a benefic.',
    dh:'गहरी अस्त (सीमा के ~50% भीतर): ग्रह लगभग पूर्ण आच्छादित — कारकत्व 80-100% क्षतिग्रस्त, योग रद्द, कठिन दशा, शक्तिशाली उपाय आवश्यक। साधारण अस्त (50-100%): ग्रह दुर्बल पर नष्ट नहीं — बलवान राशि या शुभ दृष्टि होने पर कुछ फल देता है।',
    x:{ deep_orbs:{ Moon:6, Mars:8, Mercury:5, Jupiter:5, Venus:3, Saturn:7 } }, s:'AstroAnsh Class 13, Ch. 4' });
  add('combust_rule','udaya_rising',{ t:'Udaya: Emerging From Combustion (Heliacal Rising)', th:'उदय: अस्त से बाहर निकलना',
    d:'A planet emerging from combustion (Udaya) is energized and reborn — it often bestows unexpected positive results, especially if the Udaya occurs during that planet\'s own dasha.',
    dh:'अस्त से बाहर निकलता ग्रह (उदय) ऊर्जावान और पुनर्जन्मित होता है — विशेषकर उसकी अपनी दशा में अप्रत्याशित शुभ फल देता है।', s:'AstroAnsh Class 13, Ch. 20' });
  add('combust_rule','combust_retro_fact',{ t:'Only Mercury & Venus Can Be Combust + Retrograde', th:'केवल बुध-शुक्र ही अस्त+वक्री हो सकते हैं',
    d:'Critical astronomical fact: outer planets (Mars, Jupiter, Saturn) are NEVER simultaneously combust and retrograde — they retrograde near opposition, at maximum distance from the Sun. Only the inner planets Mercury and Venus can be both combust and retrograde — a rare and highly significant placement.',
    dh:'महत्वपूर्ण तथ्य: बाह्य ग्रह (मंगल, गुरु, शनि) कभी एक साथ अस्त और वक्री नहीं होते — वे प्रतियोग के निकट वक्री होते हैं। केवल बुध और शुक्र ही अस्त+वक्री हो सकते हैं — दुर्लभ एवं महत्वपूर्ण स्थिति।', s:'AstroAnsh Class 13, Ch. 14' });

  // ════ REMEDIES (Ch. 18) ════
  const REM = {
    Moon:    ['ॐ सों सोमाय नमः | Om Som Somaay Namah','White rice, milk, silver on Monday','सोमवार को सफेद चावल, दूध, चाँदी','Chandra Yantra','Pearl (Moti)','Lord Shiva, Goddess Parvati'],
    Mars:    ['ॐ अं अंगारकाय नमः | Om Ang Angarakaay Namah','Red lentils, copper on Tuesday','मंगलवार को लाल मसूर, ताँबा','Mangal Yantra','Red Coral (Moonga)','Lord Hanuman, Kartikeya'],
    Mercury: ['ॐ बुं बुधाय नमः | Om Bum Budhaay Namah','Green moong dal on Wednesday','बुधवार को हरी मूँग दाल','Budha Yantra','Emerald (Panna)','Lord Vishnu, Goddess Lakshmi'],
    Jupiter: ['ॐ बृं बृहस्पतये नमः | Om Brim Brihaspataye Namah','Yellow gram, gold on Thursday','गुरुवार को पीली चना, सोना','Guru Yantra','Yellow Sapphire (Pukhraj)','Lord Brahma, Guru Brihaspati'],
    Venus:   ['ॐ शुं शुक्राय नमः | Om Shum Shukraay Namah','White cow, white clothes on Friday','शुक्रवार को सफेद गाय, सफेद वस्त्र','Shukra Yantra','Diamond / White Sapphire','Goddess Lakshmi, Goddess Parvati'],
    Saturn:  ['ॐ शं शनैश्चराय नमः | Om Sham Shanaishcharaay Namah','Black sesame, iron on Saturday','शनिवार को काले तिल, लोहा','Shani Yantra','Blue Sapphire (Neelam) — only after consultation & 3-day trial','Lord Shiva, Lord Hanuman'],
  };
  Object.entries(REM).forEach(([p, [mantra, daan, daan_hi, yantra, gem, deity]]) => add('remedy', p, {
    t:`Remedies for ${p}`, th:`${p} के उपाय`,
    x:{ mantra, daan_en:daan, daan_hi, yantra, gemstone:gem, deity }, s:'AstroAnsh Class 13, Ch. 18' }));
  add('remedy','combust_special',{ t:'Special Remedies for Combust Planets', th:'अस्त ग्रहों के विशेष उपाय',
    e:['Surya Namaskar at sunrise — strengthens the Sun and harmonises its relationship with the native\'s energy','Aditya Hridayam Stotra recitation — pacifies solar energy so combust planets regain expression','Fasting on the weekday ruled by the combust planet'],
    eh:['सूर्योदय पर सूर्य नमस्कार — सूर्य को बल देता है और जातक की ऊर्जा से तालमेल बैठाता है','आदित्य हृदयम् स्तोत्र पाठ — सौर ऊर्जा शांत होती है, अस्त ग्रह पुनः व्यक्त होता है','अस्त ग्रह के वार का उपवास'], s:'AstroAnsh Class 13, Ch. 18' });
  add('remedy','retro_special',{ t:'Special Remedies for Retrograde Planets', th:'वक्री ग्रहों के विशेष उपाय',
    e:['Pitru Tarpana and ancestor worship — retrogrades often indicate unresolved karmic debts to ancestors','Navagraha Puja — harmonises the entire planetary system','Meditation and Yoga — retrograde energy is fundamentally internal and responds best to inner discipline'],
    eh:['पितृ तर्पण और पूर्वज पूजा — वक्री ग्रह पूर्वजों के अनसुलझे कार्मिक ऋण दर्शाते हैं','नवग्रह पूजा — संपूर्ण ग्रह तंत्र में सामंजस्य','ध्यान और योग — वक्री ऊर्जा मूलतः आंतरिक है, आंतरिक अनुशासन से श्रेष्ठ फल'], s:'AstroAnsh Class 13, Ch. 18' });

  // ════ MISCONCEPTIONS (Ch. 19) ════
  add('misconception','mercury_retro',{ t:'Misconception: Mercury Retrograde Ruins Everything', th:'भ्रांति: बुध वक्री सब बर्बाद करता है',
    d:'Western pop-astrology oversimplifies. In classical Jyotish, retrograde Mercury is a POWERFUL placement giving enhanced intellect, research skill and deep introspective thinking. Challenges are real but manageable.',
    dh:'पश्चिमी ज्योतिष का अति-सरलीकरण। शास्त्रीय ज्योतिष में बुध वक्री शक्तिशाली स्थिति है — उन्नत बुद्धि, शोध कौशल और गहरा चिंतन देती है।', s:'AstroAnsh Class 13, Ch. 19' });
  add('misconception','combust_useless',{ t:'Misconception: Combust Planets Are Completely Useless', th:'भ्रांति: अस्त ग्रह पूर्णतः निरर्थक',
    d:'Combustion weakens but does not nullify. A combust planet still gives results through its house lordship — especially when that house is activated in dasha. Near exaltation or in own sign, it retains considerable strength.',
    dh:'अस्त कमज़ोर करती है, निष्प्रभावी नहीं। अस्त ग्रह भाव-स्वामित्व से फल देता है — विशेषकर दशा में। उच्च के निकट या स्व-राशि में पर्याप्त बल रहता है।', s:'AstroAnsh Class 13, Ch. 19' });
  add('misconception','retro_is_bad',{ t:'Misconception: Retrograde Means Bad', th:'भ्रांति: वक्री अर्थात् अशुभ',
    d:'Classical Jyotish is unequivocal: a retrograde planet GAINS strength. Confusion arises because retrogrades express energy in unusual, internal or delayed ways that look like weakness. A retrograde benefic is often MORE powerful than a direct one.',
    dh:'शास्त्र स्पष्ट है: वक्री ग्रह बल पाता है, खोता नहीं। भ्रम इसलिए कि वक्री ऊर्जा असामान्य, आंतरिक या विलंबित रूप से व्यक्त होती है। वक्री शुभ ग्रह प्रायः सीधे से अधिक शक्तिशाली होता है।', s:'AstroAnsh Class 13, Ch. 19' });

  // ════ STRENGTH RANKING (Summary table) ════
  const RANKS = [
    ['exalted_direct','Exalted Direct','उच्च सीधा',5,'Excellent','High','Low'],
    ['retrograde_any','Retrograde (any sign)','वक्री (किसी राशि में)',4,'Good–Very Good','High','Moderate'],
    ['own_direct','Own Sign Direct','स्व राशि सीधा',4,'Good','Moderate','Low'],
    ['retro_neecha','Retrograde Debilitated','वक्री नीच',3,'Mixed–Good','Moderate','Moderate'],
    ['neecha_direct','Debilitated Direct','नीच सीधा',2,'Challenging','Low','High'],
    ['combust','Combust (Maudhya)','अस्त',1,'Poor–Moderate','Very Low','High'],
    ['combust_neecha','Combust + Debilitated','अस्त नीच',0,'Very Poor','Negligible','Very High'],
  ];
  RANKS.forEach(([k, en, hi, stars, dasha, yoga, remedy]) => add('strength_rank', k, {
    t: en, th: hi, x:{ stars, dasha_results: dasha, yoga_potential: yoga, remedy_need: remedy }, s:'AstroAnsh Class 13, Summary' }));

  await knex('asta_vakri_library').insert(rows);
};
