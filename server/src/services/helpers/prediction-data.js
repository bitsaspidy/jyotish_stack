'use strict';
// All large static prediction/report reference data

const LAGNA_PORTRAIT = {
  1:  { en: 'You are a natural pioneer with Aries Lagna, ruled by Mars. You carry fierce energy, raw courage, and an unstoppable drive to initiate. People around you sense your confidence before you even speak. You are at your best when there is a challenge to overcome or a new trail to blaze. Your weakness is impatience — you want things done immediately. The world needs your fire; balance it with wisdom and patience.' },
  2:  { en: 'Taurus Lagna, ruled by Venus, gives you a grounded, reliable, and deeply sensory nature. You build things that last — relationships, wealth, and reputation. You move steadily, and once your mind is set, very little can move you. You have a natural appreciation for beauty and the finer things in life. Your gift is persistence; your challenge is releasing stubborn attachment.' },
  3:  { en: 'With Gemini Lagna, ruled by Mercury, you are sharp, curious, and endlessly adaptable. Your mind connects ideas, people, and possibilities that others miss. You communicate naturally and can hold multiple perspectives at once. You thrive in variety and wither in monotony. Your challenge is scattered energy — depth requires slowing the restless mind and committing fully.' },
  4:  { en: 'Cancer Lagna, ruled by the Moon, makes you deeply intuitive, emotionally perceptive, and profoundly nurturing. You carry the world in your heart and feel things that words cannot reach. Home, family, and belonging are your anchors. Your sensitivity is your superpower, but it can cause you to absorb others\' pain. Learning to set emotional boundaries is your lifelong practice.' },
  5:  { en: 'Leo Lagna, ruled by the Sun, gives you a natural radiance that draws people in. You were born to lead, create, and inspire. There is a kingly quality to your presence — warm and generous when secure, proud when not. You need recognition because your soul genuinely wants to make an impact. Your challenge is the ego: when the self becomes too large, it blocks the very light you were born to share.' },
  6:  { en: 'Virgo Lagna, ruled by Mercury, makes you one of the most perceptive and service-oriented souls in the zodiac. You see the details others miss. Your analytical mind, love of order, and dedication to craft make you excellent in any precision field. You genuinely care about doing things right. Your growth edge: imperfection is not failure, and you too deserve rest and self-compassion.' },
  7:  { en: 'Libra Lagna, ruled by Venus, gives you a diplomatic, fair-minded, and relationship-oriented nature. You instinctively seek balance and harmony — in yourself, in relationships, and in the world around you. You work best in partnership. Your challenge is decision-making: the scales can tip endlessly without a strong inner anchor of conviction.' },
  8:  { en: 'Scorpio Lagna, ruled by Mars and Ketu, makes you one of the most intense, perceptive, and transformative souls alive. Nothing is surface-level for you — you sense what lies beneath every word and silence. You have an extraordinary capacity for regeneration: you destroy what no longer serves and rise stronger. Your challenge is trust; vulnerability is the path to your greatest power.' },
  9:  { en: 'Sagittarius Lagna, ruled by Jupiter, gives you an expansive, philosophical, and freedom-loving spirit. You see the big picture when others see only fragments. Truth, wisdom, and meaning are your north stars. You are generous and magnetic in your optimism. Your challenge is commitment: the horizon is always more exciting than the destination.' },
  10: { en: 'Capricorn Lagna, ruled by Saturn, gives you an extraordinary capacity for discipline, long-term vision, and patient achievement. You understand that real things take time, and you are willing to do the work. Authority and responsibility sit naturally with you. Your reputation is built slowly but endures. Your challenge: allow joy and playfulness into the serious architecture of your life.' },
  11: { en: 'Aquarius Lagna, ruled by Saturn and Rahu, makes you a visionary, humanitarian, and natural innovator. You think in systems, often ahead of your time, and may feel misunderstood — because you are seeing what others have not yet imagined. You care deeply about collective progress. Your challenge is connecting that grand vision to the human beings right in front of you.' },
  12: { en: 'Pisces Lagna, ruled by Jupiter and Ketu, gives you boundless compassion, deep intuition, and a natural connection to the unseen. You live in two worlds — the visible and the mystical. You feel music in silence, meaning in symbols, and the divine in ordinary moments. You are deeply creative and spiritually sensitive. Your challenge: grounding your gifts in the practical world.' },
};

