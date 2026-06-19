'use strict';
/**
 * varga-purpose-filter.js — Purpose-aware filtering for Varga chart planet readings.
 * Each Varga chart has a specific topic domain; generic karakatva language is filtered out
 * and replaced with chart-purpose-appropriate interpretations.
 * D30 (Trimshamsha) receives special risk/vulnerability language transformation.
 */

// ── What each Varga is fundamentally about ───────────────────────────────────
const VARGA_PURPOSE = {
  d1:  { focus:'Self, personality, and overall life trajectory', allowedThemes:['personality','health','vitality','self','lifespan','karma','career','relationships','wealth','overall'] },
  d2:  { focus:'Wealth and accumulated financial resources', allowedThemes:['wealth','money','income','savings','assets','financial','property'] },
  d3:  { focus:'Siblings, courage, and short journeys', allowedThemes:['siblings','courage','communication','effort','short travel','valour','competition'] },
  d4:  { focus:'Home, property, and fixed assets', allowedThemes:['home','property','land','vehicle','comfort','fixed assets','mother','domestic'] },
  d5:  { focus:'Intelligence, power, and past-life merit', allowedThemes:['intelligence','authority','creativity','mantra','children','past-life merit','learning'] },
  d7:  { focus:'Children and progeny', allowedThemes:['children','progeny','fertility','grandchildren','creativity'] },
  d8:  { focus:'Longevity, obstacles, and hidden matters', allowedThemes:['longevity','obstacles','accidents','health crises','hidden','transformation','adversity'] },
  d9:  { focus:'Marriage, dharma, and soul quality', allowedThemes:['spouse','marriage','dharma','soul','partner','fortune','dharmic'] },
  d10: { focus:'Career, reputation, and professional success', allowedThemes:['career','profession','reputation','work','success','public life','authority','income'] },
  d12: { focus:'Parents and their wellbeing', allowedThemes:['parents','father','mother','parental','ancestors','lineage'] },
  d16: { focus:'Vehicles, comforts, and conveyances', allowedThemes:['vehicles','comfort','luxury','conveyance','travel','transport'] },
  d20: { focus:'Spiritual practice and moksha path', allowedThemes:['spirituality','moksha','devotion','practice','liberation','dharma','meditation'] },
  d24: { focus:'Education, learning, and academic success', allowedThemes:['education','learning','academic','study','knowledge','teaching'] },
  d27: { focus:'Strength, vitality, and physical health', allowedThemes:['strength','vitality','health','stamina','physical','constitution'] },
  d30: { focus:'Misfortune, hidden problems, and karmic pressure', allowedThemes:['misfortune','trouble','vulnerability','risk','challenge','hidden problems','karmic pressure','protection','caution','prevention'] },
  d40: { focus:'Maternal inheritance and lineage', allowedThemes:['maternal','mother','lineage','inheritance','karma','ancestral'] },
  d45: { focus:'Paternal inheritance and lineage', allowedThemes:['paternal','father','lineage','inheritance','karma','ancestral'] },
  d60: { focus:'Past life karma and soul history', allowedThemes:['past life','karma','previous life','soul history','accumulated','past-life'] },
};

// ── D30 specific: what each planet means in the misfortune chart ──────────────
const D30_PLANET_RISK_ROLE = {
  Sun: {
    en: 'areas where ego, authority conflicts, or pride may attract misfortune — needs conscious humility',
    hi: 'वे क्षेत्र जहाँ अहंकार, अधिकार-संघर्ष या घमंड दुर्भाग्य को आकर्षित कर सकते हैं — सचेत विनम्रता जरूरी है',
  },
  Moon: {
    en: 'emotional vulnerability patterns, mental stress tendencies, or health imbalances that need monitoring',
    hi: 'भावनात्मक कमजोरियाँ, मानसिक तनाव के पैटर्न, या स्वास्थ्य असंतुलन जिन पर ध्यान जरूरी है',
  },
  Mars: {
    en: 'areas where aggression, impulsive action, or physical risk-taking may attract accidents or conflicts — extra caution needed',
    hi: 'वे क्षेत्र जहाँ आक्रामकता, आवेगी निर्णय या शारीरिक जोखिम दुर्घटना या संघर्ष को आकर्षित कर सकते हैं — अतिरिक्त सावधानी जरूरी',
  },
  Mercury: {
    en: 'nervous system stress or communication patterns that may create anxiety, overthinking, or miscommunication difficulties',
    hi: 'तंत्रिका तनाव या संचार के पैटर्न जो चिंता, अति-सोच, या गलतफहमी की कठिनाई दे सकते हैं',
  },
  Jupiter: {
    en: 'protection and resilience against misfortune — Jupiter in D30 helps reduce the intensity of challenges and supports recovery',
    hi: 'दुर्भाग्य के विरुद्ध सुरक्षा और लचीलापन — D30 में बृहस्पति कठिनाइयों की तीव्रता को कम करता है और सुधार में सहायता करता है',
  },
  Venus: {
    en: 'areas where comfort expectations, luxury habits, or over-indulgence may become a source of trouble or vulnerability',
    hi: 'वे क्षेत्र जहाँ सुविधा की अपेक्षाएँ, विलासिता की आदतें, या अत्यधिक भोग मुसीबत या कमजोरी का स्रोत बन सकती हैं',
  },
  Saturn: {
    en: 'karmic pressure areas, chronic stress patterns, and discipline challenges — patience and discipline reduce the intensity',
    hi: 'कार्मिक दबाव के क्षेत्र, पुराने तनाव के पैटर्न, और अनुशासन की चुनौतियाँ — धैर्य और अनुशासन तीव्रता को कम करते हैं',
  },
  Rahu: {
    en: 'obsessive patterns, unconventional risks, or sudden disruptions that may cause unexpected difficulties — grounding practices help',
    hi: 'जुनूनी पैटर्न, असाधारण जोखिम, या अचानक बाधाएँ जो अप्रत्याशित कठिनाइयाँ पैदा कर सकती हैं — स्थिरता के अभ्यास सहायक हैं',
  },
  Ketu: {
    en: 'past-life karmic pressure points and deep-seated vulnerabilities — spiritual practice and acceptance reduce their intensity',
    hi: 'पूर्व जन्म के कार्मिक दबाव और गहरी कमजोरियाँ — आध्यात्मिक अभ्यास और स्वीकृति उनकी तीव्रता को कम करती है',
  },
};

