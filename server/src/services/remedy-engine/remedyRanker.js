'use strict';
/**
 * Ranks planets by remedy need.
 * Priority logic (PDF Remedy Class 1):
 *   1. Lagna lord affliction
 *   2. Current Mahadasha/Antardasha planet
 *   3. Atmakaraka planet
 *   4. Severe dosha-related planet
 *   5. Weak/combust/debilitated planet
 *   6. Life area-specific issue
 */
const { PLANET_ORDER } = require('./planetRemedyMap');

const PRIORITY_RANK = { critical:1, high:2, medium:3, low:4, healthy:5 };

function rankPlanets(scored, lagnaLord, atmakarak, mdLord, adLord) {
  const list = PLANET_ORDER
    .map(name => scored[name])
    .filter(Boolean);

  list.sort((a, b) => {
    // Primary: score descending
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreak 1: Lagna lord first
    const aLL = a.name === lagnaLord ? 0 : 1;
    const bLL = b.name === lagnaLord ? 0 : 1;
    if (aLL !== bLL) return aLL - bLL;
    // Tiebreak 2: Current dasha lords
    const aDL = (a.name === mdLord || a.name === adLord) ? 0 : 1;
    const bDL = (b.name === mdLord || b.name === adLord) ? 0 : 1;
    if (aDL !== bDL) return aDL - bDL;
    // Tiebreak 3: Atmakaraka
    const aAK = a.name === atmakarak ? 0 : 1;
    const bAK = b.name === atmakarak ? 0 : 1;
    return aAK - bAK;
  });

  return list;
}

/**
 * Split sorted list into buckets.
 */
function bucketize(sorted) {
  return {
    critical: sorted.filter(p => p.priority === 'critical'),
    high:     sorted.filter(p => p.priority === 'high'),
    medium:   sorted.filter(p => p.priority === 'medium'),
    low:      sorted.filter(p => p.priority === 'low'),
    healthy:  sorted.filter(p => p.priority === 'healthy'),
  };
}

/**
 * Pick focus planets (top 3 non-healthy planets for Priority 1/2/3 slots).
 */
function pickFocusPlanets(sorted) {
  return sorted.filter(p => p.priority !== 'healthy').slice(0, 3);
}

module.exports = { rankPlanets, bucketize, pickFocusPlanets };