const MOON_SIGN_PORTRAIT = {
  1:  { en: 'Your Moon in Aries makes your emotional world fiery and immediate. You feel and react quickly — sometimes before thinking. You need action as emotional release. When you are sad, moving helps. When you are happy, you want to share it right away. You heal through courage and initiative.' },
  2:  { en: 'Your Moon in Taurus gives you an emotional world rooted in comfort, beauty, and stability. You are calmed by nature, good food, music, and physical touch. You are deeply loyal once you trust someone, but change unsettles your inner landscape. Patience is your emotional superpower.' },
  3:  { en: 'Your Moon in Gemini makes your emotional world quick, curious, and communicative. You process feelings through conversation and ideas. Your mood can shift in moments — not from instability, but because your mind needs constant stimulation. Writing, talking, and connecting are how you heal.' },
  4:  { en: 'Your Moon in Cancer is in its own sign — you are emotionally rich, deeply intuitive, and powerfully connected to home and family. Your feelings run very deep even when your face shows composure. You need a safe sanctuary. When loved ones are well, you are well.' },
  5:  { en: 'Your Moon in Leo gives you a warm, expressive emotional nature. You feel with a big heart and want your feelings to matter. You are generous with affection and need appreciation in return. Creative expression — art, performance, or leadership — is how your emotional energy flows best.' },
  6:  { en: 'Your Moon in Virgo means you process emotions analytically — you think through your feelings before expressing them. You care deeply about being useful and doing things right. Anxiety can arise when things feel out of control. Serving others is genuinely healing for you.' },
  7:  { en: 'Your Moon in Libra creates an emotional world oriented around relationship, fairness, and beauty. You are most at peace in harmonious partnership. Conflict genuinely troubles you. You need beauty around you — in your space, your relationships, and your daily rhythms — to feel emotionally well.' },
  8:  { en: 'Your Moon in Scorpio gives you an intense, private emotional world. You feel everything deeply but share very little until you fully trust. You are drawn to the hidden and the transformative. You have extraordinary resilience — you have survived things that would break others, and emerged wiser.' },
  9:  { en: 'Your Moon in Sagittarius gives you an emotionally optimistic, free-spirited nature. You feel best when learning, traveling, or expanding your horizons. Your mood lifts when you see meaning in events. You cannot thrive in emotionally suffocating environments — freedom is your emotional oxygen.' },
  10: { en: 'Your Moon in Capricorn gives you a reserved, self-contained emotional world. You may feel more than you show. You find emotional security in achievement and structure — having a plan makes you feel safe. Learning to receive support, not just give it, is your growth edge.' },
  11: { en: 'Your Moon in Aquarius makes your emotional world intellectual, idealistic, and group-oriented. You care about humanity but may struggle with one-on-one emotional intimacy. You feel best when contributing to something larger than yourself. Friendship is as meaningful to you as romantic love.' },
  12: { en: 'Your Moon in Pisces gives you the most empathic, boundless emotional nature of all signs. You absorb the feelings of everyone around you — regularly clearing this energy is essential. You are deeply creative and spiritually attuned. Solitude, water, and music restore your soul.' },
};

