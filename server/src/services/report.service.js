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

// Premium designed report — see services/pdf/kundli-report.js
const { buildKundliReport } = require('./pdf/kundli-report');

function kundliReportPdf(profile, chart, extras = {}) {
  return buildKundliReport(profile, chart, extras);
}

function matchmakingReportPdf(request, result) {
  // Active doshas
  const activeDoshas = (result.kootas || []).filter((k) => k.has_dosha);

  // Boy/Girl Mangal helpers
  const fmtMangal = (m) => {
    if (!m) return 'N/A';
    if (!m.has_dosha) return 'Not Manglik';
    const cancel = m.cancellations?.length ? ` [${m.cancellations.length} cancellation(s)]` : '';
    return `${m.manglik_type || 'Manglik'} (${m.severity})${cancel} — ${m.summary_en || ''}`;
  };

  const lines = [
    `Boy: ${request.boy_name}`,
    `Girl: ${request.girl_name}`,
    `Status: ${request.status}`,
    '',
    `System: ${result.system}`,
    `Score: ${result.total}/${result.max} (${result.percentage}%)`,
    `Verdict: ${result.verdict_en || result.verdict}`,
    `Mangal Compatibility: ${result.mangal_compatible ? 'Compatible' : 'Mismatch — Review Required'}`,
    '',
    '━━ Ashtakoot Guna Milan ━━',
    ...(result.kootas || []).map((k) => {
      const doshaTag = k.has_dosha ? ` [${k.dosha_name || 'DOSHA'}]` : '';
      return `${k.name} (${k.name_hi || ''}): ${k.score}/${k.max}${doshaTag} | ${k.details}`;
    }),
    '',
    activeDoshas.length
      ? `Active Koot Doshas: ${activeDoshas.map((k) => k.dosha_name || k.name).join(', ')}`
      : 'No major Koot Dosha detected.',
    '',
    '━━ Mangal (Mars) Analysis ━━',
    `Boy  — ${fmtMangal(result.mangal?.boy)}`,
    `Girl — ${fmtMangal(result.mangal?.girl)}`,
    result.mangal_note_en ? `Note: ${result.mangal_note_en}` : '',
    '',
    '━━ Overall Assessment ━━',
    result.summary_en || '',
    '',
    result.note || '',
  ].filter((l) => l !== undefined);

  return buildPdf({ title: 'Jyotish Stack AI Matchmaking Report', lines });
}

module.exports = {
  buildPdf,
  kundliReportPdf,
  matchmakingReportPdf,
};
