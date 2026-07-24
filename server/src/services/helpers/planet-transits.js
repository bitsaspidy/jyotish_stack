'use strict';
/**
 * Planet transit calendar — the dates a planet enters each Rashi (sign) and each
 * Nakshatra across a year, in the style of a Drik-Panchang transit page.
 *
 * Every ingress is a real boundary crossing of the planet's SIDEREAL longitude
 * (Lahiri), located by a coarse scan and refined by bisection to the minute — the
 * same idea as dated-transit.js's signWindow, generalised to enumerate every
 * crossing in a range rather than just the one around a date.
 *
 * Retrograde planets cross a boundary more than once; each crossing is its own
 * event, so a planet that enters, backs out and re-enters a sign shows all three.
 */
const eph = require('./../ephemeris.service');
const { siderealLongitudeForPlanet } = require('./core-helpers');
const { RASHIS, NAKSHATRAS, NAK_SPAN } = require('./vedic-data');

const MIN_MS = 60 * 1000;
const DAY_MS = 86400000;

// Slower planets can be scanned coarsely; the Moon needs a fine step so a whole
// nakshatra (~1 day for the Moon) is never stepped over. Values are the scan
// granularity in days — small enough that the planet moves under half a segment.
const STEP_DAYS = {
  Moon: 0.05, Sun: 0.25, Mercury: 0.2, Venus: 0.2, Mars: 0.25,
  Jupiter: 0.5, Saturn: 0.5, Rahu: 0.5, Ketu: 0.5,
};

function jdFor(date) {
  return eph.julianDay(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(),
  );
}
const lonAt  = (planet, date) => ((siderealLongitudeForPlanet(planet, jdFor(date)) % 360) + 360) % 360;
const signAt = (planet, date) => Math.floor(lonAt(planet, date) / 30);          // 0..11
const nakAt  = (planet, date) => Math.floor(lonAt(planet, date) / NAK_SPAN);    // 0..26

// Bisect between a time in the old segment and a time in the new one, down to a
// minute; return the first instant of the new segment (the ingress moment).
function refine(planet, keyFn, before, after) {
  let lo = before.getTime(), hi = after.getTime();
  const k0 = keyFn(planet, new Date(lo));
  while (hi - lo > MIN_MS) {
    const mid = (lo + hi) / 2;
    if (keyFn(planet, new Date(mid)) === k0) lo = mid;
    else hi = mid;
  }
  return new Date(Math.round(hi / MIN_MS) * MIN_MS); // snap to the minute
}

// Every ingress whose moment falls in (startUTC, endUTC].
function enumerate(planet, keyFn, startUTC, endUTC) {
  const step = (STEP_DAYS[planet] || 0.5) * DAY_MS;
  const events = [];
  let prevKey = keyFn(planet, new Date(startUTC));
  for (let t = startUTC + step; t <= endUTC; t += step) {
    const d = new Date(t);
    const key = keyFn(planet, d);
    if (key !== prevKey) {
      events.push({ key, at: refine(planet, keyFn, new Date(t - step), d) });
      prevKey = key;
    }
  }
  return events;
}

// Local-year bounds [Jan 1 00:00, next Jan 1 00:00) at the given tz, as UTC ms.
function yearBoundsUTC(year, tz) {
  const off = tz * 3600000;
  return [Date.UTC(year, 0, 1) - off, Date.UTC(year + 1, 0, 1) - off];
}

/** Rashi (sign) ingresses of `planet` during `year` (local `tz`). */
function signIngresses(planet, year, tz = 5.5) {
  const [s, e] = yearBoundsUTC(year, tz);
  return enumerate(planet, signAt, s, e).map((ev) => {
    const r = RASHIS[ev.key];
    return { sign_num: r.num, sign_en: r.en, sign_hi: r.hi, symbol: r.symbol, at: ev.at.toISOString() };
  });
}

/** Nakshatra ingresses of `planet` during `year` (local `tz`). */
function nakshatraIngresses(planet, year, tz = 5.5) {
  const [s, e] = yearBoundsUTC(year, tz);
  return enumerate(planet, nakAt, s, e).map((ev) => {
    const n = NAKSHATRAS[ev.key];
    return { nak_num: ev.key + 1, nak_en: n.en, nak_hi: n.hi, lord: n.lord, at: ev.at.toISOString() };
  });
}

/** Which sign the planet occupies right now (for the "currently transiting" badge). */
function currentSign(planet, at = new Date()) {
  const r = RASHIS[signAt(planet, at)];
  return { sign_num: r.num, sign_en: r.en, sign_hi: r.hi, symbol: r.symbol };
}

module.exports = { signIngresses, nakshatraIngresses, currentSign };