const DASHA_LORD_MEANINGS = {
  Sun: {
    nature: 'Soul, authority, father, government, and vitality.',
    career_en: 'This is a period of authority and recognition. Careers in government, leadership, administration, and public life are highlighted. Your confidence shines — people see and respect your abilities. Work that puts you in a position of responsibility is strongly favored. Push forward on goals that require courage and visibility.',
    relationships_en: 'Your relationship with father figures, authorities, and mentors comes to the fore. You may feel a stronger need to express your individuality in relationships. The soul-level purpose of partnerships deepens. Be careful not to let ego create unnecessary distance with those you love.',
    health_en: 'Heart, eyes, spine, and bone health need attention this period. Avoid overexertion and ego-driven stress. Pitta imbalances can affect vitality. Morning sunlight, Surya Namaskar, and time in nature support your system. Do not ignore signals from your heart and spine.',
    finance_en: 'Income through government, authority, or established organizations is favored. Investments in stable assets are appropriate. Steady dignified effort brings reward — speculation and shortcuts are not aligned with Sun\'s energy.',
    spiritual_en: 'This is a time to develop personal integrity and dharma-aligned purpose. Gayatri mantra, Surya Namaskar at sunrise, and practices that cultivate the authentic Self serve you deeply. Offer water to the Sun every morning.',
    opportunities: ['Career recognition', 'Leadership roles', 'Government connections', 'Father-child healing', 'Authority and respect'],
    cautions: ['Ego conflicts with superiors', 'Heart or eye strain', 'Arrogance in relationships', 'Overwork and burnout'],
  },
  Moon: {
    nature: 'Mind, mother, emotions, public life, and fluctuations.',
    career_en: 'Public-facing work, creative arts, hospitality, healthcare, and fields requiring emotional intelligence are highlighted. Your public image and popularity can grow significantly this period.',
    relationships_en: 'Emotional bonds deepen and become central. Your relationship with mother or maternal figures is especially significant. Practice active listening without losing yourself in others\' emotions.',
    health_en: 'Mind and emotional balance are paramount. The digestive system, lungs, and fluid balance need care. Prioritize sleep, mental peace, and emotional processing.',
    finance_en: 'Finances may fluctuate. Income through creative or public-facing work is possible. Avoid emotionally-driven financial decisions.',
    spiritual_en: 'This is a time for emotional healing and lunar practices. Chandra mantra, full moon meditations, and devotion to the Divine Mother are powerful.',
    opportunities: ['Public recognition', 'Creative breakthroughs', 'Emotional healing', 'Maternal connections', 'Popularity growth'],
    cautions: ['Mood swings and instability', 'Overthinking', 'Digestive sensitivity', 'Emotional dependency', 'Financial fluctuations'],
  },
  Mars: {
    nature: 'Energy, courage, property, siblings, and competitive spirit.',
    career_en: 'Mars dasha ignites ambition and raw action. Careers in engineering, medicine, military, real estate, sports, and any field requiring courage are strongly supported.',
    relationships_en: 'Passion and conflict both intensify. Relationships with siblings and competitive peers need balanced communication.',
    health_en: 'Blood, muscles, inflammation, and accidents require careful attention. Regular, vigorous physical exercise is essential.',
    finance_en: 'Real estate, property investments, and bold business ventures can bring significant gains. Avoid purely impulsive financial risks.',
    spiritual_en: 'Channel Mars energy into disciplined spiritual practice. Hanuman devotion and physical sadhana transform Mars into dharmic fire.',
    opportunities: ['Property and real estate gains', 'Career bold moves', 'Physical and athletic performance', 'Courageous leadership'],
    cautions: ['Anger and impatience', 'Accident risk', 'Sibling or peer conflicts', 'Inflammation and blood-related issues'],
  },
  Mercury: {
    nature: 'Intelligence, communication, business, and analytical ability.',
    career_en: 'Mercury\'s dasha is excellent for business, writing, teaching, accounting, data, and any communication-intensive field. Multiple income streams and business partnerships are favored.',
    relationships_en: 'Intellectual compatibility becomes the foundation of meaningful relationships. Conversations and mental rapport are the glue in your closest bonds.',
    health_en: 'The nervous system, skin, and respiratory health need attention. Mental overload and anxiety can surface. Ground yourself through physical activity.',
    finance_en: 'Business acumen is sharp. Multiple income streams, trade, and smart investments are favored. Keep financial records clear and transparent.',
    spiritual_en: 'Study of sacred texts, mantras, and astrology is deeply supported. Vishnu devotion and using your voice in service of truth are aligned practices.',
    opportunities: ['Business expansion', 'Learning breakthroughs', 'Communication influence', 'Multiple income streams', 'Educational advancement'],
    cautions: ['Scattered energy', 'Overthinking and indecision', 'Nervous tension and anxiety', 'Over-commitment to too many things'],
  },
  Jupiter: {
    nature: 'Wisdom, grace, expansion, children, guru, and higher knowledge.',
    career_en: 'Jupiter\'s dasha is among the most blessed for career growth. Teaching, counseling, law, finance, and philosophy are strongly favored. Mentors open doors. This is a period of genuine, lasting growth.',
    relationships_en: 'Relationships are blessed with wisdom and growth. Marriage, commitment, and starting a family are all favored. Children and the teacher-student role become important themes.',
    health_en: 'Generally excellent vitality. The liver, fat tissue, and weight may need monitoring — overindulgence can become a comfortable habit.',
    finance_en: 'Financial expansion and wealth multiplication are strongly indicated. Investments in education and long-term assets are especially rewarding.',
    spiritual_en: 'This is THE great spiritual expansion period. Guru connection, pilgrimages, and scripture study are powerfully supported.',
    opportunities: ['Career and income expansion', 'Wealth and financial growth', 'Marriage or children', 'Guru or mentor connection', 'Higher knowledge'],
    cautions: ['Overconfidence', 'Weight gain', 'Liver health', 'Overextension', 'Laziness in abundance'],
  },
  Venus: {
    nature: 'Love, beauty, luxury, art, marriage, and material pleasures.',
    career_en: 'Venus dasha illuminates creative fields — arts, design, music, fashion, entertainment, and relationship-based work. Partnerships and collaborations flourish.',
    relationships_en: 'This is THE relationship dasha. Marriage, romantic love, and deep partnerships are strongly favored. Existing partnerships deepen with new appreciation.',
    health_en: 'Kidneys, reproductive system, throat, and blood sugar need attention. Avoid overindulgence in sweets and rich food.',
    finance_en: 'Material abundance increases noticeably. Income through beauty, luxury, creative work, and partnerships rises.',
    spiritual_en: 'Lakshmi devotion, artistic expression as spiritual practice, and recognizing beauty as divine are the paths for Venus dasha.',
    opportunities: ['Love and romantic connections', 'Creative recognition', 'Material abundance', 'Business partnerships', 'Marriage and commitment'],
    cautions: ['Overindulgence', 'Kidney and reproductive health', 'Sugar and dietary imbalance', 'Attachment to luxury'],
  },
  Saturn: {
    nature: 'Discipline, karma, delay, patience, service, and structured achievement.',
    career_en: 'Saturn dasha demands sustained, disciplined effort. Careers in law, agriculture, social service, engineering, and structured organizations gain traction — slowly but durably.',
    relationships_en: 'Relationships face a test of commitment and maturity. Saturn delays but does not permanently deny — relationships that survive are built to last.',
    health_en: 'Joints, bones, teeth, skin, and the nervous system all need care. Chronic patterns may surface. Prioritize consistent sleep and regular routine.',
    finance_en: 'Finances require patient management and careful planning. Slow, steady accumulation is the rewarded path. Avoid unnecessary debt.',
    spiritual_en: 'Saturn dasha is one of the most profound for karma-clearing. Service to the less fortunate and Shani devotion on Saturdays are the practices.',
    opportunities: ['Disciplined growth', 'Karma clearing', 'Building foundations', 'Professional credibility', 'Service-oriented impact'],
    cautions: ['Delays requiring patience', 'Heavy episodes', 'Joint and bone issues', 'Pessimism or isolation', 'Fatigue from sustained effort'],
  },
  Rahu: {
    nature: 'Ambition, foreign connections, technology, illusion, and sudden transformation.',
    career_en: 'Rahu opens unconventional and ambitious career paths. Technology, media, foreign organizations, and anything outside the norm are especially active. Sudden career leaps are possible.',
    relationships_en: 'Relationships can feel intense, karmic, and sometimes destabilizing. Foreign or unconventional connections may form with compelling force.',
    health_en: 'Mysterious or difficult-to-diagnose issues and mental confusion can arise. Addictive tendencies need watching. Grounding practices are essential.',
    finance_en: 'Sudden financial gains and equally sudden losses are possible. Foreign income and unconventional sources may arise. Diversify rather than bet everything.',
    spiritual_en: 'Rahu dasha is a time to confront illusion and recognize the karmic currents beneath your life. The worldly experiences carry spiritual lessons.',
    opportunities: ['Unconventional success', 'Foreign connections', 'Technology breakthroughs', 'Rapid expansion', 'Karmic completion'],
    cautions: ['Illusion and self-deception', 'Obsessive patterns', 'Health mysteries', 'Sudden reversals', 'Overambition'],
  },
  Ketu: {
    nature: 'Spirituality, detachment, past-life karma, and inner awakening.',
    career_en: 'Ketu naturally draws focus inward. Research, healing, spiritual work, and deep specialization are supported. Worldly career ambition may feel less compelling — and this is an invitation to go deeper.',
    relationships_en: 'Ketu creates a pull toward solitude and inner work. Old karmic relationships may complete or close gracefully. New relationships tend to be spiritually oriented.',
    health_en: 'Mysterious or sudden health events and healing crises can mark Ketu periods. Ayurvedic treatments and reducing toxic inputs support you greatly.',
    finance_en: 'Financial focus naturally decreases. Some gains arrive through unexpected channels. A genuine detachment from money can paradoxically attract what you genuinely need.',
    spiritual_en: 'Ketu dasha is the most powerful period for moksha-seeking. Ganesha practices, deep meditation, and silent retreats carry immense power.',
    opportunities: ['Spiritual awakening', 'Research and mastery', 'Inner clarity', 'Karmic completion', 'Moksha-oriented living'],
    cautions: ['Detachment from life', 'Isolation', 'Mysterious health events', 'Loss of worldly direction'],
  },
};

