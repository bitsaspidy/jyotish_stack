'use strict';
// Rule text — English (simple, plain, life-guidance tone; no technical terms).
const shared = require('./shared');

module.exports = {
  ...shared,

  // personality
  'pers.lagnalord.strong': { text: 'You show good self-control, firmness and an ability to hold yourself together.' },
  'pers.lagnalord.weak': { text: 'At times your confidence and inner steadiness may go up and down; work on trusting yourself more.', advice: 'Give yourself a little quiet time each day to understand and settle your mind.' },
  'pers.sun.strong': { text: 'Leadership, self-respect and the will to take responsibility are strong in you.' },
  'pers.saturn.lagna': { text: 'You are serious, responsible and practical, but try not to overthink or be too hard on yourself.' },

  // family
  'fam.base': { text: 'Family and home act like an emotional support in your life. With time, both responsibilities and bonds grow.' },
  'fam.benefic4': { text: 'Your home generally stays peaceful, with good support from loved ones.' },
  'fam.malefic4': { text: 'Some responsibilities related to home or mother may rest on you; handled with patience, the atmosphere stays good.', advice: 'Take care of the elders at home — it keeps both your mind and the mood at peace.' },
  'fam.jupiter.strong': { text: 'You keep receiving the blessings and support of elders and well-wishers.' },
  'fam.rahuketu2': { text: 'There can sometimes be misunderstandings over money or words in the family; keep your speech gentle.', caution: 'Do not let money dealings or sharp words create distance in the family.' },

  // career
  'car.base': { text: 'You have the ability to rise in your career; the right direction and steady effort build your name.' },
  'car.benefic10': { text: 'There is a good chance of growth and good opportunities at work.' },
  'car.saturn': { text: 'Jobs and roles with responsibility suit you; success comes slowly but stays strong and lasting.', advice: 'Choose patience and steady effort over haste.' },
  'car.sun': { text: 'Leadership, administration or responsible/government-type fields work well for you.' },
  'car.mercury': { text: 'You can do well in work involving intelligence, communication, business, writing or advice.' },
  'car.rajyoga': { text: 'With the right opportunity, you have the ability to reach a good position and earn respect.' },
  'car.rahu10': { text: 'Your career may see sudden ups and downs; avoid shortcuts and trust your hard work.', caution: 'Do not pick the wrong path in the rush for quick success.' },
  'car.ego': { text: 'Avoid clashing your ego with seniors or authority — it can spoil good work.', caution: 'Do not harm your job or work in anger and pride.' },

  // money
  'mon.base': { text: 'You understand how to earn; along with income, focus on saving and good planning will help.' },
  'mon.jupiter.venus': { text: 'There is a good chance that wealth and comforts will grow with time.' },
  'mon.gain11': { text: 'More than one source of income, and gains through friends and contacts, are likely.' },
  'mon.lakshmi': { text: 'Your chart shows a good ability to build wealth and grow prosperity.' },
  'mon.chandramangal': { text: 'Practical earning chances come up, but it is important to control spending and haste.', advice: 'Put aside a part of your earnings into savings every month.' },
  'mon.rahu2': { text: 'Money can sometimes arrive suddenly, but avoid unthinking investments or borrowing.', caution: 'Stay away from quick-money, risky deals driven by greed.' },
  'mon.saturn2': { text: 'Early on, money feels a little tight, but discipline builds good savings later.' },

  // marriage
  'mar.base': { text: 'Marriage and partnership will be an important part of your life; understanding and conversation make the bond strong.' },
  'mar.benefic7': { text: 'Your partner is likely to be good-natured and supportive; love and understanding stay in married life.' },
  'mar.jupiter7': { text: 'Your partner can be wise, well-mannered and guiding — the relationship carries maturity.' },
  'mar.venus.weak': { text: 'Relationships may need a little more effort and understanding; share your feelings openly.', advice: 'Give your partner time and do not let small things grow big.' },
  'mar.mars7': { text: 'Your partner may be energetic and outspoken; patience and understanding each other will matter in the relationship.', caution: 'Do not let small arguments grow; words said in anger hurt the relationship.' },
  'mar.rahuketu7': { text: 'Distance or misunderstanding can sometimes appear in the relationship; trust and clear talk matter most.' },

  // children
  'chl.base': { text: 'Happiness through children will be a beautiful part of your life.' },
  'chl.jupiter5': { text: 'There is a good chance of happiness and joy through children.' },
  'chl.delay': { text: 'There may be some delay or extra effort in the matter of children. It is better to walk forward with both the right timing, good medical advice and spiritual practices together.', advice: 'Stay patient and, if needed, take good medical advice in time.' },

  // siblings
  'sib.base': { text: 'Siblings and friends will be a source of support and connection in your life.' },
  'sib.mars3': { text: 'You have good courage and initiative; the bond with siblings stays supportive.' },
  'sib.saturn3': { text: 'Effort and discipline build your courage; with siblings there can sometimes be a little distance or responsibility.' },

  // health
  'hea.base': { text: 'Overall your health can be managed well; a good routine and a balanced lifestyle are the biggest remedy.' },
  'hea.lagnalord.strong': { text: 'Your body shows a good ability to fight off illness.' },
  'hea.weak': { text: 'Energy and health may go up and down at times; do not ignore tiredness and stress.', advice: 'Build a routine for sleep, food and a little exercise.' },
  'hea.mind': { text: 'The mind sometimes starts overthinking or feeling too much; take special care of your mental peace.', advice: 'Spend a few minutes in deep breathing or meditation daily.' },

  // debt / enemies
  'deb.base': { text: 'You have the ability to face difficulties and competition; handled wisely, problems settle down.' },
  'deb.win6': { text: 'You have a good ability to come out on top of competition and opponents — hard work brings the win.' },
  'deb.caution': { text: 'Stay careful in matters of loans, legal cases and hidden opponents; keep your paperwork clean.', caution: 'Avoid giving guarantees or taking large loans without thinking.' },

  // property
  'pro.base': { text: 'With time, there is a chance of gaining a home, vehicle and comforts.' },
  'pro.benefic4': { text: "There is a good chance of comfort from home and vehicle, and warmth from your mother." },
  'pro.mars4': { text: 'Property comes through effort; do not let arguments grow at home.' },
  'pro.saturn4': { text: 'There may be some delay or responsibility around home/property, but things come together with patience.' },

  // luck / spirituality
  'spi.base': { text: 'Both luck and effort move your life forward; interest in faith and good deeds brings peace of mind.' },
  'spi.jupiter9': { text: 'The support of luck and the guidance of elders/mentors keep reaching you from time to time.' },
  'spi.ketu': { text: 'You have a natural pull towards spirituality, practice and deeper understanding.' },
};
