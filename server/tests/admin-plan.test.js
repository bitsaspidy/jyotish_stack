const test = require('node:test');
const assert = require('node:assert/strict');
const {
  activationWindow,
  chooseReusableSubscription,
} = require('../src/services/admin-plan.service');

test('admin activation uses the selected plan duration', () => {
  const now = new Date('2026-07-06T10:00:00.000Z');
  const monthly = activationWindow({ duration_days:30 }, now);
  const yearly = activationWindow({ duration_days:365 }, now);

  assert.equal(monthly.startsAt.toISOString(), now.toISOString());
  assert.equal(monthly.expiresAt.toISOString(), '2026-08-05T10:00:00.000Z');
  assert.equal(yearly.expiresAt.toISOString(), '2027-07-06T10:00:00.000Z');
});

test('admin activation rejects a plan with an invalid duration', () => {
  assert.throws(
    () => activationWindow({ duration_days:0 }, new Date()),
    (error) => error.code === 'INVALID_PLAN_DURATION',
  );
});

test('pending subscription for the selected plan is reused before an active row', () => {
  const subscriptions = [
    { id:1, plan_id:2, status:'active', created_at:'2026-07-06T09:00:00.000Z' },
    { id:2, plan_id:2, status:'pending', created_at:'2026-07-05T09:00:00.000Z' },
    { id:3, plan_id:3, status:'pending', created_at:'2026-07-06T10:00:00.000Z' },
    { id:4, plan_id:2, status:'cancelled', created_at:'2026-07-06T11:00:00.000Z' },
  ];

  assert.equal(chooseReusableSubscription(subscriptions, 2)?.id, 2);
  assert.equal(chooseReusableSubscription(subscriptions, 3)?.id, 3);
  assert.equal(chooseReusableSubscription(subscriptions, 4), null);
});

test('newest pending row is selected when multiple payment attempts exist', () => {
  const subscriptions = [
    { id:5, plan_id:2, status:'pending', created_at:'2026-07-05T09:00:00.000Z' },
    { id:6, plan_id:2, status:'pending', created_at:'2026-07-06T09:00:00.000Z' },
  ];

  assert.equal(chooseReusableSubscription(subscriptions, 2)?.id, 6);
});
