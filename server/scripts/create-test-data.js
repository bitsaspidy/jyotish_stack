/**
 * One-time script to create a dummy user + kundli profile for testing.
 * Run: node server/scripts/create-test-data.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../src/config/db');

async function run() {
  console.log('Creating test data...\n');

  // ── 1. Dummy User ─────────────────────────────────────────────────────────
  const userEmail = 'rahul.sharma@test.com';
  const userPass  = 'Test@1234';

  // Clean previous test user if exists
  await db('kundli_profiles').where('user_id',
    db('users').select('id').where('email', userEmail).limit(1)
  ).del().catch(() => {});
  await db('users').where('email', userEmail).del().catch(() => {});

  const hash = await bcrypt.hash(userPass, 12);
  const userUUID = uuidv4();

  const [userId] = await db('users').insert({
    uuid: userUUID,
    name: 'Rahul Sharma',
    email: userEmail,
    phone: '+91-9876543210',
    password_hash: hash,
    role: 'user',
    is_active: true,
    email_verified: true,
    preferred_language: 'hi',
  });

  console.log('✅  Dummy User created');
  console.log('    Name      :', 'Rahul Sharma');
  console.log('    Email     :', userEmail);
  console.log('    Password  :', userPass);
  console.log('    User ID   :', userId);

  // ── 2. Dummy Kundli Profile ───────────────────────────────────────────────
  const kundliUUID = uuidv4();

  await db('kundli_profiles').insert({
    uuid: kundliUUID,
    user_id: userId,
    name: 'Rahul Sharma',
    date_of_birth: '1990-05-15',
    time_of_birth: '10:30:00',
    place_of_birth: 'New Delhi, India',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone_offset: 5.50,
    gender: 'male',
    calculated_data: JSON.stringify({
      note: 'Placeholder — Vedic calculation engine not yet implemented',
      ascendant: 'Cancer (Karka)',
      sun_sign: 'Taurus (Vrishabha)',
      moon_sign: 'Leo (Simha)',
      nakshatra: 'Magha',
      nakshatra_pada: 2,
      lagna_degree: '15°24\' Cancer',
    }),
    is_public: false,
  });

  console.log('\n✅  Dummy Kundli Profile created');
  console.log('    Name      :', 'Rahul Sharma');
  console.log('    DOB       :', '15 May 1990');
  console.log('    TOB       :', '10:30 AM');
  console.log('    Place     :', 'New Delhi, India');
  console.log('    Lat/Lng   :', '28.6139°N / 77.2090°E');
  console.log('    Timezone  :', 'IST (UTC +5:30)');
  console.log('    Kundli ID :', kundliUUID);

  // ── 3. Print Admin Details ────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log('🔐  ADMIN LOGIN DETAILS');
  console.log('    URL       : http://localhost:3000/admin/login');
  console.log('    Email     : admin@jyotishstack.com');
  console.log('    Password  : Admin@2026!');
  console.log('    Role      : superadmin');
  console.log('─────────────────────────────────────────────');
  console.log('👤  DUMMY USER LOGIN DETAILS');
  console.log('    URL       : http://localhost:3000/login');
  console.log('    Email     :', userEmail);
  console.log('    Password  :', userPass);
  console.log('─────────────────────────────────────────────\n');

  await db.destroy();
  console.log('Done ✔');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
