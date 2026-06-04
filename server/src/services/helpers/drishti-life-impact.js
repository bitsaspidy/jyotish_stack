'use strict';
/**
 * Graha Drishti — Detailed Life-Area Impact Engine
 *
 * For every (aspecting planet × aspected planet × house) combination,
 * generates practical interpretations across 7 life areas:
 * Self, Family, Spouse/Relationships, Money, Career, Health, Spirituality
 *
 * Formula: planet_karakatva + house_modifier + aspecting_planet_effect
 */

// ─── Planet names ─────────────────────────────────────────────────────────────
const PH = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध', Jupiter:'गुरु',
  Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु',
};

const ph = (p) => PH[p] || p;

// ─── 1. PLANET KARAKATVA  (what each planet governs in each life area) ────────

const PLANET_KARAKATVA = {
  Sun: {
    self:   { en: 'your soul, ego, confidence, authority, and physical vitality',
              hi: 'आत्मा, आत्मविश्वास, अहंकार, अधिकार और शारीरिक ऊर्जा' },
    family: { en: 'your father, paternal lineage, and authority figures in the family',
              hi: 'पिता, पितृ वंश और परिवार के अधिकारिक व्यक्ति' },
    spouse: { en: 'a partner with authority, official status, government connections, or commanding nature',
              hi: 'अधिकार, सरकारी संपर्क या प्रभावी व्यक्तित्व वाला जीवनसाथी' },
    money:  { en: 'income through government, authority, gold, fame, or prestige-related work',
              hi: 'सरकार, सोना, प्रतिष्ठा या अधिकार से प्राप्त आय' },
    career: { en: 'government service, politics, senior administration, leadership roles, and medical management',
              hi: 'सरकारी सेवा, राजनीति, वरिष्ठ प्रशासन और नेतृत्व' },
    health: { en: 'heart, spine, right eye, bones, and overall physical constitution',
              hi: 'हृदय, रीढ़, दाहिनी आँख, हड्डियाँ और समग्र शारीरिक ढाँचा' },
    spirit: { en: 'the Atma — inner light, soul purpose, divine will, and dharmic clarity',
              hi: 'आत्मा — आंतरिक प्रकाश, जीवन उद्देश्य और धार्मिक स्पष्टता' },
  },

  Moon: {
    self:   { en: 'your mind, emotions, memory, intuition, mood, and public image',
              hi: 'मन, भावनाएँ, स्मृति, अंतर्ज्ञान और लोक-छवि' },
    family: { en: 'your mother, maternal care, domestic comfort, and home environment',
              hi: 'माता, मातृत्व, घरेलू सुख और पारिवारिक वातावरण' },
    spouse: { en: 'an emotionally sensitive, nurturing, and caring partner — one with fluctuating moods',
              hi: 'भावनात्मक, पालन-पोषण करने वाला और संवेदनशील जीवनसाथी' },
    money:  { en: 'income through public dealings, food, dairy, real estate, or fluctuating business',
              hi: 'जन-व्यापार, भोजन, डेयरी, अचल संपत्ति या उतार-चढ़ाव वाले व्यापार से आय' },
    career: { en: 'nursing, hospitality, public relations, food industry, psychology, and care-giving roles',
              hi: 'नर्सिंग, आतिथ्य, जनसंपर्क, खाद्य उद्योग और मनोविज्ञान' },
    health: { en: 'mental health, lungs, chest, stomach, blood, left eye, and sleep patterns',
              hi: 'मानसिक स्वास्थ्य, फेफड़े, सीना, पेट, रक्त और नींद' },
    spirit: { en: 'devotion, inner peace, intuitive prayer, the divine mother, and meditative stillness',
              hi: 'भक्ति, आंतरिक शांति, अंतर्ज्ञान और माँ की कृपा' },
  },

  Mars: {
    self:   { en: 'your energy, courage, aggression, competitive drive, and physical stamina',
              hi: 'ऊर्जा, साहस, प्रतिस्पर्धी भावना और शारीरिक शक्ति' },
    family: { en: 'younger siblings, conflicts, passion within family, and property matters',
              hi: 'छोटे भाई-बहन, पारिवारिक विवाद, जोश और संपत्ति विषय' },
    spouse: { en: 'a passionate, assertive, physically active partner — possible intensity or conflicts in the relationship',
              hi: 'जोशीला, दृढ़ और सक्रिय जीवनसाथी — संबंध में तीव्रता या विवाद भी संभव' },
    money:  { en: 'income through property, land, engineering, competition, or physical effort',
              hi: 'संपत्ति, भूमि, इंजीनियरिंग, प्रतिस्पर्धा या शारीरिक श्रम से आय' },
    career: { en: 'military, police, surgery, engineering, sports, fire services, and competitive fields',
              hi: 'सेना, पुलिस, शल्यचिकित्सा, इंजीनियरिंग, खेल और प्रतिस्पर्धी क्षेत्र' },
    health: { en: 'blood pressure, muscles, fever, accidents, inflammations, and surgery risks',
              hi: 'रक्तचाप, मांसपेशियाँ, बुखार, दुर्घटनाएँ, सूजन और सर्जरी' },
    spirit: { en: 'courageous spiritual practice, fire rituals, warrior dharma, and Hanuman worship',
              hi: 'साहसी साधना, अग्नि अनुष्ठान, वीर धर्म और हनुमान उपासना' },
  },

  Mercury: {
    self:   { en: 'your intelligence, communication skills, analytical mind, adaptability, and youthfulness',
              hi: 'बुद्धि, संचार कौशल, विश्लेषण क्षमता और युवा ऊर्जा' },
    family: { en: 'maternal uncles/aunts, cousins, communication within the family, and younger members',
              hi: 'मामा, मामी, चचेरे भाई-बहन और पारिवारिक संवाद' },
    spouse: { en: 'an intellectual, witty, communicative, and adaptable partner — possibly younger or dual-natured',
              hi: 'बुद्धिमान, चतुर, संवादशील और अनुकूलनीय जीवनसाथी' },
    money:  { en: 'income through trading, business, financial analysis, writing, or multiple streams',
              hi: 'व्यापार, वित्तीय विश्लेषण, लेखन या एकाधिक आय स्रोतों से धन' },
    career: { en: 'writing, journalism, IT, accounting, sales, consulting, and communication roles',
              hi: 'लेखन, पत्रकारिता, आईटी, लेखाकार, बिक्री और परामर्श' },
    health: { en: 'nervous system, skin, respiratory health, hands/arms, and digestive system',
              hi: 'तंत्रिका तंत्र, त्वचा, श्वसन, हाथ-भुजाएँ और पाचन' },
    spirit: { en: 'Vedic study, scriptural knowledge, analytical devotion, and Vishnu worship',
              hi: 'वेदाध्ययन, शास्त्र ज्ञान, विश्लेषणात्मक भक्ति और विष्णु उपासना' },
  },

  Jupiter: {
    self:   { en: 'your wisdom, optimism, faith, generosity, and philosophical outlook on life',
              hi: 'ज्ञान, आशावाद, श्रद्धा, उदारता और दार्शनिक दृष्टिकोण' },
    family: { en: 'children, the husband (in a female chart), elder wise figures, and guru-like elders',
              hi: 'संतान, पति (स्त्री कुंडली में), बुजुर्ग ज्ञानी व्यक्ति और गुरु' },
    spouse: { en: 'a wise, principled, dharmic, and generous partner — expansive and spiritually inclined',
              hi: 'बुद्धिमान, सिद्धांतवादी, धार्मिक और उदार जीवनसाथी' },
    money:  { en: 'wealth accumulation, banking, investments, business expansion, and dharmic prosperity',
              hi: 'धन संग्रह, बैंकिंग, निवेश, व्यापार विस्तार और धार्मिक समृद्धि' },
    career: { en: 'teaching, law, finance, advisory roles, clergy, counseling, and higher education',
              hi: 'शिक्षण, कानून, वित्त, परामर्श, पुरोहित और उच्च शिक्षा' },
    health: { en: 'liver, fat metabolism, immunity, thyroid, growth, and overall bodily expansion',
              hi: 'यकृत, वसा-चयापचय, रोग प्रतिरोधक क्षमता, थायरॉइड और शारीरिक वृद्धि' },
    spirit: { en: 'dharma, guru\'s grace, religious devotion, higher philosophy, and divine blessings',
              hi: 'धर्म, गुरु कृपा, धार्मिक भक्ति, उच्च दर्शन और ईश्वरीय आशीर्वाद' },
  },

  Venus: {
    self:   { en: 'your beauty, charm, artistic sensitivity, social grace, and love of pleasure',
              hi: 'सौंदर्य, आकर्षण, कलात्मक संवेदनशीलता, सामाजिक शालीनता और सुख-भोग' },
    family: { en: 'the wife (in a male chart), harmony at home, comforts, and family pleasures',
              hi: 'पत्नी (पुरुष कुंडली में), घरेलू सामंजस्य, सुख-सुविधाएँ और पारिवारिक आनंद' },
    spouse: { en: 'a beautiful, charming, artistic, and luxury-loving partner — the primary wife karaka',
              hi: 'सुंदर, आकर्षक, कलाप्रिय और विलास-प्रेमी जीवनसाथी — पत्नी कारक' },
    money:  { en: 'income through luxury goods, jewelry, entertainment, art, beauty, and creative ventures',
              hi: 'विलास वस्तुएँ, आभूषण, मनोरंजन, कला और सौंदर्य से आय' },
    career: { en: 'arts, entertainment, fashion, design, beauty industry, hospitality, and luxury goods',
              hi: 'कला, मनोरंजन, फैशन, डिज़ाइन, सौंदर्य उद्योग और आतिथ्य' },
    health: { en: 'kidneys, reproductive system, blood sugar/diabetes, throat, and skin radiance',
              hi: 'गुर्दे, प्रजनन तंत्र, रक्त शर्करा, गला और त्वचा की चमक' },
    spirit: { en: 'Bhakti — devotion through love, sacred arts (music/dance), Lakshmi worship, and beauty as offering',
              hi: 'भक्ति — प्रेम के माध्यम से ईश्वर-संपर्क, संगीत-नृत्य, लक्ष्मी पूजा' },
  },

  Saturn: {
    self:   { en: 'your discipline, patience, karmic responsibility, endurance, and sense of duty',
              hi: 'अनुशासन, धैर्य, कर्म जिम्मेदारी, सहनशीलता और कर्तव्यबोध' },
    family: { en: 'longevity of family members, elderly relatives, servants, and the family\'s karmic burden',
              hi: 'पारिवारिक दीर्घायु, बुजुर्ग सदस्य, नौकर और परिवार का कर्म-भार' },
    spouse: { en: 'an older, serious, disciplined, or reserved partner — marriages may be delayed but lasting',
              hi: 'आयु में बड़ा, गंभीर, अनुशासित जीवनसाथी — विवाह में देरी पर टिकाऊ' },
    money:  { en: 'income earned through sustained hard work, persistence, and disciplined saving — slow but steady',
              hi: 'निरंतर परिश्रम, दृढ़ता और अनुशासित बचत से धन — धीमा पर स्थिर' },
    career: { en: 'service sector, labor, construction, mining, agriculture, law, justice, and long-term systems',
              hi: 'सेवा क्षेत्र, श्रम, निर्माण, खनन, कृषि, कानून और दीर्घकालिक व्यवस्थाएँ' },
    health: { en: 'bones, joints, arthritis, chronic diseases, teeth, skin aging, and Vata-related conditions',
              hi: 'हड्डियाँ, जोड़, गठिया, दीर्घकालिक रोग, दाँत, त्वचा-वृद्धावस्था और वात' },
    spirit: { en: 'karma yoga, patient service, long-term austerity, renunciation, and disciplined practice',
              hi: 'कर्म योग, धैर्यपूर्ण सेवा, दीर्घकालिक तपस्या और अनुशासित साधना' },
  },

  Rahu: {
    self:   { en: 'ambition, obsession, unconventional identity, foreign influence, and intense material desires',
              hi: 'महत्वाकांक्षा, जुनून, अपरंपरागत पहचान, विदेशी प्रभाव और भौतिक इच्छाएँ' },
    family: { en: 'unconventional family dynamics, disruption to tradition, and foreign connections in family',
              hi: 'अपरंपरागत पारिवारिक स्थिति, परंपरा में व्यवधान और परिवार में विदेशी संपर्क' },
    spouse: { en: 'a foreign, unconventional, or obsessive partner — extraordinary and unpredictable relationship dynamics',
              hi: 'विदेशी, अपरंपरागत या जुनूनी जीवनसाथी — असाधारण और अप्रत्याशित संबंध' },
    money:  { en: 'sudden gains or losses, speculative wealth, foreign currency, technology profits, and unconventional earnings',
              hi: 'अचानक लाभ-हानि, सट्टे की संपत्ति, विदेशी धन और तकनीकी आय' },
    career: { en: 'technology, foreign companies, media, innovation, politics, and unconventional or underground professions',
              hi: 'प्रौद्योगिकी, विदेशी कंपनियाँ, मीडिया, नवाचार और अपरंपरागत पेशे' },
    health: { en: 'unusual diseases, neurological/mental issues, skin conditions, viral infections, and chronic anxiety',
              hi: 'असामान्य रोग, तंत्रिका/मानसिक समस्याएँ, त्वचा, वायरल संक्रमण और दीर्घकालिक चिंता' },
    spirit: { en: 'material illusions and maya — but also the potential for sudden spiritual awakening and breaking old patterns',
              hi: 'माया और भ्रम — किंतु अचानक आध्यात्मिक जागृति और पुरानी लकीरों को तोड़ने की क्षमता' },
  },

  Ketu: {
    self:   { en: 'spiritual detachment, past-life karma, occult interests, isolation, and inner withdrawal',
              hi: 'आध्यात्मिक वैराग्य, पूर्वजन्म कर्म, रहस्यमय रुचि, एकांत और अंतर्मुखी प्रवृत्ति' },
    family: { en: 'karmic separation from family, past-life bonds with relatives, and a feeling of not belonging',
              hi: 'परिवार से कर्मिक अलगाव, पूर्वजन्म के रिश्ते और न-अपनापन की भावना' },
    spouse: { en: 'a spiritual, karmic past-life partner — phases of detachment, emotional distance, or physical separation',
              hi: 'आध्यात्मिक, कर्मिक पूर्वजन्म-साथी — वैराग्य, भावनात्मक दूरी या शारीरिक विछोह के दौर' },
    money:  { en: 'financial detachment, unexpected losses, spending on spiritual pursuits, and non-attachment to wealth',
              hi: 'धन से वैराग्य, अप्रत्याशित हानि, आध्यात्मिक खर्च और धन की अनासक्ति' },
    career: { en: 'spirituality, research, occult sciences, alternative medicine, mysticism, astrology, and hidden work',
              hi: 'अध्यात्म, शोध, रहस्य विज्ञान, वैकल्पिक चिकित्सा, ज्योतिष और गुप्त कार्य' },
    health: { en: 'mysterious diseases, immune disorders, accident-prone periods, and karma-driven health patterns',
              hi: 'रहस्यमय रोग, प्रतिरक्षा विकार, दुर्घटना-प्रवणता और कर्मजन्य स्वास्थ्य पैटर्न' },
    spirit: { en: 'moksha — liberation, meditation, surrender, past-life wisdom, and Ganesha worship',
              hi: 'मोक्ष — मुक्ति, ध्यान, समर्पण, पूर्वजन्म प्रज्ञा और गणेश उपासना' },
  },
};

