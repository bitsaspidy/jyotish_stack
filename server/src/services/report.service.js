'use strict';

function ascii(value) {
  return String(value ?? '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(value) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(line, width = 88) {
  const words = ascii(line).split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function buildPdf({ title, lines }) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 54;
  const topY = 790;
  const lineHeight = 14;
  const linesPerPage = 46;
  const wrapped = lines.flatMap((line) => wrapLine(line));
  const pages = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }
  if (!pages.length) pages.push([]);

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];

  for (const pageLines of pages) {
    const content = [
      'q',
      'BT',
      `/F1 18 Tf`,
      `${marginX} ${topY} Td`,
      `(${escapePdfText(title)}) Tj`,
      `0 -26 Td`,
      `/F1 10 Tf`,
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj\n0 -${lineHeight} Td`),
      'ET',
      'Q',
    ].join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, 'binary'));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body, 'binary');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body, 'binary');
}

function currentDasha(chart) {
  const dasha = chart?.dasha?.find((period) => period.is_current) || chart?.dasha?.[0];
  const antar = dasha?.antardasha?.find((period) => period.is_current) || dasha?.antardasha?.[0];
  return { dasha, antar };
}

function kundliReportPdf(profile, chart) {
  const { dasha, antar } = currentDasha(chart);
  const lines = [
    `Name: ${profile.name}`,
    `Birth: ${String(profile.date_of_birth).slice(0, 10)} ${String(profile.time_of_birth || '').slice(0, 8)} | ${profile.place_of_birth}`,
    `Coordinates: ${profile.latitude}, ${profile.longitude} | Timezone UTC+${profile.timezone_offset}`,
    '',
    `System: ${chart.meta.system} | Ayanamsa: ${chart.meta.ayanamsa_dms} | JD: ${chart.meta.julian_day}`,
    `Ascendant: ${chart.ascendant.rashi_en} ${chart.ascendant.degree_in_sign_dms}`,
    `Moon: ${chart.planets.Moon.rashi_en} ${chart.planets.Moon.degree_in_sign_dms}`,
    `Nakshatra: ${chart.nakshatra.en} Pada ${chart.nakshatra.pada} | Gana ${chart.nakshatra.gana} | Nadi ${chart.nakshatra.nadi}`,
    `Current Dasha: ${dasha?.lord || 'N/A'} Mahadasha, ${antar?.lord || 'N/A'} Antardasha`,
    `Navamsha Ascendant: ${chart.navamsha?.ascendant?.rashi_en || 'N/A'}`,
    `Mangal Dosha: ${chart.mangal_dosha?.severity || 'N/A'} | ${chart.mangal_dosha?.summary_en || ''}`,
    '',
    'Planet Positions:',
    ...Object.entries(chart.planets || {}).map(([name, p]) =>
      `${name}: ${p.rashi_en} ${p.degree_in_sign_dms} | ${p.dignity} | Retrograde: ${p.is_retrograde ? 'Yes' : 'No'}`
    ),
    '',
    'Transit Highlights:',
    `Sade Sati: ${chart.gochar?.highlights?.sade_sati?.active ? chart.gochar.highlights.sade_sati.phase : 'No'}`,
    `Jupiter support: ${chart.gochar?.highlights?.jupiter_support?.favorable ? 'Favorable' : 'Needs patience'}`,
    `Rahu-Ketu axis: ${chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}`,
    '',
    'Predictions:',
    ...(chart.predictions?.summary_en || []),
    '',
    'Note: This report uses the Jyotish Stack rule engine and Meeus-based calculations. Production decisions should be verified with owner-approved Panchang/Swiss Ephemeris references.',
  ];

  return buildPdf({ title: 'Jyotish Stack AI Kundli Report', lines });
}

function matchmakingReportPdf(request, result) {
  const lines = [
    `Boy: ${request.boy_name}`,
    `Girl: ${request.girl_name}`,
    `Status: ${request.status}`,
    '',
    `System: ${result.system}`,
    `Score: ${result.total}/${result.max} (${result.percentage}%)`,
    `Verdict: ${result.verdict}`,
    `Mangal compatible: ${result.mangal_compatible ? 'Yes' : 'Review required'}`,
    '',
    'Ashtakoot:',
    ...(result.kootas || []).map((koota) => `${koota.name}: ${koota.score}/${koota.max} | ${koota.details}`),
    '',
    `Boy Mangal: ${result.mangal?.boy?.severity || 'N/A'} | ${result.mangal?.boy?.summary_en || ''}`,
    `Girl Mangal: ${result.mangal?.girl?.severity || 'N/A'} | ${result.mangal?.girl?.summary_en || ''}`,
    '',
    result.summary_en || '',
    '',
    result.note || '',
  ];

  return buildPdf({ title: 'Jyotish Stack AI Matchmaking Report', lines });
}

module.exports = {
  buildPdf,
  kundliReportPdf,
  matchmakingReportPdf,
};