// Phrases that must not appear in D30 planet readings
const D30_FORBIDDEN = [
  'results arrive with relatively less effort',
  'career and reputation building',
  'career and reputation',
  'visibility and social recognition',
  'supports authority, vitality, self-confidence, father, career',
  'supports beauty, love, luxury, arts',
  'supports wisdom, grace, wealth, children',
  'supports mind, emotions, mother, happiness',
];

function hasForbidden(text) {
  const low = (text || '').toLowerCase();
  return D30_FORBIDDEN.some(f => low.includes(f.toLowerCase()));
}

// Sync-filter positives_hi by the same indices removed from positives_en
function syncFilter(arrEn, arrHi) {
  const keepIdx = arrEn.reduce((acc, txt, i) => { if (!hasForbidden(txt)) acc.push(i); return acc; }, []);
  return {
    en: keepIdx.map(i => arrEn[i]),
    hi: keepIdx.map(i => (arrHi || [])[i]).filter(Boolean),
  };
}

/**
 * Apply purpose filtering to planet readings for a given slug.
 * Currently applies special D30 risk-language transformation;
 * other slugs pass through unchanged (their PLANET_CHART_ROLE handles them).
 */
function applyPurposeFilter(slug, readings) {
  if (!Array.isArray(readings) || !readings.length) return readings;

  if (slug === 'd30') {
    return readings.map(r => {
      const riskRole = D30_PLANET_RISK_ROLE[r.planet];
      if (!riskRole) return r;

      const updated = {
        ...r,
        planet_role_en: riskRole.en,
        planet_role_hi: riskRole.hi,
      };

      // Filter forbidden phrases from positives
      const filtered = syncFilter(r.positives_en || [], r.positives_hi || []);
      updated.positives_en = filtered.en;
      updated.positives_hi = filtered.hi;

      // If all positives were filtered for a non-challenged placement, add a soft purpose-aware one
      if (updated.positives_en.length === 0 && !r.is_challenged) {
        if (r.planet === 'Jupiter') {
          updated.positives_en = [`Jupiter in H${r.house} (${r.house_domain_en}) may offer protection and resilience — its presence here helps reduce the intensity of D30 challenges in this area.`];
          updated.positives_hi = [`H${r.house} (${r.house_domain_hi}) में बृहस्पति सुरक्षा और लचीलापन दे सकता है — इसकी उपस्थिति इस क्षेत्र में D30 की कठिनाइयों की तीव्रता को कम करने में सहायता करती है।`];
        } else {
          updated.positives_en = [`${r.planet} in H${r.house} (${r.house_domain_en}) — this area needs awareness and extra care; the placement may indicate a manageable pattern with mindful effort.`];
          updated.positives_hi = [`${r.planet_hi} भाव ${r.house} (${r.house_domain_hi}) में — इस क्षेत्र में सजागता और अतिरिक्त ध्यान जरूरी है; सचेत प्रयास से यह पैटर्न प्रबंधनीय हो सकता है।`];
        }
      }

      return updated;
    });
  }

  return readings;
}

/**
 * Get a short human-readable focus description for a Varga slug.
 */
function getPurposeFocus(slug) {
  return VARGA_PURPOSE[slug]?.focus || null;
}

module.exports = { VARGA_PURPOSE, D30_PLANET_RISK_ROLE, applyPurposeFilter, getPurposeFocus };
