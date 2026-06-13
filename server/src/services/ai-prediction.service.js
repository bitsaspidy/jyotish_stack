'use strict';
/**
 * AI Prediction Service — personalised Vedic reading via Claude API.
 * When ANTHROPIC_API_KEY is not set, returns a structured stub so the
 * frontend can render a placeholder without crashing.
 */

const buildPrompt = (chart) => {
  const p   = chart.planets || {};
  const asc = chart.ascendant_rashi || 'Unknown';
  const nak = chart.nakshatra?.en   || 'Unknown';

  const planetLines = Object.entries(p)
    .map(([name, d]) =>
      `  • ${name}: ${d.rashi} in House ${d.house}${d.is_retrograde ? ' (Retrograde)' : ''}${d.dignity ? ', ' + d.dignity : ''}`
    )
    .join('\n');

  const currentDasha = Array.isArray(chart.dasha_periods) ? chart.dasha_periods[0] : null;
  const dashaLine = currentDasha
    ? `Current Mahadasha: ${currentDasha.planet} (until ${currentDasha.end_date || 'unknown'})`
    : 'Mahadasha: not available';

  const yogas = (chart.yogas_doshas?.yogas || []).filter(y => y.present).map(y => y.name).slice(0, 5);
  const yogaLine = yogas.length ? `Active Yogas: ${yogas.join(', ')}` : '';

  return `You are an expert Vedic astrologer trained in classical BPHS tradition. Write a deeply personalised, warm, and insightful reading for someone with the following birth chart:

ASCENDANT (LAGNA): ${asc}
MOON NAKSHATRA: ${nak}
${dashaLine}
${yogaLine ? yogaLine + '\n' : ''}
PLANET PLACEMENTS:
${planetLines}

Please write a personalised reading in 4 clear sections:

**1. Your Core Nature (Lagna & Moon)**
Describe the person's fundamental character, emotional landscape, and life approach based on their Ascendant and Moon sign.

**2. Your Current Life Chapter (Mahadasha)**
Explain what this planetary period means for them — themes, opportunities, and challenges they are likely experiencing right now.

**3. Your Strengths & Hidden Gifts**
Identify 2–3 genuine strengths visible in the chart — specific yogas, planetary dignities, or auspicious placements.

**4. Your Path Forward**
One practical, grounding piece of guidance based on the overall chart pattern — something actionable and encouraging.

Keep the tone personal ("you" and "your"), warm, wise, and grounded. Use Vedic terms but always explain them. Avoid generic statements — make it feel like a reading from a knowledgeable astrologer who has studied this specific chart carefully. Total length: approximately 400–500 words.`;
};

const generateAIPrediction = async (chart) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      available: false,
      stub: true,
      reading: null,
      message: 'AI personalised readings are coming soon. Add your ANTHROPIC_API_KEY to enable this feature.',
    };
  }

  try {
    // Dynamic require — package is optional; install with: npm install @anthropic-ai/sdk
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1200,
      messages:   [{ role: 'user', content: buildPrompt(chart) }],
    });

    const reading = msg.content?.[0]?.text || '';
    return { available: true, stub: false, reading };
  } catch (e) {
    console.error('[ai-prediction]', e.message);
    return {
      available: false,
      stub: false,
      reading: null,
      error: 'AI reading failed. Please try again shortly.',
    };
  }
};

module.exports = { generateAIPrediction };
