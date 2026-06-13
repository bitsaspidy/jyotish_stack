const Razorpay = require('razorpay');
const crypto   = require('crypto');
const db       = require('../config/db');

let instance = null;

const getKeys = async () => {
  const rows = await db('app_settings')
    .whereIn('key', ['razorpay_key_id', 'razorpay_key_secret'])
    .select('key', 'value');
  const m = {};
  rows.forEach((r) => { m[r.key] = r.value; });
  return {
    key_id:     m.razorpay_key_id     || process.env.RAZORPAY_KEY_ID     || '',
    key_secret: m.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '',
  };
};

const getRazorpay = async () => {
  if (!instance) {
    const { key_id, key_secret } = await getKeys();
    instance = new Razorpay({ key_id, key_secret });
  }
  return instance;
};

const resetInstance = () => { instance = null; };

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const rz = await getRazorpay();
  return rz.orders.create({ amount: Math.round(amount * 100), currency, receipt, notes });
};

const verifySignature = async ({ orderId, paymentId, signature }) => {
  const { key_secret } = await getKeys();
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', key_secret)
    .update(body)
    .digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifySignature, resetInstance, getKeys };
