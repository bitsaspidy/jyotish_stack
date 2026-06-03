'use strict';
/**
 * Seed 005 — 27 Nakshatras with Detailed Notes
 * Base data: AstroAnsh Class 8 — Nakshatra Table Sheet.pdf
 * Detailed notes: AstroAnsh Class 9 — Detailed Nakshatra Notes (EN + HI)
 *
 * planet_id: 1=Sun,2=Moon,3=Mars,4=Mercury,5=Jupiter,6=Venus,7=Saturn,8=Rahu,9=Ketu
 * zodiac_sign_id: 1=Aries … 12=Pisces
 */

const SPAN = 13 + 1 / 3;
const GANDMOOL = new Set([1, 9, 10, 18, 19, 27]);
const p = (category, roles) => ({ category, roles });
const j = (arr) => JSON.stringify(arr);

// Detailed notes indexed by nakshatra ID
const NOTES = {

  // ─── 1. Ashwini ──────────────────────────────────────────────────────────
  1: {
    characteristics_en: 'Extremely fast, energetic, and action-oriented. Natural initiators — they start things before others even think. Strong instinct to heal, fix, and rescue. Courageous, fearless, and spontaneous. Works best in emergencies and crisis situations. Strong Ketu influence gives healing powers, intuition, and spiritual speed.',
    characteristics_hi: 'अत्यंत तेज़, ऊर्जावान और क्रियाशील। दूसरों के सोचने से पहले ही काम शुरू करने वाले प्राकृतिक आरंभकर्ता। उपचार, सुधार और बचाव की प्रबल प्रवृत्ति। साहसी, निर्भीक और सहज। संकट और आपातकाल में सर्वश्रेष्ठ। केतु का प्रभाव उपचार शक्ति, अंतर्ज्ञान और आध्यात्मिक गति देता है।',
    negative_traits_en: 'Impatience. Incomplete execution. Recklessness. Difficulty with long-term consistency.',
    negative_traits_hi: 'अधीरता। कार्य अधूरे छोड़ना। लापरवाही। दीर्घकालिक स्थिरता में कठिनाई।',
    professions_en: j([
      p('Medicine, Healing & Emergency Services', ['Emergency doctors', 'Trauma surgeons', 'Paramedics', 'Ayurvedic physicians', 'Homeopathy doctors', 'Energy healers (Reiki, Pranic Healing)', 'Physiotherapists']),
      p('Speed, Courage & Risk-Based Professions', ['Athletes and sports professionals', 'Army, police, commandos', 'Firefighters', 'Rescue workers', 'Pilots', 'Professional drivers', 'Racing sports']),
      p('Entrepreneurship & Modern Fields', ['Startup founders (early-stage)', 'Rapid-scaling businesses', 'Logistics & delivery services', 'Travel industry', 'Adventure tourism']),
      p('Other Suitable Fields', ['Veterinary doctors', 'Animal care', 'Fitness trainers', 'Motivational coaches', 'First responders']),
    ]),
    professions_hi: j([
      p('चिकित्सा, उपचार और आपातकाल सेवाएं', ['आपातकालीन चिकित्सक', 'ट्रॉमा सर्जन', 'पैरामेडिक', 'आयुर्वेदिक चिकित्सक', 'होम्योपैथी डॉक्टर', 'ऊर्जा उपचारक (रेकी, प्राणिक हीलिंग)', 'फिजियोथेरेपिस्ट']),
      p('गति, साहस और जोखिम आधारित पेशे', ['एथलीट और खिलाड़ी', 'सेना, पुलिस, कमांडो', 'अग्निशमन कर्मी', 'बचाव कार्यकर्ता', 'पायलट', 'पेशेवर चालक', 'रेसिंग खेल']),
      p('उद्यमिता और आधुनिक क्षेत्र', ['स्टार्टअप संस्थापक', 'तेज़ी से बढ़ते व्यवसाय', 'लॉजिस्टिक्स और डिलीवरी सेवाएं', 'यात्रा उद्योग', 'साहसिक पर्यटन']),
      p('अन्य उपयुक्त क्षेत्र', ['पशु चिकित्सक', 'पशु देखभाल', 'फिटनेस प्रशिक्षक', 'प्रेरणादायक कोच', 'प्रथम प्रतिक्रियाकर्ता']),
    ]),
    health_issues_en: 'Headaches and migraines. Brain fatigue. Insomnia. Nervous system disorders. Accidents and injuries due to haste.',
    health_issues_hi: 'सिरदर्द और माइग्रेन। मस्तिष्क थकान। अनिद्रा। तंत्रिका तंत्र विकार। जल्दबाजी के कारण दुर्घटनाएं और चोटें।',
    health_root_cause_en: 'Excess physical and mental energy. Lack of rest. Over-speed lifestyle.',
    health_root_cause_hi: 'अत्यधिक शारीरिक और मानसिक ऊर्जा। आराम की कमी। अत्यधिक तेज़ जीवनशैली।',
    health_guidance_en: 'Meditation and breathwork are essential. Proper sleep discipline. Slowing down decision-making. Cooling and grounding practices.',
    health_guidance_hi: 'ध्यान और श्वास-क्रिया आवश्यक। उचित नींद का अनुशासन। निर्णय लेने में धीमापन। शीतल और स्थिरता देने वाले अभ्यास।',
  },

  // ─── 2. Bharani ──────────────────────────────────────────────────────────
  2: {
    characteristics_en: 'Extremely intense, enduring, and transformative. Can tolerate pain and pressure more than most. Strong connection with life–death–rebirth themes. High sexual and creative energy. Emotionally deep and passionate. Powerful sense of responsibility.',
    characteristics_hi: 'अत्यंत तीव्र, सहनशील और परिवर्तनकारी। अधिकांश लोगों की तुलना में दर्द और दबाव सहने में सक्षम। जीवन-मृत्यु-पुनर्जन्म विषयों से गहरा जुड़ाव। उच्च यौन और रचनात्मक ऊर्जा। भावनात्मक रूप से गहरे और जुनूनी। जिम्मेदारी की प्रबल भावना।',
    negative_traits_en: 'Stubbornness. Emotional extremes. Excess indulgence. Suppressed emotions turning destructive.',
    negative_traits_hi: 'जिद्दीपन। भावनात्मक चरम सीमाएं। अत्यधिक भोग-विलास। दबी भावनाएं विनाशकारी रूप लेना।',
    professions_en: j([
      p('Medical & Life–Death Related Fields', ['Gynecologists', 'Obstetricians', 'Nurses and midwives', 'ICU and hospital staff', 'Forensic doctors', 'Mortuary and post-mortem professionals']),
      p('Creative & Artistic Fields', ['Actors', 'Filmmakers', 'Musicians', 'Writers and poets', 'Fashion designers']),
      p('Psychological & Occult Fields', ['Psychologists', 'Counselors', 'Sex therapists', 'Trauma healers', 'Astrologers (karma, punishment themes)', 'Occult researchers']),
      p('Authority, Discipline & Reform', ['Prison administration', 'Correctional facilities', 'Rehabilitation centers', 'Social reform work', 'Trauma recovery NGOs']),
    ]),
    professions_hi: j([
      p('चिकित्सा और जीवन-मृत्यु संबंधित क्षेत्र', ['स्त्री रोग विशेषज्ञ', 'प्रसूति विशेषज्ञ', 'नर्स और दाइयां', 'आईसीयू और अस्पताल कर्मचारी', 'फोरेंसिक डॉक्टर', 'शव परीक्षण पेशेवर']),
      p('रचनात्मक और कलात्मक क्षेत्र', ['अभिनेता', 'फिल्म निर्माता', 'संगीतकार', 'लेखक और कवि', 'फैशन डिजाइनर']),
      p('मनोविज्ञान और गूढ़ विद्या क्षेत्र', ['मनोवैज्ञानिक', 'परामर्शदाता', 'यौन चिकित्सक', 'ट्रॉमा उपचारक', 'ज्योतिषी', 'गूढ़ शोधकर्ता']),
      p('अधिकार, अनुशासन और सुधार', ['जेल प्रशासन', 'सुधार गृह', 'पुनर्वास केंद्र', 'सामाजिक सुधार कार्य', 'ट्रॉमा रिकवरी एनजीओ']),
    ]),
    health_issues_en: 'Hormonal imbalance. Reproductive system disorders. Lower back pain. Skin diseases. Addiction tendencies.',
    health_issues_hi: 'हार्मोनल असंतुलन। प्रजनन तंत्र विकार। पीठ के निचले हिस्से में दर्द। त्वचा रोग। नशे की प्रवृत्ति।',
    health_root_cause_en: 'Suppressed emotions. Excessive indulgence. Emotional overload.',
    health_root_cause_hi: 'दबी हुई भावनाएं। अत्यधिक भोग-विलास। भावनात्मक अधिभार।',
    health_guidance_en: 'Emotional expression is crucial. Sexual discipline or conscious regulation. Creative outlets for emotional release. Balanced lifestyle with boundaries.',
    health_guidance_hi: 'भावनात्मक अभिव्यक्ति अत्यावश्यक। यौन अनुशासन या सचेत नियंत्रण। भावनात्मक मुक्ति के लिए रचनात्मक गतिविधियां। सीमाओं के साथ संतुलित जीवनशैली।',
  },

  // ─── 3. Krittika ─────────────────────────────────────────────────────────
  3: {
    characteristics_en: 'Extremely sharp, decisive, and truth-oriented. Natural ability to cut through lies, confusion, and weakness. Strong moral compass with clear right vs wrong thinking. Leadership-oriented, authoritative, commanding presence. Strong purification energy — removes what is impure or unnecessary. Internally fiery, disciplined, and principled.',
    characteristics_hi: 'अत्यंत तीक्ष्ण, निर्णायक और सत्य-उन्मुख। झूठ, भ्रम और कमजोरी को काटने की प्राकृतिक क्षमता। स्पष्ट सही-गलत सोच के साथ दृढ़ नैतिक दिशानिर्देश। नेतृत्व-उन्मुख, अधिकारपूर्ण, प्रभावशाली व्यक्तित्व। शक्तिशाली शुद्धिकरण ऊर्जा — अशुद्ध और अनावश्यक को हटाती है। आंतरिक रूप से अग्निमय, अनुशासित और सिद्धांतवादी।',
    negative_traits_en: 'Harshness and intolerance. Emotional coldness. Rigid thinking. Excessive criticism.',
    negative_traits_hi: 'कठोरता और असहिष्णुता। भावनात्मक शीतलता। कठोर सोच। अत्यधिक आलोचना।',
    professions_en: j([
      p('Government, Authority & Power', ['Administrative officers', 'Government spokespersons', 'Policy enforcers', 'Military leadership', 'Law enforcement heads']),
      p('Medical & Fire-Based Professions', ['Surgeons (especially cutting procedures)', 'ENT specialists', 'Dentists', 'Laser surgery professionals', 'Emergency medicine']),
      p('Technical & Industrial Fields', ['Metal industry', 'Mining', 'Electrical engineering', 'Heavy machinery', 'Foundry and steel plants']),
      p('Religious, Ethical & Disciplinary Roles', ['Priests performing fire rituals', 'Moral philosophers', 'Ethical teachers', 'Discipline-based spiritual leaders']),
    ]),
    professions_hi: j([
      p('सरकार, अधिकार और शक्ति', ['प्रशासनिक अधिकारी', 'सरकारी प्रवक्ता', 'नीति प्रवर्तक', 'सैन्य नेतृत्व', 'कानून प्रवर्तन प्रमुख']),
      p('चिकित्सा और अग्नि आधारित पेशे', ['सर्जन (विशेषतः काटने की प्रक्रियाएं)', 'नाक-कान-गला विशेषज्ञ', 'दंत चिकित्सक', 'लेजर सर्जरी पेशेवर', 'आपातकालीन चिकित्सा']),
      p('तकनीकी और औद्योगिक क्षेत्र', ['धातु उद्योग', 'खनन', 'विद्युत इंजीनियरिंग', 'भारी मशीनरी', 'ढलाई और इस्पात संयंत्र']),
      p('धार्मिक, नैतिक और अनुशासनात्मक भूमिकाएं', ['यज्ञ करने वाले पुजारी', 'नैतिक दार्शनिक', 'नैतिक शिक्षक', 'अनुशासन आधारित आध्यात्मिक नेता']),
    ]),
    health_issues_en: 'Fever and infections. Inflammatory conditions. Blood pressure issues. Eye disorders. Ulcers and acidity.',
    health_issues_hi: 'बुखार और संक्रमण। सूजन संबंधी स्थितियां। रक्तचाप की समस्याएं। नेत्र विकार। अल्सर और अम्लता।',
    health_root_cause_en: 'Excess fire element. Suppressed anger. Over-control.',
    health_root_cause_hi: 'अत्यधिक अग्नि तत्व। दबा हुआ क्रोध। अत्यधिक नियंत्रण।',
    health_guidance_en: 'Cooling diet and lifestyle. Anger regulation. Hydration and calming practices. Exposure to water and nature.',
    health_guidance_hi: 'शीतल आहार और जीवनशैली। क्रोध नियंत्रण। हाइड्रेशन और शांत करने वाले अभ्यास। जल और प्रकृति के संपर्क में रहना।',
  },

  // ─── 4. Rohini ───────────────────────────────────────────────────────────
  4: {
    characteristics_en: 'Extremely fertile, growth-oriented, and nourishing. Strong desire to build, expand, and multiply. Attractive personality with magnetic charm. Deep attachment to comfort, luxury, and security. Financially and materially inclined. Emotionally steady when secure.',
    characteristics_hi: 'अत्यंत उर्वर, विकास-उन्मुख और पोषणकारी। निर्माण, विस्तार और गुणन की प्रबल इच्छा। चुंबकीय आकर्षण के साथ आकर्षक व्यक्तित्व। आराम, विलासिता और सुरक्षा के प्रति गहरी आसक्ति। आर्थिक और भौतिक झुकाव। सुरक्षित होने पर भावनात्मक रूप से स्थिर।',
    negative_traits_en: 'Possessiveness. Greed. Over-attachment. Comfort addiction.',
    negative_traits_hi: 'अधिकार भावना। लालच। अत्यधिक आसक्ति। आराम की लत।',
    professions_en: j([
      p('Wealth, Property & Growth Fields', ['Real estate', 'Agriculture and farming', 'Dairy and food production', 'Land development', 'Wealth management']),
      p('Beauty, Luxury & Creative Fields', ['Actors and models', 'Fashion designers', 'Interior designers', 'Cosmetics industry', 'Jewelry business']),
      p('Business & Expansion', ['Large-scale entrepreneurs', 'Brand builders', 'FMCG industry', 'Hospitality and resorts', 'Food chains']),
      p('Feminine & Nurturing Fields', ['Women-centric businesses', 'Wellness industry', 'Lifestyle coaching', 'Nutrition and health brands']),
    ]),
    professions_hi: j([
      p('संपत्ति, धन और विकास क्षेत्र', ['रियल एस्टेट', 'कृषि और खेती', 'डेयरी और खाद्य उत्पादन', 'भूमि विकास', 'धन प्रबंधन']),
      p('सौंदर्य, विलासिता और रचनात्मक क्षेत्र', ['अभिनेता और मॉडल', 'फैशन डिजाइनर', 'इंटीरियर डिजाइनर', 'सौंदर्य प्रसाधन उद्योग', 'आभूषण व्यवसाय']),
      p('व्यवसाय और विस्तार', ['बड़े पैमाने के उद्यमी', 'ब्रांड निर्माता', 'एफएमसीजी उद्योग', 'आतिथ्य और रिसॉर्ट', 'खाद्य श्रृंखलाएं']),
      p('स्त्री और पोषण क्षेत्र', ['महिला-केंद्रित व्यवसाय', 'वेलनेस उद्योग', 'जीवनशैली कोचिंग', 'पोषण और स्वास्थ्य ब्रांड']),
    ]),
    health_issues_en: 'Obesity. Diabetes. Thyroid imbalance. Hormonal disorders. Water retention issues.',
    health_issues_hi: 'मोटापा। मधुमेह। थायरॉइड असंतुलन। हार्मोनल विकार। जल प्रतिधारण समस्याएं।',
    health_root_cause_en: 'Overindulgence. Excess comfort and sweetness. Emotional attachment to pleasure.',
    health_root_cause_hi: 'अत्यधिक भोग-विलास। अत्यधिक आराम और मिठास। सुख के प्रति भावनात्मक आसक्ति।',
    health_guidance_en: 'Dietary discipline. Regular physical activity. Moderation in pleasure. Detachment practices.',
    health_guidance_hi: 'आहार अनुशासन। नियमित शारीरिक गतिविधि। सुख में संयम। वैराग्य अभ्यास।',
  },

  // ─── 5. Mrigashira ───────────────────────────────────────────────────────
  5: {
    characteristics_en: 'Extremely curious, searching, and mentally restless. Constant urge to seek something better, newer, or more meaningful. Sharp intellect with a questioning nature. Youthful, adaptable, and socially engaging. Strong desire for knowledge, relationships, and experiences. Quick learner, but struggles with long-term stability.',
    characteristics_hi: 'अत्यंत जिज्ञासु, खोजी और मानसिक रूप से बेचैन। कुछ बेहतर, नया या अधिक अर्थपूर्ण खोजने की निरंतर उत्कंठा। प्रश्नवाचक स्वभाव के साथ तीव्र बुद्धि। युवा, अनुकूलनीय और सामाजिक रूप से आकर्षक। ज्ञान, रिश्तों और अनुभवों की प्रबल इच्छा। तेज़ सीखने वाले, लेकिन दीर्घकालिक स्थिरता में संघर्ष।',
    negative_traits_en: 'Mental wandering. Dissatisfaction. Indecisiveness. Leaving things unfinished.',
    negative_traits_hi: 'मानसिक भटकाव। असंतोष। अनिर्णायकता। काम अधूरा छोड़ना।',
    professions_en: j([
      p('Research, Investigation & Analysis', ['Researchers and scientists', 'Data analysts', 'Intelligence officers', 'Detectives and investigators', 'Forensic experts']),
      p('Communication & Information', ['Journalists', 'Content writers', 'Scriptwriters', 'Market research analysts', 'Media professionals']),
      p('Technology & Modern Fields', ['IT professionals', 'Software developers', 'Product researchers', 'Startup idea strategists']),
      p('Counseling & Mental Fields', ['Psychologists', 'Counselors', 'Coaches', 'Trainers']),
    ]),
    professions_hi: j([
      p('शोध, जांच और विश्लेषण', ['शोधकर्ता और वैज्ञानिक', 'डेटा विश्लेषक', 'खुफिया अधिकारी', 'जासूस और अन्वेषक', 'फोरेंसिक विशेषज्ञ']),
      p('संचार और सूचना', ['पत्रकार', 'कंटेंट राइटर', 'पटकथा लेखक', 'बाज़ार अनुसंधान विश्लेषक', 'मीडिया पेशेवर']),
      p('प्रौद्योगिकी और आधुनिक क्षेत्र', ['आईटी पेशेवर', 'सॉफ्टवेयर डेवलपर', 'उत्पाद शोधकर्ता', 'स्टार्टअप रणनीतिकार']),
      p('परामर्श और मानसिक क्षेत्र', ['मनोवैज्ञानिक', 'परामर्शदाता', 'कोच', 'प्रशिक्षक']),
    ]),
    health_issues_en: 'Migraines and headaches. Neck and shoulder pain. Anxiety disorders. Nervous exhaustion. Insomnia.',
    health_issues_hi: 'माइग्रेन और सिरदर्द। गर्दन और कंधे का दर्द। चिंता विकार। तंत्रिका थकावट। अनिद्रा।',
    health_root_cause_en: 'Overthinking. Mental instability. Lack of grounding.',
    health_root_cause_hi: 'अत्यधिक सोचना। मानसिक अस्थिरता। ग्राउंडिंग की कमी।',
    health_guidance_en: 'Meditation and mindfulness. One-goal-at-a-time discipline. Physical grounding practices. Proper sleep routines.',
    health_guidance_hi: 'ध्यान और माइंडफुलनेस। एक समय में एक लक्ष्य का अनुशासन। शारीरिक ग्राउंडिंग अभ्यास। उचित नींद की दिनचर्या।',
  },

  // ─── 6. Ardra ────────────────────────────────────────────────────────────
  6: {
    characteristics_en: 'Extremely intense, disruptive, and transformative. Life marked by emotional storms and sudden changes. Sharp, penetrating intelligence with brutal honesty. Breaks illusions, hypocrisy, and false structures. Gains strength through pain and crisis. Capable of deep compassion after personal suffering.',
    characteristics_hi: 'अत्यंत तीव्र, विघटनकारी और परिवर्तनकारी। भावनात्मक तूफानों और अचानक बदलावों से चिह्नित जीवन। कटु सत्यवादिता के साथ तीक्ष्ण, भेदक बुद्धि। भ्रम, पाखंड और झूठी संरचनाओं को तोड़ता है। दर्द और संकट से शक्ति प्राप्त करता है। व्यक्तिगत कष्ट के बाद गहरी करुणा में सक्षम।',
    negative_traits_en: 'Harsh speech. Emotional volatility. Self-destructive habits. Rebellion without direction.',
    negative_traits_hi: 'कठोर वाणी। भावनात्मक अस्थिरता। आत्म-विनाशकारी आदतें। दिशाहीन विद्रोह।',
    professions_en: j([
      p('Crisis, Destruction & Rebuilding', ['Structural engineers (demolition, reconstruction)', 'Disaster management professionals', 'Crisis managers', 'Emergency response planners']),
      p('Psychology & Trauma Fields', ['Psychiatrists', 'Clinical psychologists', 'Trauma therapists', 'Addiction recovery specialists']),
      p('Technology & Rahu Domains', ['Cybersecurity experts', 'Ethical hackers', 'Data scientists', 'Artificial intelligence specialists', 'Telecommunications industry']),
      p('Investigative & Confrontational Fields', ['Investigative journalists', 'Crime reporters', 'Social activists', 'Whistleblowers']),
    ]),
    professions_hi: j([
      p('संकट, विध्वंस और पुनर्निर्माण', ['संरचनात्मक इंजीनियर (विध्वंस, पुनर्निर्माण)', 'आपदा प्रबंधन पेशेवर', 'संकट प्रबंधक', 'आपातकालीन प्रतिक्रिया योजनाकार']),
      p('मनोविज्ञान और ट्रॉमा क्षेत्र', ['मनोचिकित्सक', 'नैदानिक मनोवैज्ञानिक', 'ट्रॉमा थेरेपिस्ट', 'नशा मुक्ति विशेषज्ञ']),
      p('प्रौद्योगिकी और राहु क्षेत्र', ['साइबर सुरक्षा विशेषज्ञ', 'एथिकल हैकर', 'डेटा वैज्ञानिक', 'कृत्रिम बुद्धिमत्ता विशेषज्ञ', 'दूरसंचार उद्योग']),
      p('खोजी और टकराव क्षेत्र', ['खोजी पत्रकार', 'क्राइम रिपोर्टर', 'सामाजिक कार्यकर्ता', 'व्हिसलब्लोअर']),
    ]),
    health_issues_en: 'Respiratory disorders. Asthma and allergies. Lung infections. Depression. Substance abuse tendencies.',
    health_issues_hi: 'श्वसन विकार। अस्थमा और एलर्जी। फेफड़ों के संक्रमण। अवसाद। मादक द्रव्यों के सेवन की प्रवृत्ति।',
    health_root_cause_en: 'Suppressed grief. Emotional trauma. Unprocessed pain.',
    health_root_cause_hi: 'दबा हुआ दुःख। भावनात्मक आघात। अनसुलझा दर्द।',
    health_guidance_en: 'Emotional expression and therapy. Breath-based practices (Pranayama). Avoidance of intoxicants. Supportive social environment.',
    health_guidance_hi: 'भावनात्मक अभिव्यक्ति और चिकित्सा। श्वास-आधारित अभ्यास (प्राणायाम)। नशीले पदार्थों से परहेज। सहायक सामाजिक वातावरण।',
  },

  // ─── 7. Punarvasu ────────────────────────────────────────────────────────
  7: {
    characteristics_en: 'Strong ability to recover, rebuild, and begin again. Naturally optimistic, forgiving, and hopeful. Life brings repeated losses followed by restoration. Ethical, generous, and morally guided. Family-oriented and protective. Learns wisdom through repeated life cycles.',
    characteristics_hi: 'ठीक होने, पुनर्निर्माण और फिर शुरुआत करने की प्रबल क्षमता। स्वाभाविक रूप से आशावादी, क्षमाशील और उम्मीदवार। जीवन में बार-बार हानि और फिर पुनर्स्थापना। नैतिक, उदार और मूल्य-आधारित। परिवार-उन्मुख और सुरक्षात्मक। बार-बार जीवन चक्रों से ज्ञान सीखता है।',
    negative_traits_en: 'Excessive forgiveness. Trusting people too easily. Delayed self-assertion.',
    negative_traits_hi: 'अत्यधिक क्षमा करना। लोगों पर अत्यधिक विश्वास। स्व-अभिव्यक्ति में देरी।',
    professions_en: j([
      p('Education, Guidance & Wisdom', ['Teachers', 'Professors', 'Mentors', 'Coaches', 'Motivational speakers']),
      p('Law, Ethics & Social Order', ['Lawyers', 'Judges', 'Legal advisors', 'Policy consultants', 'Social reformers']),
      p('Healing & Restoration', ['Doctors', 'Rehabilitation specialists', 'Family counselors', 'Child psychologists', 'Mental health workers']),
      p('Spiritual & Traditional Fields', ['Priests', 'Philosophers', 'Scriptural teachers', 'Religious counselors']),
    ]),
    professions_hi: j([
      p('शिक्षा, मार्गदर्शन और ज्ञान', ['शिक्षक', 'प्रोफेसर', 'मेंटर', 'कोच', 'प्रेरणादायक वक्ता']),
      p('कानून, नैतिकता और सामाजिक व्यवस्था', ['वकील', 'न्यायाधीश', 'कानूनी सलाहकार', 'नीति परामर्शदाता', 'सामाजिक सुधारक']),
      p('उपचार और पुनर्स्थापना', ['डॉक्टर', 'पुनर्वास विशेषज्ञ', 'पारिवारिक परामर्शदाता', 'बाल मनोवैज्ञानिक', 'मानसिक स्वास्थ्य कार्यकर्ता']),
      p('आध्यात्मिक और पारंपरिक क्षेत्र', ['पुजारी', 'दार्शनिक', 'शास्त्र शिक्षक', 'धार्मिक परामर्शदाता']),
    ]),
    health_issues_en: 'Liver disorders. Digestive imbalance. Gradual weight gain. Blood sugar fluctuations. Emotional exhaustion.',
    health_issues_hi: 'यकृत विकार। पाचन असंतुलन। धीरे-धीरे वजन बढ़ना। रक्त शर्करा में उतार-चढ़ाव। भावनात्मक थकावट।',
    health_root_cause_en: 'Over-giving. Neglecting personal needs.',
    health_root_cause_hi: 'अत्यधिक देना। व्यक्तिगत जरूरतों की उपेक्षा।',
    health_guidance_en: 'Setting personal boundaries. Structured routines. Balanced diet and rest.',
    health_guidance_hi: 'व्यक्तिगत सीमाएं निर्धारित करना। संरचित दिनचर्या। संतुलित आहार और आराम।',
  },

  // ─── 8. Pushya ───────────────────────────────────────────────────────────
  8: {
    characteristics_en: 'Extremely disciplined, dependable, and nurturing. Carries responsibility from a young age. Protective, patient, and service-oriented. Grows slowly but steadily. Highly respected for reliability and ethics. Emotionally reserved but deeply caring.',
    characteristics_hi: 'अत्यंत अनुशासित, भरोसेमंद और पोषणकारी। छोटी उम्र से ही जिम्मेदारी उठाने वाले। सुरक्षात्मक, धैर्यशील और सेवा-उन्मुख। धीरे लेकिन स्थिरता से बढ़ते हैं। विश्वसनीयता और नैतिकता के लिए अत्यधिक सम्मानित। भावनात्मक रूप से संयमित लेकिन गहराई से देखभाल करने वाले।',
    negative_traits_en: 'Emotional suppression. Overburdening oneself. Rigidity.',
    negative_traits_hi: 'भावनात्मक दमन। स्वयं पर अत्यधिक बोझ डालना। कठोरता।',
    professions_en: j([
      p('Administration & Governance', ['Government officers', 'Bureaucrats', 'Institutional administrators', 'Compliance officers']),
      p('Healthcare & Caregiving', ['Doctors', 'Nurses', 'Nutritionists', 'Care managers', 'Hospital administrators']),
      p('Food, Supply & Sustenance', ['Food processing', 'Dairy industry', 'Supply chain management', 'Agriculture support services']),
      p('Long-Term Structures', ['Infrastructure management', 'Pharmaceutical industry', 'Public sector enterprises']),
    ]),
    professions_hi: j([
      p('प्रशासन और शासन', ['सरकारी अधिकारी', 'नौकरशाह', 'संस्थागत प्रशासक', 'अनुपालन अधिकारी']),
      p('स्वास्थ्य सेवा और देखभाल', ['डॉक्टर', 'नर्स', 'पोषण विशेषज्ञ', 'देखभाल प्रबंधक', 'अस्पताल प्रशासक']),
      p('खाद्य, आपूर्ति और जीविका', ['खाद्य प्रसंस्करण', 'डेयरी उद्योग', 'आपूर्ति श्रृंखला प्रबंधन', 'कृषि सहायता सेवाएं']),
      p('दीर्घकालिक संरचनाएं', ['बुनियादी ढांचा प्रबंधन', 'फार्मास्युटिकल उद्योग', 'सार्वजनिक क्षेत्र उद्यम']),
    ]),
    health_issues_en: 'Joint pain and stiffness. Digestive sluggishness. Constipation. Calcium deficiency.',
    health_issues_hi: 'जोड़ों का दर्द और अकड़न। पाचन सुस्ती। कब्ज। कैल्शियम की कमी।',
    health_root_cause_en: 'Emotional rigidity. Excess responsibility.',
    health_root_cause_hi: 'भावनात्मक कठोरता। अत्यधिक जिम्मेदारी।',
    health_guidance_en: 'Emotional expression. Warm, nourishing diet. Gentle physical activity.',
    health_guidance_hi: 'भावनात्मक अभिव्यक्ति। गर्म, पोषक आहार। हल्की शारीरिक गतिविधि।',
  },

  // ─── 9. Ashlesha ─────────────────────────────────────────────────────────
  9: {
    characteristics_en: 'Extremely intelligent, secretive, and psychologically sharp. Natural ability to read minds, motives, and hidden intentions. Strategic, persuasive, and highly intuitive. Drawn to mystery, secrecy, and control of information. Powerful healer when evolved; manipulator when unevolved. Operates best behind the scenes rather than in open spotlight.',
    characteristics_hi: 'अत्यंत बुद्धिमान, रहस्यमय और मनोवैज्ञानिक रूप से तीक्ष्ण। मन, उद्देश्यों और छिपी मंशाओं को पढ़ने की प्राकृतिक क्षमता। रणनीतिक, प्रेरक और अत्यधिक सहज। रहस्य, गोपनीयता और सूचना नियंत्रण की ओर आकर्षित। विकसित होने पर शक्तिशाली उपचारक; अविकसित होने पर हेरफेरकर्ता। खुले मंच की अपेक्षा पर्दे के पीछे सर्वश्रेष्ठ कार्य करते हैं।',
    negative_traits_en: 'Manipulation and emotional control. Jealousy and suspicion. Obsessive thinking. Revenge mindset.',
    negative_traits_hi: 'हेरफेर और भावनात्मक नियंत्रण। ईर्ष्या और संदेह। जुनूनी सोच। प्रतिशोध की मानसिकता।',
    professions_en: j([
      p('Psychology, Mind & Healing', ['Psychologists', 'Psychiatrists', 'Counselors', 'Hypnotherapists', 'Trauma therapists']),
      p('Medicine & Toxicology', ['Doctors (especially internal medicine)', 'Toxicologists', 'Pharmacologists', 'Ayurvedic physicians (detox, Panchakarma)']),
      p('Strategy, Control & Intelligence', ['Intelligence analysts', 'Political strategists', 'Corporate strategists', 'Risk analysts', 'Crisis advisors']),
      p('Communication, Law & Investigation', ['Lawyers', 'Negotiators', 'Investigative journalists', 'Thriller / psychological writers']),
    ]),
    professions_hi: j([
      p('मनोविज्ञान, मन और उपचार', ['मनोवैज्ञानिक', 'मनोचिकित्सक', 'परामर्शदाता', 'हिप्नोथेरेपिस्ट', 'ट्रॉमा थेरेपिस्ट']),
      p('चिकित्सा और विषविज्ञान', ['डॉक्टर (विशेषतः आंतरिक चिकित्सा)', 'विषविज्ञानी', 'औषधविज्ञानी', 'आयुर्वेदिक चिकित्सक (डिटॉक्स, पंचकर्म)']),
      p('रणनीति, नियंत्रण और खुफिया', ['खुफिया विश्लेषक', 'राजनीतिक रणनीतिकार', 'कॉर्पोरेट रणनीतिकार', 'जोखिम विश्लेषक', 'संकट सलाहकार']),
      p('संचार, कानून और जांच', ['वकील', 'वार्ताकार', 'खोजी पत्रकार', 'थ्रिलर/मनोवैज्ञानिक लेखक']),
    ]),
    health_issues_en: 'Digestive and intestinal disorders. Hormonal imbalance. Psychosomatic illnesses. Skin allergies. Anxiety and paranoia.',
    health_issues_hi: 'पाचन और आंतों के विकार। हार्मोनल असंतुलन। मनोदैहिक रोग। त्वचा एलर्जी। चिंता और व्यामोह।',
    health_root_cause_en: 'Stored emotional toxicity. Suppressed jealousy or fear. Mental manipulation (self or others).',
    health_root_cause_hi: 'संचित भावनात्मक विषाक्तता। दबी हुई ईर्ष्या या भय। मानसिक हेरफेर (स्वयं या दूसरों के साथ)।',
    health_guidance_en: 'Emotional detox. Mental hygiene practices. Meditation focused on release. Avoiding toxic environments.',
    health_guidance_hi: 'भावनात्मक डिटॉक्स। मानसिक स्वच्छता अभ्यास। मुक्ति-केंद्रित ध्यान। विषाक्त वातावरण से बचाव।',
  },

  // ─── 10. Magha ───────────────────────────────────────────────────────────
  10: {
    characteristics_en: 'Strong royal, authoritative, and ancestral consciousness. Deep respect for lineage, tradition, and heritage. Natural leadership and command presence. Strong sense of entitlement to respect and authority. Connected to past-life karma and ancestral blessings. Works best when honoring tradition and duty.',
    characteristics_hi: 'प्रबल राजसी, अधिकारपूर्ण और पैतृक चेतना। वंश, परंपरा और विरासत के प्रति गहरा सम्मान। प्राकृतिक नेतृत्व और आदेश की उपस्थिति। सम्मान और अधिकार के प्रति अधिकार-भावना। पिछले जन्म के कर्म और पैतृक आशीर्वाद से जुड़ाव। परंपरा और कर्तव्य का सम्मान करने पर सर्वश्रेष्ठ कार्य।',
    negative_traits_en: 'Ego and arrogance. Obsession with status. Living in the past. Looking down on others.',
    negative_traits_hi: 'अहंकार और घमंड। स्थिति के प्रति जुनून। अतीत में जीना। दूसरों को कमतर आंकना।',
    professions_en: j([
      p('Leadership, Power & Authority', ['Politicians', 'Government officials', 'Royal or administrative heads', 'Senior executives', 'Military leadership']),
      p('Ancestral & Traditional Fields', ['Family business heads', 'Estate and property managers', 'Trustees of heritage institutions']),
      p('Religious & Ritualistic Roles', ['Priests', 'Ritual specialists', 'Ancestral rite experts', 'Traditional scholars']),
      p('Social & Cultural Leadership', ['Community leaders', 'Cultural organization heads', 'Social hierarchy administrators']),
    ]),
    professions_hi: j([
      p('नेतृत्व, शक्ति और अधिकार', ['राजनेता', 'सरकारी अधिकारी', 'राजसी या प्रशासनिक प्रमुख', 'वरिष्ठ कार्यकारी', 'सैन्य नेतृत्व']),
      p('पैतृक और पारंपरिक क्षेत्र', ['पारिवारिक व्यवसाय प्रमुख', 'संपत्ति और जागीर प्रबंधक', 'विरासत संस्थानों के ट्रस्टी']),
      p('धार्मिक और अनुष्ठान भूमिकाएं', ['पुजारी', 'अनुष्ठान विशेषज्ञ', 'पितृ-कर्म विशेषज्ञ', 'पारंपरिक विद्वान']),
      p('सामाजिक और सांस्कृतिक नेतृत्व', ['सामुदायिक नेता', 'सांस्कृतिक संगठन प्रमुख', 'सामाजिक पदानुक्रम प्रशासक']),
    ]),
    health_issues_en: 'Heart problems. High blood pressure. Spine and back pain. Stress-related disorders.',
    health_issues_hi: 'हृदय समस्याएं। उच्च रक्तचाप। रीढ़ और पीठ दर्द। तनाव संबंधी विकार।',
    health_root_cause_en: 'Ego pressure. Ancestral karmic burdens. Fear of losing authority.',
    health_root_cause_hi: 'अहंकार का दबाव। पैतृक कार्मिक बोझ। अधिकार खोने का भय।',
    health_guidance_en: 'Humility practices. Ancestral healing and rituals. Heart-centered meditation. Service-oriented leadership.',
    health_guidance_hi: 'विनम्रता अभ्यास। पैतृक उपचार और अनुष्ठान। हृदय-केंद्रित ध्यान। सेवा-उन्मुख नेतृत्व।',
  },

  // ─── 11. Purva Phalguni ──────────────────────────────────────────────────
  11: {
    characteristics_en: 'Extremely pleasure-loving, charismatic, and socially magnetic. Strong desire for love, romance, comfort, and enjoyment. Natural artist with creative and sensual expression. Easily attracts people, opportunities, and admiration. Believes life should be lived with joy, beauty, and passion. Works best when freedom and enjoyment coexist.',
    characteristics_hi: 'अत्यंत सुख-प्रिय, करिश्माई और सामाजिक रूप से आकर्षक। प्रेम, रोमांस, आराम और आनंद की प्रबल इच्छा। रचनात्मक और संवेदनशील अभिव्यक्ति वाले प्राकृतिक कलाकार। लोगों, अवसरों और प्रशंसा को आसानी से आकर्षित करते हैं। मानते हैं कि जीवन आनंद, सौंदर्य और जुनून के साथ जीना चाहिए। स्वतंत्रता और आनंद के सहअस्तित्व में सर्वश्रेष्ठ।',
    negative_traits_en: 'Laziness. Overindulgence. Escapism from responsibility. Dependency on pleasure.',
    negative_traits_hi: 'आलस्य। अत्यधिक भोग-विलास। जिम्मेदारी से पलायन। सुख पर निर्भरता।',
    professions_en: j([
      p('Art, Entertainment & Glamour', ['Actors and performers', 'Musicians and dancers', 'Fashion and costume designers', 'Entertainment industry professionals']),
      p('Hospitality & Pleasure Industries', ['Hotel and resort management', 'Event management', 'Luxury travel', 'Wedding planning']),
      p('Beauty, Style & Venus Domains', ['Cosmetics and skincare industry', 'Jewelry and luxury goods', 'Styling and personal branding', 'Relationship coaching']),
      p('Public & Social Fields', ['Public relations', 'Brand ambassadors', 'Influencers', 'Lifestyle consultants']),
    ]),
    professions_hi: j([
      p('कला, मनोरंजन और ग्लैमर', ['अभिनेता और कलाकार', 'संगीतकार और नर्तक', 'फैशन और वेशभूषा डिजाइनर', 'मनोरंजन उद्योग पेशेवर']),
      p('आतिथ्य और सुख उद्योग', ['होटल और रिसॉर्ट प्रबंधन', 'इवेंट मैनेजमेंट', 'लक्जरी यात्रा', 'विवाह आयोजन']),
      p('सौंदर्य, शैली और शुक्र क्षेत्र', ['सौंदर्य प्रसाधन और त्वचा देखभाल उद्योग', 'आभूषण और विलासिता वस्तुएं', 'स्टाइलिंग और व्यक्तिगत ब्रांडिंग', 'संबंध कोचिंग']),
      p('सार्वजनिक और सामाजिक क्षेत्र', ['जनसंपर्क', 'ब्रांड एंबेसडर', 'इन्फ्लुएंसर', 'जीवनशैली परामर्शदाता']),
    ]),
    health_issues_en: 'Reproductive system disorders. Hormonal imbalance. Obesity due to indulgence.',
    health_issues_hi: 'प्रजनन तंत्र विकार। हार्मोनल असंतुलन। भोग-विलास के कारण मोटापा।',
    health_root_cause_en: 'Excess pleasure. Lack of discipline. Overindulgence in comfort.',
    health_root_cause_hi: 'अत्यधिक सुख। अनुशासन की कमी। आराम में अत्यधिक लिप्तता।',
    health_guidance_en: 'Moderation in pleasure. Regular physical activity. Structured daily routine.',
    health_guidance_hi: 'सुख में संयम। नियमित शारीरिक गतिविधि। संरचित दैनिक दिनचर्या।',
  },

  // ─── 12. Uttara Phalguni ─────────────────────────────────────────────────
  12: {
    characteristics_en: 'Extremely responsible, reliable, and duty-oriented. Strong sense of honor, commitment, and fairness. Keeps promises and values long-term stability. Protective toward family, society, and institutions. Leadership based on service, not ego. Believes relationships require responsibility, not just pleasure.',
    characteristics_hi: 'अत्यंत जिम्मेदार, विश्वसनीय और कर्तव्य-उन्मुख। सम्मान, प्रतिबद्धता और निष्पक्षता की दृढ़ भावना। वादे निभाने और दीर्घकालिक स्थिरता को मूल्य देने वाले। परिवार, समाज और संस्थाओं के प्रति सुरक्षात्मक। अहंकार नहीं, सेवा पर आधारित नेतृत्व। मानते हैं कि रिश्तों में सिर्फ सुख नहीं, जिम्मेदारी भी चाहिए।',
    negative_traits_en: 'Overburdening oneself. Emotional dryness. Ignoring personal needs. Burnout.',
    negative_traits_hi: 'स्वयं पर अत्यधिक बोझ डालना। भावनात्मक रूखापन। व्यक्तिगत जरूरतों की अनदेखी। बर्नआउट।',
    professions_en: j([
      p('Administration, Law & Governance', ['Government officers', 'Judges', 'Legal advisors', 'Contract managers']),
      p('Organizational Leadership', ['HR heads', 'Corporate managers', 'Institutional leaders', 'Trustees and board members']),
      p('Social & Ethical Roles', ['Social workers', 'NGO leaders', 'Policy planners', 'Marriage and family counselors']),
      p('Traditional & Protective Roles', ['Family heads', 'Clan or community leaders', 'Heritage and trust managers']),
    ]),
    professions_hi: j([
      p('प्रशासन, कानून और शासन', ['सरकारी अधिकारी', 'न्यायाधीश', 'कानूनी सलाहकार', 'अनुबंध प्रबंधक']),
      p('संगठनात्मक नेतृत्व', ['एचआर प्रमुख', 'कॉर्पोरेट प्रबंधक', 'संस्थागत नेता', 'ट्रस्टी और बोर्ड सदस्य']),
      p('सामाजिक और नैतिक भूमिकाएं', ['समाज सेवक', 'एनजीओ नेता', 'नीति योजनाकार', 'विवाह और परिवार परामर्शदाता']),
      p('पारंपरिक और सुरक्षात्मक भूमिकाएं', ['परिवार प्रमुख', 'कुल या सामुदायिक नेता', 'विरासत और ट्रस्ट प्रबंधक']),
    ]),
    health_issues_en: 'Heart strain. Spine and back pain. Vitamin D deficiency. Chronic fatigue.',
    health_issues_hi: 'हृदय पर तनाव। रीढ़ और पीठ दर्द। विटामिन डी की कमी। दीर्घकालिक थकान।',
    health_root_cause_en: 'Excess responsibility. Neglect of self-care. Emotional restraint.',
    health_root_cause_hi: 'अत्यधिक जिम्मेदारी। स्व-देखभाल की उपेक्षा। भावनात्मक संयम।',
    health_guidance_en: 'Balanced work–rest routine. Sun exposure. Learning to delegate. Emotional expression.',
    health_guidance_hi: 'संतुलित काम-आराम दिनचर्या। धूप में रहना। काम सौंपना सीखना। भावनात्मक अभिव्यक्ति।',
  },

  // ─── 13. Hasta ───────────────────────────────────────────────────────────
  13: {
    characteristics_en: 'Highly skilled, dexterous, and solution-oriented. Natural ability to take control of situations. Excellent hand–eye coordination. Quick thinking combined with practical execution. Adaptable, clever, and communicative. Capable of turning chaos into order.',
    characteristics_hi: 'अत्यंत कुशल, दक्ष और समाधान-उन्मुख। परिस्थितियों पर नियंत्रण लेने की प्राकृतिक क्षमता। उत्कृष्ट हाथ-आंख समन्वय। व्यावहारिक क्रियान्वयन के साथ त्वरित सोच। अनुकूलनीय, चतुर और संवाद-कुशल। अराजकता को व्यवस्था में बदलने में सक्षम।',
    negative_traits_en: 'Manipulative behavior. Over-control. Restlessness. Opportunism.',
    negative_traits_hi: 'हेरफेर करने की प्रवृत्ति। अत्यधिक नियंत्रण। बेचैनी। अवसरवादिता।',
    professions_en: j([
      p('Skill-Based & Technical Fields', ['Surgeons', 'Dentists', 'Physiotherapists', 'Craftsmen', 'Artisans']),
      p('Healing & Care', ['Nurses', 'Massage therapists', 'Panchakarma therapists', 'Alternative healers']),
      p('Business, Trade & Execution', ['Traders', 'Sales professionals', 'Marketing specialists', 'Business operators']),
      p('Performance & Communication', ['Magicians', 'Anchors', 'Trainers', 'Public speakers']),
    ]),
    professions_hi: j([
      p('कौशल-आधारित और तकनीकी क्षेत्र', ['सर्जन', 'दंत चिकित्सक', 'फिजियोथेरेपिस्ट', 'शिल्पकार', 'कारीगर']),
      p('उपचार और देखभाल', ['नर्स', 'मालिश चिकित्सक', 'पंचकर्म चिकित्सक', 'वैकल्पिक उपचारक']),
      p('व्यापार, वाणिज्य और क्रियान्वयन', ['व्यापारी', 'बिक्री पेशेवर', 'विपणन विशेषज्ञ', 'व्यवसाय संचालक']),
      p('प्रदर्शन और संचार', ['जादूगर', 'एंकर', 'प्रशिक्षक', 'सार्वजनिक वक्ता']),
    ]),
    health_issues_en: 'Wrist and hand pain. Nerve strain. Digestive disorders. Anxiety.',
    health_issues_hi: 'कलाई और हाथ का दर्द। तंत्रिका तनाव। पाचन विकार। चिंता।',
    health_root_cause_en: 'Overuse of hands and mind. Mental restlessness.',
    health_root_cause_hi: 'हाथों और दिमाग का अत्यधिक उपयोग। मानसिक बेचैनी।',
    health_guidance_en: 'Hand and wrist care. Yoga and pranayama. Mental relaxation practices.',
    health_guidance_hi: 'हाथ और कलाई की देखभाल। योग और प्राणायाम। मानसिक विश्राम अभ्यास।',
  },

  // ─── 14. Chitra ──────────────────────────────────────────────────────────
  14: {
    characteristics_en: 'Extremely creative, perfectionist, and visually driven. Strong urge to create something extraordinary. Values beauty, symmetry, and excellence. Seeks recognition for creative work. Internally intense, externally charming. Possesses strong design intelligence.',
    characteristics_hi: 'अत्यंत रचनात्मक, पूर्णतावादी और दृश्य-प्रधान। कुछ असाधारण बनाने की प्रबल उत्कंठा। सौंदर्य, समरूपता और उत्कृष्टता को महत्व देते हैं। रचनात्मक कार्य के लिए पहचान चाहते हैं। आंतरिक रूप से तीव्र, बाहरी रूप से आकर्षक। प्रबल डिजाइन बुद्धि।',
    negative_traits_en: 'Ego issues. Dissatisfaction. Obsession with perfection. Stress due to self-imposed pressure.',
    negative_traits_hi: 'अहंकार की समस्याएं। असंतोष। पूर्णता का जुनून। स्व-आरोपित दबाव से तनाव।',
    professions_en: j([
      p('Design, Architecture & Creation', ['Architects', 'Interior designers', 'Fashion designers', 'Graphic designers']),
      p('Engineering & Technical Design', ['Civil engineers', 'Product designers', 'Automotive designers', 'Structural planners']),
      p('Visual Arts & Media', ['Photographers', 'Filmmakers', 'VFX artists', 'Animators']),
      p('Beauty & Branding', ['Jewelry designers', 'Stylists', 'Brand designers', 'Cosmetic industry professionals']),
    ]),
    professions_hi: j([
      p('डिजाइन, वास्तुकला और सृजन', ['वास्तुकार', 'इंटीरियर डिजाइनर', 'फैशन डिजाइनर', 'ग्राफिक डिजाइनर']),
      p('इंजीनियरिंग और तकनीकी डिजाइन', ['सिविल इंजीनियर', 'उत्पाद डिजाइनर', 'ऑटोमोटिव डिजाइनर', 'संरचनात्मक योजनाकार']),
      p('दृश्य कला और मीडिया', ['फोटोग्राफर', 'फिल्म निर्माता', 'वीएफएक्स कलाकार', 'एनिमेटर']),
      p('सौंदर्य और ब्रांडिंग', ['आभूषण डिजाइनर', 'स्टाइलिस्ट', 'ब्रांड डिजाइनर', 'सौंदर्य प्रसाधन उद्योग पेशेवर']),
    ]),
    health_issues_en: 'Skin disorders. Hormonal imbalance. Blood pressure fluctuations. Stress-related ailments.',
    health_issues_hi: 'त्वचा विकार। हार्मोनल असंतुलन। रक्तचाप में उतार-चढ़ाव। तनाव संबंधी बीमारियां।',
    health_root_cause_en: 'Excess internal fire. Perfection pressure. Creative stress.',
    health_root_cause_hi: 'अत्यधिक आंतरिक अग्नि। पूर्णता का दबाव। रचनात्मक तनाव।',
    health_guidance_en: 'Stress management. Creative relaxation. Balanced lifestyle.',
    health_guidance_hi: 'तनाव प्रबंधन। रचनात्मक विश्राम। संतुलित जीवनशैली।',
  },

  // ─── 15. Swati ───────────────────────────────────────────────────────────
  15: {
    characteristics_en: 'Extremely independent, freedom-loving, and self-directed. Strong desire to live life on one\'s own terms. Highly adaptable; survives and grows in changing environments. Sharp intellect with modern, global outlook. Learns best through real-world experience rather than authority. Values equality, fairness, and personal space.',
    characteristics_hi: 'अत्यंत स्वतंत्र, स्वतंत्रता-प्रेमी और स्व-निर्देशित। अपनी शर्तों पर जीवन जीने की प्रबल इच्छा। अत्यधिक अनुकूलनीय; बदलते वातावरण में जीवित और विकसित होते हैं। आधुनिक, वैश्विक दृष्टिकोण के साथ तीव्र बुद्धि। अधिकार से नहीं बल्कि वास्तविक अनुभव से सर्वश्रेष्ठ सीखते हैं। समानता, निष्पक्षता और व्यक्तिगत स्थान को महत्व देते हैं।',
    negative_traits_en: 'Lack of commitment. Emotional detachment. Restlessness. Difficulty with long-term stability.',
    negative_traits_hi: 'प्रतिबद्धता की कमी। भावनात्मक अलगाव। बेचैनी। दीर्घकालिक स्थिरता में कठिनाई।',
    professions_en: j([
      p('Independent & Entrepreneurial Fields', ['Entrepreneurs', 'Freelancers', 'Consultants', 'Startup founders', 'Independent advisors']),
      p('Trade, Commerce & Negotiation', ['Import–export business', 'International trade', 'Sales and negotiation specialists', 'Business development managers']),
      p('Travel, Movement & Air-Based Fields', ['Travel industry professionals', 'Aviation sector', 'Logistics and transportation', 'Tour operators']),
      p('Rahu & Modern Domains', ['Digital marketing', 'Social media professionals', 'Online businesses', 'Fintech, crypto-related fields']),
    ]),
    professions_hi: j([
      p('स्वतंत्र और उद्यमशीलता क्षेत्र', ['उद्यमी', 'फ्रीलांसर', 'सलाहकार', 'स्टार्टअप संस्थापक', 'स्वतंत्र सलाहकार']),
      p('व्यापार, वाणिज्य और वार्ता', ['आयात-निर्यात व्यवसाय', 'अंतरराष्ट्रीय व्यापार', 'बिक्री और वार्ता विशेषज्ञ', 'व्यवसाय विकास प्रबंधक']),
      p('यात्रा, गति और वायु-आधारित क्षेत्र', ['यात्रा उद्योग पेशेवर', 'विमानन क्षेत्र', 'लॉजिस्टिक्स और परिवहन', 'टूर ऑपरेटर']),
      p('राहु और आधुनिक क्षेत्र', ['डिजिटल मार्केटिंग', 'सोशल मीडिया पेशेवर', 'ऑनलाइन व्यवसाय', 'फिनटेक, क्रिप्टो संबंधित क्षेत्र']),
    ]),
    health_issues_en: 'Anxiety and nervous tension. Digestive gas problems. Insomnia. Dizziness.',
    health_issues_hi: 'चिंता और तंत्रिका तनाव। पाचन गैस की समस्याएं। अनिद्रा। चक्कर आना।',
    health_root_cause_en: 'Unstable routine. Excess mental movement. Lack of grounding.',
    health_root_cause_hi: 'अस्थिर दिनचर्या। अत्यधिक मानसिक गतिविधि। ग्राउंडिंग की कमी।',
    health_guidance_en: 'Fixed daily routine. Breathwork and grounding exercises. Limiting overstimulation.',
    health_guidance_hi: 'निश्चित दैनिक दिनचर्या। श्वास-कार्य और ग्राउंडिंग व्यायाम। अत्यधिक उत्तेजना सीमित करना।',
  },

  // ─── 16. Vishakha ────────────────────────────────────────────────────────
  16: {
    characteristics_en: 'Extremely goal-driven, ambitious, and competitive. Focused on achievement, recognition, and success. Works tirelessly until the objective is reached. Strong desire for social elevation and influence. Can sacrifice comfort for long-term victory. Powerful will and persistence.',
    characteristics_hi: 'अत्यंत लक्ष्य-उन्मुख, महत्वाकांक्षी और प्रतिस्पर्धी। उपलब्धि, पहचान और सफलता पर ध्यान केंद्रित। लक्ष्य प्राप्त होने तक अथक काम करते हैं। सामाजिक उन्नति और प्रभाव की प्रबल इच्छा। दीर्घकालिक विजय के लिए आराम का त्याग कर सकते हैं। दृढ़ इच्छाशक्ति और दृढ़ता।',
    negative_traits_en: 'Obsession with results. Comparison with others. Inner dissatisfaction even after success.',
    negative_traits_hi: 'परिणामों का जुनून। दूसरों से तुलना। सफलता के बाद भी आंतरिक असंतोष।',
    professions_en: j([
      p('Leadership & Achievement-Oriented Roles', ['Corporate leaders', 'CEOs and directors', 'Project heads', 'Senior managers']),
      p('Competitive & Performance Fields', ['Professional athletes', 'Civil services', 'Defense and police leadership', 'Politics']),
      p('Teaching, Motivation & Training', ['Teachers', 'Coaches', 'Motivational speakers', 'Performance trainers']),
      p('Expansion & Growth Businesses', ['Large-scale entrepreneurs', 'Franchise businesses', 'Network marketing leaders']),
    ]),
    professions_hi: j([
      p('नेतृत्व और उपलब्धि-उन्मुख भूमिकाएं', ['कॉर्पोरेट नेता', 'सीईओ और निदेशक', 'परियोजना प्रमुख', 'वरिष्ठ प्रबंधक']),
      p('प्रतिस्पर्धी और प्रदर्शन क्षेत्र', ['पेशेवर एथलीट', 'सिविल सेवाएं', 'रक्षा और पुलिस नेतृत्व', 'राजनीति']),
      p('शिक्षण, प्रेरणा और प्रशिक्षण', ['शिक्षक', 'कोच', 'प्रेरणादायक वक्ता', 'प्रदर्शन प्रशिक्षक']),
      p('विस्तार और विकास व्यवसाय', ['बड़े पैमाने के उद्यमी', 'फ्रेंचाइजी व्यवसाय', 'नेटवर्क मार्केटिंग नेता']),
    ]),
    health_issues_en: 'Stress-related disorders. Hormonal imbalance. Reproductive system issues. High blood pressure.',
    health_issues_hi: 'तनाव संबंधी विकार। हार्मोनल असंतुलन। प्रजनन तंत्र समस्याएं। उच्च रक्तचाप।',
    health_root_cause_en: 'Over-ambition. Constant pressure to achieve. Inability to relax.',
    health_root_cause_hi: 'अत्यधिक महत्वाकांक्षा। निरंतर उपलब्धि का दबाव। आराम करने में असमर्थता।',
    health_guidance_en: 'Learning to pause and rest. Detachment from outcomes. Meditation and balance practices.',
    health_guidance_hi: 'रुकना और आराम करना सीखना। परिणामों से अनासक्ति। ध्यान और संतुलन अभ्यास।',
  },

  // ─── 17. Anuradha ────────────────────────────────────────────────────────
  17: {
    characteristics_en: 'Extremely loyal, disciplined, and relationship-oriented. Strong ability to build and sustain long-term bonds. Works well within teams, organizations, and alliances. Emotionally deep but outwardly controlled. Thrives through cooperation rather than dominance. Gains success slowly but permanently.',
    characteristics_hi: 'अत्यंत वफादार, अनुशासित और संबंध-उन्मुख। दीर्घकालिक बंधन बनाने और बनाए रखने की दृढ़ क्षमता। टीमों, संगठनों और गठबंधनों में अच्छा काम करते हैं। भावनात्मक रूप से गहरे लेकिन बाहरी रूप से नियंत्रित। प्रभुत्व की अपेक्षा सहयोग से फलते-फूलते हैं। धीरे-धीरे लेकिन स्थायी रूप से सफलता प्राप्त करते हैं।',
    negative_traits_en: 'Emotional suppression. Over-sacrifice. Feeling unappreciated. Loneliness despite being surrounded by people.',
    negative_traits_hi: 'भावनात्मक दमन। अत्यधिक त्याग। सराहना न होने का एहसास। लोगों से घिरे होने के बावजूद अकेलापन।',
    professions_en: j([
      p('Organization, Team & Management', ['Corporate managers', 'Team leaders', 'Project managers', 'Operations heads']),
      p('Networking & Relationship-Based Fields', ['Human resources professionals', 'Public relations', 'Community leaders', 'Diplomats']),
      p('Administration & Saturn Domains', ['Government officials', 'Compliance officers', 'System administrators']),
      p('Long-Term & Infrastructure Roles', ['Supply chain management', 'Industrial management', 'Institutional leadership']),
    ]),
    professions_hi: j([
      p('संगठन, टीम और प्रबंधन', ['कॉर्पोरेट प्रबंधक', 'टीम नेता', 'परियोजना प्रबंधक', 'संचालन प्रमुख']),
      p('नेटवर्किंग और संबंध-आधारित क्षेत्र', ['मानव संसाधन पेशेवर', 'जनसंपर्क', 'सामुदायिक नेता', 'राजनयिक']),
      p('प्रशासन और शनि क्षेत्र', ['सरकारी अधिकारी', 'अनुपालन अधिकारी', 'सिस्टम प्रशासक']),
      p('दीर्घकालिक और बुनियादी ढांचा भूमिकाएं', ['आपूर्ति श्रृंखला प्रबंधन', 'औद्योगिक प्रबंधन', 'संस्थागत नेतृत्व']),
    ]),
    health_issues_en: 'Depression and melancholy. Hormonal imbalance. Skin disorders. Bone and joint pain.',
    health_issues_hi: 'अवसाद और उदासी। हार्मोनल असंतुलन। त्वचा विकार। हड्डी और जोड़ों का दर्द।',
    health_root_cause_en: 'Suppressed emotions. Carrying others\' burdens silently.',
    health_root_cause_hi: 'दबी हुई भावनाएं। दूसरों का बोझ चुपचाप उठाना।',
    health_guidance_en: 'Emotional expression. Strong social support. Regular physical activity.',
    health_guidance_hi: 'भावनात्मक अभिव्यक्ति। मजबूत सामाजिक समर्थन। नियमित शारीरिक गतिविधि।',
  },

  // ─── 18. Jyeshtha ────────────────────────────────────────────────────────
  18: {
    characteristics_en: 'Extremely protective, authoritative, and responsibility-driven. Natural "elder" energy — takes charge in crises. Strong instinct to protect family, team, or nation. Strategic, intelligent, and commanding. Sensitive to respect and recognition. Often carries heavy karmic responsibility.',
    characteristics_hi: 'अत्यंत सुरक्षात्मक, अधिकारपूर्ण और जिम्मेदारी-प्रेरित। प्राकृतिक "बड़े" की ऊर्जा — संकट में कार्यभार संभालते हैं। परिवार, टीम या राष्ट्र की रक्षा की प्रबल प्रवृत्ति। रणनीतिक, बुद्धिमान और आदेश देने वाले। सम्मान और पहचान के प्रति संवेदनशील। अक्सर भारी कार्मिक जिम्मेदारी उठाते हैं।',
    negative_traits_en: 'Control issues. Suspicion. Fear of losing authority. Stress from over-responsibility.',
    negative_traits_hi: 'नियंत्रण की समस्याएं। संदेह। अधिकार खोने का डर। अत्यधिक जिम्मेदारी से तनाव।',
    professions_en: j([
      p('Leadership, Security & Authority', ['Senior government officers', 'Police and defense leadership', 'Intelligence and security heads']),
      p('Strategy, Risk & Crisis Management', ['Risk managers', 'Crisis response leaders', 'Corporate strategists']),
      p('Governance & Policy', ['Policy advisors', 'Political strategists', 'Administrative heads']),
      p('Protective Roles', ['Family business heads', 'Trustees', 'Security consultants']),
    ]),
    professions_hi: j([
      p('नेतृत्व, सुरक्षा और अधिकार', ['वरिष्ठ सरकारी अधिकारी', 'पुलिस और रक्षा नेतृत्व', 'खुफिया और सुरक्षा प्रमुख']),
      p('रणनीति, जोखिम और संकट प्रबंधन', ['जोखिम प्रबंधक', 'संकट प्रतिक्रिया नेता', 'कॉर्पोरेट रणनीतिकार']),
      p('शासन और नीति', ['नीति सलाहकार', 'राजनीतिक रणनीतिकार', 'प्रशासनिक प्रमुख']),
      p('सुरक्षात्मक भूमिकाएं', ['पारिवारिक व्यवसाय प्रमुख', 'ट्रस्टी', 'सुरक्षा सलाहकार']),
    ]),
    health_issues_en: 'High blood pressure. Heart strain. Migraines. Stress-induced disorders.',
    health_issues_hi: 'उच्च रक्तचाप। हृदय पर तनाव। माइग्रेन। तनाव-प्रेरित विकार।',
    health_root_cause_en: 'Excess responsibility. Fear of failure or loss of control.',
    health_root_cause_hi: 'अत्यधिक जिम्मेदारी। विफलता या नियंत्रण खोने का भय।',
    health_guidance_en: 'Delegation of duties. Stress management practices. Rest and emotional relaxation.',
    health_guidance_hi: 'कार्य-सौंपन। तनाव प्रबंधन अभ्यास। आराम और भावनात्मक विश्राम।',
  },

  // ─── 19. Mula ────────────────────────────────────────────────────────────
  19: {
    characteristics_en: 'Extremely truth-seeking, radical, and root-oriented. Compelled to go to the very foundation of any issue. Destroys false beliefs, weak structures, and illusions. Life marked by sudden upheavals followed by rebirth. Spiritually intense, detached from superficial success. Fearless in questioning authority, tradition, and dogma.',
    characteristics_hi: 'अत्यंत सत्य-साधक, कट्टरपंथी और जड़-उन्मुख। किसी भी मुद्दे की नींव तक जाने के लिए विवश। झूठी मान्यताओं, कमज़ोर संरचनाओं और भ्रमों को नष्ट करता है। अचानक उथल-पुथल और फिर पुनर्जन्म से चिह्नित जीवन। आध्यात्मिक रूप से तीव्र, सतही सफलता से विरक्त। अधिकार, परंपरा और हठधर्मिता पर प्रश्न करने में निर्भीक।',
    negative_traits_en: 'Destructive speech. Emotional detachment. Instability. Nihilistic thinking.',
    negative_traits_hi: 'विनाशकारी वाणी। भावनात्मक अलगाव। अस्थिरता। निहिलिस्टिक सोच।',
    professions_en: j([
      p('Research, Investigation & Truth-Seeking', ['Research scientists', 'Philosophers', 'Archaeologists', 'Historians', 'Investigative analysts']),
      p('Occult, Spiritual & Ketu Domains', ['Astrologers', 'Occult researchers', 'Tantric practitioners', 'Spiritual seekers']),
      p('Medical & Crisis Fields', ['Surgeons (complex, life-saving procedures)', 'Trauma specialists', 'Emergency medicine']),
      p('Destruction & Rebuilding', ['Demolition experts', 'Crisis managers', 'System reform specialists']),
    ]),
    professions_hi: j([
      p('शोध, जांच और सत्य-साधना', ['अनुसंधान वैज्ञानिक', 'दार्शनिक', 'पुरातत्वविद', 'इतिहासकार', 'खोजी विश्लेषक']),
      p('गूढ़, आध्यात्मिक और केतु क्षेत्र', ['ज्योतिषी', 'गूढ़ शोधकर्ता', 'तांत्रिक', 'आध्यात्मिक साधक']),
      p('चिकित्सा और संकट क्षेत्र', ['सर्जन (जटिल, जीवन-रक्षक प्रक्रियाएं)', 'ट्रॉमा विशेषज्ञ', 'आपातकालीन चिकित्सा']),
      p('विध्वंस और पुनर्निर्माण', ['विध्वंस विशेषज्ञ', 'संकट प्रबंधक', 'प्रणाली सुधार विशेषज्ञ']),
    ]),
    health_issues_en: 'Intestinal and digestive disorders. Nerve-related weakness. Sudden injuries or accidents. Deep anxiety.',
    health_issues_hi: 'आंतों और पाचन संबंधी विकार। तंत्रिका-संबंधित कमजोरी। अचानक चोटें या दुर्घटनाएं। गहरी चिंता।',
    health_root_cause_en: 'Extreme psychological intensity. Constant inner destruction and rebuilding.',
    health_root_cause_hi: 'चरम मनोवैज्ञानिक तीव्रता। निरंतर आंतरिक विध्वंस और पुनर्निर्माण।',
    health_guidance_en: 'Grounding practices. Stable routine. Connection with nature. Mind–body balance.',
    health_guidance_hi: 'ग्राउंडिंग अभ्यास। स्थिर दिनचर्या। प्रकृति से जुड़ाव। मन-शरीर संतुलन।',
  },

  // ─── 20. Purva Ashadha ───────────────────────────────────────────────────
  20: {
    characteristics_en: 'Extremely confident, persuasive, and victory-oriented. Strong belief in one\'s ideas and moral correctness. Natural motivator who rallies people toward a cause. Socially expressive and influential. Thrives in public platforms and ideological battles. Driven by the need to prove and win.',
    characteristics_hi: 'अत्यंत आत्मविश्वासी, प्रेरक और विजय-उन्मुख। अपने विचारों और नैतिक सत्यता में दृढ़ विश्वास। लोगों को किसी कारण की ओर एकत्रित करने वाले प्राकृतिक प्रेरक। सामाजिक रूप से अभिव्यक्तिशील और प्रभावशाली। सार्वजनिक मंचों और वैचारिक लड़ाइयों में पनपते हैं। सिद्ध करने और जीतने की आवश्यकता से प्रेरित।',
    negative_traits_en: 'Arrogance. Moral superiority. Emotional exaggeration.',
    negative_traits_hi: 'अहंकार। नैतिक श्रेष्ठता। भावनात्मक अतिशयोक्ति।',
    professions_en: j([
      p('Leadership, Campaigning & Influence', ['Political leaders', 'Campaign managers', 'Social movement leaders', 'Motivational speakers']),
      p('Education & Ideological Fields', ['Professors', 'Trainers', 'Philosophical teachers']),
      p('Media, Promotion & Public Platforms', ['Media personalities', 'Anchors', 'Influencers', 'Public relations experts']),
      p('Venus & Expansion Domains', ['Lifestyle brands', 'Fashion and beauty industries', 'Event management']),
    ]),
    professions_hi: j([
      p('नेतृत्व, अभियान और प्रभाव', ['राजनीतिक नेता', 'अभियान प्रबंधक', 'सामाजिक आंदोलन नेता', 'प्रेरणादायक वक्ता']),
      p('शिक्षा और वैचारिक क्षेत्र', ['प्रोफेसर', 'प्रशिक्षक', 'दार्शनिक शिक्षक']),
      p('मीडिया, प्रचार और सार्वजनिक मंच', ['मीडिया व्यक्तित्व', 'एंकर', 'इन्फ्लुएंसर', 'जनसंपर्क विशेषज्ञ']),
      p('शुक्र और विस्तार क्षेत्र', ['जीवनशैली ब्रांड', 'फैशन और सौंदर्य उद्योग', 'इवेंट मैनेजमेंट']),
    ]),
    health_issues_en: 'Hormonal imbalance. Urinary system disorders. Water retention. Blood pressure fluctuations.',
    health_issues_hi: 'हार्मोनल असंतुलन। मूत्र तंत्र विकार। जल प्रतिधारण। रक्तचाप में उतार-चढ़ाव।',
    health_root_cause_en: 'Emotional excess. Ego-driven confidence.',
    health_root_cause_hi: 'भावनात्मक अतिरेक। अहंकार-प्रेरित आत्मविश्वास।',
    health_guidance_en: 'Humility practices. Emotional regulation. Balanced hydration. Meditation.',
    health_guidance_hi: 'विनम्रता अभ्यास। भावनात्मक नियमन। संतुलित जलयोजन। ध्यान।',
  },

  // ─── 21. Uttara Ashadha ──────────────────────────────────────────────────
  21: {
    characteristics_en: 'Extremely principled, patient, and destined for lasting success. Does not seek quick wins; believes in ultimate victory. Strong moral backbone and sense of righteousness. Natural authority with quiet confidence. Carries responsibility for collective good. Reliable, disciplined, and steady leader.',
    characteristics_hi: 'अत्यंत सिद्धांतवादी, धैर्यशील और स्थायी सफलता के लिए नियतिबद्ध। त्वरित जीत नहीं चाहते; अंतिम विजय में विश्वास। दृढ़ नैतिक आधार और धार्मिकता की भावना। शांत आत्मविश्वास के साथ प्राकृतिक अधिकार। सामूहिक भलाई की जिम्मेदारी उठाते हैं। विश्वसनीय, अनुशासित और स्थिर नेता।',
    negative_traits_en: 'Rigidity. Emotional distance. Resistance to change. Moral stubbornness.',
    negative_traits_hi: 'कठोरता। भावनात्मक दूरी। परिवर्तन का प्रतिरोध। नैतिक जिद्द।',
    professions_en: j([
      p('Governance, Law & Authority', ['Senior government officers', 'Civil services', 'Constitutional experts', 'Policy makers']),
      p('Leadership & Institution Building', ['Heads of large organizations', 'Corporate chairpersons', 'Infrastructure project leaders', 'Nation-building roles']),
      p('Law, Ethics & Justice', ['Judges', 'Legal advisors', 'Compliance authorities']),
      p('Social & Collective Roles', ['Union leaders', 'International organizations', 'Public trustees']),
    ]),
    professions_hi: j([
      p('शासन, कानून और अधिकार', ['वरिष्ठ सरकारी अधिकारी', 'सिविल सेवाएं', 'संवैधानिक विशेषज्ञ', 'नीति निर्माता']),
      p('नेतृत्व और संस्था निर्माण', ['बड़े संगठनों के प्रमुख', 'कॉर्पोरेट अध्यक्ष', 'बुनियादी ढांचा परियोजना नेता', 'राष्ट्र-निर्माण भूमिकाएं']),
      p('कानून, नैतिकता और न्याय', ['न्यायाधीश', 'कानूनी सलाहकार', 'अनुपालन प्राधिकरण']),
      p('सामाजिक और सामूहिक भूमिकाएं', ['संघ नेता', 'अंतरराष्ट्रीय संगठन', 'सार्वजनिक ट्रस्टी']),
    ]),
    health_issues_en: 'Bone and joint disorders. Knee and spine problems. Vitamin D deficiency. Heart strain from responsibility.',
    health_issues_hi: 'हड्डी और जोड़ों के विकार। घुटने और रीढ़ की समस्याएं। विटामिन डी की कमी। जिम्मेदारी से हृदय पर तनाव।',
    health_root_cause_en: 'Carrying long-term burdens. Rigid lifestyle and mindset.',
    health_root_cause_hi: 'दीर्घकालिक बोझ उठाना। कठोर जीवनशैली और मानसिकता।',
    health_guidance_en: 'Sun exposure and mobility. Flexibility in routine and thought. Work–rest balance.',
    health_guidance_hi: 'धूप और गतिशीलता। दिनचर्या और सोच में लचीलापन। काम-आराम संतुलन।',
  },

  // ─── 22. Shravana ────────────────────────────────────────────────────────
  22: {
    characteristics_en: 'Extremely receptive, observant, and knowledge-absorbing. Learns primarily through listening. Strong respect for tradition, scripture, and lineage of knowledge. Calm, patient, and thoughtful communicator. Natural teacher, advisor, and messenger. Success grows steadily through accumulated wisdom.',
    characteristics_hi: 'अत्यंत ग्रहणशील, अवलोकनशील और ज्ञान-अवशोषक। मुख्यतः सुनने के माध्यम से सीखते हैं। परंपरा, शास्त्र और ज्ञान की परंपरा के प्रति गहरा सम्मान। शांत, धैर्यशील और विचारशील संचारक। प्राकृतिक शिक्षक, सलाहकार और संदेशवाहक। संचित ज्ञान के माध्यम से सफलता स्थिरता से बढ़ती है।',
    negative_traits_en: 'Over-dependence on others\' opinions. Mental overload. Indecisiveness.',
    negative_traits_hi: 'दूसरों की राय पर अत्यधिक निर्भरता। मानसिक अधिभार। अनिर्णायकता।',
    professions_en: j([
      p('Education, Teaching & Knowledge', ['Teachers', 'Professors', 'Gurus', 'Scriptural scholars']),
      p('Communication & Media', ['Journalists', 'Radio presenters', 'Podcasters', 'News analysts']),
      p('Advisory & Counseling Roles', ['Counselors', 'Consultants', 'Astrologers', 'Spiritual advisors']),
      p('Administration & Documentation', ['Secretaries', 'Archivists', 'Record managers', 'Policy documentation experts']),
    ]),
    professions_hi: j([
      p('शिक्षा, अध्यापन और ज्ञान', ['शिक्षक', 'प्रोफेसर', 'गुरु', 'शास्त्र विद्वान']),
      p('संचार और मीडिया', ['पत्रकार', 'रेडियो प्रस्तुतकर्ता', 'पॉडकास्टर', 'समाचार विश्लेषक']),
      p('सलाहकार और परामर्श भूमिकाएं', ['परामर्शदाता', 'सलाहकार', 'ज्योतिषी', 'आध्यात्मिक सलाहकार']),
      p('प्रशासन और दस्तावेज़ीकरण', ['सचिव', 'अभिलेखाध्यक्ष', 'रिकॉर्ड प्रबंधक', 'नीति दस्तावेज़ीकरण विशेषज्ञ']),
    ]),
    health_issues_en: 'Ear and hearing problems. Neck and shoulder stiffness. Mental confusion. Anxiety from information overload.',
    health_issues_hi: 'कान और श्रवण समस्याएं। गर्दन और कंधे की अकड़न। मानसिक भ्रम। सूचना अधिभार से चिंता।',
    health_root_cause_en: 'Absorbing too much external input. Weak personal boundaries.',
    health_root_cause_hi: 'अत्यधिक बाहरी इनपुट अवशोषित करना। कमज़ोर व्यक्तिगत सीमाएं।',
    health_guidance_en: 'Periods of silence. Mental detox. Meditation and focus practices.',
    health_guidance_hi: 'मौन की अवधियां। मानसिक डिटॉक्स। ध्यान और एकाग्रता अभ्यास।',
  },

  // ─── 23. Dhanishtha ──────────────────────────────────────────────────────
  23: {
    characteristics_en: 'Extremely dynamic, ambitious, and rhythm-driven. Strong ability to create wealth, resources, and influence. Thrives in groups, networks, and collective systems. Natural organizer with leadership in motion-based environments. Competitive, courageous, and action-oriented. Strong sense of timing and opportunity.',
    characteristics_hi: 'अत्यंत गतिशील, महत्वाकांक्षी और लय-प्रधान। धन, संसाधन और प्रभाव बनाने की दृढ़ क्षमता। समूहों, नेटवर्कों और सामूहिक प्रणालियों में फलते-फूलते हैं। गति-आधारित वातावरण में नेतृत्व के साथ प्राकृतिक आयोजक। प्रतिस्पर्धी, साहसी और क्रिया-उन्मुख। समय और अवसर की दृढ़ समझ।',
    negative_traits_en: 'Impatience. Aggressiveness. Ego clashes. Burnout due to constant activity.',
    negative_traits_hi: 'अधीरता। आक्रामकता। अहंकार टकराव। निरंतर गतिविधि के कारण बर्नआउट।',
    professions_en: j([
      p('Wealth, Finance & Resource Management', ['Finance managers', 'Investment advisors', 'Banking professionals', 'Corporate operations heads']),
      p('Music, Rhythm & Performance', ['Musicians (especially percussionists)', 'Performers', 'Event performers', 'Rhythm-based artists']),
      p('Leadership, Sports & Action Fields', ['Athletes', 'Sports coaches', 'Fitness professionals', 'Defense and paramilitary services']),
      p('Organization & Network Management', ['Event managers', 'Logistics and supply-chain managers', 'Operations leaders', 'Team coordinators']),
    ]),
    professions_hi: j([
      p('धन, वित्त और संसाधन प्रबंधन', ['वित्त प्रबंधक', 'निवेश सलाहकार', 'बैंकिंग पेशेवर', 'कॉर्पोरेट संचालन प्रमुख']),
      p('संगीत, लय और प्रदर्शन', ['संगीतकार (विशेषतः तालवादक)', 'कलाकार', 'इवेंट कलाकार', 'लय-आधारित कलाकार']),
      p('नेतृत्व, खेल और क्रिया क्षेत्र', ['एथलीट', 'खेल कोच', 'फिटनेस पेशेवर', 'रक्षा और अर्धसैनिक सेवाएं']),
      p('संगठन और नेटवर्क प्रबंधन', ['इवेंट मैनेजर', 'लॉजिस्टिक्स और आपूर्ति श्रृंखला प्रबंधक', 'संचालन नेता', 'टीम समन्वयक']),
    ]),
    health_issues_en: 'Muscle strain. Injuries due to overexertion. High blood pressure. Physical exhaustion.',
    health_issues_hi: 'मांसपेशियों में खिंचाव। अत्यधिक परिश्रम से चोटें। उच्च रक्तचाप। शारीरिक थकावट।',
    health_root_cause_en: 'Excess physical drive. Insufficient rest.',
    health_root_cause_hi: 'अत्यधिक शारीरिक प्रेरणा। अपर्याप्त आराम।',
    health_guidance_en: 'Balanced exercise. Adequate recovery time. Stress management. Listening to bodily limits.',
    health_guidance_hi: 'संतुलित व्यायाम। पर्याप्त रिकवरी समय। तनाव प्रबंधन। शारीरिक सीमाओं को सुनना।',
  },

  // ─── 24. Shatabhisha ─────────────────────────────────────────────────────
  24: {
    characteristics_en: 'Extremely mysterious, independent, and research-oriented. Strong attraction toward healing, science, and hidden knowledge. Prefers solitude or limited social interaction. Thinks beyond conventional rules and systems. Natural problem-solver for complex or unknown issues. Detached yet deeply compassionate at core.',
    characteristics_hi: 'अत्यंत रहस्यमय, स्वतंत्र और शोध-उन्मुख। उपचार, विज्ञान और छिपे ज्ञान की ओर प्रबल आकर्षण। एकांत या सीमित सामाजिक संपर्क पसंद करते हैं। पारंपरिक नियमों और प्रणालियों से परे सोचते हैं। जटिल या अज्ञात समस्याओं के लिए प्राकृतिक समाधानकर्ता। अलग होने के बाद भी आंतरिक रूप से गहरे करुणामय।',
    negative_traits_en: 'Isolation. Emotional detachment. Depression. Rebellion without direction.',
    negative_traits_hi: 'अलगाव। भावनात्मक विरक्ति। अवसाद। दिशाहीन विद्रोह।',
    professions_en: j([
      p('Medicine, Healing & Research', ['Physicians', 'Surgeons', 'Alternative healers', 'Medical researchers', 'Epidemiologists']),
      p('Science & Technology', ['Scientists', 'Biotech professionals', 'Pharmaceutical researchers', 'Data scientists']),
      p('Rahu & Advanced Domains', ['Medical technology', 'AI and health analytics', 'Cyber research', 'Space and futuristic studies']),
      p('Independent & Advisory Roles', ['Astrologers', 'Researchers', 'Consultants', 'Analysts']),
    ]),
    professions_hi: j([
      p('चिकित्सा, उपचार और शोध', ['चिकित्सक', 'सर्जन', 'वैकल्पिक उपचारक', 'चिकित्सा शोधकर्ता', 'महामारी विशेषज्ञ']),
      p('विज्ञान और प्रौद्योगिकी', ['वैज्ञानिक', 'बायोटेक पेशेवर', 'फार्मास्युटिकल शोधकर्ता', 'डेटा वैज्ञानिक']),
      p('राहु और उन्नत क्षेत्र', ['चिकित्सा प्रौद्योगिकी', 'एआई और स्वास्थ्य विश्लेषण', 'साइबर शोध', 'अंतरिक्ष और भविष्यवादी अध्ययन']),
      p('स्वतंत्र और सलाहकार भूमिकाएं', ['ज्योतिषी', 'शोधकर्ता', 'सलाहकार', 'विश्लेषक']),
    ]),
    health_issues_en: 'Nervous system disorders. Hormonal imbalance. Insomnia. Depression and anxiety.',
    health_issues_hi: 'तंत्रिका तंत्र विकार। हार्मोनल असंतुलन। अनिद्रा। अवसाद और चिंता।',
    health_root_cause_en: 'Emotional isolation. Suppressed feelings. Mental over-analysis.',
    health_root_cause_hi: 'भावनात्मक अलगाव। दबी हुई भावनाएं। मानसिक अत्यधिक विश्लेषण।',
    health_guidance_en: 'Regular social interaction. Emotional expression. Structured routine. Grounding practices.',
    health_guidance_hi: 'नियमित सामाजिक संपर्क। भावनात्मक अभिव्यक्ति। संरचित दिनचर्या। ग्राउंडिंग अभ्यास।',
  },

  // ─── 25. Purva Bhadrapada ────────────────────────────────────────────────
  25: {
    characteristics_en: 'Extremely intense, ideological, and uncompromising. Strong inner fire for truth, reform, and higher principles. Capable of great sacrifice for beliefs. Sharp intellect with philosophical depth. Alternates between extreme detachment and extreme intensity. Often carries a "mission" mindset in life.',
    characteristics_hi: 'अत्यंत तीव्र, वैचारिक और अडिग। सत्य, सुधार और उच्च सिद्धांतों के लिए प्रबल आंतरिक अग्नि। विश्वासों के लिए महान त्याग में सक्षम। दार्शनिक गहराई के साथ तीव्र बुद्धि। चरम विरक्ति और चरम तीव्रता के बीच बदलते रहते हैं। अक्सर जीवन में "मिशन" की मानसिकता रखते हैं।',
    negative_traits_en: 'Fanaticism. Harsh judgments. Self-destructive intensity. Mental extremism.',
    negative_traits_hi: 'कट्टरता। कठोर निर्णय। आत्म-विनाशकारी तीव्रता। मानसिक चरमपंथ।',
    professions_en: j([
      p('Philosophy, Ideology & Reform', ['Philosophers', 'Social reformers', 'Ideological leaders', 'Ethical critics']),
      p('Teaching, Knowledge & Jupiter Domains', ['Professors', 'Spiritual teachers', 'Religious reformers', 'Scriptural scholars']),
      p('Radical & High-Risk Fields', ['Investigative journalists', 'War correspondents', 'Activists', 'Revolutionary thinkers']),
      p('Occult, Research & Depth', ['Astrologers', 'Occult researchers', 'Tantric practitioners', 'Deep research analysts']),
    ]),
    professions_hi: j([
      p('दर्शन, विचारधारा और सुधार', ['दार्शनिक', 'सामाजिक सुधारक', 'वैचारिक नेता', 'नैतिक आलोचक']),
      p('शिक्षण, ज्ञान और गुरु क्षेत्र', ['प्रोफेसर', 'आध्यात्मिक शिक्षक', 'धार्मिक सुधारक', 'शास्त्र विद्वान']),
      p('कट्टरपंथी और उच्च-जोखिम क्षेत्र', ['खोजी पत्रकार', 'युद्ध संवाददाता', 'कार्यकर्ता', 'क्रांतिकारी विचारक']),
      p('गूढ़, शोध और गहराई', ['ज्योतिषी', 'गूढ़ शोधकर्ता', 'तांत्रिक', 'गहन शोध विश्लेषक']),
    ]),
    health_issues_en: 'High blood pressure. Severe headaches. Nervous tension. Insomnia.',
    health_issues_hi: 'उच्च रक्तचाप। गंभीर सिरदर्द। तंत्रिका तनाव। अनिद्रा।',
    health_root_cause_en: 'Excess mental fire. Ideological rigidity. Suppressed emotional release.',
    health_root_cause_hi: 'अत्यधिक मानसिक अग्नि। वैचारिक कठोरता। दबी हुई भावनात्मक मुक्ति।',
    health_guidance_en: 'Mental cooling practices. Meditation and mantra. Reducing extremism in thinking. Emotional grounding.',
    health_guidance_hi: 'मानसिक शीतलन अभ्यास। ध्यान और मंत्र। सोच में चरमपंथ कम करना। भावनात्मक ग्राउंडिंग।',
  },

  // ─── 26. Uttara Bhadrapada ───────────────────────────────────────────────
  26: {
    characteristics_en: 'Extremely deep, calm, and spiritually mature. Silent strength and profound emotional depth. Able to endure long-term suffering with grace. Detached from surface-level ambitions. Natural compassion born from lived pain. Works quietly in the background rather than seeking recognition.',
    characteristics_hi: 'अत्यंत गहरे, शांत और आध्यात्मिक रूप से परिपक्व। मौन शक्ति और गहन भावनात्मक गहराई। दीर्घकालिक पीड़ा को अनुग्रह के साथ सहन करने में सक्षम। सतही महत्वाकांक्षाओं से विरक्त। जीए हुए दर्द से उत्पन्न प्राकृतिक करुणा। पहचान के बजाय पर्दे के पीछे चुपचाप काम करते हैं।',
    negative_traits_en: 'Emotional withdrawal. Depression. Loneliness. Excessive detachment.',
    negative_traits_hi: 'भावनात्मक संकोच। अवसाद। अकेलापन। अत्यधिक विरक्ति।',
    professions_en: j([
      p('Spirituality, Service & Healing', ['Spiritual guides', 'Meditation teachers', 'Yogis', 'Ashram administrators']),
      p('Care, Protection & Long-Term Service', ['Social service leaders', 'NGO managers', 'Orphanage or elder-care administrators', 'Hospice workers']),
      p('Research & Behind-the-Scenes Work', ['Long-term researchers', 'Archivists', 'Institutional planners']),
      p('Saturn & Pisces Domains', ['Hospital administration', 'Charitable trusts', 'Rehabilitation centers']),
    ]),
    professions_hi: j([
      p('आध्यात्मिकता, सेवा और उपचार', ['आध्यात्मिक मार्गदर्शक', 'ध्यान शिक्षक', 'योगी', 'आश्रम प्रशासक']),
      p('देखभाल, सुरक्षा और दीर्घकालिक सेवा', ['समाज सेवा नेता', 'एनजीओ प्रबंधक', 'अनाथालय या वृद्ध देखभाल प्रशासक', 'होस्पिस कार्यकर्ता']),
      p('शोध और पर्दे के पीछे का काम', ['दीर्घकालिक शोधकर्ता', 'अभिलेखाध्यक्ष', 'संस्थागत योजनाकार']),
      p('शनि और मीन क्षेत्र', ['अस्पताल प्रशासन', 'धर्मार्थ ट्रस्ट', 'पुनर्वास केंद्र']),
    ]),
    health_issues_en: 'Joint and knee problems. Chronic fatigue. Depression. Circulatory issues.',
    health_issues_hi: 'जोड़ों और घुटनों की समस्याएं। दीर्घकालिक थकान। अवसाद। परिसंचरण संबंधी समस्याएं।',
    health_root_cause_en: 'Emotional suppression. Long-term karmic burdens.',
    health_root_cause_hi: 'भावनात्मक दमन। दीर्घकालिक कार्मिक बोझ।',
    health_guidance_en: 'Gentle physical movement. Emotional sharing. Service with self-care balance. Structured routine.',
    health_guidance_hi: 'हल्की शारीरिक गतिविधि। भावनात्मक साझाकरण। स्व-देखभाल संतुलन के साथ सेवा। संरचित दिनचर्या।',
  },

  // ─── 27. Revati ──────────────────────────────────────────────────────────
  27: {
    characteristics_en: 'Extremely compassionate, protective, and guiding. Natural instinct to lead others safely to their destination. Gentle, empathetic, and emotionally intelligent. Highly spiritual without being rigid or dogmatic. Represents completion, fulfillment, and safe closure. Selfless helper who finds meaning in service. Deep inner contentment when helping others succeed.',
    characteristics_hi: 'अत्यंत करुणामय, सुरक्षात्मक और मार्गदर्शक। दूसरों को उनके गंतव्य तक सुरक्षित ले जाने की प्राकृतिक प्रवृत्ति। कोमल, सहानुभूतिपूर्ण और भावनात्मक रूप से बुद्धिमान। कठोर या हठधर्मी हुए बिना अत्यधिक आध्यात्मिक। पूर्णता, संतुष्टि और सुरक्षित समापन का प्रतिनिधित्व। नि:स्वार्थ सहायक जो सेवा में अर्थ पाते हैं। दूसरों की सफलता में मदद करने पर गहरी आंतरिक संतुष्टि।',
    negative_traits_en: 'Over-sacrifice. Weak personal boundaries. Emotional exhaustion. Losing self-identity while serving others.',
    negative_traits_hi: 'अत्यधिक त्याग। कमज़ोर व्यक्तिगत सीमाएं। भावनात्मक थकावट। दूसरों की सेवा में स्व-पहचान खोना।',
    professions_en: j([
      p('Guidance, Teaching & Mentorship', ['Teachers', 'Mentors', 'Coaches', 'Counselors', 'Spiritual guides']),
      p('Travel, Movement & Protection', ['Travel industry professionals', 'Tour guides', 'Logistics managers', 'Shipping and navigation', 'Aviation support roles']),
      p('Service, Care & Compassion-Based Fields', ['Social workers', 'NGO professionals', 'Rehabilitation centers', 'Child care services', 'Elder care services']),
      p('Mercury & Pisces Domains', ['Writers', 'Translators', 'Content creators', 'Advisors', 'Communication-based healers']),
    ]),
    professions_hi: j([
      p('मार्गदर्शन, शिक्षण और मेंटरशिप', ['शिक्षक', 'मेंटर', 'कोच', 'परामर्शदाता', 'आध्यात्मिक मार्गदर्शक']),
      p('यात्रा, गति और सुरक्षा', ['यात्रा उद्योग पेशेवर', 'टूर गाइड', 'लॉजिस्टिक्स प्रबंधक', 'शिपिंग और नेवीगेशन', 'विमानन सहायता भूमिकाएं']),
      p('सेवा, देखभाल और करुणा-आधारित क्षेत्र', ['समाज सेवक', 'एनजीओ पेशेवर', 'पुनर्वास केंद्र', 'बाल देखभाल सेवाएं', 'वृद्ध देखभाल सेवाएं']),
      p('बुध और मीन क्षेत्र', ['लेखक', 'अनुवादक', 'कंटेंट क्रिएटर', 'सलाहकार', 'संचार-आधारित उपचारक']),
    ]),
    health_issues_en: 'Foot and ankle problems. Lymphatic system disorders. Fluid retention. Emotional burnout. Depression due to emotional overload.',
    health_issues_hi: 'पैर और टखने की समस्याएं। लसिका तंत्र विकार। द्रव प्रतिधारण। भावनात्मक बर्नआउट। भावनात्मक अधिभार के कारण अवसाद।',
    health_root_cause_en: 'Carrying others\' emotional burdens. Lack of self-boundaries. Excess empathy.',
    health_root_cause_hi: 'दूसरों का भावनात्मक बोझ उठाना। स्व-सीमाओं की कमी। अत्यधिक सहानुभूति।',
    health_guidance_en: 'Emotional boundaries. Grounding practices. Regular rest and solitude. Self-care alongside service.',
    health_guidance_hi: 'भावनात्मक सीमाएं। ग्राउंडिंग अभ्यास। नियमित आराम और एकांत। सेवा के साथ-साथ स्व-देखभाल।',
  },
};

