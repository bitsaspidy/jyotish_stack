'use strict';
const { nakshatraFromDeg, NAK_SPAN, formatDate, addYears } = require('./core-helpers');

const DASHA_SEQ = [
  { lord:'Ketu',    years:7  },
  { lord:'Venus',   years:20 },
  { lord:'Sun',     years:6  },
  { lord:'Moon',    years:10 },
  { lord:'Mars',    years:7  },
  { lord:'Rahu',    years:18 },
  { lord:'Jupiter', years:16 },
  { lord:'Saturn',  years:19 },
  { lord:'Mercury', years:17 },
];
const LORD_IDX = { Ketu:0, Venus:1, Sun:2, Moon:3, Mars:4, Rahu:5, Jupiter:6, Saturn:7, Mercury:8 };

function buildAntardasha(mahadasha, currentDate = new Date()) {
  const startDate = new Date(mahadasha.start);
  const endDate   = new Date(mahadasha.end);
  const totalMs   = endDate.getTime() - startDate.getTime();
  const idx0      = LORD_IDX[mahadasha.lord];
  const periods   = [];
  let cursor      = startDate;

  for (let i = 0; i < 9; i++) {
    const d = DASHA_SEQ[(idx0 + i) % 9];
    const durationMs = totalMs * (d.years / 120);
    const end = i === 8 ? endDate : new Date(cursor.getTime() + durationMs);
    periods.push({ lord: d.lord, start: formatDate(cursor), end: formatDate(end), is_current: currentDate >= cursor && currentDate < end });
    cursor = end;
  }
  return periods;
}

function vimshottariDasha(siderealMoonDeg, birthDate, currentDate = new Date()) {
  const nak      = nakshatraFromDeg(siderealMoonDeg);
  const idx0     = LORD_IDX[nak.lord];
  const fracDone = nak.degree_in_nakshatra / NAK_SPAN;
  const curDasha = DASHA_SEQ[idx0];
  const balanceYrs = (1 - fracDone) * curDasha.years;

  const periods = [];
  let cursor = new Date(birthDate);

  const end0 = addYears(cursor, balanceYrs);
  periods.push({ lord: curDasha.lord, full_years: curDasha.years, balance: +balanceYrs.toFixed(2), start: formatDate(cursor), end: formatDate(end0), is_current: currentDate >= cursor && currentDate < end0, is_birth_balance: true });
  cursor = end0;

  for (let i = 1; i <= 8; i++) {
    const d = DASHA_SEQ[(idx0 + i) % 9];
    const end = addYears(cursor, d.years);
    periods.push({ lord: d.lord, full_years: d.years, balance: d.years, start: formatDate(cursor), end: formatDate(end), is_current: currentDate >= cursor && currentDate < end, is_birth_balance: false });
    cursor = end;
  }

  return periods.map((period) => ({ ...period, antardasha: buildAntardasha(period, currentDate) }));
}

// Legacy version (used in tests / older paths)
function legacyVimshottariDasha(siderealMoonDeg, birthDate) {
  const nak  = nakshatraFromDeg(siderealMoonDeg);
  const idx0 = LORD_IDX[nak.lord];
  const fracDone = nak.degree_in_nakshatra / NAK_SPAN;
  const curDasha = DASHA_SEQ[idx0];
  const balanceYrs = (1 - fracDone) * curDasha.years;

  const periods = [];
  let cursor = new Date(birthDate);
  const end0 = addYears(cursor, balanceYrs);
  periods.push({ lord: curDasha.lord, full_years: curDasha.years, balance: +balanceYrs.toFixed(2), start: cursor.toISOString().slice(0,10), end: end0.toISOString().slice(0,10), is_current: true });
  cursor = end0;
  for (let i = 1; i <= 8; i++) {
    const d = DASHA_SEQ[(idx0 + i) % 9];
    const end = addYears(cursor, d.years);
    periods.push({ lord: d.lord, full_years: d.years, balance: d.years, start: cursor.toISOString().slice(0,10), end: end.toISOString().slice(0,10), is_current: false });
    cursor = end;
  }
  return periods;
}

function dashaSequenceFrom(lord) {
  const start = LORD_IDX[lord] || 0;
  return Array.from({ length: 9 }, (_, i) => DASHA_SEQ[(start + i) % 9]);
}

function proportionalLord(offsetDeg, spanDeg, startLord) {
  const sequence = dashaSequenceFrom(startLord);
  let cursor = 0;
  for (const item of sequence) {
    const size = spanDeg * (item.years / 120);
    if (offsetDeg <= cursor + size + 1e-9) return { lord: item.lord, start: cursor, end: cursor + size, size, offset: Math.max(0, offsetDeg - cursor) };
    cursor += size;
  }
  const last = sequence[sequence.length - 1];
  return { lord: last.lord, start: spanDeg, end: spanDeg, size: 0, offset: 0 };
}

function kpSubLordsFromLongitude(siderealDeg) {
  const nak = nakshatraFromDeg(siderealDeg);
  const sub = proportionalLord(nak.degree_in_nakshatra, NAK_SPAN, nak.lord);
  const subSub = proportionalLord(sub.offset, sub.size || NAK_SPAN, sub.lord);
  return { nakshatra: nak, sub_lord: sub.lord, sub_sub_lord: subSub.lord };
}

module.exports = { DASHA_SEQ, LORD_IDX, buildAntardasha, vimshottariDasha, legacyVimshottariDasha, dashaSequenceFrom, proportionalLord, kpSubLordsFromLongitude };
