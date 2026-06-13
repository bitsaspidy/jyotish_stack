#!/bin/bash
# deploy.sh — Full deployment script for Jyotish Stack AI
# Usage: bash deploy.sh
# Run from /var/www/jyotish-stack on the production server.

set -e
APP_DIR="/var/www/jyotish-stack"

echo "════════════════════════════════════════════"
echo "  Jyotish Stack AI — Deploy $(date '+%Y-%m-%d %H:%M')"
echo "════════════════════════════════════════════"

# 1. Pull latest code
echo "▶ Pulling latest from git…"
git pull origin main

# 2. Install server dependencies
echo "▶ Installing server dependencies…"
cd "$APP_DIR/server"
npm install --omit=dev

# 3. Run DB migrations
echo "▶ Running database migrations…"
NODE_ENV=production node -e "require('./src/db/knex').migrate.latest().then(() => { console.log('Migrations done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"

# 4. Install UI dependencies
echo "▶ Installing UI dependencies…"
cd "$APP_DIR/ui-main"
npm install

# 5. Build Next.js
echo "▶ Building Next.js…"
NODE_ENV=production npm run build

# 6. Reload PM2 processes (zero-downtime)
echo "▶ Reloading PM2…"
cd "$APP_DIR"
pm2 reload ecosystem.config.js --env production --update-env

# 7. Save PM2 process list (so it survives server reboot)
pm2 save

# 8. Reload Apache
echo "▶ Reloading Apache…"
sudo apache2ctl configtest && sudo systemctl reload apache2

echo ""
echo "✅ Deployment complete."
echo "   Server: http://localhost:5000/api/health"
echo "   UI:     http://localhost:3000"
