const Razorpay = require('razorpay');
const crypto = require('crypto');

let instance = null;

const getRazorpay = () => {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const rz = getRazorpay();
  return rz.orders.create({ amount: Math.round(amount * 100), currency, receipt, notes });
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifySignature };
