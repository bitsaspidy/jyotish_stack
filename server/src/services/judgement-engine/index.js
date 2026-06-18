'use strict';
/**
 * Kundli Judgement Priority Engine — Main Orchestrator
 *
 * Priority Order:
 *  1. Lagna + Lagna Lord Strength
 *  2. Sun + Moon Pillar Strength
 *  3. House Lord Strength (2,4,5,7,10,11)
 *  4. Yoga Detection + Conditional Activation
 *  5. Gains (11th house deep evaluation)
 *  6. Marriage & Relationship Judgement
 *  7. Children & Education (5th house)
 *  8. Rahu Special Placement
 *  9. Navamsha / D9 Maturity Activation
 * 10. Ashtakavarga Guard
 * 11. Final Human-Friendly Output via humanComposer
 */

const { evaluateLagna }            = require('./lagnaJudgement');
const { evaluatePillars }          = require('./pillarJudgement');
const { evaluateYogas }            = require('./yogaActivation');
const { evaluateHouseLords }       = require('./houseLordJudgement');
const { evaluateGains }            = require('./gainsJudgement');
const { evaluateMarriage }         = require('./marriageJudgement');
const { evaluateChildren }         = require('./childrenJudgement');
const { evaluateRahu }             = require('./rahuJudgement');
const { evaluateNavamsha }         = require('./navamshaJudgement');
const { evaluateAshtakavargaGuard } = require('./ashtakavargaGuard');
const { composeFullReport }        = require('./humanComposer');
const { sanitizeForUser }          = require('./conflictResolver');

/**
 * Run the full judgement priority engine on a chart.
 *
 * @param {object} chart   - calculated chart from calculateVedicChart
 * @param {object} profile - DB profile row (has date_of_birth, gender, etc.)
 * @param {object} opts    - { lang: 'en'|'hi'|'hinglish', admin: bool }
 * @returns {object}       - structured judgement output
 */
function generateJudgement(chart, profile = {}, opts = {}) {
  const lang    = _normLang(opts.lang || 'hi');
  const isAdmin = Boolean(opts.admin);

  if (!chart?.ascendant?.rashi_num) {
    return _emptyResult(lang, isAdmin);
  }

  try {
    // ── LAYER 1: Lagna ──────────────────────────────────────────────────────
    const lagnaResult = evaluateLagna(chart, profile);

    // ── LAYER 2: Sun + Moon Pillars ─────────────────────────────────────────
    const pillarResult = evaluatePillars(chart);

    // ── LAYER 3: House Lord Strength ────────────────────────────────────────
    const houseLordResults = evaluateHouseLords(chart, lagnaResult);

    // ── LAYERS 4+5: Yoga Conditional Activation ─────────────────────────────
    const yogaResults = evaluateYogas(chart, lagnaResult, pillarResult);

    // ── LAYER 5: 11th House Gains ────────────────────────────────────────────
    const gainsResult = evaluateGains(chart, lagnaResult);

    // ── LAYER 6: Marriage ─────────────────────────────────────────────────────
    const marriageResult = evaluateMarriage(chart, lagnaResult, pillarResult, profile);

    // ── LAYER 7: Children / 5th House ────────────────────────────────────────
    const childrenResult = evaluateChildren(chart, profile);

    // ── LAYER 8: Rahu Special Rules ───────────────────────────────────────────
    const rahuResult = evaluateRahu(chart, profile);

    // ── LAYER 9: Navamsha ─────────────────────────────────────────────────────
    const navamshaResult = evaluateNavamsha(chart, lagnaResult, profile);

    // ── LAYER 10: Ashtakavarga Guard ──────────────────────────────────────────
    const avGuardResult = evaluateAshtakavargaGuard(chart);

    // ── LAYER 11: Human-Friendly Composition ─────────────────────────────────
    const report = composeFullReport({
      lagnaResult, pillarResult, yogaResults, houseLordResults,
      gainsResult, marriageResult, navamshaResult, childrenResult,
      rahuResult, avGuardResult, lang, isAdmin,
    });

    // Add raw sub-results for admin
    if (isAdmin) {
      report.rawLagna     = lagnaResult;
      report.rawPillars   = pillarResult;
      report.rawHouseLords = houseLordResults;
      report.rawYogas     = yogaResults;
      report.rawGains     = gainsResult;
      report.rawMarriage  = marriageResult;
      report.rawChildren  = childrenResult;
      report.rawRahu      = rahuResult;
      report.rawNavamsha  = navamshaResult;
      report.avGuard      = avGuardResult;
    }

    // Sanitize user output (strip forbidden phrases)
    return isAdmin ? report : sanitizeForUser(report);

  } catch (err) {
    console.error('[JudgementEngine] Error:', err.message, err.stack);
    return _emptyResult(lang, isAdmin);
  }
}

// Convenience: just run yoga activation without full report
function getActivatedYogas(chart, opts = {}) {
  const lagnaResult  = evaluateLagna(chart);
  const pillarResult = evaluatePillars(chart);
  return evaluateYogas(chart, lagnaResult, pillarResult);
}

// Convenience: just get lagna strength
function getLagnaStrength(chart, profile = {}) {
  return evaluateLagna(chart, profile);
}

function _normLang(lang) {
  const l = String(lang || '').toLowerCase();
  return ['en', 'hi', 'hinglish'].includes(l) ? l : 'hi';
}

function _emptyResult(lang, isAdmin) {
  return {
    overallScore:  50,
    overallStatus: 'balanced',
    overallLabel:  { en: 'Chart data not available', hi: 'कुंडली डेटा उपलब्ध नहीं' },
    areas:         [],
    lagnaStrength: null,
    pillarStrength: null,
    yogaReducers:  [],
    rahuPlacement: null,
    ashtakavargaGuard: null,
  };
}

module.exports = {
  generateJudgement,
  getActivatedYogas,
  getLagnaStrength,
};