// ─── 2. ASPECTING PLANET EFFECT PER LIFE AREA ────────────────────────────────
// How does each aspecting planet modify the area it touches?

const ASPECT_EFFECT = {
  Sun: {
    self:   { en: 'Sun\'s illuminating aspect brings authority, clarity, and ego-drive here. You may feel a strong need to assert yourself and be seen.',
              hi: 'सूर्य की प्रकाशमान दृष्टि यहाँ अधिकार, स्पष्टता और अहं-शक्ति लाती है।' },
    family: { en: 'Sun\'s authoritative energy highlights power dynamics, father\'s influence, or official relationships within the family.',
              hi: 'सूर्य की अधिकारिक ऊर्जा परिवार में शक्ति-संतुलन और पिता के प्रभाव को उभारती है।' },
    spouse: { en: 'Sun\'s dignified energy adds prestige, authority, or ego tensions to the relationship — the partner may be prominent or strong-willed.',
              hi: 'सूर्य की दृष्टि जीवनसाथी में प्रतिष्ठा, अधिकार या अहं-टकराव जोड़ती है।' },
    money:  { en: 'Sun\'s clear energy brings authority-based income, government earnings, or income tied to reputation and status.',
              hi: 'सूर्य की दृष्टि अधिकार, सरकार या प्रतिष्ठा से जुड़ी आय को उभारती है।' },
    career: { en: 'Sun\'s authoritative aspect strengthens leadership qualities, government connections, and the drive to be in command.',
              hi: 'सूर्य की दृष्टि नेतृत्व गुण, सरकारी संपर्क और आदेश में रहने की इच्छा को बलवान करती है।' },
    health: { en: 'Sun\'s intense energy can over-heat this area — watch for inflammation, excess Pitta, or heart/spine strain.',
              hi: 'सूर्य की तीव्र दृष्टि यहाँ अत्यधिक गर्मी दे सकती है — सूजन, पित्त या हृदय-रीढ़ पर ध्यान दें।' },
    spirit: { en: 'Sun\'s soul-illuminating aspect brings powerful dharmic clarity, connection to divine will, and the drive to fulfill life purpose.',
              hi: 'सूर्य की आत्म-प्रकाशक दृष्टि धार्मिक स्पष्टता और जीवन-उद्देश्य की शक्ति लाती है।' },
  },

  Moon: {
    self:   { en: 'Moon\'s emotional aspect makes this area sensitive, fluctuating, and deeply tied to mood and mental state.',
              hi: 'चंद्र की भावनात्मक दृष्टि इस क्षेत्र को संवेदनशील और मनोदशा से जोड़ती है।' },
    family: { en: 'Moon\'s nurturing aspect deepens emotional bonds, mother\'s influence, and the need for domestic comfort and belonging.',
              hi: 'चंद्र की पालन-पोषण दृष्टि भावनात्मक बंधन, माँ का प्रभाव और घर-ममता को गहरा करती है।' },
    spouse: { en: 'Moon\'s sensitive aspect creates emotional depth and care in the relationship, but also mood-driven changes and attachment.',
              hi: 'चंद्र की संवेदनशील दृष्टि संबंध में भावनात्मक गहराई तो देती है, पर उतार-चढ़ाव भी।' },
    money:  { en: 'Moon\'s fluctuating aspect creates variable income, emotional spending, and wealth tied to public mood or real estate.',
              hi: 'चंद्र की अस्थिर दृष्टि परिवर्तनशील आय, भावुक खर्च और जन-रुझान से जुड़ा धन बनाती है।' },
    career: { en: 'Moon\'s caring aspect supports public-facing, nurturing, and creative careers — popularity rises and falls with personal energy.',
              hi: 'चंद्र की देखभाल-दृष्टि जन-संपर्क और पालन-पोषण वाले करियर को सहारा देती है।' },
    health: { en: 'Moon\'s fluid aspect influences mental health, sleep, emotional eating, and immune system fluctuations.',
              hi: 'चंद्र की तरल दृष्टि मानसिक स्वास्थ्य, नींद, भावनात्मक खान-पान और प्रतिरक्षा को प्रभावित करती है।' },
    spirit: { en: 'Moon\'s devotional aspect deepens inner peace, intuitive prayer, and a loving connection to the Divine Mother.',
              hi: 'चंद्र की भक्तिमय दृष्टि आंतरिक शांति, अंतर्ज्ञान और माँ की कृपा को गहरा करती है।' },
  },

  Mars: {
    self:   { en: 'Mars\'s forceful aspect ignites energy, drive, and competitive instinct here — but watch for impulsive decisions or conflict.',
              hi: 'मंगल की तीव्र दृष्टि यहाँ ऊर्जा और प्रतिस्पर्धी भावना जगाती है — पर आवेश और विवाद से सावधान।' },
    family: { en: 'Mars\'s aggressive energy can create disputes, passion, and sibling rivalry in family matters — property issues may arise.',
              hi: 'मंगल की आक्रामक ऊर्जा परिवार में विवाद, जोश और भाई-बहन की प्रतिद्वंद्विता ला सकती है।' },
    spouse: { en: 'Mars\'s passionate aspect adds intensity, physical attraction, and possible conflict to the relationship — power dynamics are heightened.',
              hi: 'मंगल की तीव्र दृष्टि संबंध में जोश, शारीरिक आकर्षण और टकराव बढ़ा देती है।' },
    money:  { en: 'Mars\'s cutting energy drives bold financial decisions, property gains or disputes, and income from physical or technical work.',
              hi: 'मंगल की तेज दृष्टि साहसी वित्तीय निर्णय, संपत्ति लाभ-विवाद और शारीरिक श्रम से आय देती है।' },
    career: { en: 'Mars\'s active energy accelerates career ambition, competitive edge, and success in physically demanding or technical fields.',
              hi: 'मंगल की सक्रिय दृष्टि करियर महत्वाकांक्षा, प्रतिस्पर्धात्मक बढ़त और तकनीकी सफलता बढ़ाती है।' },
    health: { en: 'Mars\'s fiery aspect increases risk of inflammation, accidents, surgery, blood pressure, and fever — channel energy wisely.',
              hi: 'मंगल की अग्निमय दृष्टि सूजन, दुर्घटना, सर्जरी और रक्तचाप का जोखिम बढ़ाती है।' },
    spirit: { en: 'Mars\'s warrior aspect brings courage to the spiritual path — fire rituals, intense sadhana, and Hanuman-level devotion.',
              hi: 'मंगल की वीर दृष्टि साधना में साहस लाती है — अग्नि अनुष्ठान और हनुमान-भक्ति सहायक।' },
  },

  Mercury: {
    self:   { en: 'Mercury\'s analytical aspect adds intelligence, communication skills, and adaptability — creating a sharp, multi-faceted personality.',
              hi: 'बुध की विश्लेषणात्मक दृष्टि बुद्धि, संचार कौशल और अनुकूलनशीलता जोड़ती है।' },
    family: { en: 'Mercury\'s communicative aspect improves family dialogue and brings intellectual exchange — relatives may be involved in business or education.',
              hi: 'बुध की संवाद-दृष्टि पारिवारिक संवाद सुधारती है और शिक्षा-व्यापार में रिश्तेदारों को सक्रिय करती है।' },
    spouse: { en: 'Mercury\'s intellectual aspect creates a mentally stimulating, communicative, and witty relationship — conversations are the foundation.',
              hi: 'बुध की बौद्धिक दृष्टि बातचीत पर आधारित, उत्तेजक और चतुर संबंध बनाती है।' },
    money:  { en: 'Mercury\'s sharp aspect multiplies income through commerce, trading, writing, and multiple simultaneous ventures.',
              hi: 'बुध की तीक्ष्ण दृष्टि व्यापार, लेखन और एक साथ कई काम करके धन बढ़ाती है।' },
    career: { en: 'Mercury\'s versatile aspect supports careers in communication, technology, commerce, education, and analytical fields.',
              hi: 'बुध की बहुमुखी दृष्टि संचार, तकनीक, शिक्षा और विश्लेषण क्षेत्र के करियर को सहारा देती है।' },
    health: { en: 'Mercury\'s nervous energy can affect the nervous system, skin, or digestive health — over-thinking and anxiety may arise.',
              hi: 'बुध की तंत्रिका ऊर्जा तंत्रिका तंत्र, त्वचा और पाचन को प्रभावित कर सकती है — अति-चिंतन से सावधान।' },
    spirit: { en: 'Mercury\'s analytical aspect benefits scriptural study, mantra practice, and intellectual exploration of dharma.',
              hi: 'बुध की विश्लेषणात्मक दृष्टि शास्त्राध्ययन, मंत्र-साधना और धर्म के बौद्धिक अन्वेषण को लाभ देती है।' },
  },

  Jupiter: {
    self:   { en: 'Jupiter\'s expansive aspect is the most beneficial — it blesses, expands, and adds wisdom, faith, and generosity here.',
              hi: 'गुरु की विस्तारक दृष्टि सर्वाधिक शुभ है — यहाँ ज्ञान, श्रद्धा और उदारता का आशीर्वाद मिलता है।' },
    family: { en: 'Jupiter\'s protective aspect brings blessings to family, children, and wise elder guidance — family expands and prospers.',
              hi: 'गुरु की रक्षात्मक दृष्टि परिवार, संतान और बुजुर्ग मार्गदर्शन को आशीर्वाद देती है।' },
    spouse: { en: 'Jupiter\'s auspicious aspect blesses the relationship with wisdom, dharma, and growth — the partner may be wise, learned, or spiritually inclined.',
              hi: 'गुरु की शुभ दृष्टि संबंध में ज्ञान, धर्म और विकास का आशीर्वाद देती है।' },
    money:  { en: 'Jupiter\'s expansive aspect is one of the strongest wealth indicators — it grows, multiplies, and blesses financial matters.',
              hi: 'गुरु की विस्तारक दृष्टि धन के सर्वाधिक शक्तिशाली संकेतों में से एक है — संपत्ति बढ़ती और आशीर्वाद मिलता है।' },
    career: { en: 'Jupiter\'s wise aspect brings recognition, promotions, and success through knowledge-based, advisory, or leadership roles.',
              hi: 'गुरु की ज्ञानमय दृष्टि मान्यता, पदोन्नति और ज्ञान-आधारित नेतृत्व में सफलता देती है।' },
    health: { en: 'Jupiter\'s generous energy generally protects health, but over-expansion can cause liver issues, obesity, or excess Kapha.',
              hi: 'गुरु की उदार ऊर्जा सामान्यतः स्वास्थ्य की रक्षा करती है, पर अति-विस्तार से यकृत, मोटापा या कफ बढ़ सकता है।' },
    spirit: { en: 'Jupiter\'s divine aspect is the highest blessing for spiritual growth — guru\'s grace, dharmic clarity, and divine protection flow here.',
              hi: 'गुरु की दिव्य दृष्टि अध्यात्म के लिए सर्वोच्च आशीर्वाद है — गुरु कृपा, धार्मिक स्पष्टता और ईश्वरीय संरक्षण मिलता है।' },
  },

  Venus: {
    self:   { en: 'Venus\'s harmonious aspect adds beauty, charm, pleasure-seeking, and a love of comfort to the personality.',
              hi: 'शुक्र की सहज दृष्टि व्यक्तित्व में सौंदर्य, आकर्षण, सुख-खोज और आराम-प्रेम जोड़ती है।' },
    family: { en: 'Venus\'s comforting aspect brings harmony, beauty, comforts, and pleasure to the family environment.',
              hi: 'शुक्र की सुखद दृष्टि परिवार में सामंजस्य, सौंदर्य और सुख-सुविधाएँ लाती है।' },
    spouse: { en: 'Venus\'s loving aspect is deeply supportive of marriage — it brings attraction, pleasure, and a strong desire for a harmonious partnership.',
              hi: 'शुक्र की प्रेमपूर्ण दृष्टि विवाह के लिए अत्यंत शुभ है — आकर्षण, सुख और सुमेल संबंध की इच्छा लाती है।' },
    money:  { en: 'Venus\'s attractive aspect draws wealth through beauty, creativity, entertainment, and pleasurable pursuits.',
              hi: 'शुक्र की आकर्षक दृष्टि सौंदर्य, सृजनशीलता और मनोरंजन के माध्यम से धन आकर्षित करती है।' },
    career: { en: 'Venus\'s creative aspect strongly supports arts, entertainment, design, beauty, and hospitality careers.',
              hi: 'शुक्र की सृजनशील दृष्टि कला, मनोरंजन, डिज़ाइन और सौंदर्य उद्योग के करियर को मजबूती देती है।' },
    health: { en: 'Venus\'s indulgent aspect may create kidney sensitivity, reproductive health issues, or excess sugar/sweetness in lifestyle.',
              hi: 'शुक्र की भोग-दृष्टि गुर्दे, प्रजनन तंत्र और अत्यधिक मिठास से जुड़ी स्वास्थ्य समस्याएँ दे सकती है।' },
    spirit: { en: 'Venus\'s devotional aspect supports Bhakti — loving devotion through music, art, and sacred beauty.',
              hi: 'शुक्र की भक्ति-दृष्टि संगीत, कला और पवित्र सौंदर्य के माध्यम से ईश्वर-प्रेम को बढ़ाती है।' },
  },

  Saturn: {
    self:   { en: 'Saturn\'s restricting aspect adds weight, seriousness, delays, and karmic pressure — but it ultimately builds resilience and maturity.',
              hi: 'शनि की प्रतिबंधात्मक दृष्टि गंभीरता, देरी और कर्म-दबाव जोड़ती है — पर अंततः दृढ़ता और परिपक्वता बनाती है।' },
    family: { en: 'Saturn\'s serious aspect can create emotional distance, discipline, or burden in family life — but karmic lessons here lead to lasting bonds.',
              hi: 'शनि की गंभीर दृष्टि परिवार में दूरी, अनुशासन या बोझ बना सकती है — पर कर्म-सीख से स्थायी बंधन बनते हैं।' },
    spouse: { en: 'Saturn\'s karmic aspect may delay marriage, create a serious/older partner, or bring responsibility and duty into the relationship.',
              hi: 'शनि की कर्मिक दृष्टि विवाह में देरी, वरिष्ठ/गंभीर साथी या संबंध में जिम्मेदारी ला सकती है।' },
    money:  { en: 'Saturn\'s disciplined aspect slows down wealth, but results are earned and lasting — avoid shortcuts and work steadily.',
              hi: 'शनि की अनुशासित दृष्टि धन-वृद्धि को धीमा करती है, पर परिणाम टिकाऊ होते हैं — शॉर्टकट से बचें।' },
    career: { en: 'Saturn\'s patient aspect supports slow but steady career growth — service, hard work, and long-term systems are rewarded.',
              hi: 'शनि की धैर्यशील दृष्टि धीमी पर स्थिर करियर प्रगति देती है — सेवा और दीर्घकालिक व्यवस्था पुरस्कृत होती है।' },
    health: { en: 'Saturn\'s cold and slow aspect increases risk of chronic, joint, bone, and Vata-related conditions — regular routine helps.',
              hi: 'शनि की ठंडी-धीमी दृष्टि दीर्घकालिक, जोड़ों, हड्डियों और वात-रोगों का खतरा बढ़ाती है।' },
    spirit: { en: 'Saturn\'s karmic aspect deeply supports long-term sadhana, karma yoga, service, and austere spiritual discipline.',
              hi: 'शनि की कर्मिक दृष्टि दीर्घकालिक साधना, कर्म योग, सेवा और तपस्या को गहरा आधार देती है।' },
  },

  Rahu: {
    self:   { en: 'Rahu\'s amplifying aspect intensifies and obsesses over this area — creating an unusually strong, sometimes unconventional expression.',
              hi: 'राहु की प्रवर्धक दृष्टि इस क्षेत्र को तीव्र और जुनूनी बनाती है — असाधारण और अपरंपरागत अभिव्यक्ति संभव।' },
    family: { en: 'Rahu\'s unconventional aspect disrupts family traditions, adds foreign elements, and creates unusual family dynamics or separations.',
              hi: 'राहु की अपरंपरागत दृष्टि परिवार में विदेशी प्रभाव, असामान्य स्थिति या अलगाव ला सकती है।' },
    spouse: { en: 'Rahu\'s intense aspect creates strong attraction and obsession in relationships — the partner may be foreign, unusual, or transformative.',
              hi: 'राहु की तीव्र दृष्टि संबंध में तीव्र आकर्षण और जुनून बनाती है — साथी विदेशी, असामान्य या परिवर्तनकारी हो सकता है।' },
    money:  { en: 'Rahu\'s amplifying aspect creates the potential for sudden windfalls, speculative gains, and foreign income — but also sudden losses.',
              hi: 'राहु की प्रवर्धक दृष्टि अचानक धन, सट्टा लाभ और विदेशी आय की संभावना देती है — पर अचानक हानि भी।' },
    career: { en: 'Rahu\'s unconventional aspect drives ambition in technology, foreign work, media, and cutting-edge or controversial fields.',
              hi: 'राहु की अपरंपरागत दृष्टि तकनीक, विदेशी कार्य, मीडिया और नवीन क्षेत्रों में महत्वाकांक्षा बढ़ाती है।' },
    health: { en: 'Rahu\'s obsessive aspect creates unusual, hard-to-diagnose conditions — mental health, neurological issues, and lifestyle extremes.',
              hi: 'राहु की जुनूनी दृष्टि असामान्य, निदान-कठिन रोग — मानसिक, तंत्रिका समस्याएँ और जीवनशैली की अति बना सकती है।' },
    spirit: { en: 'Rahu\'s illusory aspect can mislead the spiritual path — but when channeled, it brings sudden awakening and breaking of old spiritual molds.',
              hi: 'राहु की भ्रम-दृष्टि आध्यात्मिक पथ को भटका सकती है — पर ऊर्जा सही लगाई जाए तो अचानक जागृति संभव है।' },
  },

  Ketu: {
    self:   { en: 'Ketu\'s detaching aspect withdraws from material identity here — creating an introverted, spiritually sensitive, and past-life-driven personality layer.',
              hi: 'केतु की वैराग्य-दृष्टि यहाँ भौतिक पहचान से अलगाव करती है — अंतर्मुखी, आध्यात्मिक और पूर्वजन्म-प्रेरित व्यक्तित्व बनता है।' },
    family: { en: 'Ketu\'s separating aspect creates emotional distance from family — there may be a karmic feeling of not truly belonging, or unresolved past-life bonds.',
              hi: 'केतु की विछोह-दृष्टि परिवार से भावनात्मक दूरी बनाती है — न-अपनापन या अनसुलझे पूर्वजन्म-बंधन का बोध हो सकता है।' },
    spouse: { en: 'Ketu\'s karmic aspect brings a deeply spiritual but emotionally detached quality to relationships — this feels like a past-life bond. Phases of separation are natural stepping stones to deeper connection.',
              hi: 'केतु की कर्मिक दृष्टि संबंध में गहरी आध्यात्मिकता पर भावनात्मक दूरी लाती है — यह पूर्वजन्म का बंधन लगता है।' },
    money:  { en: 'Ketu\'s renouncing aspect reduces attachment to money — unexpected losses occur but so does unexpected liberation from financial burdens. Non-attachment is the key.',
              hi: 'केतु की त्याग-दृष्टि धन से अनासक्ति कम करती है — अप्रत्याशित हानि होती है पर आर्थिक बोझ से मुक्ति भी मिलती है।' },
    career: { en: 'Ketu\'s spiritualizing aspect points career toward research, occult, healing, spirituality, and hidden or behind-the-scenes work.',
              hi: 'केतु की आध्यात्मिक दृष्टि करियर को शोध, गूढ़ विद्या, चिकित्सा, अध्यात्म और पर्दे के पीछे के कार्यों की ओर ले जाती है।' },
    health: { en: 'Ketu\'s mysterious aspect brings karma-driven health patterns — conditions may be hard to diagnose and respond better to spiritual or alternative healing.',
              hi: 'केतु की रहस्यमय दृष्टि कर्म-जन्य स्वास्थ्य पैटर्न लाती है — रोग निदान कठिन हो सकता है, आध्यात्मिक या वैकल्पिक उपचार बेहतर।' },
    spirit: { en: 'Ketu\'s moksha-giving aspect is one of the most powerful for liberation — it strips away illusions, deepens meditation, and aligns the soul with surrender and freedom.',
              hi: 'केतु की मोक्षकारी दृष्टि मुक्ति के लिए सर्वाधिक शक्तिशाली है — भ्रम दूर होते हैं, ध्यान गहरा होता है और आत्मा समर्पण में जुड़ती है।' },
  },
};

