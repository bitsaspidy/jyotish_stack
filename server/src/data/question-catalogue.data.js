'use strict';
/**
 * Master data for the deterministic Q&A catalogue (Phase 2).
 * Single source seeded into question_categories / question_catalogue /
 * question_requirements / question_legacy_alias / answer_shared_blocks.
 * Kept out of controllers by design. Runtime source of truth is the DB;
 * this module only feeds the idempotent seeds. No answer templates here
 * (those arrive in the pilot phase).
 */

// ── 10 categories (code → bilingual label + order) ───────────────────────────
const CATEGORIES = [
  { code:'personality', order:1,  label_en:'Personality & Life Direction',              label_hi:'व्यक्तित्व और जीवन की दिशा' },
  { code:'career',      order:2,  label_en:'Job & Career',                              label_hi:'नौकरी और करियर' },
  { code:'business',    order:3,  label_en:'Business & Entrepreneurship',               label_hi:'व्यवसाय और उद्यमिता' },
  { code:'money',       order:4,  label_en:'Money & Financial Position',                label_hi:'धन और आर्थिक स्थिति' },
  { code:'marriage',    order:5,  label_en:'Marriage & Spouse',                         label_hi:'विवाह और जीवनसाथी' },
  { code:'family',      order:6,  label_en:'Children, Family & Relationships',          label_hi:'संतान, परिवार और रिश्ते' },
  { code:'education',   order:7,  label_en:'Education, Learning & Skills',              label_hi:'शिक्षा, अध्ययन और कौशल' },
  { code:'health',      order:8,  label_en:'Health & Mental Wellbeing',                 label_hi:'स्वास्थ्य और मानसिक संतुलन' },
  { code:'property',    order:9,  label_en:'Property, Vehicle, Travel & Foreign',       label_hi:'मकान, संपत्ति, वाहन और विदेश' },
  { code:'timing',      order:10, label_en:'Current Dasha, Transit, Timing & Remedies', label_hi:'वर्तमान दशा, गोचर, समय और उपाय' },
];

// ── 100 questions (code, category, subcategory, bilingual text + short title) ─
// disclaimer inferred from category (see disclaimerFor); q(...) keeps rows compact.
const q = (code, category, sub, q_en, q_hi, t_en, t_hi) => ({ code, category, subcategory: sub, q_en, q_hi, t_en, t_hi });

