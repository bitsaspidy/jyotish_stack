import { localizeAstroText } from './astroI18n';

const VARGA_HI = {
  D1: {
    name: 'लग्न / राशि कुंडली',
    domain: 'समग्र जीवन, शरीर, संबंध',
    signifies: 'स्वयं, शरीर, आत्मबल',
    description: 'यह मूल जन्म कुंडली है। स्वास्थ्य, व्यक्तित्व, कर्म, संबंध, करियर और जीवन की मुख्य दिशा पहले D1 से ही समझी जाती है। बाकी सभी वर्गों को D1 के संदर्भ में पढ़ना चाहिए।',
    keyUses: ['जीवन की मुख्य दिशा', 'लग्न और लग्नेश का बल', 'स्वास्थ्य और शरीर', 'महत्वपूर्ण घटनाएं', 'बाकी वर्गों की पुष्टि'],
  },
  D2: {
    name: 'होरा',
    domain: 'धन और वित्त',
    signifies: 'धन, आय, आर्थिक समृद्धि',
    description: 'D2 धन, आय, बचत और आर्थिक क्षमता देखने के लिए उपयोगी वर्ग है। सूर्य होरा और चंद्र होरा से धन का स्वभाव और स्रोत समझे जाते हैं।',
    keyUses: ['धन योग की पुष्टि', 'आय और बचत क्षमता', 'पैतृक या मातृ धन संकेत', 'आर्थिक निर्णयों की दिशा', 'D1 के धन भावों के साथ पढ़ना'],
  },
  D3: {
    name: 'द्रेष्काण',
    domain: 'भाई-बहन, साहस, छोटे यात्रा',
    signifies: 'सहोदर, पराक्रम, संचार',
    description: 'D3 भाई-बहन, साहस, मानसिक दृढ़ता, संचार और छोटी यात्राओं के लिए प्रमुख वर्ग है। मंगल को सहोदर का प्राकृतिक कारक माना जाता है।',
    keyUses: ['भाई-बहन से संबंध', 'छोटे और बड़े सहोदर संकेत', 'साहस और पराक्रम', 'संचार शैली', 'छोटी यात्राएं'],
  },
  D4: {
    name: 'चतुर्थांश',
    domain: 'संपत्ति, वाहन, भाग्य',
    signifies: 'घर, भूमि, स्थिर संपत्ति',
    description: 'D4 घर, भूमि, वाहन, स्थिर संपत्ति, घरेलू सुख और पैतृक संपत्ति के संकेत दिखाता है। इसे D1 के चौथे भाव के साथ पढ़ना चाहिए।',
    keyUses: ['घर और भूमि', 'वाहन और सुख-सुविधा', 'पैतृक संपत्ति', 'घरेलू वातावरण', 'स्थिर संपत्ति से लाभ'],
  },
  D5: {
    name: 'पंचमांश',
    domain: 'पूर्व पुण्य, अधिकार, शक्ति',
    signifies: 'पुण्य, प्रतिष्ठा, नेतृत्व',
    description: 'D5 पूर्व जन्म के पुण्य, अधिकार, मान-सम्मान, नेतृत्व क्षमता और आध्यात्मिक योग्यता को सहायक रूप से दिखाता है।',
    keyUses: ['पूर्व पुण्य', 'अधिकार और नेतृत्व', 'प्रतिष्ठा', 'मंत्र और साधना', 'दिव्य कृपा'],
  },
  D7: {
    name: 'सप्तमांश',
    domain: 'संतान, प्रजनन, वंश',
    signifies: 'संतान, गर्भधारण, वंश वृद्धि',
    description: 'D7 संतान, गर्भधारण, बच्चों के स्वास्थ्य, स्वभाव, विकास और संतान सुख के लिए मुख्य वर्ग है। गुरु इसका प्रमुख कारक है।',
    keyUses: ['संतान योग', 'गर्भधारण क्षमता', 'बच्चों का स्वास्थ्य', 'संतान से संबंध', 'दत्तक या सौतेली संतान संकेत'],
  },
  D8: {
    name: 'अष्टमांश',
    domain: 'आयु, बाधा, गुप्त विषय',
    signifies: 'दीर्घायु, संकट, अचानक घटना',
    description: 'D8 आयु, बाधा, दुर्घटना, अचानक परिवर्तन, छिपे शत्रु और गहरी रूपांतरण प्रक्रिया के लिए उपयोगी है। इसे सावधानी से पढ़ना चाहिए।',
    keyUses: ['आयु संकेत', 'दुर्घटना और संकट', 'गुप्त बाधाएं', 'विरासत', 'पुरानी बीमारी या शल्य संकेत'],
  },
  D9: {
    name: 'नवांश',
    domain: 'विवाह, जीवनसाथी, धर्म, ग्रह बल',
    signifies: 'धर्म, विवाह, जीवनसाथी',
    description: 'D9 को कुंडली की आत्मा कहा जाता है। विवाह, जीवनसाथी का स्वभाव, धर्म, भाग्य और ग्रहों का वास्तविक बल देखने में यह अत्यंत महत्वपूर्ण है।',
    keyUses: ['विवाह और वैवाहिक सुख', 'जीवनसाथी का स्वभाव', 'ग्रहों का वास्तविक बल', 'धर्म और भाग्य', 'वर्गोत्तम ग्रह'],
  },
  D10: {
    name: 'दशमांश',
    domain: 'करियर, पद, पेशा',
    signifies: 'कार्य, व्यवसाय, सार्वजनिक जीवन',
    description: 'D10 करियर, पेशा, पद, प्रतिष्ठा, अधिकार और सार्वजनिक जीवन देखने का प्रमुख वर्ग है। इसे D1 के दसवें भाव के साथ पढ़ना चाहिए।',
    keyUses: ['करियर दिशा', 'नौकरी या व्यवसाय', 'पदोन्नति और प्रतिष्ठा', 'अधिकार और नेतृत्व', 'सामाजिक स्थिति'],
  },
  D12: {
    name: 'द्वादशांश',
    domain: 'माता-पिता, वंश, पूर्वज',
    signifies: 'माता-पिता, कुल, पैतृक कर्म',
    description: 'D12 माता-पिता, वंश, पैतृक संबंध, पूर्वजों के आशीर्वाद या ऋण और पारिवारिक कर्म को समझने के लिए उपयोगी है।',
    keyUses: ['माता-पिता का स्वास्थ्य', 'माता-पिता से संबंध', 'वंश और पूर्वज', 'पितृ संकेत', 'पारिवारिक कर्म'],
  },
  D16: {
    name: 'षोडशांश',
    domain: 'वाहन, विलास, सुख',
    signifies: 'वाहन, सुविधा, आराम',
    description: 'D16 वाहन, सुविधा, विलासिता, आराम और वाहन से जुड़े सुख-दुख देखने के लिए प्रयोग किया जाता है। जन्म समय की शुद्धता यहां महत्वपूर्ण है।',
    keyUses: ['वाहन योग', 'वाहन सुख या दुर्घटना', 'सुविधा और आराम', 'विलास सामग्री', 'मानसिक सुख'],
  },
  D20: {
    name: 'विंशांश',
    domain: 'आध्यात्मिक प्रगति, उपासना',
    signifies: 'साधना, पूजा, आध्यात्मिकता',
    description: 'D20 साधना, उपासना, ध्यान, मंत्र सिद्धि, कुल देवता प्रभाव और आध्यात्मिक प्रगति को देखने के लिए उपयोगी है।',
    keyUses: ['आध्यात्मिक रुचि', 'उपासना पद्धति', 'मंत्र सिद्धि', 'कुल देवता संकेत', 'मोक्ष दिशा'],
  },
  D24: {
    name: 'चतुर्विंशांश / सिद्धांश',
    domain: 'शिक्षा और अध्ययन',
    signifies: 'विद्या, बुद्धि, उच्च शिक्षा',
    description: 'D24 शिक्षा, उच्च अध्ययन, डिग्री, शोध, विद्वता, शिक्षण क्षमता और बौद्धिक विकास के लिए प्रयोग होता है।',
    keyUses: ['उच्च शिक्षा', 'डिग्री और उपलब्धियां', 'शोध क्षमता', 'सीखने की शैली', 'शिक्षण या अकादमिक करियर'],
  },
  D27: {
    name: 'सप्तविंशांश / भांश',
    domain: 'शारीरिक बल, जीवनी शक्ति',
    signifies: 'बल, स्वास्थ्य, सहज क्षमता',
    description: 'D27 शरीर की शक्ति, रोग प्रतिरोध, प्राकृतिक प्रतिभा, मानसिक दृढ़ता और कमजोरी के क्षेत्रों को समझने में सहायक है।',
    keyUses: ['शारीरिक बल', 'रोग प्रतिरोध', 'खेल या योद्धा क्षमता', 'मानसिक दृढ़ता', 'जन्मजात प्रतिभा'],
  },
  D30: {
    name: 'त्रिंशांश',
    domain: 'रोग, विपत्ति, दोष',
    signifies: 'दुर्भाग्य, रोग, अवरोध',
    description: 'D30 रोग, दुर्घटना, दोष, नकारात्मक प्रवृत्ति, चरित्र कमजोरी और विपत्ति के संकेतों के लिए संवेदनशील वर्ग है। इसे D1 और वास्तविक परिस्थिति से मिलाकर पढ़ना चाहिए।',
    keyUses: ['रोग और बाधा', 'दोष विश्लेषण', 'दुर्घटना संकेत', 'कठिन आदतें', 'चरित्र की कमजोरियां'],
  },
  D40: {
    name: 'खवेदांश',
    domain: 'मातृ वंश, शुभता',
    signifies: 'मातृ पूर्वज, आशीर्वाद, अशुभता',
    description: 'D40 मातृ पक्ष के वंश, आशीर्वाद, शाप, मातृ कर्म और जीवन पर मातृ कुल के प्रभाव को देखने के लिए उपयोगी है।',
    keyUses: ['मातृ वंश', 'मां के पक्ष का आशीर्वाद', 'मातृ कर्म', 'मातृ पक्ष से बाधा', 'स्त्री स्वास्थ्य संकेत'],
  },
  D45: {
    name: 'अक्षवेदांश',
    domain: 'पितृ वंश, पितृ दोष',
    signifies: 'पितृ कर्म, धर्म, वंश ऋण',
    description: 'D45 पिता के वंश, पितृ कर्म, पितृ दोष, धार्मिक विरासत और पूर्वजों से जुड़े ऋणों को समझने में सहायक है।',
    keyUses: ['पितृ वंश', 'पितृ दोष', 'पिता पक्ष का कर्म', 'धार्मिक विरासत', 'पूर्वज ऋण'],
  },
  D60: {
    name: 'षष्ट्यंश',
    domain: 'पूर्व जन्म कर्म, अंतिम फल',
    signifies: 'कर्म, भाग्य, मूल कारण',
    description: 'D60 अत्यंत संवेदनशील और शक्तिशाली वर्ग माना जाता है। यह गहरे कर्म, पूर्व जन्म के संकेत, जीवन घटनाओं के मूल कारण और अंतिम पुष्टि दिखाता है।',
    keyUses: ['पूर्व जन्म कर्म', 'जीवन घटनाओं का मूल कारण', 'गहरे कर्म ऋण', 'भाग्य की अंतिम पुष्टि', 'आत्मिक उद्देश्य'],
  },
};