// ─── 3. HOUSE MODIFIER  (house context per life area) ─────────────────────────

const HOUSE_MODIFIER = {
  1: {
    self:   { en: 'the core house of self and physical identity', hi: 'स्व और शरीर का मूल भाव' },
    family: { en: 'the house that defines your personal presence within the family', hi: 'परिवार में आपकी व्यक्तिगत उपस्थिति' },
    spouse: { en: 'the house of self, which describes how you approach relationships from your own nature', hi: 'स्व-भाव — जो दर्शाता है आप अपनी प्रकृति से संबंध कैसे देखते हैं' },
    money:  { en: 'the house of overall fortune and the launching platform for financial identity', hi: 'समग्र भाग्य और वित्तीय पहचान का प्रारंभ बिंदु' },
    career: { en: 'the house of personality — how you are perceived in professional life', hi: 'व्यक्तित्व भाव — पेशेवर जीवन में आपकी छवि' },
    health: { en: 'the most important house for physical health, vitality, and constitution', hi: 'शारीरिक स्वास्थ्य, जीवनशक्ति और प्रकृति का सर्वप्रमुख भाव' },
    spirit: { en: 'the house of the self that begins the entire spiritual journey', hi: 'स्व-भाव — जहाँ से पूरी आध्यात्मिक यात्रा शुरू होती है' },
  },
  2: {
    self:   { en: 'the house of speech, values, and accumulated self-worth', hi: 'वाणी, मूल्यों और संचित आत्म-मूल्य का भाव' },
    family: { en: 'the house of immediate family, family finances, and inherited values', hi: 'तत्काल परिवार, पारिवारिक धन और विरासत में मिले मूल्यों का भाव' },
    spouse: { en: 'the house of family and resources — affecting how wealth flows between partners', hi: 'परिवार और संसाधनों का भाव — साझेदारों के बीच धन-प्रवाह' },
    money:  { en: 'the primary house of accumulated wealth, savings, and financial resources', hi: 'संचित धन, बचत और वित्तीय संसाधनों का प्राथमिक भाव' },
    career: { en: 'the house of professional speech, business values, and financial career', hi: 'व्यावसायिक वाणी, व्यापार मूल्य और वित्तीय करियर का भाव' },
    health: { en: 'the house of face, mouth, teeth, right eye, throat, and food intake', hi: 'चेहरा, मुँह, दाँत, दाहिनी आँख, गला और भोजन का भाव' },
    spirit: { en: 'the house of spiritual values, mantra, and the sacred power of speech', hi: 'आध्यात्मिक मूल्य, मंत्र और वाणी की पवित्र शक्ति का भाव' },
  },
  3: {
    self:   { en: 'the house of courage, communication, and self-driven effort', hi: 'साहस, संचार और स्व-प्रयास का भाव' },
    family: { en: 'the house of siblings — primarily younger brothers and sisters', hi: 'भाई-बहनों — विशेषकर छोटे भाई-बहनों का भाव' },
    spouse: { en: 'the house of short journeys and communication — affecting travel and conversations with partner', hi: 'छोटी यात्राएँ और संचार — साथी के साथ यात्रा और बातचीत' },
    money:  { en: 'the house of income through skills, writing, communication, and self-employment efforts', hi: 'कौशल, लेखन, संचार और स्वरोजगार प्रयासों से आय' },
    career: { en: 'the house of professional skills, communication-based careers, and media work', hi: 'पेशेवर कौशल, संचार-आधारित करियर और मीडिया कार्य का भाव' },
    health: { en: 'the house of hands, arms, shoulders, lungs, and nervous system strength', hi: 'हाथ, भुजाएँ, कंधे, फेफड़े और तंत्रिका तंत्र शक्ति का भाव' },
    spirit: { en: 'the house of courage in spiritual practice and sacred effort', hi: 'साधना में साहस और पवित्र प्रयास का भाव' },
  },
  4: {
    self:   { en: 'the house of inner happiness, emotional foundation, and subconscious patterns', hi: 'आंतरिक सुख, भावनात्मक आधार और अवचेतन पैटर्न का भाव' },
    family: { en: 'the house of mother, home, and the emotional foundation of the family', hi: 'माता, घर और परिवार की भावनात्मक नींव का भाव' },
    spouse: { en: 'the house of home and comfort — shaping the domestic life partners share', hi: 'घर और सुख का भाव — जो साझेदार मिलकर बनाते हैं' },
    money:  { en: 'the house of property, land, vehicles, and inherited assets', hi: 'संपत्ति, भूमि, वाहन और विरासत में मिली संपदा का भाव' },
    career: { en: 'the house of real estate, psychology, education, and work done from home', hi: 'अचल संपत्ति, मनोविज्ञान, शिक्षा और घर से किए जाने वाले काम का भाव' },
    health: { en: 'the house of chest, heart (emotional), lungs, and inner emotional wellbeing', hi: 'सीना, हृदय (भावनात्मक), फेफड़े और आंतरिक भावनात्मक स्वास्थ्य का भाव' },
    spirit: { en: 'the house of inner peace, devotional practices, sacred space, and the heart-mind', hi: 'आंतरिक शांति, भक्ति साधना, पवित्र स्थान और हृदय-मन का भाव' },
  },
  5: {
    self:   { en: 'the house of intelligence, creativity, past-life merit, and personal expression', hi: 'बुद्धि, सृजनशीलता, पूर्वपुण्य और व्यक्तिगत अभिव्यक्ति का भाव' },
    family: { en: 'the house of children, romance, and past-life blessings on the family', hi: 'संतान, प्रेम और परिवार पर पूर्वपुण्य के आशीर्वाद का भाव' },
    spouse: { en: 'the house of romance and love affairs — shapes the emotional quality of partnerships before and after marriage', hi: 'प्रेम और रोमांस का भाव — विवाह से पहले और बाद की भावनात्मक गुणवत्ता' },
    money:  { en: 'the house of speculation, creative income, investments, and stock market', hi: 'सट्टेबाजी, सृजनात्मक आय, निवेश और शेयर बाजार का भाव' },
    career: { en: 'the house of creative professions, arts, teaching, and speculation-based work', hi: 'सृजनात्मक पेशे, कला, शिक्षण और अटकलबाजी-आधारित कार्य का भाव' },
    health: { en: 'the house of the upper digestive system, heart (physical), spine, and reproductive vitality', hi: 'ऊपरी पाचन, हृदय (शारीरिक), रीढ़ और प्रजनन शक्ति का भाव' },
    spirit: { en: 'the house of purva punya (past-life merit), mantra power, intuition, and divine inspiration', hi: 'पूर्वपुण्य, मंत्र शक्ति, अंतर्ज्ञान और दैवी प्रेरणा का भाव' },
  },
  6: {
    self:   { en: 'the house of enemies, diseases, debts, and the daily grind that shapes character', hi: 'शत्रु, रोग, ऋण और दैनिक संघर्ष का भाव जो चरित्र बनाता है' },
    family: { en: 'the house of material cousins, domestic disputes, and servants in the family', hi: 'मातृ पक्ष के रिश्तेदार, पारिवारिक विवाद और सेवकों का भाव' },
    spouse: { en: 'the house of competition and conflict — affecting rivalries, health challenges in marriage, and service to partner', hi: 'प्रतिस्पर्धा और संघर्ष का भाव — विवाह में प्रतिद्वंद्विता और सेवा' },
    money:  { en: 'the house of loans, debts, legal disputes, and income through service or healthcare', hi: 'ऋण, कानूनी विवाद और सेवा या स्वास्थ्य सेवा से आय का भाव' },
    career: { en: 'the house of service, healthcare, competition, litigation, and problem-solving professions', hi: 'सेवा, स्वास्थ्य सेवा, प्रतिस्पर्धा, कानूनी विवाद और समस्या-समाधान पेशों का भाव' },
    health: { en: 'the house most directly linked to physical diseases, immunity, gut health, and medical conditions', hi: 'शारीरिक रोगों, प्रतिरक्षा, पाचन स्वास्थ्य और चिकित्सा स्थितियों का प्रत्यक्ष भाव' },
    spirit: { en: 'the house of spiritual enemies, inner obstacles, and the testing ground of faith and purification', hi: 'आंतरिक बाधाओं, आध्यात्मिक शत्रुओं और श्रद्धा परीक्षा का भाव' },
  },
  7: {
    self:   { en: 'the house of partnerships that mirror your own traits back to you through others', hi: 'साझेदारियाँ जो आपके अपने गुणों को दूसरों के माध्यम से प्रतिबिंबित करती हैं' },
    family: { en: 'the house of the spouse who enters and becomes the center of family life', hi: 'जीवनसाथी जो परिवार में आकर केंद्र बनता है' },
    spouse: { en: 'the primary house of marriage, spouse, and all long-term partnerships', hi: 'विवाह, जीवनसाथी और दीर्घकालिक साझेदारियों का प्राथमिक भाव' },
    money:  { en: 'the house of business partnerships, joint ventures, and income through marriage or contracts', hi: 'व्यापारिक साझेदारी, संयुक्त उद्यम और विवाह या अनुबंध से आय का भाव' },
    career: { en: 'the house of business, public dealing, foreign trade, and partnership-based ventures', hi: 'व्यापार, जन-व्यवहार, विदेश व्यापार और साझेदारी-आधारित उद्यम का भाव' },
    health: { en: 'the house of kidneys, lower back, the reproductive system, and overall vitality of the second half of life', hi: 'गुर्दे, पीठ के निचले हिस्से, प्रजनन तंत्र और जीवन के दूसरे भाग की जीवनशक्ति' },
    spirit: { en: 'the house of dharma in relationships — how partnerships serve as mirrors for spiritual growth', hi: 'संबंधों में धर्म — साझेदारियाँ आध्यात्मिक विकास के दर्पण के रूप में' },
  },
  8: {
    self:   { en: 'the house of death, transformation, deep psychology, and the occult — the self is profoundly reshaped here', hi: 'मृत्यु, परिवर्तन, गहरी मनोवैज्ञानिकता और गूढ़ विद्या का भाव' },
    family: { en: 'the house of in-laws, inheritance, ancestral secrets, and sudden family changes', hi: 'ससुराल, विरासत, पूर्वज रहस्य और अचानक पारिवारिक परिवर्तन का भाव' },
    spouse: { en: 'the house of the spouse\'s hidden matters, shared assets, and the deep transformative power of marriage', hi: 'साथी के छिपे मामले, साझा संपत्ति और विवाह की गहरी परिवर्तनकारी शक्ति का भाव' },
    money:  { en: 'the house of inheritance, insurance, joint finances, and sudden unexpected wealth or loss', hi: 'विरासत, बीमा, संयुक्त वित्त और अचानक अप्रत्याशित धन या हानि का भाव' },
    career: { en: 'the house of research, investigation, medicine, occult, insurance, and crisis management',  hi: 'शोध, जाँच-पड़ताल, चिकित्सा, गूढ़ विद्या, बीमा और संकट प्रबंधन का भाव' },
    health: { en: 'the house of longevity, chronic and life-threatening conditions, surgeries, and reproductive health', hi: 'दीर्घायु, गंभीर/जानलेवा रोग, सर्जरी और प्रजनन स्वास्थ्य का भाव' },
    spirit: { en: 'the house of deep occult knowledge, tantric practices, near-death experiences, and moksha through transformation', hi: 'गहरे रहस्य ज्ञान, तांत्रिक अभ्यास, मृत्यु-समान अनुभव और परिवर्तन के माध्यम से मोक्ष' },
  },
  9: {
    self:   { en: 'the house of higher philosophy, dharma, and the fortune that shapes the life path', hi: 'उच्च दर्शन, धर्म और जीवन-पथ को आकार देने वाले भाग्य का भाव' },
    family: { en: 'the house of father, grandfather, guru, and the spiritual lineage of the family', hi: 'पिता, दादा, गुरु और परिवार की आध्यात्मिक परंपरा का भाव' },
    spouse: { en: 'the house of higher learning — the partner\'s beliefs, dharma, and spiritual orientation',  hi: 'उच्च शिक्षा का भाव — साथी की आस्था, धर्म और आध्यात्मिक दिशा' },
    money:  { en: 'the house of fortune, luck, and divine grace that opens financial opportunities', hi: 'भाग्य, सौभाग्य और ईश्वरीय कृपा से खुलने वाले वित्तीय अवसरों का भाव' },
    career: { en: 'the house of advisory, teaching, legal, pilgrimage-related, and dharmic professions', hi: 'परामर्श, शिक्षण, कानूनी, तीर्थ-संबंधित और धार्मिक पेशों का भाव' },
    health: { en: 'the house of hips, thighs, liver function, and the body\'s relationship with faith and dharma', hi: 'कूल्हे, जाँघें, यकृत कार्य और शरीर का धर्म-श्रद्धा से संबंध' },
    spirit: { en: 'the most dharmic house — religion, philosophy, guru, pilgrimage, and divine fortune', hi: 'सर्वाधिक धार्मिक भाव — धर्म, दर्शन, गुरु, तीर्थयात्रा और दैवी भाग्य' },
  },
  10: {
    self:   { en: 'the house of public image, career, authority, and how the world sees you', hi: 'सार्वजनिक छवि, करियर, अधिकार और दुनिया आपको कैसे देखती है' },
    family: { en: 'the house of the father\'s public life and the family\'s social standing', hi: 'पिता का सार्वजनिक जीवन और परिवार की सामाजिक प्रतिष्ठा का भाव' },
    spouse: { en: 'the house of public life — how the partner\'s career or public role shapes the relationship', hi: 'सार्वजनिक जीवन का भाव — साथी का करियर या सार्वजनिक भूमिका' },
    money:  { en: 'the house of professional income, government earnings, and wealth through status', hi: 'पेशेवर आय, सरकारी कमाई और प्रतिष्ठा से धन का भाव' },
    career: { en: 'the primary house of career, profession, authority, public life, and life\'s work (karma)', hi: 'करियर, पेशा, अधिकार, सार्वजनिक जीवन और कर्म का प्राथमिक भाव' },
    health: { en: 'the house of knees, joints, skeletal health, and the impact of work stress on the body', hi: 'घुटने, जोड़, हड्डी का स्वास्थ्य और कार्य-तनाव का शरीर पर प्रभाव' },
    spirit: { en: 'the house of karma — right action, dharmic profession, and service as a form of worship', hi: 'कर्म का भाव — सही कर्म, धार्मिक पेशा और पूजा के रूप में सेवा' },
  },
  11: {
    self:   { en: 'the house of desires, gains, social networks, and the fulfilment of long-held wishes', hi: 'इच्छाएँ, लाभ, सामाजिक नेटवर्क और दीर्घ-पोषित इच्छाओं की पूर्ति का भाव' },
    family: { en: 'the house of elder siblings, extended social family, and networked support', hi: 'बड़े भाई-बहन, विस्तारित सामाजिक परिवार और नेटवर्क समर्थन का भाव' },
    spouse: { en: 'the house of desires and social circle — the partner\'s connections, friendships, and gains', hi: 'इच्छाएँ और सामाजिक घेरा — साथी के संपर्क, मित्रता और लाभ का भाव' },
    money:  { en: 'the strongest house for income, gains, and the fulfilment of financial wishes', hi: 'आय, लाभ और वित्तीय इच्छाओं की पूर्ति का सर्वाधिक शक्तिशाली भाव' },
    career: { en: 'the house of career gains, professional networks, social media, and recognition', hi: 'करियर लाभ, पेशेवर नेटवर्क, सोशल मीडिया और मान्यता का भाव' },
    health: { en: 'the house of calves, ankles, circulatory system, and gains related to health efforts', hi: 'पिंडलियाँ, टखने, परिसंचरण तंत्र और स्वास्थ्य प्रयासों से मिलने वाले फल का भाव' },
    spirit: { en: 'the house where spiritual desires and long-term goals of liberation may be fulfilled', hi: 'आध्यात्मिक इच्छाएँ और मुक्ति के दीर्घकालिक लक्ष्य पूरे होने का भाव' },
  },
  12: {
    self:   { en: 'the house of losses, isolation, foreign lands, and spiritual liberation — the self withdraws from the world here',  hi: 'हानि, एकांत, विदेश और मोक्ष का भाव — यहाँ स्वयं संसार से पीछे हटता है' },
    family: { en: 'the house of separation from family — through distance, foreign residence, isolation, or spiritual withdrawal', hi: 'परिवार से अलगाव — दूरी, विदेश निवास, एकांत या आध्यात्मिक वैराग्य के माध्यम से' },
    spouse: { en: 'the house of losses and foreign connections in relationships — the partner may be distant, foreign, or spiritually oriented',  hi: 'संबंधों में हानि और विदेशी संपर्क — साथी दूर, विदेशी या आध्यात्मिक हो सकता है' },
    money:  { en: 'the house of expenses, losses, and outflow — money flows toward spiritual, foreign, or charitable causes',  hi: 'खर्च, हानि और बहिर्प्रवाह का भाव — धन आध्यात्मिक, विदेश या दान-पुण्य में जाता है' },
    career: { en: 'the house of foreign work, service institutions (hospitals, prisons, ashrams), and behind-the-scenes roles', hi: 'विदेश कार्य, सेवा संस्थानों (अस्पताल, जेल, आश्रम) और पर्दे के पीछे की भूमिकाओं का भाव' },
    health: { en: 'the house of sleep disorders, hospitalization, isolation-related conditions, and the left eye', hi: 'नींद विकार, अस्पताल में भर्ती, एकांत से जुड़ी स्थितियाँ और बाईं आँख का भाव' },
    spirit: { en: 'the most powerful house for liberation — moksha, meditation, complete surrender, and dissolution of ego', hi: 'मोक्ष का सर्वाधिक शक्तिशाली भाव — मुक्ति, ध्यान, पूर्ण समर्पण और अहं का विलय' },
  },
};