const QUESTIONS = [
  // Category 1 — Personality & life direction (Q001–Q010)
  q('Q001','personality','self',        'What is my basic nature and personality?','मेरा मूल स्वभाव और व्यक्तित्व कैसा है?','Basic personality','मूल व्यक्तित्व'),
  q('Q002','personality','strengths',   'What are my greatest strengths?','मेरी सबसे बड़ी खूबियाँ क्या हैं?','Greatest strengths','प्रमुख शक्तियाँ'),
  q('Q003','personality','challenges',  'What are my major weaknesses and life challenges?','मेरी प्रमुख कमजोरियाँ और जीवन की चुनौतियाँ क्या हैं?','Weaknesses & challenges','कमजोरियाँ व चुनौतियाँ'),
  q('Q004','personality','emotional',   'What kind of person am I emotionally?','मैं भावनात्मक रूप से किस प्रकार का व्यक्ति हूँ?','Emotional nature','भावनात्मक स्वभाव'),
  q('Q005','personality','decisions',   'Do I make decisions emotionally or logically?','मैं निर्णय दिल से लेता हूँ या दिमाग से?','Decision style','निर्णय शैली'),
  q('Q006','personality','purpose',     'What is the main purpose and appropriate direction of my life?','मेरे जीवन का मुख्य उद्देश्य और सही दिशा क्या है?','Life purpose','जीवन उद्देश्य'),
  q('Q007','personality','planet',      'Which planet influences my personality the most?','कौन-सा ग्रह मेरे व्यक्तित्व को सबसे अधिक प्रभावित करता है?','Key influencing planet','प्रमुख प्रभावी ग्रह'),
  q('Q008','personality','planet',      'Which planet is the strongest in my birth chart?','मेरी जन्म कुंडली में सबसे मजबूत ग्रह कौन-सा है?','Strongest planet','सबसे मजबूत ग्रह'),
  q('Q009','personality','planet',      'Which planet is the weakest or most challenging in my birth chart?','मेरी जन्म कुंडली में सबसे कमजोर या चुनौतीपूर्ण ग्रह कौन-सा है?','Weakest planet','सबसे कमजोर ग्रह'),
  q('Q010','personality','planet',      'Which planet is currently having the strongest influence on my life?','वर्तमान समय में मेरे जीवन पर कौन-सा ग्रह सबसे अधिक प्रभाव डाल रहा है?','Current dominant planet','वर्तमान प्रभावी ग्रह'),

  // Category 2 — Job & career (Q011–Q020)
  q('Q011','career','field',       'Which career field is most suitable for me?','मेरे लिए सबसे उपयुक्त career field कौन-सा है?','Suitable career field','उपयुक्त करियर क्षेत्र'),
  q('Q012','career','job_business','Is a job or business more suitable for me?','मेरे लिए नौकरी बेहतर है या व्यवसाय?','Job or business','नौकरी या व्यवसाय'),
  q('Q013','career','sector',      'Is a government job or the private sector more suitable for me?','मेरे लिए सरकारी नौकरी बेहतर है या private sector?','Govt or private','सरकारी या निजी'),
  q('Q014','career','current_job', 'Is my current job suitable for me?','क्या मेरी वर्तमान नौकरी मेरे लिए सही है?','Current job fit','वर्तमान नौकरी उपयुक्तता'),
  q('Q015','career','timing',      'When is the right time to change my job?','नौकरी बदलने का सही समय कब है?','Job-change timing','नौकरी बदलने का समय'),
  q('Q016','career','timing',      'When are promotion and salary-increment opportunities likely?','promotion और salary increment के योग कब बनेंगे?','Promotion & raise','पदोन्नति व वेतन वृद्धि'),
  q('Q017','career','leadership',  'Do I have the potential to obtain a leadership or management role?','क्या मुझे leadership या management role मिल सकता है?','Leadership potential','नेतृत्व क्षमता'),
  q('Q018','career','foreign',     'Do I have prospects of working for a foreign or multinational company?','क्या foreign company या multinational company में काम करने के योग हैं?','Foreign/MNC job','विदेशी/एमएनसी नौकरी'),
  q('Q019','career','obstacles',   'Why do I repeatedly face obstacles or instability in my career?','मेरे career में बार-बार रुकावट या अस्थिरता क्यों आती है?','Career obstacles','करियर रुकावटें'),
  q('Q020','career','outlook',     'How is my career likely to progress during the next 12 months?','अगले 12 महीनों में मेरा career कैसा रहेगा?','Career — 12 months','करियर — 12 माह'),

  // Category 3 — Business & entrepreneurship (Q021–Q030)
  q('Q021','business','potential',   'Does my Kundli indicate good prospects for running a business?','क्या मेरी कुंडली में व्यवसाय करने के अच्छे योग हैं?','Business potential','व्यवसाय संभावना'),
  q('Q022','business','sector',      'Which business sector is most suitable for me?','मेरे लिए कौन-सा business sector सबसे उपयुक्त रहेगा?','Suitable sector','उपयुक्त क्षेत्र'),
  q('Q023','business','partnership', 'Is it better for me to run a business alone or in partnership?','मेरे लिए अकेले business करना बेहतर है या partnership में?','Solo or partnership','अकेले या साझेदारी'),
  q('Q024','business','partnership', 'Is a business partnership likely to be beneficial for me?','क्या business partnership मेरे लिए लाभदायक रहेगी?','Partnership benefit','साझेदारी लाभ'),
  q('Q025','business','timing',      'When is the right time to start a new business?','नया business शुरू करने का सही समय कब है?','Business-start timing','व्यवसाय आरंभ समय'),
  q('Q026','business','timing',      'Is the current period favourable for business expansion?','क्या वर्तमान समय business expansion के लिए अनुकूल है?','Expansion timing','विस्तार समय'),
  q('Q027','business','cashflow',    'Why does my business repeatedly face cash-flow problems?','मेरे business में cash flow की समस्या क्यों आती है?','Cash-flow issues','नकदी प्रवाह समस्या'),
  q('Q028','business','online',      'How suitable are online or international business opportunities for me?','online या international business मेरे लिए कैसा रहेगा?','Online/international','ऑनलाइन/अंतरराष्ट्रीय'),
  q('Q029','business','risks',       'What risks and mistakes should I avoid in business?','business में मुझे किन risks और गलतियों से सावधान रहना चाहिए?','Business risks','व्यवसाय जोखिम'),
  q('Q030','business','outlook',     'How is my business likely to perform during the next 12 months?','अगले 12 महीनों में मेरे business की स्थिति कैसी रहेगी?','Business — 12 months','व्यवसाय — 12 माह'),

  // Category 4 — Money & financial position (Q031–Q040)
  q('Q031','money','wealth',        'What kind of wealth prospects are indicated in my Kundli?','मेरी कुंडली में धन प्राप्ति के योग कैसे हैं?','Wealth prospects','धन संभावना'),
  q('Q032','money','income',        'What could be my primary and potential sources of income?','मेरी आय के मुख्य और संभावित स्रोत क्या हो सकते हैं?','Income sources','आय स्रोत'),
  q('Q033','money','savings',       'Why am I unable to save money even when I earn well?','पैसे आने के बाद भी बचत क्यों नहीं हो पाती?','Saving difficulty','बचत में कठिनाई'),
  q('Q034','money','timing',        'When is my financial position likely to become stronger?','मेरी आर्थिक स्थिति कब मजबूत हो सकती है?','Financial upturn timing','आर्थिक सुधार समय'),
  q('Q035','money','sudden',        'Does my Kundli indicate possibilities of sudden financial gains?','क्या मेरी कुंडली में अचानक धन लाभ के योग हैं?','Sudden gains','अचानक लाभ'),
  q('Q036','money','debt',          'Am I likely to face problems related to debt or loans?','क्या मुझे कर्ज या loan से जुड़ी समस्याओं का सामना करना पड़ सकता है?','Debt & loans','कर्ज व ऋण'),
  q('Q037','money','inheritance',   'Are there prospects of benefiting from inheritance or ancestral property?','क्या पैतृक संपत्ति या inheritance से लाभ मिलने के योग हैं?','Inheritance','पैतृक संपत्ति'),
  q('Q038','money','planet',        'Which planet influences my income and savings the most?','कौन-सा ग्रह मेरी income और savings को सबसे अधिक प्रभावित करता है?','Wealth-key planet','धन-प्रमुख ग्रह'),
  q('Q039','money','yoga',          'What are the major wealth combinations in my Kundli?','मेरी कुंडली में प्रमुख धन योग कौन-कौन से हैं?','Wealth combinations','धन योग'),
  q('Q040','money','outlook',       'How is my financial position likely to develop during the next 12 months?','अगले 12 महीनों में मेरी आर्थिक स्थिति कैसी रहेगी?','Finances — 12 months','वित्त — 12 माह'),

  // Category 5 — Marriage & spouse (Q041–Q050)
  q('Q041','marriage','timing',     'When is my marriage likely to take place?','मेरी शादी कब होने की संभावना है?','Marriage timing','विवाह समय'),
  q('Q042','marriage','delay',      'What is the main astrological reason for delay in my marriage?','विवाह में देरी होने का मुख्य ज्योतिषीय कारण क्या है?','Marriage delay','विवाह में देरी'),
  q('Q043','marriage','spouse',     'What kind of nature and personality is my spouse likely to have?','मेरा जीवनसाथी स्वभाव और व्यक्तित्व में कैसा होगा?','Spouse nature','जीवनसाथी स्वभाव'),
  q('Q044','marriage','type',       'Does my Kundli indicate love marriage or arranged marriage?','मेरी कुंडली में love marriage के योग हैं या arranged marriage के?','Love or arranged','प्रेम या अरेंज्ड'),
  q('Q045','marriage','after',      'How is my life likely to be after marriage?','विवाह के बाद मेरा जीवन कैसा रहेगा?','Life after marriage','विवाह के बाद जीवन'),
  q('Q046','marriage','challenges', 'What major challenges may arise in my married life?','वैवाहिक जीवन में किन प्रमुख चुनौतियों का सामना करना पड़ सकता है?','Married-life challenges','वैवाहिक चुनौतियाँ'),
  q('Q047','marriage','relationship','Can my current relationship lead to marriage?','क्या मेरा वर्तमान relationship विवाह तक पहुँच सकता है?','Relationship to marriage','संबंध से विवाह'),
  q('Q048','marriage','conflict',   'What is the astrological reason for repeated conflicts between spouses?','पति-पत्नी के बीच बार-बार विवाद होने का ज्योतिषीय कारण क्या है?','Spousal conflict','दांपत्य विवाद'),
  q('Q049','marriage','window',     'What is the most favourable period for marriage during the next two years?','अगले दो वर्षों में विवाह के लिए सबसे अनुकूल समय कौन-सा है?','Best marriage window','विवाह अनुकूल समय'),
  q('Q050','marriage','remedy',     'What remedies and practical steps can improve my married life?','वैवाहिक जीवन बेहतर बनाने के लिए क्या उपाय और practical steps किए जा सकते हैं?','Marriage remedies','विवाह उपाय'),

  // Category 6 — Children, family & relationships (Q051–Q060)
  q('Q051','family','children',       'What are the prospects of having children according to my Kundli?','मेरी कुंडली में संतान प्राप्ति के योग कैसे हैं?','Children prospects','संतान संभावना'),
  q('Q052','family','children_delay', 'What astrological factors may indicate delay in having children?','संतान प्राप्ति में देरी होने के क्या ज्योतिषीय संकेत हैं?','Children delay','संतान में देरी'),
  q('Q053','family','children_bond',  'What kind of relationship am I likely to have with my children?','बच्चों के साथ मेरा संबंध कैसा रहेगा?','Bond with children','संतान से संबंध'),
  q('Q054','family','children_edu',   "Which period is favourable for my children's education and development?",'बच्चों की शिक्षा और विकास के लिए कौन-सा समय अच्छा रहेगा?','Children education timing','संतान शिक्षा समय'),
  q('Q055','family','tension',        'Why does tension repeatedly arise within my family?','मेरे परिवार में बार-बार तनाव क्यों बना रहता है?','Family tension','पारिवारिक तनाव'),
  q('Q056','family','peace_timing',   'When is peace and harmony likely to improve in my family?','परिवार में सुख और शांति कब बढ़ेगी?','Family peace timing','पारिवारिक शांति समय'),
  q('Q057','family','parents',        'What kind of relationship am I likely to have with my parents?','माता-पिता के साथ मेरा संबंध कैसा रहेगा?','Relationship with parents','माता-पिता से संबंध'),
  q('Q058','family','siblings',       'Am I likely to receive support from my siblings or face disagreements?','भाई-बहनों से मुझे सहयोग मिलेगा या मतभेद रहेंगे?','Sibling support','भाई-बहन सहयोग'),
  q('Q059','family','responsibility', 'Why do family responsibilities seem to fall heavily on me?','परिवार की जिम्मेदारियों का भार मुझ पर अधिक क्यों रहता है?','Family responsibilities','पारिवारिक जिम्मेदारियाँ'),
  q('Q060','family','outlook',        'How is my family life likely to be during the next 12 months?','अगले 12 महीनों में मेरा पारिवारिक जीवन कैसा रहेगा?','Family — 12 months','परिवार — 12 माह'),

  // Category 7 — Education, learning & skills (Q061–Q070)
  q('Q061','education','field',        'Which field of education is most suitable for me?','मेरे लिए कौन-सा education field सबसे उपयुक्त है?','Suitable education field','उपयुक्त शिक्षा क्षेत्र'),
  q('Q062','education','higher',       'What are my prospects for higher education?','मेरी कुंडली में higher education के योग कैसे हैं?','Higher-education prospects','उच्च शिक्षा संभावना'),
  q('Q063','education','competition',  'What are my chances of success in competitive examinations?','competitive examination में सफलता की संभावना कैसी है?','Competitive-exam success','प्रतियोगी परीक्षा सफलता'),
  q('Q064','education','abroad',       'Do I have prospects of studying abroad?','क्या विदेश में पढ़ाई करने के योग हैं?','Study abroad','विदेश अध्ययन'),
  q('Q065','education','interruption', 'Why do I repeatedly face interruptions in my education?','मेरी शिक्षा में बार-बार रुकावट क्यों आती है?','Education interruptions','शिक्षा में रुकावट'),
  q('Q066','education','path',         'Which is more suitable for me: technical, creative, management or research work?','technical, creative, management या research field में से मेरे लिए क्या बेहतर रहेगा?','Best learning path','सर्वोत्तम अध्ययन मार्ग'),
  q('Q067','education','focus',        'What astrological factors may contribute to weak concentration or memory?','concentration और memory कमजोर होने का ज्योतिषीय कारण क्या हो सकता है?','Focus & memory','एकाग्रता व स्मृति'),
  q('Q068','education','timing',       'What is the most favourable period to begin studying or appear for an examination?','पढ़ाई शुरू करने या examination देने का बेहतर समय कौन-सा है?','Study/exam timing','अध्ययन/परीक्षा समय'),
  q('Q069','education','skill',        'Which new skill or certification could benefit my career the most?','कौन-सा नया skill या certification मेरे career में सबसे अधिक लाभ देगा?','Beneficial skill','लाभकारी कौशल'),
  q('Q070','education','outlook',      'How are my education and learning likely to progress during the next 12 months?','अगले 12 महीनों में मेरी education और learning कैसी रहेगी?','Education — 12 months','शिक्षा — 12 माह'),

  // Category 8 — Health & mental wellbeing (Q071–Q080)
  q('Q071','health','tendencies', 'What general health tendencies are indicated in my Kundli?','मेरी कुंडली में स्वास्थ्य से जुड़ी सामान्य प्रवृत्तियाँ क्या हैं?','Health tendencies','स्वास्थ्य प्रवृत्तियाँ'),
  q('Q072','health','energy',     'Why do my energy and stamina repeatedly feel low?','मेरी energy और stamina बार-बार कम क्यों हो जाते हैं?','Low energy','कम ऊर्जा'),
  q('Q073','health','stress',     'What astrological factors may contribute to stress, anxiety or mental pressure?','तनाव, चिंता या मानसिक दबाव का ज्योतिषीय कारण क्या हो सकता है?','Stress & anxiety','तनाव व चिंता'),
  q('Q074','health','sleep',      'What astrological factors may be associated with sleep-related difficulties?','नींद से जुड़ी परेशानी के क्या ज्योतिषीय संकेत दिखाई देते हैं?','Sleep issues','नींद समस्या'),
  q('Q075','health','caution',    'During which periods should I be more careful about my health?','किन समयों में मुझे स्वास्थ्य के प्रति अधिक सावधान रहना चाहिए?','Health-caution periods','स्वास्थ्य सावधानी समय'),
  q('Q076','health','period',     'How is my current planetary period affecting my health?','वर्तमान ग्रह दशा मेरे स्वास्थ्य को कैसे प्रभावित कर रही है?','Period effect on health','दशा का स्वास्थ्य प्रभाव'),
  q('Q077','health','planet',     'Which planet affects my mental peace the most?','कौन-सा ग्रह मेरी मानसिक शांति को सबसे अधिक प्रभावित करता है?','Mental-peace planet','मानसिक शांति ग्रह'),
  q('Q078','health','lifestyle',  'Which lifestyle areas should I focus on to improve my wellbeing?','स्वास्थ्य सुधारने के लिए मुझे किन lifestyle areas पर ध्यान देना चाहिए?','Lifestyle focus','जीवनशैली फोकस'),
  q('Q079','health','recovery',   'When is a favourable period for recovery and improvement in energy?','recovery और energy improvement के लिए अनुकूल समय कब है?','Recovery timing','स्वास्थ्य सुधार समय'),
  q('Q080','health','outlook',    'What health-related precautions should I consider during the next 12 months?','अगले 12 महीनों में स्वास्थ्य के संबंध में किन बातों का ध्यान रखना चाहिए?','Health — 12 months','स्वास्थ्य — 12 माह'),

  // Category 9 — Property, vehicle, travel & foreign (Q081–Q090)
  q('Q081','property','house_timing', 'When are favourable prospects likely for purchasing a house?','मेरे लिए मकान खरीदने के योग कब बनेंगे?','House-purchase timing','मकान खरीद समय'),
  q('Q082','property','type',         'Which is more suitable for me: land, a plot or a constructed house?','मेरे लिए जमीन, plot या constructed house में से क्या बेहतर रहेगा?','Land or house','जमीन या मकान'),
  q('Q083','property','ancestral',    'Am I likely to benefit from ancestral property?','क्या पैतृक संपत्ति से लाभ मिलने की संभावना है?','Ancestral property','पैतृक संपत्ति लाभ'),
  q('Q084','property','buy_sell',     'When is the right time to purchase or sell property?','property खरीदने या बेचने का सही समय कब है?','Buy/sell property timing','संपत्ति खरीद/बिक्री समय'),
  q('Q085','property','vehicle',      'What is the favourable period for purchasing a new vehicle?','नया वाहन खरीदने का अनुकूल समय कौन-सा है?','Vehicle timing','वाहन समय'),
  q('Q086','property','relocation',   'Am I likely to live away from my birthplace?','क्या मुझे जन्मस्थान से दूर रहना पड़ सकता है?','Living away from home','जन्मस्थान से दूर'),
  q('Q087','property','travel',       'What are the prospects of foreign travel in my Kundli?','मेरी कुंडली में विदेश यात्रा के योग कैसे हैं?','Foreign travel','विदेश यात्रा'),
  q('Q088','property','settlement',   'Do I have prospects of employment or permanent settlement abroad?','क्या विदेश में नौकरी या settlement के योग हैं?','Foreign settlement','विदेश में बसना'),
  q('Q089','property','disputes',     'Why am I facing obstacles or disputes related to property?','property से जुड़ी रुकावट या विवाद क्यों हो रहे हैं?','Property disputes','संपत्ति विवाद'),
  q('Q090','property','outlook',      'How are property, vehicle and travel matters likely to develop during the next 12 months?','अगले 12 महीनों में property, vehicle और travel की स्थिति कैसी रहेगी?','Property/travel — 12 months','संपत्ति/यात्रा — 12 माह'),

  // Category 10 — Current Dasha, transit, timing & remedies (Q091–Q100)
  q('Q091','timing','mahadasha',  'What is the main effect of my current Mahadasha?','मेरी वर्तमान महादशा का मुख्य प्रभाव क्या है?','Mahadasha effect','महादशा प्रभाव'),
  q('Q092','timing','antardasha', 'How is my current Antardasha affecting my life?','वर्तमान अंतर्दशा मेरे जीवन को कैसे प्रभावित कर रही है?','Antardasha effect','अंतर्दशा प्रभाव'),
  q('Q093','timing','favourable', 'Which planet is currently the most favourable for me?','वर्तमान समय में मेरे लिए कौन-सा ग्रह सबसे अधिक अनुकूल है?','Currently favourable planet','वर्तमान अनुकूल ग्रह'),
  q('Q094','timing','challenging','Which planet is currently creating the greatest challenges for me?','वर्तमान समय में कौन-सा ग्रह मेरे लिए सबसे अधिक चुनौती पैदा कर रहा है?','Currently challenging planet','वर्तमान चुनौती ग्रह'),
  q('Q095','timing','next3',      'How is the next three-month period likely to be for me?','आने वाले तीन महीनों का समय मेरे लिए कैसा रहेगा?','Next 3 months','अगले 3 माह'),
  q('Q096','timing','next6',      'Which areas of my life may improve during the next six months?','आने वाले छह महीनों में मेरे जीवन के किन क्षेत्रों में सुधार हो सकता है?','Next 6 months','अगले 6 माह'),
  q('Q097','timing','next12',     'What are the main opportunities and challenges during the next 12 months?','अगले 12 महीनों की मुख्य opportunities और challenges क्या हैं?','Next 12 months','अगले 12 माह'),
  q('Q098','timing','muhurat',    'What is the most suitable time to begin an important activity?','किसी महत्वपूर्ण कार्य की शुरुआत के लिए कौन-सा समय बेहतर रहेगा?','Auspicious start time','शुभ आरंभ समय'),
  q('Q099','timing','spiritual',  'Which spiritual path or form of worship is suitable for my growth?','मेरी आध्यात्मिक प्रगति और उपासना के लिए कौन-सा मार्ग अनुकूल है?','Spiritual path','आध्यात्मिक मार्ग'),
  q('Q100','timing','remedy',     'What are the most suitable personalised remedies according to my current Dasha and planetary condition?','वर्तमान दशा और ग्रह स्थिति के अनुसार मेरे लिए सबसे प्रभावी व्यक्तिगत उपाय क्या हैं?','Personalised remedies','व्यक्तिगत उपाय'),
];