const SADE_SATI_DESC = {
  rising:  'You are in the Rising phase of Sade Sati — Saturn transits the 12th house from your natal Moon. This is a time of internal preparation, gradual release of old patterns, and sometimes increased expenses or travel. Dreams become vivid; hidden things surface. This phase asks you to let go of what no longer serves your deeper purpose.',
  peak:    'You are in the Peak phase of Sade Sati — Saturn transits directly over your natal Moon sign. This is the most intense phase: reality, responsibility, and karmic lessons arrive with full weight. Challenges in health, relationships, or career may arise together. But those who meet this period with discipline, humility, and consistent effort emerge with their most durable achievements and deepest character.',
  setting: 'You are in the Setting phase of Sade Sati — Saturn transits the 2nd house from your natal Moon. The heaviest weight is gradually lifting. Speech, finances, and family dynamics come into focus. This phase rewards the discipline maintained during the peak — slow consolidation and steady recovery are the themes now.',
  none:    'Saturn is not currently in Sade Sati from your Moon sign. This is an easier period in terms of Saturnine pressure from transit.',
};

const HOUSE_REPORT = {
  1:  { en:'identity, body, vitality, confidence, and life direction',                           hi:'स्वभाव, शरीर, आत्मविश्वास और जीवन दिशा' },
  2:  { en:'speech, family values, food habits, savings, and accumulated wealth',                hi:'वाणी, परिवार, भोजन, बचत और संचित धन' },
  3:  { en:'courage, effort, communication, skills, siblings, and short journeys',               hi:'साहस, प्रयास, संचार, कौशल, सहोदर और छोटी यात्रा' },
  4:  { en:'home, mother, property, education, inner peace, and emotional security',             hi:'घर, माता, संपत्ति, शिक्षा, मन की शांति और सुरक्षा' },
  5:  { en:'intelligence, creativity, children, mantra, romance, and past merit',                hi:'बुद्धि, रचनात्मकता, संतान, मंत्र, प्रेम और पूर्व पुण्य' },
  6:  { en:'debts, disease, service, competition, enemies, and daily discipline',                hi:'ऋण, रोग, सेवा, प्रतियोगिता, शत्रु और दैनिक अनुशासन' },
  7:  { en:'marriage, partnerships, contracts, public dealings, and direct relationships',       hi:'विवाह, साझेदारी, अनुबंध, जनसंपर्क और सीधे संबंध' },
  8:  { en:'longevity, transformation, secrets, sudden events, inheritance, and research',       hi:'आयु, परिवर्तन, रहस्य, अचानक घटना, विरासत और शोध' },
  9:  { en:'fortune, dharma, father, teachers, higher learning, and long journeys',              hi:'भाग्य, धर्म, पिता, गुरु, उच्च शिक्षा और लंबी यात्रा' },
  10: { en:'career, karma, authority, status, leadership, and public responsibility',            hi:'करियर, कर्म, अधिकार, पद, नेतृत्व और सार्वजनिक जिम्मेदारी' },
  11: { en:'income, gains, networks, elder siblings, ambitions, and fulfilment of desires',      hi:'आय, लाभ, नेटवर्क, बड़े सहोदर, महत्वाकांक्षा और इच्छा पूर्ति' },
  12: { en:'foreign places, sleep, expenses, losses, moksha, isolation, and retreat',            hi:'विदेश, नींद, खर्च, हानि, मोक्ष, एकांत और विश्राम' },
};