// ─── 4. LIFE AREA METADATA ────────────────────────────────────────────────────

const LIFE_AREAS = [
  { key:'self',   icon:'👤', heading_en:'Self & Personality',      heading_hi:'स्वयं और व्यक्तित्व'    },
  { key:'family', icon:'🏠', heading_en:'Family & Home',            heading_hi:'परिवार और घर'           },
  { key:'spouse', icon:'💑', heading_en:'Spouse & Relationships',   heading_hi:'जीवनसाथी और संबंध'      },
  { key:'money',  icon:'💰', heading_en:'Money & Finances',         heading_hi:'धन और वित्त'            },
  { key:'career', icon:'💼', heading_en:'Career & Job',             heading_hi:'करियर और नौकरी'         },
  { key:'health', icon:'❤️', heading_en:'Health & Vitality',        heading_hi:'स्वास्थ्य और जीवनशक्ति' },
  { key:'spirit', icon:'🙏', heading_en:'Spirituality & Moksha',    heading_hi:'अध्यात्म और मोक्ष'      },
];

// ─── 5. MAIN GENERATION FUNCTION ─────────────────────────────────────────────

/**
 * For a house with aspecting planets and occupant planets,
 * generate detailed life-area impact paragraphs.
 *
 * @param {Array}  aspects  - [{ planet, nature }]
 * @param {Array}  occupants - ['Venus', 'Saturn', ...]
 * @param {number} houseNum  - 1–12
 * @returns {Array} - per aspect planet, per life area paragraph
 */
