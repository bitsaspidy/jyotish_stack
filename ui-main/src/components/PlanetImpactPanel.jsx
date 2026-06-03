'use client';
import { useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const t = (lang, en, hi) => lang === 'hi' ? hi : en;

const PLANET_META = {
  Sun:     { icon:'☉', color:'#F59E0B', hi:'सूर्य'     },
  Moon:    { icon:'☽', color:'#94A3B8', hi:'चन्द्र'    },
  Mars:    { icon:'♂', color:'#EF4444', hi:'मंगल'       },
  Mercury: { icon:'☿', color:'#10B981', hi:'बुध'        },
  Jupiter: { icon:'♃', color:'#FBBF24', hi:'बृहस्पति'  },
  Venus:   { icon:'♀', color:'#F472B6', hi:'शुक्र'      },
  Saturn:  { icon:'♄', color:'#818CF8', hi:'शनि'        },
  Rahu:    { icon:'☊', color:'#A78BFA', hi:'राहु'       },
  Ketu:    { icon:'☋', color:'#6B7280', hi:'केतु'       },
};

const HOUSE_DOMAIN = {
  1:  { en:'Self & Body',           hi:'स्व और शरीर'         },
  2:  { en:'Wealth & Family',       hi:'धन और परिवार'         },
  3:  { en:'Siblings & Courage',    hi:'भाई-बहन और साहस'      },
  4:  { en:'Home & Mother',         hi:'घर और माता'           },
  5:  { en:'Children & Creativity', hi:'संतान और रचनात्मकता'  },
  6:  { en:'Health & Work',         hi:'स्वास्थ्य और काम'     },
  7:  { en:'Marriage & Partners',   hi:'विवाह और साझेदारी'   },
  8:  { en:'Secrets & Obstacles',   hi:'रहस्य और बाधाएं'      },
  9:  { en:'Fortune & Father',      hi:'भाग्य और पिता'        },
  10: { en:'Career & Status',       hi:'करियर और प्रतिष्ठा'   },
  11: { en:'Income & Gains',        hi:'आय और लाभ'            },
  12: { en:'Expenses & Liberation', hi:'व्यय और मोक्ष'        },
};

// ─── Per-planet life-area impact data ─────────────────────────────────────────
// Each planet has items for positive / mixed / negative assessments.
// Each item: { area_en, area_hi, icon, en, hi }
const PLANET_IMPACT = {
  Sun: {
    positive: [
      { area_en:'Career & Leadership',  area_hi:'करियर और नेतृत्व',   icon:'💼', en:'Natural authority — leadership and recognition come with time. Good prospects in management, government, or administration.', hi:'स्वाभाविक नेतृत्व — पहचान और सम्मान समय के साथ आता है। प्रबंधन, सरकारी काम में अच्छी संभावनाएं हैं।' },
      { area_en:'Self-Confidence',      area_hi:'आत्मविश्वास',          icon:'✨', en:'Strong, steady self-confidence — you hold your ground under pressure without second-guessing yourself.', hi:'मजबूत आत्मविश्वास — दबाव में भी खुद पर भरोसा बना रहता है।' },
      { area_en:'Father & Authorities', area_hi:'पिता और अधिकारी',     icon:'👨', en:'Father relationship is generally supportive. Relationships with bosses or government authorities work in your favour.', hi:'पिता संबंध सहायक है। बॉस और अधिकारियों के साथ संबंध अनुकूल रहता है।' },
      { area_en:'Social Status',        area_hi:'सामाजिक प्रतिष्ठा',   icon:'🌟', en:'Good reputation in society and community. Your integrity and confidence naturally attract respect.', hi:'समाज में अच्छी प्रतिष्ठा। आपकी ईमानदारी और आत्मविश्वास सम्मान खींचते हैं।' },
      { area_en:'Eye & Heart Health',   area_hi:'नेत्र और हृदय',        icon:'❤️', en:'Eye and heart health generally strong with normal care. Annual check-ups are sufficient.', hi:'सामान्य देखभाल से नेत्र और हृदय ठीक रहता है। वार्षिक जांच पर्याप्त है।' },
    ],
    mixed: [
      { area_en:'Career & Leadership',  area_hi:'करियर और नेतृत्व',   icon:'💼', en:'Career recognition comes, but needs consistent effort. Do not expect promotions automatically — ask for them, document achievements.', hi:'करियर में पहचान आती है पर निरंतर प्रयास चाहिए। उपलब्धियां दर्ज करें और मांगें।' },
      { area_en:'Self-Confidence',      area_hi:'आत्मविश्वास',          icon:'✨', en:'Confidence fluctuates — strong in familiar areas, shaky in unfamiliar ones. Preparation is your best confidence builder.', hi:'आत्मविश्वास उतार-चढ़ाव वाला है — परिचित क्षेत्रों में मजबूत। तैयारी सबसे अच्छा उपाय है।' },
      { area_en:'Father & Authorities', area_hi:'पिता और अधिकारी',     icon:'👨', en:'Father or authority relationships have both positive and friction phases. Clear communication prevents most conflicts.', hi:'पिता या अधिकारियों के साथ अच्छे और तनावपूर्ण दोनों दौर आते हैं।' },
      { area_en:'Social Status',        area_hi:'सामाजिक प्रतिष्ठा',   icon:'🌟', en:'Status grows slowly but steadily. Government or legal processes may take longer than expected.', hi:'प्रतिष्ठा धीरे पर स्थिर रूप से बढ़ती है। सरकारी प्रक्रियाएं अधिक समय ले सकती हैं।' },
      { area_en:'Eye & Heart Health',   area_hi:'नेत्र और हृदय',        icon:'❤️', en:'Monitor heart and eye health proactively — twice-yearly check-ups are recommended, especially after 40.', hi:'हृदय और नेत्र की सक्रिय निगरानी करें — 40 के बाद साल में दो बार जांच।' },
    ],
    negative: [
      { area_en:'Career & Leadership',  area_hi:'करियर और नेतृत्व',   icon:'💼', en:'Career recognition requires deliberate, sustained effort — it will not come automatically. Build visible achievements consistently.', hi:'करियर में पहचान के लिए जानबूझकर प्रयास जरूरी है। दृश्यमान उपलब्धियां लगातार बनाएं।' },
      { area_en:'Self-Confidence',      area_hi:'आत्मविश्वास',          icon:'✨', en:'Self-confidence dips under pressure or criticism. Inner confidence work — affirmations, small wins, therapy — directly helps.', hi:'दबाव या आलोचना में आत्मविश्वास कम होता है। आंतरिक विकास कार्य सीधे मदद करता है।' },
      { area_en:'Authority Conflicts',  area_hi:'अधिकारी संबंध',        icon:'🚧', en:'Boss, government, or father figures can be sources of friction. Pick your battles carefully — not every fight is worth having.', hi:'बॉस, सरकार या पिता तनाव का स्रोत हो सकते हैं। हर लड़ाई लड़ने योग्य नहीं होती।' },
      { area_en:'Legal & Govt Matters', area_hi:'कानूनी और सरकारी',    icon:'⚖️', en:'Government and legal matters need expert guidance — never handle alone. Documentation and patience are essential.', hi:'सरकारी और कानूनी मामलों में अनुभवी मार्गदर्शन लें — कभी अकेले न संभालें।' },
      { area_en:'Eye & Heart Health',   area_hi:'नेत्र और हृदय',        icon:'❤️', en:'Consistent attention to heart and eye health is essential. Do not ignore even small symptoms — early care prevents bigger problems.', hi:'हृदय और नेत्र की निरंतर देखभाल जरूरी है। छोटे लक्षणों को नजरअंदाज न करें।' },
    ],
  },

  Moon: {
    positive: [
      { area_en:'Mind & Emotions',         area_hi:'मन और भावनाएं',           icon:'🧠', en:'Emotionally balanced and resilient — you recover from setbacks quickly and maintain inner peace most of the time.', hi:'भावनात्मक रूप से संतुलित — झटकों से जल्दी उबरते हैं और अधिकतर समय आंतरिक शांति बनाए रखते हैं।' },
      { area_en:'Mother & Home Life',      area_hi:'माता और घरेलू जीवन',      icon:'🏠', en:'Mother relationship is nurturing and supportive. Home life provides genuine comfort and emotional security.', hi:'माता संबंध पोषक और सहायक है। घरेलू जीवन वास्तविक आराम और भावनात्मक सुरक्षा देता है।' },
      { area_en:'Wealth & Stability',      area_hi:'धन और स्थिरता',            icon:'💰', en:'Money flows with relative ease — a natural sense for accumulating and preserving wealth over time.', hi:'धन अपेक्षाकृत आसानी से आता है। समय के साथ धन जमा करने और बचाने का प्राकृतिक बोध है।' },
      { area_en:'Memory & Learning',       area_hi:'स्मृति और सीखना',          icon:'📚', en:'Good memory, quick retention, and a receptive mind make learning and creative work come naturally.', hi:'अच्छी स्मृति और ग्रहणशील मन — सीखना और रचनात्मक काम स्वाभाविक रूप से आता है।' },
      { area_en:'Mental & Gut Health',     area_hi:'मानसिक और पाचन स्वास्थ्य', icon:'💊', en:'Strong mental health and stable digestive system. Your emotional state and physical digestion are closely linked.', hi:'मजबूत मानसिक स्वास्थ्य और स्थिर पाचन। भावनात्मक स्थिति और पाचन गहरे से जुड़े हैं।' },
    ],
    mixed: [
      { area_en:'Mind & Emotions',         area_hi:'मन और भावनाएं',           icon:'🧠', en:'Emotions fluctuate with lunar cycles — some days feel very settled, others unsettled. Meditation and sleep hygiene help significantly.', hi:'भावनाएं चंद्र चक्रों के साथ बदलती हैं। ध्यान और नींद स्वच्छता काफी मदद करती है।' },
      { area_en:'Mother & Home Life',      area_hi:'माता और घरेलू जीवन',      icon:'🏠', en:'Mother relationship has both loving and complex phases. Home life can shift between harmonious and tense periods.', hi:'माता संबंध में प्रेम और जटिलता दोनों हैं। घरेलू जीवन में उतार-चढ़ाव के दौर आते हैं।' },
      { area_en:'Wealth & Stability',      area_hi:'धन और स्थिरता',            icon:'💰', en:'Finances are generally manageable but inconsistent — having a savings buffer of 3–6 months expenses is especially important.', hi:'वित्त प्रबंधनीय है पर असंगत — 3-6 माह के खर्च की बचत रखना विशेष रूप से जरूरी है।' },
      { area_en:'Concentration',           area_hi:'एकाग्रता',                 icon:'📚', en:'Concentration works well when rested but drops sharply with poor sleep. Protect your sleep as a top priority.', hi:'एकाग्रता आराम में अच्छी है पर नींद खराब होने पर तेजी से गिरती है।' },
      { area_en:'Mental & Gut Health',     area_hi:'मानसिक और पाचन स्वास्थ्य', icon:'💊', en:'Digestive sensitivity and emotional eating patterns are linked for you — stress directly affects the stomach.', hi:'पाचन संवेदनशीलता और तनाव सीधे जुड़े हैं। तनाव सीधे पेट को प्रभावित करता है।' },
    ],
    negative: [
      { area_en:'Emotional Stability',     area_hi:'भावनात्मक स्थिरता',       icon:'🧠', en:'Emotional instability can affect decision-making — important choices made during low periods often need revisiting. Build a consistent inner practice.', hi:'भावनात्मक अस्थिरता निर्णय लेने को प्रभावित कर सकती है। एक नियमित आंतरिक अभ्यास बनाएं।' },
      { area_en:'Mother & Home Life',      area_hi:'माता और घरेलू जीवन',      icon:'🏠', en:'Mother relationship or home life may require extra effort and conscious boundary-setting to remain peaceful.', hi:'माता संबंध या घरेलू जीवन को शांत रखने के लिए अतिरिक्त प्रयास और सीमाएं जरूरी हैं।' },
      { area_en:'Financial Consistency',   area_hi:'वित्तीय निरंतरता',         icon:'💰', en:'Impulsive spending and financial inconsistency are real risks. Automated savings and avoiding unplanned purchases are essential habits.', hi:'आवेगी खर्च और वित्तीय असंगतता वास्तविक जोखिम हैं। स्वचालित बचत जरूरी है।' },
      { area_en:'Mental Health',           area_hi:'मानसिक स्वास्थ्य',         icon:'💊', en:'Mental health is an active priority — regular sleep, exercise, and stillness practice are non-negotiable for your wellbeing.', hi:'मानसिक स्वास्थ्य सक्रिय प्राथमिकता है — नियमित नींद, व्यायाम और ध्यान जरूरी है।' },
      { area_en:'Social Anxiety',          area_hi:'सामाजिक चिंता',            icon:'🌐', en:'Social situations may trigger anxiety or overthinking. Ground yourself before important interactions; preparation reduces anxiety significantly.', hi:'सामाजिक स्थितियां चिंता या अत्यधिक सोच ला सकती हैं। महत्वपूर्ण मुलाकातों से पहले तैयारी करें।' },
    ],
  },

  Mars: {
    positive: [
      { area_en:'Energy & Drive',          area_hi:'ऊर्जा और साहस',          icon:'⚡', en:'High physical energy, strong willpower, and natural courage — you push through obstacles that stop most people.', hi:'उच्च शारीरिक ऊर्जा, मजबूत इच्छाशक्ति — आप उन बाधाओं को पार करते हैं जो अधिकांश को रोकती हैं।' },
      { area_en:'Property & Land',         area_hi:'संपत्ति और भूमि',         icon:'🏠', en:'Property dealings go relatively smoothly — buying, owning, or building is well-supported by your chart.', hi:'संपत्ति और भूमि के मामले अपेक्षाकृत अनुकूल हैं।' },
      { area_en:'Technical Career',        area_hi:'तकनीकी करियर',            icon:'🔧', en:'Engineering, surgery, sports, construction, military, or any action-based career is strongly supported.', hi:'इंजीनियरिंग, सर्जरी, खेल, निर्माण, सेना — किसी भी कर्म-आधारित करियर को मजबूत समर्थन।' },
      { area_en:'Siblings',                area_hi:'भाई-बहन',                 icon:'👥', en:'Sibling relationships are generally active and mutually helpful — brothers especially play a positive role.', hi:'भाई-बहन संबंध सक्रिय और परस्पर सहायक हैं — भाई विशेष रूप से सकारात्मक भूमिका निभाते हैं।' },
      { area_en:'Physical Vitality',       area_hi:'शारीरिक शक्ति',           icon:'💪', en:'Strong physical body with good recovery — you bounce back from illness and physical exertion faster than most.', hi:'मजबूत शरीर और अच्छी रिकवरी — आप बीमारी और शारीरिक थकान से दूसरों से तेज उबरते हैं।' },
    ],
    mixed: [
      { area_en:'Energy & Drive',          area_hi:'ऊर्जा और साहस',          icon:'⚡', en:'Energy comes in bursts — high drive followed by burnout if unmanaged. Regular exercise channels Mars energy productively.', hi:'ऊर्जा उछाल में आती है — बिना प्रबंधन के थकान होती है। नियमित व्यायाम मंगल ऊर्जा को सकारात्मक दिशा देता है।' },
      { area_en:'Property & Land',         area_hi:'संपत्ति और भूमि',         icon:'🏠', en:'Property progress is possible but may involve delays or minor disputes. Get everything in writing.', hi:'संपत्ति में प्रगति होती है पर देरी या छोटे विवाद हो सकते हैं। सब कुछ लिखित में लें।' },
      { area_en:'Career Ambition',         area_hi:'करियर महत्वाकांक्षा',    icon:'🔧', en:'Ambition and drive are present but anger or impatience can undermine opportunities. Manage reactions carefully.', hi:'महत्वाकांक्षा और साहस मौजूद है पर क्रोध या अधीरता अवसर खो सकती है।' },
      { area_en:'Siblings',                area_hi:'भाई-बहन',                 icon:'👥', en:'Sibling relationships can shift between close and conflicted — boundaries and open communication are key.', hi:'भाई-बहन संबंध करीबी और संघर्षपूर्ण के बीच बदल सकता है। संचार खुला रखें।' },
      { area_en:'Injuries & Inflammation', area_hi:'चोट और सूजन',             icon:'🩺', en:'Watch for inflammation, injuries, or blood-related issues during high-stress periods. Regular physical activity and hydration help.', hi:'तनाव के दौरान सूजन, चोट पर ध्यान दें। नियमित गतिविधि और पानी सहायक है।' },
    ],
    negative: [
      { area_en:'Anger & Impulsiveness',   area_hi:'क्रोध और आवेगिता',       icon:'🚨', en:'Impulsive decisions and anger create more problems than they solve. The pause before reacting is your most powerful tool.', hi:'आवेगी निर्णय और क्रोध मूल समस्या से अधिक परेशानी पैदा करते हैं। प्रतिक्रिया से पहले रुकना सबसे शक्तिशाली उपाय है।' },
      { area_en:'Property Disputes',       area_hi:'संपत्ति विवाद',           icon:'🏠', en:'Land, property, or inheritance disputes are possible. Always have legal documentation and avoid verbal agreements.', hi:'जमीन, संपत्ति या विरासत विवाद संभव हैं। हमेशा कानूनी दस्तावेज रखें।' },
      { area_en:'Career Stability',        area_hi:'करियर स्थिरता',           icon:'🔧', en:'Career ambition may be undermined by aggression, recklessness, or conflicts with colleagues. Professional boundaries matter.', hi:'करियर महत्वाकांक्षा आक्रामकता या सहकर्मियों से संघर्ष से कमजोर हो सकती है।' },
      { area_en:'Accidents & Injuries',    area_hi:'दुर्घटनाएं और चोट',       icon:'🩺', en:'Extra caution needed around vehicles, sharp objects, fire, and high-risk physical activities. Do not take safety shortcuts.', hi:'वाहनों, धारदार वस्तुओं और उच्च जोखिम गतिविधियों में अतिरिक्त सावधानी जरूरी है।' },
      { area_en:'Blood & BP Health',       area_hi:'रक्त और रक्तचाप',         icon:'💊', en:'Blood pressure, blood disorders, and inflammatory conditions need proactive monitoring — do not wait for symptoms to worsen.', hi:'रक्तचाप और सूजन संबंधी स्थितियों की सक्रिय निगरानी जरूरी है।' },
    ],
  },

  Mercury: {
    positive: [
      { area_en:'Intelligence & Thinking', area_hi:'बुद्धि और विचार',         icon:'🧠', en:'Sharp, quick mind — you grasp complex ideas fast, connect concepts others miss, and express yourself with clarity.', hi:'तेज, चुस्त दिमाग — जटिल विचारों को जल्दी समझते हैं और स्पष्टता से व्यक्त करते हैं।' },
      { area_en:'Education & Learning',    area_hi:'शिक्षा और ज्ञान',         icon:'📚', en:'Education comes naturally — academic success is well-supported. Excellence in mathematics, languages, sciences, or writing is indicated.', hi:'शिक्षा स्वाभाविक रूप से आती है। गणित, भाषा, विज्ञान या लेखन में उत्कृष्टता संकेतित है।' },
      { area_en:'Business & Trade',        area_hi:'व्यापार और व्यापार',       icon:'💼', en:'Business, trade, negotiation, and communication-based careers are strongly favoured. You can sell, persuade, and negotiate effectively.', hi:'व्यापार, बातचीत और संवाद-आधारित करियर अत्यधिक अनुकूल है। आप प्रभावी ढंग से बेच, मना और बातचीत कर सकते हैं।' },
      { area_en:'Communication & Media',   area_hi:'संचार और मीडिया',          icon:'🎤', en:'Writing, speaking, teaching, or media work are natural strengths. Your words carry clarity and persuasive power.', hi:'लेखन, बोलना, पढ़ाना या मीडिया काम प्राकृतिक शक्तियां हैं।' },
      { area_en:'Nervous System Health',   area_hi:'नाड़ी तंत्र और त्वचा',    icon:'💊', en:'Nervous system and skin health are generally good. Good sleep and mental rest maintain this strength.', hi:'नाड़ी तंत्र और त्वचा स्वास्थ्य सामान्यतः अच्छा है। अच्छी नींद इसे बनाए रखती है।' },
    ],
    mixed: [
      { area_en:'Intelligence & Focus',    area_hi:'बुद्धि और फ़ोकस',         icon:'🧠', en:'Intelligent but may scatter energy across too many things — depth beats breadth. Pick 2–3 areas and go deep.', hi:'बुद्धिमान पर ऊर्जा बहुत जगह बिखर सकती है। 2-3 क्षेत्र चुनें और गहराई से काम करें।' },
      { area_en:'Education',               area_hi:'शिक्षा',                   icon:'📚', en:'Education is possible but certain subjects need more focused effort. Self-directed learning often works better than classroom settings.', hi:'शिक्षा संभव है पर कुछ विषयों में अधिक केंद्रित प्रयास चाहिए।' },
      { area_en:'Business Communication',  area_hi:'व्यापार संचार',            icon:'💼', en:'Business communication can sometimes cause misunderstandings even when well-intended. Written confirmations prevent most issues.', hi:'व्यापार संचार में गलतफहमी हो सकती है। लिखित पुष्टियां अधिकांश समस्याओं को रोकती हैं।' },
      { area_en:'Decision-Making',         area_hi:'निर्णय लेना',              icon:'🎤', en:'Tendency to overthink before deciding — set a time limit for analysis, then commit to a choice and move forward.', hi:'निर्णय से पहले अत्यधिक सोचने की प्रवृत्ति — विश्लेषण के लिए समय सीमा तय करें।' },
      { area_en:'Anxiety & Nerves',        area_hi:'चिंता और घबराहट',          icon:'💊', en:'Anxiety and nervous tension are possible in high-stress periods. Regular breaks and breathing exercises help significantly.', hi:'उच्च तनाव में चिंता और घबराहट संभव है। नियमित ब्रेक और श्वास व्यायाम काफी मदद करते हैं।' },
    ],
    negative: [
      { area_en:'Mental Clarity',          area_hi:'मानसिक स्पष्टता',         icon:'🧠', en:'Anxiety, overthinking, or inability to focus are active challenges. Structured routines, journaling, and mindfulness practice help most.', hi:'चिंता, अत्यधिक सोच या ध्यान केंद्रित करने में कठिनाई। संरचित दिनचर्या और माइंडफुलनेस सबसे ज्यादा मदद करते हैं।' },
      { area_en:'Education & Learning',    area_hi:'शिक्षा और ज्ञान',         icon:'📚', en:'Academic or professional learning requires more patience and deliberate effort. Short study sessions daily outperform marathon cramming.', hi:'शैक्षणिक सीखने में अधिक धैर्य चाहिए। प्रतिदिन छोटे अध्ययन सत्र बेहतर काम करते हैं।' },
      { area_en:'Business & Contracts',    area_hi:'व्यापार और अनुबंध',       icon:'💼', en:'Communication gaps in business can cost money. Always get agreements in writing — never rely on verbal understanding alone.', hi:'व्यापार में संचार की खामियां पैसे की हानि कर सकती हैं। सभी समझौते लिखित में लें।' },
      { area_en:'Sibling Relationships',   area_hi:'भाई-बहन संबंध',           icon:'👥', en:'Sibling or friend relationships may have trust issues or recurring miscommunications. Active listening solves more than clever arguments.', hi:'भाई-बहन या मित्र संबंधों में विश्वास समस्याएं हो सकती हैं। सक्रिय सुनना तर्क से अधिक हल करता है।' },
      { area_en:'Nervous System Care',     area_hi:'नाड़ी तंत्र देखभाल',     icon:'💊', en:'Actively protect nervous system health: reduce caffeine, screen time limits, and 7–8 hours of sleep are essential.', hi:'नाड़ी तंत्र की सक्रिय देखभाल: कैफीन कम करें, स्क्रीन समय सीमित करें, 7-8 घंटे की नींद जरूरी है।' },
    ],
  },

  Jupiter: {
    positive: [
      { area_en:'Wealth & Growth',         area_hi:'धन और विकास',             icon:'💰', en:'Strong financial growth — wealth accumulates steadily and you tend to be in the right place at the right time for opportunities.', hi:'मजबूत आर्थिक वृद्धि — धन स्थिर रूप से बढ़ता है। आप अवसरों के लिए सही समय और जगह पर रहते हैं।' },
      { area_en:'Education & Wisdom',      area_hi:'शिक्षा और ज्ञान',         icon:'📚', en:'Higher learning, wisdom, and philosophy come naturally. Teachers and mentors play a genuinely positive role in your life.', hi:'उच्च शिक्षा, ज्ञान और दर्शन स्वाभाविक रूप से आते हैं। शिक्षक और गुरु सकारात्मक भूमिका निभाते हैं।' },
      { area_en:'Children & Family',       area_hi:'संतान और परिवार',         icon:'👨‍👩‍👧', en:'Children are a genuine source of joy and blessing. Family life is generally harmonious and relationships feel rewarding.', hi:'संतान वास्तविक खुशी और आशीर्वाद का स्रोत है। पारिवारिक जीवन सामान्यतः सामंजस्यपूर्ण है।' },
      { area_en:'Marriage & Partnership',  area_hi:'विवाह और साझेदारी',       icon:'💍', en:'Marriage or serious partnership is well-supported — a wise, supportive, and growth-oriented partner is indicated for you.', hi:'विवाह या गंभीर साझेदारी को अच्छा समर्थन है — एक बुद्धिमान और विकास-उन्मुख साथी संकेतित है।' },
      { area_en:'Luck & Divine Blessings', area_hi:'भाग्य और दैवीय आशीर्वाद', icon:'🌟', en:'A natural sense of optimism and grace that attracts good fortune. Prayers and gratitude practice amplify what Jupiter already gives.', hi:'स्वाभाविक आशावाद और अनुग्रह जो सौभाग्य आकर्षित करता है। प्रार्थना इसे और बढ़ाती है।' },
    ],
    mixed: [
      { area_en:'Financial Growth',        area_hi:'आर्थिक वृद्धि',           icon:'💰', en:'Financial growth happens but may have ups and downs. Avoid over-expansion and borrowing beyond what is comfortable to repay.', hi:'आर्थिक वृद्धि होती है पर उतार-चढ़ाव हो सकते हैं। अत्यधिक विस्तार और कर्ज से बचें।' },
      { area_en:'Education & Wisdom',      area_hi:'शिक्षा और ज्ञान',         icon:'📚', en:'Education is accessible but may require more consistent effort in specific subjects. Finding the right teacher changes everything.', hi:'शिक्षा सुलभ है पर कुछ विषयों में अधिक प्रयास चाहिए। सही गुरु मिलना सब कुछ बदल देता है।' },
      { area_en:'Children & Family',       area_hi:'संतान और परिवार',         icon:'👨‍👩‍👧', en:'Family is generally positive but may go through phases of complexity or responsibility. Communication keeps the family together.', hi:'परिवार सामान्यतः सकारात्मक है पर जटिलता के दौर हो सकते हैं। संचार परिवार को एकजुट रखता है।' },
      { area_en:'Marriage & Partnership',  area_hi:'विवाह और साझेदारी',       icon:'💍', en:'Partnership is possible and meaningful but may need conscious effort on mutual respect and shared goals.', hi:'साझेदारी संभव और सार्थक है पर आपसी सम्मान पर सचेत काम चाहिए।' },
      { area_en:'Over-Confidence Risk',    area_hi:'अत्यधिक आत्मविश्वास',     icon:'⚠️', en:'Watch for over-promising, over-committing, or taking on more than is manageable — Jupiter\'s expansion energy can overshoot.', hi:'अत्यधिक वादे, प्रतिबद्धताएं लेने से सावधान रहें — गुरु की विस्तार ऊर्जा सीमा पार कर सकती है।' },
    ],
    negative: [
      { area_en:'Financial Discipline',    area_hi:'वित्तीय अनुशासन',         icon:'💰', en:'Financial growth requires deliberate, disciplined effort — passive accumulation does not come easily. Budget strictly and save first.', hi:'आर्थिक वृद्धि के लिए अनुशासित प्रयास चाहिए। सख्त बजट बनाएं और पहले बचत करें।' },
      { area_en:'Education Goals',         area_hi:'शिक्षा लक्ष्य',           icon:'📚', en:'Education goals may face obstacles or delays — persistence, a structured study plan, and the right mentor are the solution.', hi:'शिक्षा लक्ष्यों में बाधाएं हो सकती हैं। दृढ़ता, संरचित अध्ययन योजना और सही गुरु समाधान हैं।' },
      { area_en:'Children & Parenthood',   area_hi:'संतान और माता-पिता',      icon:'👨‍👩‍👧', en:'Path to parenthood may have delays or children may face more challenges. Medical consultation after 2 years of trying is recommended.', hi:'माता-पिता बनने के रास्ते में देरी हो सकती है। 2 वर्ष के प्रयास के बाद चिकित्सा परामर्श लें।' },
      { area_en:'Marriage Delays',         area_hi:'विवाह में देरी',           icon:'💍', en:'Marriage may be delayed or the right partner may take time to appear. Use the waiting period to build yourself — the right match follows self-development.', hi:'विवाह में देरी हो सकती है। प्रतीक्षा के दौरान खुद को बनाएं — सही साथी आत्म-विकास के बाद आता है।' },
      { area_en:'Liver & Weight Health',   area_hi:'यकृत और वजन',              icon:'💊', en:'Jupiter rules the liver and weight — excess food and alcohol affect these directly. Consistent moderation in diet matters.', hi:'गुरु यकृत और वजन को नियंत्रित करता है। भोजन और शराब में संयम जरूरी है।' },
    ],
  },

  Venus: {
    positive: [
      { area_en:'Love & Romance',          area_hi:'प्रेम और रोमांस',         icon:'💕', en:'Naturally attractive personality — romantic relationships tend to flow and deepen without excessive effort.', hi:'स्वाभाविक रूप से आकर्षक व्यक्तित्व — प्रेम संबंध अत्यधिक प्रयास के बिना गहरे होते हैं।' },
      { area_en:'Marriage & Partnership',  area_hi:'विवाह और संबंध',           icon:'💍', en:'Marriage is well-supported — a loving, refined, or materially comfortable partner is indicated in your chart.', hi:'विवाह को अच्छा समर्थन है — प्यार करने वाला, परिष्कृत या आर्थिक रूप से सुखी साथी संकेतित है।' },
      { area_en:'Wealth & Luxury',         area_hi:'धन और विलासिता',           icon:'💰', en:'Material comfort, luxury, and beautiful surroundings come with relative ease — you know how to enjoy life well.', hi:'भौतिक आराम, विलासिता और सुंदर वातावरण अपेक्षाकृत आसानी से आते हैं।' },
      { area_en:'Arts & Creativity',       area_hi:'कला और रचनात्मकता',       icon:'🎨', en:'Creative, aesthetic, and artistic gifts are real — music, visual arts, design, fashion, or any beauty-related field is strongly supported.', hi:'रचनात्मक और कलात्मक उपहार वास्तविक हैं। संगीत, दृश्य कला, डिज़ाइन में मजबूत समर्थन।' },
      { area_en:'Reproductive Health',     area_hi:'प्रजनन स्वास्थ्य',         icon:'💊', en:'Reproductive health and kidney function are generally good with normal attention to diet and hydration.', hi:'प्रजनन स्वास्थ्य और गुर्दे सामान्य आहार और पानी से ठीक रहते हैं।' },
    ],
    mixed: [
      { area_en:'Love & Romance',          area_hi:'प्रेम और रोमांस',         icon:'💕', en:'Love relationships can be fulfilling but may have phases of uncertainty — knowing your own worth is the foundation.', hi:'प्रेम संबंध पूर्ण हो सकते हैं पर अनिश्चितता के दौर हो सकते हैं। अपना मूल्य जानना नींव है।' },
      { area_en:'Marriage & Partnership',  area_hi:'विवाह और संबंध',           icon:'💍', en:'Marriage is achievable but may need working through differing expectations. Honest conversations early save years of friction later.', hi:'विवाह संभव है पर अपेक्षाओं में अंतर पर काम चाहिए। शुरुआत में ईमानदार बातचीत बाद में घर्षण बचाती है।' },
      { area_en:'Finances & Luxury',       area_hi:'वित्त और विलासिता',        icon:'💰', en:'Financial comfort is variable — periods of plenty and tighter resources alternate. Build savings discipline especially during good phases.', hi:'आर्थिक आराम परिवर्तनशील है। समृद्धि के दौर में बचत अनुशासन बनाएं।' },
      { area_en:'Creative Expression',     area_hi:'रचनात्मक अभिव्यक्ति',     icon:'🎨', en:'Creative ability is present but may need more deliberate cultivation to fully flourish — find and maintain a creative practice.', hi:'रचनात्मक क्षमता है पर पूरी तरह विकसित करने के लिए जानबूझकर अभ्यास चाहिए।' },
      { area_en:'Overindulgence Risk',     area_hi:'अत्यधिक भोग का जोखिम',    icon:'⚠️', en:'Watch for overindulgence in food, pleasure, or luxury spending — Venus\'s enjoyment energy can tip into excess.', hi:'भोजन, आनंद या विलासिता में अत्यधिक भोग से सावधान रहें।' },
    ],
    negative: [
      { area_en:'Relationship Patterns',   area_hi:'संबंध पैटर्न',             icon:'💕', en:'Disappointment in love or attracting the wrong partners is a risk — knowing your own value and maintaining standards protects you.', hi:'प्रेम में निराशा या गलत साथी आकर्षित होने का जोखिम है। अपना मूल्य जानना और मानक बनाए रखना आपकी रक्षा करता है।' },
      { area_en:'Marriage Challenges',     area_hi:'विवाह चुनौतियां',          icon:'💍', en:'Marriage may face significant delays or require sustained effort to reach harmony. Pre-marital counselling is highly recommended.', hi:'विवाह में महत्वपूर्ण देरी या सामंजस्य के लिए निरंतर प्रयास हो सकता है।' },
      { area_en:'Financial Discipline',    area_hi:'वित्तीय अनुशासन',         icon:'💰', en:'Overspending on luxury, beauty, or pleasure can create serious financial strain — build strict spending limits and track every expense.', hi:'विलासिता पर अत्यधिक खर्च गंभीर आर्थिक तनाव पैदा कर सकता है। खर्च सीमा बनाएं।' },
      { area_en:'Suppressed Creativity',   area_hi:'दबी रचनात्मकता',          icon:'🎨', en:'Creative gifts may be suppressed or underused — not expressing them creates a deep inner dissatisfaction. Find a regular creative outlet.', hi:'रचनात्मक उपहार दबे हो सकते हैं। उन्हें व्यक्त न करना गहरी असंतुष्टि पैदा करता है।' },
      { area_en:'Kidney & Reproductive',   area_hi:'गुर्दे और प्रजनन',        icon:'💊', en:'Take care of reproductive health and kidneys — avoid chronic dehydration and inflammatory foods; regular check-ups matter.', hi:'प्रजनन स्वास्थ्य और गुर्दों की देखभाल करें। पुरानी डिहाइड्रेशन और सूजन वाले भोजन से बचें।' },
    ],
  },

  Saturn: {
    positive: [
      { area_en:'Career & Long-term Goals', area_hi:'करियर और दीर्घकालिक लक्ष्य', icon:'💼', en:'What you build lasts — slow, disciplined, real. Authority, recognition, and lasting career achievements come with time and genuine effort.', hi:'आप जो बनाते हैं वह टिकता है — धीमा, अनुशासित, वास्तविक। समय और ईमानदार प्रयास से अधिकार और पहचान आती है।' },
      { area_en:'Discipline & Work Ethic',  area_hi:'अनुशासन और परिश्रम',      icon:'⚒️', en:'Exceptional work ethic, reliability, and follow-through — employers, clients, and partners trust you because you deliver what you promise.', hi:'असाधारण कार्य नैतिकता और विश्वसनीयता। नियोक्ता और ग्राहक आप पर भरोसा करते हैं।' },
      { area_en:'Justice & Fairness',       area_hi:'न्याय और निष्पक्षता',     icon:'⚖️', en:'Your fair dealings and patient approach to challenges mean karmic balance works in your favour over the long run.', hi:'आपके निष्पक्ष व्यवहार का मतलब है कि कर्मिक संतुलन दीर्घकाल में आपके पक्ष में काम करता है।' },
      { area_en:'Longevity & Stability',    area_hi:'दीर्घायु और स्थिरता',     icon:'🌿', en:'Longevity is well-indicated — Saturn in strength gives a long, relatively stable life with a strong foundation.', hi:'दीर्घायु अच्छी तरह संकेतित है। मजबूत शनि एक लंबा, स्थिर जीवन देता है।' },
      { area_en:'Bone & Joint Health',      area_hi:'हड्डियां और जोड़',        icon:'🦴', en:'Bone and joint health are generally strong with consistent exercise and adequate calcium intake throughout life.', hi:'नियमित व्यायाम और कैल्शियम से हड्डियां और जोड़ आम तौर पर मजबूत रहते हैं।' },
    ],
    mixed: [
      { area_en:'Career Timing',            area_hi:'करियर का समय',            icon:'💼', en:'Career progress is real but may feel slower than you want — your peak typically comes in the 30s and 40s, later than peers but more durable.', hi:'करियर प्रगति वास्तविक है पर साथियों से धीमी लग सकती है। शिखर 30-40 के बाद आता है पर टिकाऊ होता है।' },
      { area_en:'Discipline & Habits',      area_hi:'अनुशासन और आदतें',        icon:'⚒️', en:'Discipline varies — some life areas are highly structured while others feel scattered. Identify the patterns and close the gap.', hi:'अनुशासन असंगत है। कुछ क्षेत्र व्यवस्थित, कुछ बिखरे हुए। पैटर्न पहचानें और अंतर भरें।' },
      { area_en:'Delays & Obstacles',       area_hi:'देरी और बाधाएं',           icon:'⏳', en:'Delays in career, property, or major goals are likely but temporary — what Saturn delays, it eventually delivers when the time is right.', hi:'करियर, संपत्ति में देरी संभव है पर अस्थायी है। शनि जो देरी करता है, सही समय पर देता है।' },
      { area_en:'Older Relationships',      area_hi:'बड़ों के साथ संबंध',       icon:'👴', en:'Relationships with older people, elders, or those in authority can carry heavy responsibility. Set healthy limits.', hi:'बड़ों या अधिकारियों के साथ संबंधों में भारी जिम्मेदारी हो सकती है। स्वस्थ सीमाएं बनाएं।' },
      { area_en:'Joint & Bone Care',        area_hi:'जोड़ और हड्डी की देखभाल', icon:'🦴', en:'Joint and bone health needs regular attention — especially from 40+. Weight-bearing exercise, calcium, and Vitamin D matter.', hi:'जोड़ और हड्डी के स्वास्थ्य पर नियमित ध्यान — विशेष रूप से 40 के बाद। व्यायाम और कैल्शियम जरूरी है।' },
    ],
    negative: [
      { area_en:'Career & Recognition',     area_hi:'करियर और पहचान',          icon:'💼', en:'Career, income, and recognition come significantly later than peers — but what you eventually build is rock-solid. Patience is your primary tool.', hi:'करियर और पहचान साथियों से काफी देर से आती है — पर आप जो बनाते हैं वह ठोस होता है।' },
      { area_en:'Chronic Burdens',          area_hi:'पुरानी जिम्मेदारियां',    icon:'⏳', en:'Chronic responsibilities, delays, or life restrictions can cause frustration and heaviness — regular spiritual practice directly lightens this weight.', hi:'पुरानी जिम्मेदारियां थकान पैदा कर सकती हैं। नियमित आध्यात्मिक अभ्यास सीधे इस भार को हल्का करता है।' },
      { area_en:'Legal & Ethical Risks',    area_hi:'कानूनी और नैतिक जोखिम',  icon:'⚖️', en:'Never cut ethical or legal corners — Saturn\'s justice is slow but absolutely certain. Integrity is your greatest protection.', hi:'कभी नैतिक या कानूनी कोने न काटें — शनि का न्याय धीमा है पर निश्चित है।' },
      { area_en:'Depression Risk',          area_hi:'अवसाद का जोखिम',          icon:'💊', en:'Low periods, depression, or loss of motivation can occur during Saturn cycles. Professional support and community connection help most.', hi:'शनि चक्रों में निम्न दौर या अवसाद हो सकता है। पेशेवर सहायता और समुदाय से जुड़ाव सबसे ज्यादा मदद करता है।' },
      { area_en:'Chronic Health Issues',    area_hi:'पुरानी स्वास्थ्य समस्याएं', icon:'🦴', en:'Joint pain, arthritis, bone density loss, and chronic conditions need proactive care — do not delay treatment or dismiss persistent symptoms.', hi:'जोड़ों का दर्द, गठिया, हड्डी घनत्व की सक्रिय देखभाल जरूरी है। लगातार लक्षणों को नजरअंदाज न करें।' },
    ],
  },

  Rahu: {
    positive: [
      { area_en:'Ambition & Success',       area_hi:'महत्वाकांक्षा और सफलता', icon:'🚀', en:'Powerful ambition and ability to think outside conventional limits — you can reach places through unconventional routes others cannot.', hi:'शक्तिशाली महत्वाकांक्षा और अपरंपरागत सोच — आप ऐसे रास्तों से सफल हो सकते हैं जहां दूसरे नहीं पहुंचते।' },
      { area_en:'Technology & Innovation',  area_hi:'प्रौद्योगिकी और नवाचार', icon:'💻', en:'Technology, foreign connections, research, media, AI, or cutting-edge fields are areas of natural advantage and rapid rise.', hi:'प्रौद्योगिकी, विदेशी संबंध, शोध, मीडिया, AI — इन क्षेत्रों में स्वाभाविक लाभ और तेज उन्नति।' },
      { area_en:'Sudden Fortune',           area_hi:'अचानक सौभाग्य',           icon:'⚡', en:'Unexpected opportunities, sudden good fortune, and rapid rise in recognition or status are genuinely possible for you.', hi:'अप्रत्याशित अवसर, अचानक सौभाग्य और प्रतिष्ठा में तेजी आपके लिए वास्तव में संभव है।' },
      { area_en:'Material Achievement',     area_hi:'भौतिक उपलब्धि',           icon:'🌟', en:'Material desires and financial targets others consider impossible are achievable — Rahu dissolves conventional ceilings.', hi:'जो लक्ष्य दूसरों को असंभव लगते हैं वे आपके लिए प्राप्य हैं — राहु पारंपरिक सीमाएं हटाता है।' },
      { area_en:'Foreign Opportunities',    area_hi:'विदेशी अवसर',             icon:'✈️', en:'Foreign travel, immigration, or work with international connections brings real growth and opportunity.', hi:'विदेश यात्रा, प्रवास या अंतरराष्ट्रीय संबंधों से वास्तविक विकास और अवसर मिलते हैं।' },
    ],
    mixed: [
      { area_en:'Ambition & Direction',     area_hi:'महत्वाकांक्षा और दिशा',  icon:'🚀', en:'Ambition is strong but direction may keep shifting — identify your true long-term goal and commit to it for at least 5 years.', hi:'महत्वाकांक्षा मजबूत है पर दिशा बदलती रहती है। अपना असली दीर्घकालिक लक्ष्य पहचानें और 5 वर्षों के लिए प्रतिबद्ध रहें।' },
      { area_en:'Technology Career',        area_hi:'तकनीकी करियर',            icon:'💻', en:'Unconventional paths offer opportunity, but need grounding in genuine skill — shortcuts lead to short-lived gains.', hi:'अपरंपरागत रास्ते अवसर देते हैं पर असली कौशल की जरूरत है। शॉर्टकट अल्पकालिक लाभ देते हैं।' },
      { area_en:'Sudden Events',            area_hi:'अचानक घटनाएं',            icon:'⚡', en:'Unexpected events can go either way — some bring sudden gains, others sudden disruptions. Build financial reserves for the disruptions.', hi:'अचानक घटनाएं दोनों तरफ जा सकती हैं। व्यवधानों के लिए वित्तीय रिजर्व बनाएं।' },
      { area_en:'Relationship Clarity',     area_hi:'संबंध स्पष्टता',          icon:'💕', en:'Romantic or business relationships can be intensely drawn but confusing — take time before committing. What glitters is not always gold.', hi:'रोमांटिक या व्यावसायिक संबंध तीव्र रूप से आकर्षित कर सकते हैं। प्रतिबद्धता से पहले समय लें।' },
      { area_en:'Unusual Health Symptoms',  area_hi:'असामान्य स्वास्थ्य',       icon:'💊', en:'Health issues may be unusual or difficult to diagnose initially — trust your body, seek second opinions, avoid self-diagnosis.', hi:'स्वास्थ्य समस्याएं असामान्य हो सकती हैं। अपने शरीर पर भरोसा करें, दूसरी राय लें।' },
    ],
    negative: [
      { area_en:'Deception & Illusion',     area_hi:'धोखा और भ्रम',            icon:'🚨', en:'Being misled, deceived, or caught in illusions is an active risk — investigate every new opportunity thoroughly before trusting or investing.', hi:'गुमराह होना, धोखा या भ्रम में फंसना सक्रिय जोखिम है। किसी पर भरोसा या निवेश से पहले पूरी तरह जांच करें।' },
      { area_en:'Career Instability',       area_hi:'करियर अस्थिरता',          icon:'💻', en:'Unconventional career moves can bring instability — build a stable base and financial buffer before taking big risks.', hi:'अपरंपरागत करियर कदम अस्थिरता ला सकते हैं। बड़े जोखिम से पहले स्थिर आधार और वित्तीय बफर बनाएं।' },
      { area_en:'Sudden Losses',            area_hi:'अचानक हानि',               icon:'⚡', en:'Sudden negative events — financial loss, reputation damage, unexpected change — are more likely during Rahu Dasha. Build reserves in advance.', hi:'राहु दशा में अचानक नकारात्मक घटनाएं अधिक संभव हैं। पहले से रिजर्व बनाएं।' },
      { area_en:'Addictive Tendencies',     area_hi:'व्यसनी प्रवृत्तियां',     icon:'⚠️', en:'Addictive tendencies — substances, devices, compulsive behaviours, social media — need conscious awareness and firm limits.', hi:'पदार्थों, उपकरणों, बाध्यकारी व्यवहारों की व्यसनी प्रवृत्तियां — सचेत जागरूकता और दृढ़ सीमाएं जरूरी हैं।' },
      { area_en:'Mental & Mysterious Health', area_hi:'मानसिक और रहस्यमय स्वास्थ्य', icon:'💊', en:'Mental disturbances, unusual symptoms, or mysterious health conditions require thorough investigation — not self-diagnosis and not dismissal.', hi:'मानसिक विक्षोभ या रहस्यमय लक्षणों की गहन जांच जरूरी है — न स्वयं निदान, न अनदेखा करना।' },
    ],
  },

  Ketu: {
    positive: [
      { area_en:'Spiritual Depth',          area_hi:'आध्यात्मिक गहराई',        icon:'🕉️', en:'Deep intuition and spiritual insight — you often know things before they happen, and inner guidance is strong and reliable.', hi:'गहरा अंतर्ज्ञान और आध्यात्मिक दृष्टि — आप अक्सर चीजें होने से पहले जान लेते हैं।' },
      { area_en:'Past-Life Gifts',          area_hi:'पूर्व जन्म के उपहार',     icon:'🔮', en:'Past-life spiritual merit shows up as natural abilities, grace in difficult moments, and skills that come without apparent reason.', hi:'पूर्व जन्म का पुण्य प्राकृतिक क्षमताओं और कठिन क्षणों में अनुग्रह के रूप में प्रकट होता है।' },
      { area_en:'Research & Investigation', area_hi:'शोध और जांच',             icon:'🔭', en:'Exceptional research ability, investigative skills, and the capacity to find hidden truths make you uniquely valuable in complex fields.', hi:'असाधारण शोध क्षमता और छिपे सत्य खोजने की शक्ति आपको जटिल क्षेत्रों में अद्वितीय बनाती है।' },
      { area_en:'Inner Peace',              area_hi:'आंतरिक शांति',            icon:'🌊', en:'Natural detachment from material things brings inner peace and freedom that deeply materialistic people never find.', hi:'भौतिक चीजों से स्वाभाविक वैराग्य आंतरिक शांति और स्वतंत्रता लाता है।' },
      { area_en:'Spiritual Healing',        area_hi:'आध्यात्मिक उपचार',        icon:'✨', en:'Healing modalities — energy healing, astrology, psychology, alternative medicine — are strongly supported and can become a vocation.', hi:'ऊर्जा उपचार, ज्योतिष, मनोविज्ञान, वैकल्पिक चिकित्सा — ये क्षेत्र मजबूत समर्थन और व्यवसाय बन सकते हैं।' },
    ],
    mixed: [
      { area_en:'Intuition vs Logic',       area_hi:'अंतर्ज्ञान बनाम तर्क',   icon:'🔮', en:'Intuition is present but may not always be correctly interpreted — developing discernment between true intuition and fear-based hunches takes practice.', hi:'अंतर्ज्ञान मौजूद है पर हमेशा सही व्याख्यायित नहीं होता। सच्चे अंतर्ज्ञान और भय-आधारित अनुमान में अंतर करना सीखें।' },
      { area_en:'Practical vs Spiritual',  area_hi:'व्यावहारिक बनाम आध्यात्मिक', icon:'🕉️', en:'Spiritual gifts may feel disconnected from daily practical life — finding ways to make spirituality practical and income-generating bridges this gap.', hi:'आध्यात्मिक उपहार दैनिक व्यावहारिक जीवन से कटे महसूस हो सकते हैं।' },
      { area_en:'Career & Materialism',    area_hi:'करियर और भौतिकवाद',       icon:'🔭', en:'Research and investigative abilities are strong but may not translate into consistent income without a solid practical structure around them.', hi:'शोध क्षमताएं मजबूत हैं पर ठोस व्यावहारिक संरचना के बिना निरंतर आय नहीं आती।' },
      { area_en:'Relationship Detachment', area_hi:'संबंध में वैराग्य',        icon:'🌊', en:'Detachment from outcomes can unintentionally create emotional distance in relationships — consciously express care and presence to partners.', hi:'परिणामों से वैराग्य अनजाने में संबंधों में दूरी बना सकता है। जानबूझकर देखभाल और उपस्थिति व्यक्त करें।' },
      { area_en:'Mysterious Health',       area_hi:'रहस्यमय स्वास्थ्य',        icon:'💊', en:'Health issues may be difficult to diagnose initially — trust your body\'s signals and seek thorough investigation rather than dismissing symptoms.', hi:'स्वास्थ्य समस्याएं शुरू में निदान करना मुश्किल हो सकती हैं। शरीर के संकेतों पर भरोसा करें।' },
    ],
    negative: [
      { area_en:'Sense of Loss',            area_hi:'हानि की भावना',            icon:'🌊', en:'Persistent feeling of loss, isolation, or purposelessness — Ketu can create the sense that nothing in the material world fully satisfies.', hi:'हानि, एकाकीपन या उद्देश्यहीनता की लगातार भावना। नियमित आध्यात्मिक अभ्यास इसे काफी कम करता है।' },
      { area_en:'Unexpected Losses',        area_hi:'अचानक हानि',               icon:'⚡', en:'Unexpected losses in career, finances, or relationships may occur — Ketu strips what is not truly yours. Accept gracefully and rebuild.', hi:'करियर, वित्त या संबंधों में अचानक हानि हो सकती है। जो वास्तव में आपका नहीं है उसे जाने दें।' },
      { area_en:'Material Instability',     area_hi:'भौतिक अस्थिरता',           icon:'💰', en:'Difficulty holding onto money, property, or material things — what is grasped may slip away. Focus on experiences and relationships over possessions.', hi:'पैसे, संपत्ति या भौतिक चीजों को बनाए रखने में कठिनाई। संपत्ति की बजाय अनुभव और संबंधों पर ध्यान दें।' },
      { area_en:'Spiritual Confusion',      area_hi:'आध्यात्मिक भ्रम',          icon:'🕉️', en:'Spiritual confusion, feeling purposeless, or being stuck can affect daily motivation. An authentic practice tradition provides stability.', hi:'आध्यात्मिक भ्रम या उद्देश्यहीनता दैनिक प्रेरणा को प्रभावित कर सकती है। एक प्रामाणिक परंपरा स्थिरता देती है।' },
      { area_en:'Viral & Immune Health',    area_hi:'वायरल और प्रतिरक्षा',      icon:'💊', en:'Unusual viral infections or immune challenges may arise — early and thorough investigation is important. Do not dismiss recurring or unusual symptoms.', hi:'असामान्य वायरल संक्रमण या प्रतिरक्षा चुनौतियां उठ सकती हैं। बार-बार आने वाले लक्षणों की गहन जांच करें।' },
    ],
  },
};

const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PlanetImpactPanel({ chart, lang }) {
  const [activeTab, setActiveTab] = useState('all');   // 'all' | 'positive' | 'attention'

  if (!chart?.planets || !chart?.ascendant) return null;

  const assessments = chart.reports?.planet_assessments || {};

  // Build enriched list
  const planetList = PLANET_ORDER.map((name) => {
    const pd      = chart.planets[name];
    if (!pd) return null;
    const house   = pd.rashi_num && chart.ascendant.rashi_num
      ? ((pd.rashi_num - chart.ascendant.rashi_num + 12) % 12) + 1
      : null;
    const assess  = assessments[name] || {};
    const polarity = assess.polarity || 'mixed';
    const items   = PLANET_IMPACT[name]?.[`${polarity}`] || PLANET_IMPACT[name]?.mixed || [];
    return { name, pd, house, polarity, assess, items };
  }).filter(Boolean);

  const positiveList  = planetList.filter(p => p.polarity === 'positive');
  const mixedList     = planetList.filter(p => p.polarity === 'mixed');
  const negativeList  = planetList.filter(p => p.polarity === 'negative');

  const displayList = activeTab === 'positive'   ? positiveList
                    : activeTab === 'attention'  ? [...negativeList, ...mixedList]
                    : planetList;

  const POLARITY_STYLE = {
    positive: { border:'rgba(34,197,94,0.25)',  bg:'rgba(34,197,94,0.08)',  badge_bg:'rgba(34,197,94,0.15)',  badge_color:'#86EFAC', dot:'#22C55E' },
    mixed:    { border:'rgba(245,158,11,0.25)', bg:'rgba(245,158,11,0.07)', badge_bg:'rgba(245,158,11,0.15)', badge_color:'#FCD34D', dot:'#F59E0B' },
    negative: { border:'rgba(239,68,68,0.25)',  bg:'rgba(239,68,68,0.07)',  badge_bg:'rgba(239,68,68,0.15)',  badge_color:'#FCA5A5', dot:'#EF4444' },
  };

  const POLARITY_LABEL = {
    positive: { en:'Benefiting You',      hi:'आपको लाभ दे रहा है'    },
    mixed:    { en:'Mixed Results',       hi:'मिश्रित परिणाम'         },
    negative: { en:'Needs Your Attention', hi:'आपका ध्यान चाहिए'     },
  };

  return (
    <div className="card-royal p-5 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-gold text-sm font-semibold">
            {t(lang, 'How Your Planets Are Affecting Your Life', 'आपके ग्रह आपके जीवन को कैसे प्रभावित कर रहे हैं')}
          </h2>
          <p className="text-ivory/35 text-[10px] mt-1 font-devanagari">
            {t(lang,
              'Each planet governs specific life areas — see what is working well, what needs attention, and what to do.',
              'हर ग्रह विशिष्ट जीवन क्षेत्रों को नियंत्रित करता है — देखें क्या अच्छा चल रहा है और क्या ध्यान चाहिए।'
            )}
          </p>
        </div>
        {/* Quick counts */}
        <div className="flex gap-2 shrink-0 text-[10px]">
          <span className="px-2 py-1 rounded-full bg-emerald-400/12 text-emerald-300 border border-emerald-400/25 font-semibold">
            {positiveList.length} {t(lang, 'Strong', 'शक्तिशाली')}
          </span>
          <span className="px-2 py-1 rounded-full bg-amber-400/12 text-amber-200 border border-amber-400/25 font-semibold">
            {mixedList.length} {t(lang, 'Mixed', 'मिश्रित')}
          </span>
          {negativeList.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-400/12 text-red-300 border border-red-400/25 font-semibold">
              {negativeList.length} {t(lang, 'Watch', 'ध्यान दें')}
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 border-b border-gold/10 pb-3">
        {[
          { key:'all',       en:`All 9 Planets`, hi:`सभी 9 ग्रह`     },
          { key:'positive',  en:`Strong (${positiveList.length})`, hi:`शक्तिशाली (${positiveList.length})`  },
          { key:'attention', en:`Needs Attention (${negativeList.length + mixedList.length})`, hi:`ध्यान चाहिए (${negativeList.length + mixedList.length})` },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className="text-[10px] px-3 py-1.5 rounded font-devanagari transition-all"
            style={{
              background:   activeTab === tab.key ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
              color:        activeTab === tab.key ? '#D4AF37' : 'rgba(245,240,232,0.45)',
              border:       `1px solid ${activeTab === tab.key ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.1)'}`,
              fontWeight:   activeTab === tab.key ? 700 : 400,
            }}>
            {t(lang, tab.en, tab.hi)}
          </button>
        ))}
      </div>

      {/* Planet cards */}
      <div className="space-y-4">
        {displayList.map(({ name, pd, house, polarity, assess, items }) => {
          const meta  = PLANET_META[name];
          const style = POLARITY_STYLE[polarity];
          const houseDomain = house ? HOUSE_DOMAIN[house] : null;

          return (
            <div key={name} className="rounded-lg border p-4"
                 style={{ borderColor: style.border, background: style.bg }}>

              {/* Planet header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Icon circle */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base"
                       style={{ background: `${meta.color}22`, border: `1.5px solid ${meta.color}55` }}>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold font-devanagari" style={{ color: meta.color }}>
                        {lang === 'hi' ? meta.hi : name}
                      </p>
                      {/* Polarity badge */}
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-devanagari"
                            style={{ background: style.badge_bg, color: style.badge_color, border: `1px solid ${style.border}` }}>
                        {t(lang, POLARITY_LABEL[polarity].en, POLARITY_LABEL[polarity].hi)}
                      </span>
                      {assess.active_in_dasha && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-devanagari">
                          {t(lang, '★ Active in Dasha', '★ दशा में सक्रिय')}
                        </span>
                      )}
                    </div>
                    {/* House + dignity */}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {house && (
                        <span className="text-[10px] text-ivory/40 font-devanagari">
                          {t(lang, `House ${house}`, `भाव ${house}`)}
                          {houseDomain && (
                            <span className="ml-1 text-ivory/30">
                              · {lang === 'hi' ? houseDomain.hi : houseDomain.en}
                            </span>
                          )}
                        </span>
                      )}
                      {pd.dignity && pd.dignity !== 'shadow' && (
                        <span className="text-[9px] text-ivory/30 font-devanagari">
                          · {pd.dignity.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Life area impact items */}
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    {/* Colored dot */}
                    <span className="mt-[5px] shrink-0 w-1.5 h-1.5 rounded-full"
                          style={{ background: style.dot }} />
                    <div className="min-w-0">
                      {/* Area label chip */}
                      <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded mb-0.5 mr-1.5 font-devanagari"
                            style={{ background:'rgba(255,255,255,0.05)', color:'rgba(245,240,232,0.5)' }}>
                        {item.icon} {lang === 'hi' ? item.area_hi : item.area_en}
                      </span>
                      <p className="text-[11px] text-ivory/72 leading-relaxed font-devanagari inline">
                        {lang === 'hi' ? item.hi : item.en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advice line (from existing assessment) */}
              {assess.advice_en && (
                <div className="mt-3 pt-3 border-t font-devanagari"
                     style={{ borderColor: style.border }}>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: style.badge_color }}>
                    {t(lang, 'What to do:', 'क्या करें:')}
                  </p>
                  <p className="text-ivory/60 text-[11px] leading-relaxed font-devanagari">
                    {lang === 'hi' ? (assess.advice_hi || assess.advice_en) : assess.advice_en}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayList.length === 0 && (
        <p className="text-ivory/35 text-sm text-center py-8 font-devanagari">
          {t(lang, 'No planets in this filter.', 'इस फ़िल्टर में कोई ग्रह नहीं।')}
        </p>
      )}
    </div>
  );
}