const PLANET_REPORT = {
  Sun:     { en:'soul, authority, father, confidence, leadership, government, and visibility',                       hi:'आत्मबल, अधिकार, पिता, आत्मविश्वास, नेतृत्व, शासन और प्रतिष्ठा' },
  Moon:    { en:'mind, emotions, mother, comfort, public response, memory, and nourishment',                         hi:'मन, भावनाएं, माता, सुख, जन प्रतिक्रिया, स्मृति और पोषण' },
  Mars:    { en:'courage, action, property, siblings, engineering, discipline, and conflict response',               hi:'साहस, कर्म, संपत्ति, सहोदर, तकनीक, अनुशासन और संघर्ष प्रतिक्रिया' },
  Mercury: { en:'intellect, speech, trade, analytics, writing, learning, and adaptability',                         hi:'बुद्धि, वाणी, व्यापार, विश्लेषण, लेखन, शिक्षा और अनुकूलन' },
  Jupiter: { en:'wisdom, teachers, dharma, children, wealth counsel, protection, and expansion',                     hi:'ज्ञान, गुरु, धर्म, संतान, धन सलाह, संरक्षण और विस्तार' },
  Venus:   { en:'relationships, spouse, art, luxury, comfort, beauty, vehicles, and pleasures',                      hi:'संबंध, जीवनसाथी, कला, विलास, सुख, सौंदर्य, वाहन और आनंद' },
  Saturn:  { en:'discipline, delay, karma, service, endurance, structure, and long-term results',                    hi:'अनुशासन, विलंब, कर्म, सेवा, धैर्य, संरचना और दीर्घकालिक फल' },
  Rahu:    { en:'ambition, unconventional growth, foreign influence, technology, obsession, and breakthroughs',      hi:'महत्वाकांक्षा, असामान्य विकास, विदेशी प्रभाव, तकनीक, आसक्ति और असाधारण उपलब्धि' },
  Ketu:    { en:'detachment, moksha, past-life mastery, intuition, separation, and spiritual insight',               hi:'वैराग्य, मोक्ष, पूर्व जन्म कौशल, अंतर्ज्ञान, अलगाव और आध्यात्मिक दृष्टि' },
};

