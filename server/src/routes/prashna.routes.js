'use strict';

const router = require('express').Router();
const db = require('../config/db');
const { optionalAuthenticate } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');
const { calculateVedicChart } = require('../services/vedic-calc.service');
const { CATEGORY_CONFIG, generatePrashnaReading, gatePrashnaReading } = require('../services/prashna-engine');

const PRASHNA_MEMBER_PLANS = new Set(['premium', 'yearly']);

function isPrashnaMemberPlan(planName) {
  return PRASHNA_MEMBER_PLANS.has(String(planName || '').trim().toLowerCase());
}

async function paidAccessFor(user) {
  if (!user) return { isPaid:false, planName:null };
  if (user.role === 'admin' || user.role === 'superadmin') return { isPaid:true, planName:'Admin' };
  if (isPrashnaMemberPlan(user.plan)) {
    const planName = String(user.plan).trim().toLowerCase() === 'yearly' ? 'Yearly' : 'Premium';
    return { isPaid:true, planName, expiresAt:null };
  }
  try {
    const now = new Date();
    const subscriptions = await db('user_subscriptions as us')
      .join('subscription_plans as sp', 'us.plan_id', 'sp.id')
      .where('us.user_id', user.id)
      .where('us.status', 'active')
      .where('us.amount_paid', '>', 0)
      .where('us.starts_at', '<=', now)
      .where('us.expires_at', '>', now)
      .orderBy('us.expires_at', 'desc')
      .select('sp.name', 'us.expires_at');
    const subscription = subscriptions.find((item) => isPrashnaMemberPlan(item.name));
    return { isPaid:!!subscription, planName:subscription?.name || null, expiresAt:subscription?.expires_at || null };
  } catch (error) {
    console.error('[PrashnaAccess]', error.message);
    return { isPaid:false, planName:null };
  }
}

function parseInput(body) {
  const question = String(body?.question || '').trim().replace(/\s+/g, ' ');
  const category = String(body?.category || 'general').trim().toLowerCase();
  const place = String(body?.place || '').trim().slice(0, 240);
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const timezone = Number(body?.timezone_offset);
  const askedAt = new Date(body?.asked_at || Date.now());

  if (question.length < 8 || question.length > 500) return { error:'Question must be between 8 and 500 characters.' };
  if (!CATEGORY_CONFIG[category]) return { error:'Please select a valid question category.' };
  if (!place || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(timezone)) return { error:'A valid question location is required.' };
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { error:'Location coordinates are outside the valid range.' };
  if (timezone < -12 || timezone > 14) return { error:'Timezone offset is outside the valid range.' };
  if (Number.isNaN(askedAt.getTime())) return { error:'Question time is invalid.' };
  if (askedAt.getTime() > Date.now() + 5 * 60 * 1000 || askedAt.getTime() < Date.now() - 60 * 60 * 1000) {
    return { error:'Prashna must be cast for the current question time.' };
  }

  const local = new Date(askedAt.getTime() + timezone * 3600 * 1000);
  return {
    values:{
      question, category, place, latitude, longitude, timezone, askedAt,
      year:local.getUTCFullYear(), month:local.getUTCMonth() + 1, day:local.getUTCDate(),
      hour:local.getUTCHours(), minute:local.getUTCMinutes(), second:local.getUTCSeconds(),
    },
  };
}

router.post('/calculate', optionalAuthenticate, async (req, res) => {
  const parsed = parseInput(req.body);
  if (parsed.error) return fail(res, parsed.error, 400);
  try {
    const input = parsed.values;
    const chart = calculateVedicChart({
      year:input.year, month:input.month, day:input.day,
      hour:input.hour, minute:input.minute, second:input.second,
      timezone:input.timezone, latitude:input.latitude, longitude:input.longitude,
    });
    const reading = generatePrashnaReading({
      chart,
      question:input.question,
      category:input.category,
      askedAt:input.askedAt.toISOString(),
      place:input.place,
    });
    if (!reading) return fail(res, 'Unable to calculate the Prashna chart.', 500);

    const access = await paidAccessFor(req.user);
    const responseReading = gatePrashnaReading(reading, access.isPaid);
    return ok(res, {
      access:{
        level:access.isPaid ? 'paid' : 'free',
        is_paid:access.isPaid,
        authenticated:!!req.user,
        plan_name:access.planName,
        expires_at:access.expiresAt || null,
        required_plans:['premium', 'yearly'],
      },
      reading:responseReading,
    });
  } catch (error) {
    console.error('[PrashnaCalculate]', error.message);
    return fail(res, 'Unable to calculate the Prashna chart right now.', 500);
  }
});

module.exports = router;
module.exports.parseInput = parseInput;
module.exports.paidAccessFor = paidAccessFor;
module.exports.isPrashnaMemberPlan = isPrashnaMemberPlan;