const TOPIC_HI = {
  Father: 'पिता',
  Mother: 'माता',
  Siblings: 'भाई-बहन',
  Spouse: 'जीवनसाथी',
  Children: 'संतान',
  'Father Wealth': 'पिता का धन',
  'Mother Wealth': 'माता का धन',
  'Spouse Wealth': 'जीवनसाथी का धन',
  'Children Wealth': 'संतान का धन',
  'Younger Siblings': 'छोटे भाई-बहन',
  'Elder Siblings': 'बड़े भाई-बहन',
  'Sibling Health': 'भाई-बहन स्वास्थ्य',
  'Sibling Prosperity': 'भाई-बहन समृद्धि',
  'Mother Property': 'माता की संपत्ति',
  'Father Property': 'पिता की संपत्ति',
  'Ancestral Home': 'पैतृक घर',
  'Children Merit': 'संतान पुण्य',
  'Father Status': 'पिता की प्रतिष्ठा',
  'First Child': 'पहली संतान',
  'Second Child': 'दूसरी संतान',
  'Child Health': 'संतान स्वास्थ्य',
  'Child Growth': 'संतान विकास',
  'Fertility Issues': 'प्रजनन बाधा',
  'Father Longevity': 'पिता की आयु',
  'Mother Longevity': 'माता की आयु',
  'Spouse Longevity': 'जीवनसाथी की आयु',
  'Spouse Nature': 'जीवनसाथी का स्वभाव',
  'Spouse Health': 'जीवनसाथी स्वास्थ्य',
  'Marital Happiness': 'वैवाहिक सुख',
  'Father Fortune': 'पिता का भाग्य',
  'Mother Fortune': 'माता का भाग्य',
  'Children Intelligence': 'संतान बुद्धि',
  'Father Career': 'पिता का करियर',
  'Spouse Career': 'जीवनसाथी का करियर',
  'Children Career': 'संतान करियर',
  'Father Health': 'पिता स्वास्थ्य',
  'Relationship with Father': 'पिता से संबंध',
  'Mother Health': 'माता स्वास्थ्य',
  'Relationship with Mother': 'माता से संबंध',
  'Ancestral Karma': 'पूर्वज कर्म',
  'Spouse Vehicles': 'जीवनसाथी के वाहन',
  'Father Vehicles': 'पिता के वाहन',
  'Family Deity': 'कुल देवता',
  'Parents Spirituality': 'माता-पिता की आध्यात्मिकता',
  'Children Education': 'संतान शिक्षा',
  'Siblings Education': 'भाई-बहन शिक्षा',
  'Mother Diseases': 'माता के रोग',
  'Father Diseases': 'पिता के रोग',
  'Mother Lineage': 'मातृ वंश',
  'Maternal Ancestors': 'मातृ पूर्वज',
  'Father Lineage': 'पितृ वंश',
  'Pitru Dosha': 'पितृ दोष',
  'All Family Karma': 'समस्त पारिवारिक कर्म',
  'Spouse Karma': 'जीवनसाथी कर्म',
  'Children Karma': 'संतान कर्म',
  'Parent Karma': 'माता-पिता कर्म',
};