// disclaimer per category → maps to a shared block key at seed/runtime
const DISCLAIMER_BY_CATEGORY = {
  personality:'general', career:'general', business:'financial', money:'financial',
  marriage:'marriage', family:'general', education:'general', health:'medical',
  property:'general', timing:'general',
};

// ── Per-question requirement builder (1:1 rows) ──────────────────────────────
const BASE = {
  personality:{ charts:['d1','d9'],        houses:[1,4,5,9,10],    lords:[1,10],    planets:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], dasha:['maha','antar'] },
  career:     { charts:['d1','d10'],        houses:[1,6,10,11],     lords:[10,6],    planets:['Sun','Saturn','Mercury','Mars'],                          dasha:['maha','antar','pratyantar'] },
  business:   { charts:['d1','d10'],        houses:[3,7,10,11],     lords:[10,7,11], planets:['Mercury','Mars','Jupiter','Saturn'],                      dasha:['maha','antar','pratyantar'] },
  money:      { charts:['d1','d2'],         houses:[2,5,9,11],      lords:[2,11,9],  planets:['Jupiter','Mercury','Venus','Moon'],                       dasha:['maha','antar'] },
  marriage:   { charts:['d1','d9'],         houses:[1,5,7,11],      lords:[7,5],     planets:['Venus','Jupiter','Mars','Moon'],                          dasha:['maha','antar','pratyantar'] },
  family:     { charts:['d1','d7','d12'],   houses:[2,4,5,9],       lords:[4,5,9],   planets:['Jupiter','Moon','Sun','Mercury'],                         dasha:['maha','antar'] },
  education:  { charts:['d1','d24'],        houses:[2,4,5,9],       lords:[4,5,9],   planets:['Mercury','Jupiter','Moon'],                               dasha:['maha','antar'] },
  health:     { charts:['d1','d30'],        houses:[1,6,8,12],      lords:[1,6,8],   planets:['Sun','Moon','Mars','Saturn'],                             dasha:['maha','antar'] },
  property:   { charts:['d1','d4','d16'],   houses:[3,4,8,9,11,12], lords:[4,11,12], planets:['Mars','Venus','Moon','Rahu','Saturn'],                    dasha:['maha','antar'] },
  timing:     { charts:['d1'],              houses:[1,5,9,10,11],   lords:[1,10],    planets:['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'], dasha:['maha','antar','pratyantar'] },
};