// ─── Base nakshatra data (unchanged from migration 010) ───────────────────
const BASE = [
  [1,  'Ashwini',          'अश्विनी',          9, 1,  0,      13.333, 'Ashwini Kumars',          'अश्विनी कुमार',        'rajas',  'male',    'merchant', 'vaishya',   'Horse (Male)',        'Strychnine Tree (Kuchla)',  'Quick, energetic, healing, pioneering, travel'],
  [2,  'Bharani',          'भरणी',             6, 1,  13.333, 26.667, 'Yama',                    'यम',                   'rajas',  'female',  'outcast',  'vaishya',   'Elephant (Female)',   'Indian Gooseberry (Amla)', 'Restrained, carrying burdens, creative, sacrifice'],
  [3,  'Krittika',         'कृत्तिका',         1, 1,  26.667, 30,     'Agni',                    'अग्नि',                'rajas',  'female',  'brahmin',  'brahmin',   'Sheep',               'Cluster Fig (Udumbara)',    'Sharp, cutting, purifying, war-like, leadership'],
  [4,  'Rohini',           'रोहिणी',           2, 2,  10,     23.333, 'Brahma',                  'ब्रह्मा',              'rajas',  'male',    'brahmin',  'brahmin',   'Cobra (Male)',        'Indian Rosewood (Jamun)',   'Fertile, creative, artistic, sensual, growth'],
  [5,  'Mrigashira',       'मृगशीर्षा',        3, 2,  23.333, 30,     'Soma / Chandra',          'सोम / चंद्र',          'tamas',  'neutral', 'farmer',   'kshatriya', 'Cobra (Female)',      'Khadira/Catechu',           'Searching, gentle, curious, artistic, wandering'],
  [6,  'Ardra',            'आर्द्रा',           8, 3,  6.667,  20,     'Rudra',                   'रुद्र',                'tamas',  'female',  'butcher',  'kshatriya', 'Female Dog',          'Long Pepper',               'Stormy, sharp, intense, transformative, tearful'],
  [7,  'Punarvasu',        'पुनर्वसु',          5, 3,  20,     30,     'Aditi',                   'अदिति',                'rajas',  'male',    'merchant', 'vaishya',   'Female Cat',          'Bamboo',                    'Return to goodness, optimistic, generous, bright'],
  [8,  'Pushya',           'पुष्य',             7, 4,  3.333,  16.667, 'Brihaspati',              'बृहस्पति',             'tamas',  'male',    'kshatriya','kshatriya', 'Male Ram/Goat',       'Peepal Tree',               'Nourishing, protective, devoted, successful, sattvic'],
  [9,  'Ashlesha',         'आश्लेषा',           4, 4,  16.667, 30,     'Nagas',                   'नाग',                  'sattva', 'female',  'outcast',  'kshatriya', 'Male Cat',            'Naga Champa',               'Clinging, cunning, secretive, transforming, mystical'],
  [10, 'Magha',            'मघा',               9, 5,  0,      13.333, 'Pitris (Ancestors)',      'पितृ',                 'tamas',  'female',  'kshatriya','shudra',    'Male Rat',            'Banyan Tree',               'Royal, ancestral, proud, leadership, authority'],
  [11, 'Purva Phalguni',   'पूर्वा फाल्गुनी',   6, 5,  13.333, 26.667, 'Bhaga',                   'भग',                   'tamas',  'female',  'brahmin',  'brahmin',   'Female Rat',          'Palash/Flame Tree',         'Pleasure-seeking, creative, relaxed, sensual, wealth'],
  [12, 'Uttara Phalguni',  'उत्तरा फाल्गुनी',   1, 5,  26.667, 30,     'Aryaman',                 'अर्यमन',               'tamas',  'female',  'kshatriya','kshatriya', 'Bull (Male)',         'Audumbar/Fig Tree',         'Contract, marital, service-oriented, helpful, stable'],
  [13, 'Hasta',            'हस्त',              2, 6,  10,     23.333, 'Savitar',                 'सवितार',               'rajas',  'male',    'merchant', 'vaishya',   'Buffalo (Male)',      'Henna/Jasmine',             'Skillful hands, wit, persistence, craftsmanship, healing'],
  [14, 'Chitra',           'चित्रा',            3, 6,  23.333, 30,     'Tvashtar / Vishwakarma',  'त्वष्टा / विश्वकर्मा',  'tamas',  'female',  'farmer',   'kshatriya', 'Female Tiger',        'Bel Tree',                  'Artistic, beautiful, technical, architectural, creative'],
  [15, 'Swati',            'स्वाती',            8, 7,  6.667,  20,     'Vayu',                    'वायु',                 'tamas',  'female',  'butcher',  'kshatriya', 'Male Buffalo',        'Arjuna Tree',               'Independent, flexible, spiritual, social, diplomatic'],
  [16, 'Vishakha',         'विशाखा',            5, 7,  20,     30,     'Indra & Agni',            'इंद्र और अग्नि',       'sattva', 'female',  'outcast',  'kshatriya', 'Male Tiger',          'Vikanta/Wood Apple',        'Goal-oriented, ambitious, passionate, transforming, victory'],
  [17, 'Anuradha',         'अनुराधा',           7, 8,  3.333,  16.667, 'Mitra',                   'मित्र',                'tamas',  'male',    'merchant', 'shudra',    'Female Deer',         'Mesua Ferrea/Nagkesar',      'Devotion, friendship, organizational, occult, social'],
  [18, 'Jyeshtha',         'ज्येष्ठा',          4, 8,  16.667, 30,     'Indra',                   'इंद्र',                'rajas',  'female',  'farmer',   'kshatriya', 'Male Deer/Hare',      'Shalmali/Cotton Tree',       'Eldest, protective, responsible, leadership, courage'],
  [19, 'Mula',             'मूल',               9, 9,  0,      13.333, 'Nirriti',                 'निर्ऋति',              'tamas',  'neutral', 'butcher',  'kshatriya', 'Male Dog',            'Sarala/Sal Tree',            'Investigation, foundation-seeking, transforming, occult, truth'],
  [20, 'Purva Ashadha',    'पूर्वाषाढ़ा',       6, 9,  13.333, 26.667, 'Apas (Water)',            'आपः / जल',             'rajas',  'female',  'brahmin',  'brahmin',   'Male Monkey',         'Rattan/Shatavari',           'Invincible, proud, philosophical, truth-seeking, social'],
  [21, 'Uttara Ashadha',   'उत्तराषाढ़ा',       1, 9,  26.667, 30,     'Vishwadeva',              'विश्वदेव',             'rajas',  'female',  'kshatriya','kshatriya', 'Male Mongoose',       'Jackfruit Tree',             'Universal victory, final success, stable, righteous, honest'],
  [22, 'Shravana',         'श्रवण',             2, 10, 10,     23.333, 'Vishnu',                  'विष्णु',               'rajas',  'male',    'outcast',  'kshatriya', 'Female Monkey',       'Arka/Calotropis',            'Listening, learning, connected, preserving, teaching, compassionate'],
  [23, 'Dhanishtha',       'धनिष्ठा',           3, 10, 23.333, 30,     'Vasus',                   'वसु',                  'tamas',  'female',  'farmer',   'kshatriya', 'Female Lion',         'Shami/Prosopis',             'Wealth, music, generous, courageous, multi-talented'],
  [24, 'Shatabhisha',      'शतभिषा',            8, 11, 6.667,  20,     'Varuna',                  'वरुण',                 'tamas',  'neutral', 'butcher',  'kshatriya', 'Female Horse',        'Kadamba Tree',               'Healing, mystical, secretive, independent, research'],
  [25, 'Purva Bhadrapada', 'पूर्वा भाद्रपद',    5, 11, 20,     30,     'Aja Ekapada',             'अज एकपाद',             'rajas',  'male',    'brahmin',  'brahmin',   'Male Lion',           'Mango Tree',                 'Two-faced, spiritual, passionate, eccentric, transforming, wealth'],
  [26, 'Uttara Bhadrapada','उत्तरा भाद्रपद',    7, 12, 3.333,  16.667, 'Ahirbudhnya',             'अहिर्बुध्न्य',         'tamas',  'male',    'kshatriya','brahmin',   'Female Cow',          'Neem Tree',                  'Depth, wisdom, serpentine, compassionate, renunciation, stability'],
  [27, 'Revati',           'रेवती',             4, 12, 16.667, 30,     'Pushan',                  'पूषन',                 'sattva', 'female',  'merchant', 'shudra',    'Female Elephant',     'Madhuka/Mahua Tree',         'Nourishing, caring, spiritual, completion, gentle, abundance'],
];

