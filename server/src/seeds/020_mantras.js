'use strict';
// Seed 020 — Mantras (idempotent)

const MANTRAS = [
  {
    slug: 'ganesh-gayatri',
    deity: 'Ganesha',
    category: 'opening',
    name_hi: 'गणेश गायत्री मंत्र',
    name_en: 'Ganesh Gayatri Mantra',
    description_hi: 'एक अत्यंत शक्तिशाली और पवित्र मंत्र जो ज्ञान, बुद्धि और एकाग्रता प्रदान करता है। किसी भी नए कार्य की शुरुआत या ध्यान से पहले इसे जपना बहुत शुभ माना जाता है।',
    description_en: 'An extremely powerful and sacred mantra that bestows knowledge, wisdom, and concentration. It is considered very auspicious to chant before beginning any new work or before meditation.',
    mantra_text_sanskrit: 'ॐ एकदंताय विद्महे वक्रतुंडाय धीमहि तन्नो दंतिः प्रचोदयात्॥',
    mantra_text_hindi: 'ॐ एकदन्ताय विद्महे, वक्रतुण्डाय धीमहि, तन्नो दन्तिः प्रचोदयात्॥',
    mantra_text_english: 'Om Ekadantaya Vidmahe Vakratundaya Dhimahi Tanno Dantih Prachodayat',
    meaning_hi: 'एकदंताय विद्महे: हम उस ईश्वर (एकदंत — जिनका एक दांत है) का ध्यान करते हैं। वक्रतुंडाय धीमहि: हम उस घुमावदार सूंड वाले भगवान का ध्यान करते हैं। तन्नो दंतिः प्रचोदयात्: हे दंति (गणेश जी), हमें बुद्धि और ज्ञान के मार्ग पर प्रेरित करें।',
    meaning_en: 'Ekadantaya Vidmahe: We meditate on the one-tusked Lord. Vakratundaya Dhimahi: We meditate upon Him with the curved trunk. Tanno Dantih Prachodayat: May He with the tusk enlighten our intellect.',
    benefits_hi: 'यह आपके जीवन से सभी प्रकार की बाधाओं और नकारात्मकता को दूर करता है। मन को शांति, मानसिक स्पष्टता और एकाग्रता प्राप्त होती है।',
    benefits_en: 'Removes all obstacles and negativity from life. Bestows peace of mind, mental clarity, and concentration.',
    jap_count: 9,
    display_order: 1,
    is_active: true,
  },
];

exports.seed = async function (knex) {
  for (const m of MANTRAS) {
    const exists = await knex('mantras').where('slug', m.slug).first();
    if (!exists) {
      await knex('mantras').insert(m);
    } else {
      await knex('mantras').where('slug', m.slug).update(m);
    }
  }
};