// question sets needing specific treatment
const TIMING_CODES     = new Set(['Q015','Q016','Q020','Q025','Q026','Q030','Q034','Q040','Q041','Q049','Q054','Q056','Q060','Q068','Q070','Q075','Q079','Q080','Q081','Q084','Q085','Q090','Q095','Q096','Q097','Q098']);
const PLANET_ID_CODES  = new Set(['Q007','Q008','Q009','Q010','Q038','Q077','Q093','Q094']);
const REMEDY_CODES     = new Set(['Q050','Q078','Q100']);
const CUR_TRANSIT_CODES= new Set(['Q010','Q076','Q091','Q092','Q093','Q094','Q095','Q096']);
const STRENGTH_CENTRIC = new Set(['Q002','Q003','Q007','Q008','Q009','Q010','Q019','Q027','Q038','Q065','Q072','Q077','Q089','Q093','Q094']);

function requirementsFor(item) {
  const b = BASE[item.category];
  const code = item.code;
  const needsDated   = TIMING_CODES.has(code);
  const needsCurrent = needsDated || CUR_TRANSIT_CODES.has(code);
  const allPlanets   = PLANET_ID_CODES.has(code);
  const needsRemedy  = REMEDY_CODES.has(code);

  // sections — keep 4–7 relevant ones
  const sections = ['direct_answer', 'kundli_indicates'];
  if (b.charts.some((c) => c !== 'd1')) sections.push('dchart_indication');
  if (b.dasha.length > 2 || needsDated || CUR_TRANSIT_CODES.has(code)) sections.push('dasha_influence');
  if (needsCurrent || needsDated) sections.push('transit_influence');
  sections.push('positive', 'caution');
  if (needsDated) sections.push('timing_outlook');
  sections.push('practical_guidance');
  if (needsRemedy) sections.push('remedy');
  sections.push('important_note');

  return {
    question_code: code,
    houses: b.houses,
    house_lords: b.lords,
    planets: allPlanets ? ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'] : b.planets,
    divisional_charts: b.charts,
    dasha_levels: needsDated ? Array.from(new Set([...b.dasha, 'pratyantar'])) : b.dasha,
    needs_current_transit: needsCurrent,
    needs_dated_transit: needsDated,
    needs_yoga: true,
    needs_remedy: needsRemedy,
    shadbala_enhances: STRENGTH_CENTRIC.has(code) || PLANET_ID_CODES.has(code),
    ashtakavarga_enhances: needsCurrent || needsDated || PLANET_ID_CODES.has(code),
    answer_sections: sections,
    required_fields: ['ascendant', 'planets', 'dasha'],
    missing_data_behaviour: 'degrade',
  };
}