// Vimshottari years by planet_id (1-indexed: Sun=6, Moon=10, Mars=7, Merc=17, Jup=16, Ven=20, Sat=19, Rahu=18, Ketu=9)
const VIMSH = { 1: 6, 2: 10, 3: 7, 4: 17, 5: 16, 6: 20, 7: 19, 8: 18, 9: 7 };

exports.seed = async function (knex) {
  await knex('nakshatras').del();

  const rows = BASE.map(([id, name, name_hi, lord, sign, start_sign, end_sign, deity, deity_hi, guna, gender, caste, varna, animal, tree, nature]) => {
    const absStart = (id - 1) * SPAN;
    const absEnd   = id * SPAN;
    const notes    = NOTES[id] || {};
    return {
      id, name, name_hi,
      lord_planet_id:        lord,
      zodiac_sign_id:        sign,
      start_degree_in_sign:  parseFloat(start_sign.toFixed(4)),
      end_degree_in_sign:    parseFloat(Math.min(end_sign, 30).toFixed(4)),
      absolute_start_degree: parseFloat(absStart.toFixed(4)),
      absolute_end_degree:   parseFloat(absEnd.toFixed(4)),
      deity, deity_hi,
      guna, gender, caste, varna,
      animal_symbol:         animal,
      tree,
      general_nature:        nature,
      is_gandmool:           GANDMOOL.has(id),
      vimshottari_years:     VIMSH[lord],
      ...notes,
    };
  });

  await knex('nakshatras').insert(rows);
};