const PLANET_NAME_HI = {
  Sun:'सूर्य', Moon:'चंद्र', Mars:'मंगल', Mercury:'बुध',
  Jupiter:'गुरु', Venus:'शुक्र', Saturn:'शनि', Rahu:'राहु', Ketu:'केतु', Ascendant:'लग्न',
};

const NATURAL_PLANET_NATURE = {
  Sun:'firm', Moon:'benefic', Mars:'sharp', Mercury:'benefic',
  Jupiter:'benefic', Venus:'benefic', Saturn:'slow', Rahu:'shadow', Ketu:'shadow',
};

const REPORT_PLANET_ORDER = ['Sun','Mercury','Rahu','Mars','Jupiter','Moon','Ketu','Venus','Saturn'];

const VARGA_MATRIX_ROWS = [
  { key:'birth',            label_en:'Birth',             label_hi:'जन्म',           type:'birth' },
  { key:'navamsha',         label_en:'Navamsha',          label_hi:'नवांश',          slug:'d9' },
  { key:'chalit',           label_en:'Chalit',            label_hi:'चलित',           type:'chalit' },
  { key:'sun',              label_en:'Sun',               label_hi:'सूर्य',          type:'birth', reference_lagna:'Sun' },
  { key:'moon',             label_en:'Moon',              label_hi:'चंद्र',          type:'birth', reference_lagna:'Moon' },
  { key:'hora',             label_en:'Hora',              label_hi:'होरा',           slug:'d2' },
  { key:'drekkana',         label_en:'Drekkana',          label_hi:'द्रेष्काण',      slug:'d3' },
  { key:'chaturthamsha',    label_en:'Chaturthamsha',     label_hi:'चतुर्थांश',      slug:'d4' },
  { key:'panchamsha',       label_en:'Panchamsha',        label_hi:'पंचमांश',        slug:'d5' },
  { key:'saptamsha',        label_en:'Saptamsha',         label_hi:'सप्तमांश',       slug:'d7' },
  { key:'ashtamsha',        label_en:'Ashtamsha',         label_hi:'अष्टमांश',       slug:'d8' },
  { key:'dashamsha',        label_en:'Dashamsha',         label_hi:'दशमांश',         slug:'d10' },
  { key:'dwadashamsha',     label_en:'Dwadashamsha',      label_hi:'द्वादशांश',      slug:'d12' },
  { key:'shodashamsha',     label_en:'Shodashamsha',      label_hi:'षोडशांश',        slug:'d16' },
  { key:'vimshamsha',       label_en:'Vimshamsha',        label_hi:'विंशांश',        slug:'d20' },
  { key:'chaturvimshamsha', label_en:'Chaturvimshamsha',  label_hi:'चतुर्विंशांश',   slug:'d24' },
  { key:'bhamsha',          label_en:'Bhamsha',           label_hi:'भांश',           slug:'d27' },
  { key:'trimshamsha',      label_en:'Trimshamsha',       label_hi:'त्रिंशांश',      slug:'d30' },
  { key:'khavedamsha',      label_en:'Khavedamsha',       label_hi:'खवेदांश',        slug:'d40' },
  { key:'akshavedamsha',    label_en:'Akshavedamsha',     label_hi:'अक्षवेदांश',     slug:'d45' },
  { key:'shashtiamsha',     label_en:'Shashtiamsha',      label_hi:'षष्ट्यंश',       slug:'d60' },
];

