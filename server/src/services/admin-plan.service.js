'use strict';

const { v4: uuidv4 } = require('uuid');

const OPEN_STATUSES = ['pending', 'active'];

function serviceError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function activationWindow(plan, now = new Date()) {
  const durationDays = Number(plan?.duration_days);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    throw serviceError('INVALID_PLAN_DURATION', 'The selected subscription plan has an invalid duration.');
  }
  const startsAt = new Date(now);
  const expiresAt = new Date(startsAt.getTime() + durationDays * 86400000);
  return { startsAt, expiresAt };
}

function chooseReusableSubscription(subscriptions, planId) {
  const matching = (subscriptions || [])
    .filter((item) => Number(item.plan_id) === Number(planId) && OPEN_STATUSES.includes(item.status))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return matching.find((item) => item.status === 'pending')
    || matching.find((item) => item.status === 'active')
    || null;
}

async function syncAdminSelectedPlan(database, {
  userId,
  planKey,
  now = new Date(),
  idFactory = uuidv4,
}) {
  const normalizedPlan = String(planKey || '').trim().toLowerCase();

  return database.transaction(async (trx) => {
    const user = await trx('users').where({ id:userId }).forUpdate().first();
    if (!user) throw serviceError('USER_NOT_FOUND', 'User not found');

    if (normalizedPlan === 'free') {
      await trx('user_subscriptions')
        .where({ user_id:user.id })
        .whereIn('status', OPEN_STATUSES)
        .update({ status:'cancelled', expires_at:now, updated_at:now });
      await trx('users').where({ id:user.id }).update({ plan:'free', updated_at:now });
      return { plan:'free', subscription:null };
    }

    const plan = await trx('subscription_plans')
      .whereRaw('LOWER(name) = ?', [normalizedPlan])
      .where({ is_active:true })
      .first();
    if (!plan) throw serviceError('PLAN_NOT_FOUND', 'Selected subscription plan is not available');

    const openSubscriptions = await trx('user_subscriptions')
      .where({ user_id:user.id })
      .whereIn('status', OPEN_STATUSES)
      .select();
    const reusable = chooseReusableSubscription(openSubscriptions, plan.id);
    const { startsAt, expiresAt } = activationWindow(plan, now);

    let superseded = trx('user_subscriptions')
      .where({ user_id:user.id })
      .whereIn('status', OPEN_STATUSES);
    if (reusable) superseded = superseded.whereNot({ id:reusable.id });
    await superseded.update({ status:'cancelled', expires_at:now, updated_at:now });

    const activation = {
      status:'active',
      starts_at:startsAt,
      expires_at:expiresAt,
      updated_at:now,
    };

    let subscriptionId;
    let subscriptionUuid;
    if (reusable) {
      subscriptionId = reusable.id;
      subscriptionUuid = reusable.uuid;
      await trx('user_subscriptions').where({ id:reusable.id }).update(activation);
    } else {
      subscriptionUuid = idFactory();
      [subscriptionId] = await trx('user_subscriptions').insert({
        uuid:subscriptionUuid,
        user_id:user.id,
        plan_id:plan.id,
        amount_paid:0,
        ...activation,
      });
    }

    await trx('users').where({ id:user.id }).update({ plan:normalizedPlan, updated_at:now });

    return {
      plan:normalizedPlan,
      subscription:{
        id:subscriptionId,
        uuid:subscriptionUuid,
        plan_id:plan.id,
        plan_name:plan.name,
        status:'active',
        starts_at:startsAt,
        expires_at:expiresAt,
        amount_paid:reusable?.amount_paid ?? 0,
      },
    };
  });
}

module.exports = {
  OPEN_STATUSES,
  activationWindow,
  chooseReusableSubscription,
  syncAdminSelectedPlan,
};
