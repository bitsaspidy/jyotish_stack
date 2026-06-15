#!/usr/bin/env bash
# Full deployment script for Jyotish Stack AI.
# Run on the production server as the deploy user:
#   APP_DIR=/var/www/jyotish-stack bash deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/jyotish-stack}"
BRANCH="${BRANCH:-main}"

echo "Jyotish Stack AI deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "App dir: ${APP_DIR}"
echo "Branch:  ${BRANCH}"

cd "$APP_DIR"

echo "Pulling latest code..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Installing workspace dependencies..."
npm install

echo "Running database migrations..."
(cd "$APP_DIR/server" && NODE_ENV=production npm run migrate)

echo "Building public Next.js app..."
NODE_ENV=production npm run build:main

echo "Starting or reloading PM2 processes..."
if ! pm2 reload ecosystem.config.js --env production --update-env; then
  pm2 start ecosystem.config.js --env production --update-env
fi

pm2 save

echo "Reloading Apache..."
sudo apache2ctl configtest && sudo systemctl reload apache2

echo "Deployment complete."
echo "API: http://127.0.0.1:5000/health"
echo "UI:  http://127.0.0.1:3000"