const EVENT_AREA_CONFIG = {
  career: {
    title_en:'Career, role, authority', title_hi:'करियर, पद और अधिकार',
    houses:[6,10,11], lords:['Sun','Mars','Mercury','Jupiter','Saturn','Rahu'],
    gochar:['jupiter_support','sade_sati'],
    action_en:'Use the window for career decisions, interviews, role changes, visibility, and responsibility planning.',
    action_hi:'इस समय का उपयोग करियर निर्णय, इंटरव्यू, भूमिका बदलाव, पहचान और जिम्मेदारी की योजना के लिए करें।',
  },
  finance: {
    title_en:'Money, gains, assets', title_hi:'धन, लाभ और संपत्ति',
    houses:[2,5,9,11], lords:['Jupiter','Venus','Mercury','Sun','Rahu'],
    gochar:['jupiter_support'],
    action_en:'Plan income, savings, investments, client growth, and asset consolidation with clear records.',
    action_hi:'आय, बचत, निवेश, ग्राहक वृद्धि और संपत्ति सुदृढ़ीकरण को स्पष्ट रिकॉर्ड के साथ संभालें।',
  },
  relationships: {
    title_en:'Marriage, partnership, family', title_hi:'विवाह, साझेदारी और परिवार',
    houses:[2,4,7], lords:['Venus','Moon','Jupiter','Mercury'],
    gochar:['rahu_ketu_axis'],
    action_en:'Time important conversations, commitment decisions, matchmaking reviews, and family healing carefully.',
    action_hi:'महत्वपूर्ण बातचीत, प्रतिबद्धता, मिलान समीक्षा और पारिवारिक सुधार को सावधानी से समय दें।',
  },
  health: {
    title_en:'Health, routine, recovery', title_hi:'स्वास्थ्य, दिनचर्या और सुधार',
    houses:[1,6,8,12], lords:['Sun','Moon','Mars','Saturn','Ketu'],
    gochar:['sade_sati'],
    action_en:'Prioritize routine, sleep, diagnostics, treatment follow-through, and stress reduction.',
    action_hi:'दिनचर्या, नींद, जांच, उपचार की निरंतरता और तनाव घटाने को प्राथमिकता दें।',
  },
  education_spiritual: {
    title_en:'Education, dharma, spiritual growth', title_hi:'शिक्षा, धर्म और आध्यात्मिक विकास',
    houses:[5,9,12], lords:['Jupiter','Mercury','Ketu','Sun'],
    gochar:['jupiter_support','rahu_ketu_axis'],
    action_en:'Study, certification, mentoring, mantra, pilgrimage, research, and inner work respond well in this phase.',
    action_hi:'अध्ययन, प्रमाणपत्र, मार्गदर्शन, मंत्र, तीर्थ, शोध और आंतरिक कार्य इस चरण में अच्छा प्रतिसाद देते हैं।',
  },
};

module.exports = {
  LAGNA_PORTRAIT, MOON_SIGN_PORTRAIT, DASHA_LORD_MEANINGS, SADE_SATI_DESC,
  HOUSE_REPORT, PLANET_REPORT, PLANET_NAME_HI, NATURAL_PLANET_NATURE,
  REPORT_PLANET_ORDER, VARGA_MATRIX_ROWS, EVENT_AREA_CONFIG,
};