const COMMON_REPLACEMENTS = [
  [/\bJudge\b/g, 'देखें'],
  [/\bCheck\b/g, 'देखें'],
  [/\bStrong\b/g, 'मजबूत'],
  [/\bstrong\b/g, 'मजबूत'],
  [/\bAffliction\b/g, 'पीड़ा'],
  [/\baffliction\b/g, 'पीड़ा'],
  [/\bAfflictions\b/g, 'पीड़ाएं'],
  [/\bprimary chart\b/g, 'मुख्य वर्ग'],
  [/\bplacement\b/g, 'स्थिति'],
  [/\bplacements\b/g, 'स्थितियां'],
  [/\bstrength\b/g, 'बल'],
  [/\blord\b/g, 'स्वामी'],
  [/\bhealth\b/g, 'स्वास्थ्य'],
  [/\brelationship quality\b/g, 'संबंध की गुणवत्ता'],
  [/\brelationship\b/g, 'संबंध'],
  [/\bmarriage\b/g, 'विवाह'],
  [/\bcareer\b/g, 'करियर'],
  [/\bwealth\b/g, 'धन'],
  [/\bEach sign\b/g, 'प्रत्येक राशि'],
  [/\beach sign\b/g, 'प्रत्येक राशि'],
  [/\bsections\b/g, 'भाग'],
  [/\bsection\b/g, 'भाग'],
  [/\bcounted\b/g, 'गिने जाते हैं'],
  [/\bfrom the sign itself\b/g, 'उसी राशि से'],
  [/\bfrom the natal sign\b/g, 'जन्म राशि से'],
  [/\bforward\b/g, 'आगे'],
  [/\bchildren\b/g, 'संतान'],
  [/\bsiblings\b/g, 'भाई-बहन'],
  [/\bmother\b/g, 'माता'],
  [/\bfather\b/g, 'पिता'],
  [/\bspouse\b/g, 'जीवनसाथी'],
  [/\bshows\b/g, 'दिखाता है'],
  [/\bindicates\b/g, 'संकेत देता है'],
  [/\bdetermines\b/g, 'निर्धारित करता है'],
  [/\bfrom\b/g, 'से'],
  [/\band\b/g, 'और'],
  [/\bor\b/g, 'या'],
  [/\bin\b/g, 'में'],
];

