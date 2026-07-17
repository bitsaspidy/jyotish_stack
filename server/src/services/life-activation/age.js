'use strict';
/**
 * Timezone-safe age from birth date + birth time + birth timezone offset.
 *
 * Why this is not a one-liner:
 *
 * - `timezone_offset` is a DECIMAL(5,2) column, so mysql2 hands it back as the
 *   STRING "5.50". `"5.50" * 3600e3` happens to work, but `"5.50" + 1` does not —
 *   every use is parsed through `Number()` here so no caller can inherit that bug.
 * - Age must be a CALENDAR difference with borrow logic, never days/365. Dividing
 *   by 365 drifts a full day every four years and reports the wrong age for most
 *   of the birthday month.
 * - `completedYears` is the age fully lived; `runningYear` is the year in
 *   progress, which is always completedYears + 1. They are different numbers and
 *   users notice when they are conflated.
 * - Leap-year birthdays (29 Feb) have no anniversary in a common year. We clamp to
 *   the last valid day of the month → 28 Feb, so a leap-born person ages on 28 Feb
 *   in common years rather than silently rolling into 1 March.
 *
 * All arithmetic happens in the BIRTH timezone: we shift "now" into the birth
 * offset and compare calendar fields via getUTC* on a shifted instant. That keeps
 * the result identical on a server in UTC, IST, or anywhere else — the spec's
 * "avoid client-only calculations that differ between environments".
 */

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

const daysInMonth = (year, month /* 1-12 */) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Parse "YYYY-MM-DD" (knexfile typeCasts DATE to a string) or a Date. */
function parseBirthDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { y: value.getUTCFullYear(), m: value.getUTCMonth() + 1, d: value.getUTCDate() };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

/** Parse "HH:MM:SS" / "HH:MM". Missing time is a caller decision, not a default. */
function parseBirthTime(value) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(value || ''));
  if (!m) return null;
  const hh = +m[1], mm = +m[2], ss = m[3] ? +m[3] : 0;
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return { hh, mm, ss };
}

/** DECIMAL(5,2) arrives as a string; reject anything outside real-world offsets. */
function parseTimezoneOffset(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < -12 || n > 14) return null;
  return n;
}

/**
 * The anniversary of (birthMonth, birthDay) `k` months after the birth month,
 * clamped to a real date. 29 Feb → 28 Feb in a common year; 31 Jan + 1 month →
 * 28/29 Feb. Clamping always measures from the ORIGINAL birth day, so stepping
 * never accumulates drift (31 Jan → 28 Feb → 31 Mar, not → 28 Mar).
 */
function anniversaryUtcMs(baseYear, birthMonth, birthDay, hh, mm, ss, monthsAfter = 0) {
  const total = (birthMonth - 1) + monthsAfter;
  const year = baseYear + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  const day = Math.min(birthDay, daysInMonth(year, month));
  return Date.UTC(year, month - 1, day, hh, mm, ss);
}

/**
 * @param {object} birth  { date_of_birth, time_of_birth, timezone_offset }
 * @param {Date}   [now]  injectable for tests — never read the clock twice
 * @returns {{ok:true, age:object} | {ok:false, reason:string}}
 */
function computeAge(birth, now = new Date()) {
  const date = parseBirthDate(birth?.date_of_birth);
  if (!date) return { ok: false, reason: 'missing_birth_date' };

  const time = parseBirthTime(birth?.time_of_birth);
  if (!time) return { ok: false, reason: 'missing_birth_time' };

  const tz = parseTimezoneOffset(birth?.timezone_offset);
  if (tz === null) return { ok: false, reason: 'invalid_timezone' };

  const offsetMs = tz * HOUR_MS;

  // The real UTC instant of birth, and the same instant expressed in birth-local
  // wall-clock (so getUTC* reads local fields).
  const birthLocalMs = Date.UTC(date.y, date.m - 1, date.d, time.hh, time.mm, time.ss);
  const birthUtcMs = birthLocalMs - offsetMs;

  const nowUtcMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(nowUtcMs)) return { ok: false, reason: 'calculation_failed' };
  if (birthUtcMs > nowUtcMs) return { ok: false, reason: 'future_birth_date' };

  const nowLocalMs = nowUtcMs + offsetMs;
  const anniv = (yearsAfter, monthsAfter = 0) =>
    anniversaryUtcMs(date.y + yearsAfter, date.m, date.d, time.hh, time.mm, time.ss, monthsAfter);

  // ── completedYears: the largest k whose anniversary has actually passed ────
  // Anchoring on real anniversary INSTANTS (not a y/m/d borrow) is what makes the
  // birthday-before-birth-time case and the 29 Feb clamp fall out correctly
  // instead of needing special cases that contradict each other.
  let years = new Date(nowLocalMs).getUTCFullYear() - date.y;
  while (years > 0 && anniv(years) > nowLocalMs) years -= 1;
  years = Math.max(0, years);

  // ── months: full months elapsed since that anniversary (never days/365) ────
  let months = 0;
  for (let k = 11; k >= 1; k -= 1) {
    if (anniv(years, k) <= nowLocalMs) { months = k; break; }
  }

  // ── days: whole days since the month anniversary ──────────────────────────
  const days = Math.max(0, Math.floor((nowLocalMs - anniv(years, months)) / DAY_MS));

  // ── decimalAge: progress through the CURRENT anniversary year ─────────────
  const lastAnnivMs = anniv(years);
  const nextAnnivMs = anniv(years + 1);
  const span = nextAnnivMs - lastAnnivMs;
  const through = nowLocalMs - lastAnnivMs;
  const fraction = span > 0 ? Math.min(1, Math.max(0, through / span)) : 0;

  return {
    ok: true,
    age: {
      completedYears: years,
      months,
      days,
      runningYear: years + 1,
      // FLOOR, not round: toFixed(2) turns 35.997 into "36.00", which reads as a
      // 36-year-old whose completedYears says 35. decimalAge must never cross the
      // completed year it belongs to.
      decimalAge: Math.floor((years + fraction) * 100) / 100,
      birthUtcIso: new Date(birthUtcMs).toISOString(),
      timezoneOffset: tz,
    },
  };
}

module.exports = {
  computeAge,
  // exported for tests
  parseBirthDate,
  parseBirthTime,
  parseTimezoneOffset,
  daysInMonth,
  DAY_MS,
};
