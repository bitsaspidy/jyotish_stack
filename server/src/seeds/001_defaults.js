const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  // App settings
  await knex('app_settings').del();
  await knex('app_settings').insert([
    { key: 'maintenance_mode', value: 'false', description: 'Enable/disable maintenance/coming-soon page' },
    { key: 'maintenance_title', value: 'Coming Soon', description: 'Title shown on maintenance page' },
    { key: 'maintenance_message', value: 'We are crafting something extraordinary. Jyotish Stack AI is launching soon.', description: 'Message shown on maintenance page' },
    { key: 'maintenance_message_hi', value: 'हम कुछ असाधारण बना रहे हैं। ज्योतिष स्टैक AI जल्द ही लॉन्च होगा।', description: 'Hindi maintenance message' },
    { key: 'site_name', value: 'Jyotish Stack AI', description: 'Site display name' },
    { key: 'site_tagline', value: 'Ancient Wisdom. Modern Intelligence.', description: 'Site tagline' },
    { key: 'site_tagline_hi', value: 'प्राचीन ज्ञान। आधुनिक बुद्धि।', description: 'Hindi tagline' },
    { key: 'contact_email', value: 'contact@jyotishstack.com', description: 'Public contact email' },
    { key: 'razorpay_enabled', value: 'false', description: 'Enable Razorpay payments' },
  ]);

  // Default accounts — upsert so re-running seeds never wipes real user accounts
  const adminEmail = 'admin@jyotishstack.com';
  const clientEmail = 'client@jyotishstack.com';

  const adminHash  = await bcrypt.hash('Admin@2026!', 12);
  const clientHash = await bcrypt.hash('Client@2026!', 12);

  // Superadmin
  const existingAdmin = await knex('users').where({ email: adminEmail }).first();
  if (!existingAdmin) {
    await knex('users').insert({
      uuid: uuidv4(), name: 'Super Admin', email: adminEmail,
      password_hash: adminHash, role: 'superadmin', is_active: true, email_verified: true,
    });
  }

  // Default test client (role: user)
  const existingClient = await knex('users').where({ email: clientEmail }).first();
  if (!existingClient) {
    await knex('users').insert({
      uuid: uuidv4(), name: 'Test Client', email: clientEmail,
      password_hash: clientHash, role: 'user', is_active: true, email_verified: true,
    });
  }

  // Subscription plans
  await knex('subscription_plans').del();
  await knex('subscription_plans').insert([
    {
      name: 'Basic',
      name_hi: 'आधारभूत',
      description: 'Basic kundli and daily predictions',
      price: 0,
      currency: 'INR',
      duration_days: 30,
      features: JSON.stringify(['1 Kundli profile', 'Daily prediction', 'Basic matchmaking']),
      is_active: true,
    },
    {
      name: 'Premium',
      name_hi: 'प्रीमियम',
      description: 'Full kundli, dasha analysis, and advanced predictions',
      price: 499,
      currency: 'INR',
      duration_days: 30,
      features: JSON.stringify(['5 Kundli profiles', 'Daily/Weekly/Monthly predictions', 'Advanced matchmaking', 'Dasha analysis', 'Transit report']),
      is_active: true,
    },
    {
      name: 'Yearly',
      name_hi: 'वार्षिक',
      description: 'Best value — full access for a year',
      price: 3999,
      currency: 'INR',
      duration_days: 365,
      features: JSON.stringify(['Unlimited Kundli profiles', 'All prediction types', 'Priority support', 'Muhurta calculator', 'Remedies & gemstone advice']),
      is_active: true,
    },
  ]);
};