// Build catalogue + requirement rows (adds disclaimer + min_data_policy).
// TEMPORARY (Stage 1, owner-approved): only the 10 pilot questions are ACTIVE;
// the other 90 stay inactive so normal users never see or query them. This
// stands in for a dedicated readiness column (planned|pilot|under_review|ready|
// disabled) until readiness tracking is added; admins see all 100 with a
// computed readiness status via the qa/catalogue admin scope.
function buildCatalogue() {
  const pilot = new Set(PILOT_CODES);
  return QUESTIONS.map((item, i) => ({
    ...item,
    display_order: i + 1,
    active: pilot.has(item.code),
    disclaimer_type: DISCLAIMER_BY_CATEGORY[item.category] || 'general',
    min_data_policy: TIMING_CODES.has(item.code) ? 'strict' : 'lenient',
    fallback_block_key: 'insufficient_data',
    rule_version: 1,
    template_version: 1,
  }));
}
function buildRequirements() { return QUESTIONS.map(requirementsFor); }

// ── Legacy 66 → 100 aliases (approved decisions) ─────────────────────────────
const ALIASES = [
  // aliased (legacy_key → nearest new code)
  ...[
    ['career_field','Q011'],['career_business','Q012'],['career_govt','Q013'],['career_change','Q015'],
    ['career_promotion','Q016'],['career_abroad_job','Q018'],['career_growth','Q020'],['career_stability','Q020'],
    ['career_startup','Q025'],['career_offer','Q015'],
    ['marriage_when','Q041'],['marriage_delay','Q042'],['marriage_partner','Q043'],['marriage_love_arranged','Q044'],
    ['marriage_life','Q045'],['marriage_compatibility','Q047'],['marriage_happiness','Q045'],['marriage_manglik','Q042'],
    ['love_success','Q047'],['love_timing','Q041'],['love_family_approval','Q044'],
    ['finance_wealth','Q031'],['finance_growth','Q040'],['finance_savings','Q033'],['finance_sudden','Q035'],
    ['finance_multiple_income','Q032'],['finance_debt','Q036'],['finance_loan','Q036'],
    ['property_buy','Q081'],['property_own_house','Q081'],['property_sell','Q084'],['property_vehicle','Q085'],['property_land','Q082'],
    ['education_higher','Q062'],['education_competition','Q063'],['education_abroad','Q064'],['education_exam','Q068'],['education_focus','Q067'],
    ['health_general','Q071'],['health_energy','Q072'],['health_mental','Q073'],['health_care','Q075'],['health_remedies','Q078'],
    ['family_children','Q051'],['family_child_future','Q053'],['family_parents','Q057'],['family_disputes','Q055'],['family_harmony','Q060'],
    ['foreign_settlement','Q088'],['foreign_travel','Q087'],['foreign_timing','Q087'],
    ['spirit_purpose','Q006'],['spirit_growth','Q099'],['spirit_practice','Q099'],['spirit_obstacles','Q099'],
    ['general_strengths','Q002'],['general_challenges','Q003'],['general_year','Q097'],['general_success','Q097'],
    ['general_current_dasha','Q091'],['general_lucky','Q093'],['general_decision','Q098'],['general_sade_sati','Q094'],
  ].map(([legacy_key, question_code]) => ({ legacy_key, question_code, status:'aliased' })),
  // retired (approved: no forced home)
  ...['love_reunite','finance_investment','marriage_second'].map((legacy_key) => ({ legacy_key, question_code:null, status:'retired' })),
];

