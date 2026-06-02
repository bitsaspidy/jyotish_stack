const db = require('../config/db');

// Cache the setting for 30 seconds to avoid DB hit on every request
let cachedMaintenance = { value: false, ts: 0 };

const maintenanceGuard = async (req, res, next) => {
  // Admin routes bypass maintenance mode
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth')) return next();

  const now = Date.now();
  if (now - cachedMaintenance.ts > 30000) {
    const setting = await db('app_settings').where({ key: 'maintenance_mode' }).first();
    cachedMaintenance = { value: setting?.value === 'true', ts: now };
  }

  if (cachedMaintenance.value) {
    const [titleRow, msgRow, msgHiRow] = await Promise.all([
      db('app_settings').where({ key: 'maintenance_title' }).first(),
      db('app_settings').where({ key: 'maintenance_message' }).first(),
      db('app_settings').where({ key: 'maintenance_message_hi' }).first(),
    ]);
    return res.status(503).json({
      success: false,
      maintenance: true,
      title: titleRow?.value || 'Coming Soon',
      message: msgRow?.value || 'We are working on something amazing.',
      message_hi: msgHiRow?.value || 'हम कुछ असाधारण बना रहे हैं।',
    });
  }
  next();
};

// Invalidate cache (called after admin updates the setting)
maintenanceGuard.invalidate = () => { cachedMaintenance.ts = 0; };

module.exports = maintenanceGuard;