function fallbackFor(definition) {
  return VARGA_HI[definition?.code] || {};
}

// Regional DB languages (seed 027). For these, use the seeded regional column
// when present, otherwise fall back to English (never the Hindi static dict).
const REGIONAL = new Set(['ta', 'te', 'bn', 'mr', 'pa', 'gu']);

export function vargaName(definition, lang) {
  if (!definition) return lang === 'hi' ? 'वर्ग' : 'Varga';
  if (REGIONAL.has(lang)) return definition[`name_${lang}`] || definition.name_en || definition.code;
  if (lang === 'hi') return definition.name_hi || fallbackFor(definition).name || definition.name_en || definition.code;
  return definition.name_en || definition.code;
}

export function vargaDomain(definition, lang) {
  if (!definition) return '';
  // primary_domain has no regional column; keep English for regional langs.
  return lang === 'hi'
    ? fallbackFor(definition).domain || localizeAstroText(definition.primary_domain, lang)
    : definition.primary_domain;
}

export function vargaSignifies(definition, lang) {
  if (!definition) return '';
  if (REGIONAL.has(lang)) return definition[`signifies_${lang}`] || definition.signifies_en;
  if (lang === 'hi') return definition.signifies_hi || fallbackFor(definition).signifies || localizeAstroText(definition.signifies_en, lang);
  return definition.signifies_en;
}