function generateDrishtiLifeImpact(aspects, occupants, houseNum) {
  if (!aspects.length || !occupants.length) return [];

  const houseMod = HOUSE_MODIFIER[houseNum] || HOUSE_MODIFIER[12];

  return aspects.map(({ planet: aspectingPlanet, nature }) => {
    const ae = ASPECT_EFFECT[aspectingPlanet] || {};

    const life_areas = LIFE_AREAS.map(({ key, icon, heading_en, heading_hi }) => {
      // Build the interpretation for this area
      const hm  = houseMod[key] || {};

      // Collect what each occupant governs in this area
      const occupantLines_en = occupants.map((op) => {
        const pk = PLANET_KARAKATVA[op]?.[key];
        return pk?.en ? `**${op}** governs ${pk.en}` : null;
      }).filter(Boolean);

      const occupantLines_hi = occupants.map((op) => {
        const pk = PLANET_KARAKATVA[op]?.[key];
        return pk?.hi ? `**${ph(op)}** ${pk.hi} को नियंत्रित करता है` : null;
      }).filter(Boolean);

      // Aspecting planet's effect on this area
      const aeText_en = ae[key]?.en || '';
      const aeText_hi = ae[key]?.hi || '';

      // House context
      const hmText_en = hm.en ? `This is expressed through ${hm.en}.` : '';
      const hmText_hi = hm.hi ? `यह ${hm.hi} के माध्यम से व्यक्त होता है।` : '';

      // Combine into a paragraph
      const parts_en = [];
      if (occupantLines_en.length) parts_en.push(occupantLines_en.join('; ') + '.');
      if (hmText_en) parts_en.push(hmText_en);
      if (aeText_en) parts_en.push(aeText_en);

      const parts_hi = [];
      if (occupantLines_hi.length) parts_hi.push(occupantLines_hi.join('; ') + '।');
      if (hmText_hi) parts_hi.push(hmText_hi);
      if (aeText_hi) parts_hi.push(aeText_hi);

      return {
        key,
        icon,
        heading_en,
        heading_hi,
        text_en: parts_en.join(' '),
        text_hi: parts_hi.join(' '),
      };
    });

    return {
      aspecting_planet: aspectingPlanet,
      aspect_nature:    nature,
      occupants,
      house: houseNum,
      life_areas,
    };
  });
}

module.exports = { generateDrishtiLifeImpact, LIFE_AREAS, PLANET_KARAKATVA, ASPECT_EFFECT, HOUSE_MODIFIER };