// ── Shared answer blocks (disclaimers, insufficient-data, D3/D11 note) ────────
const SHARED_BLOCKS = [
  { block_key:'disclaimer_medical', type:'disclaimer_medical', lang:'en', version:1, text:'This astrological analysis describes general tendencies only. Please consult a qualified medical professional for any health concern.' },
  { block_key:'disclaimer_medical', type:'disclaimer_medical', lang:'hi', version:1, text:'यह ज्योतिषीय विश्लेषण केवल सामान्य प्रवृत्तियों को दर्शाता है। किसी भी स्वास्थ्य समस्या के लिए योग्य डॉक्टर से सलाह लेना आवश्यक है।' },
  { block_key:'disclaimer_financial', type:'disclaimer_financial', lang:'en', version:1, text:'This astrological analysis indicates financial tendencies and should not be treated as investment or financial advice.' },
  { block_key:'disclaimer_financial', type:'disclaimer_financial', lang:'hi', version:1, text:'यह ज्योतिषीय विश्लेषण आर्थिक प्रवृत्तियों का संकेत देता है, लेकिन इसे निवेश या वित्तीय सलाह नहीं माना जाना चाहिए।' },
  { block_key:'disclaimer_marriage', type:'disclaimer_general', lang:'en', version:1, text:'This reflects astrological tendencies about relationships, not guaranteed outcomes. Mutual understanding and honest communication matter most.' },
  { block_key:'disclaimer_marriage', type:'disclaimer_general', lang:'hi', version:1, text:'यह संबंधों की ज्योतिषीय प्रवृत्तियों को दर्शाता है, निश्चित परिणाम नहीं। आपसी समझ और ईमानदार संवाद सबसे महत्वपूर्ण हैं।' },
  { block_key:'disclaimer_general', type:'disclaimer_general', lang:'en', version:1, text:'This is a rule-based Jyotish interpretation of tendencies, not a guaranteed prediction.' },
  { block_key:'disclaimer_general', type:'disclaimer_general', lang:'hi', version:1, text:'यह प्रवृत्तियों की नियम-आधारित ज्योतिष व्याख्या है, गारंटीकृत भविष्यवाणी नहीं।' },
  { block_key:'insufficient_data', type:'insufficient_data', lang:'en', version:1, text:'A reliable answer to this question requires additional chart or Dasha details that are incomplete in the available Kundli data, so a definite interpretation should not be provided yet.' },
  { block_key:'insufficient_data', type:'insufficient_data', lang:'hi', version:1, text:'इस प्रश्न का विश्वसनीय उत्तर देने के लिए आवश्यक चार्ट या दशा की जानकारी आपकी उपलब्ध Kundli data में पूरी नहीं है, इसलिए अभी निश्चित निष्कर्ष देना उचित नहीं होगा।' },
  { block_key:'limitation_d3', type:'insufficient_data', lang:'en', version:1, text:'A dedicated D3 (siblings) chart is not available; this reading uses the birth-chart third house only, so treat sibling-specific detail as indicative.' },
  { block_key:'limitation_d3', type:'insufficient_data', lang:'hi', version:1, text:'पृथक D3 (भाई-बहन) चार्ट उपलब्ध नहीं है; यह विश्लेषण केवल जन्म कुंडली के तृतीय भाव पर आधारित है, इसलिए भाई-बहन संबंधी विवरण को संकेतात्मक मानें।' },
  { block_key:'limitation_d11', type:'insufficient_data', lang:'en', version:1, text:'A dedicated D11 (gains) chart is not available; this reading uses the birth-chart eleventh house only, so treat gains-specific detail as indicative.' },
  { block_key:'limitation_d11', type:'insufficient_data', lang:'hi', version:1, text:'पृथक D11 (लाभ) चार्ट उपलब्ध नहीं है; यह विश्लेषण केवल जन्म कुंडली के एकादश भाव पर आधारित है, इसलिए लाभ संबंधी विवरण को संकेतात्मक मानें।' },
];

// Pilot set (implemented in the pilot phase, not now).
const PILOT_CODES = ['Q001','Q012','Q021','Q031','Q041','Q051','Q061','Q071','Q081','Q093'];

module.exports = {
  CATEGORIES, QUESTIONS, ALIASES, SHARED_BLOCKS, PILOT_CODES,
  buildCatalogue, buildRequirements, requirementsFor,
};