export function vargaDescription(definition, lang) {
  if (!definition) return '';
  if (REGIONAL.has(lang)) return definition[`description_${lang}`] || definition.description_en;
  if (lang === 'hi') return definition.description_hi || fallbackFor(definition).description || localizeAstroText(definition.description_en, lang);
  return definition.description_en;
}

export function vargaKeyUses(definition, lang) {
  if (!definition) return [];
  if (REGIONAL.has(lang)) {
    const seeded = Array.isArray(definition[`key_uses_${lang}`]) ? definition[`key_uses_${lang}`].filter(Boolean) : [];
    return seeded.length ? seeded : (Array.isArray(definition.key_uses_en) ? definition.key_uses_en : []);
  }
  if (lang === 'hi') {
    const seeded = Array.isArray(definition.key_uses_hi) ? definition.key_uses_hi.filter(Boolean) : [];
    return seeded.length ? seeded : (fallbackFor(definition).keyUses || []);
  }
  return Array.isArray(definition.key_uses_en) ? definition.key_uses_en : [];
}

export function vargaTopic(topic, lang) {
  if (lang !== 'hi') return topic || '';
  return TOPIC_HI[topic] || localizeAstroText(topic, lang);
}

export function vargaReferenceText(text, lang) {
  if (!text || lang !== 'hi') return text || '';
  let out = text
    .replace(/\b(\d+)(st|nd|rd|th)\s+house\b/g, '$1वां भाव')
    .replace(/\b(\d+)(st|nd|rd|th)\s+lord\b/g, '$1वें भाव का स्वामी')
    .replace(/\b(\d+)(st|nd|rd|th)\s+from\b/g, '$1वां से');
  out = localizeAstroText(out, lang);
  COMMON_REPLACEMENTS.forEach(([pattern, value]) => {
    out = out.replace(pattern, value);
  });
  return out;
}
