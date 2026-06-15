#!/usr/bin/env bash
# Full deployment script for Jyotish Stack AI.
# Run on the production server as the deploy user:
#   APP_DIR=/var/www/jyotish-stack bash deploy.sh
#
# Optional overrides (all have sane defaults):
#   APP_DIR        repo location              (default: /var/www/jyotish-stack)
#   BRANCH         git branch to deploy       (default: main)
#   API_INSTANCES  PM2 cluster size for API   (default: 1, read by ecosystem.config.js)
#   UI_INSTANCES   PM2 cluster size for UI    (default: 1, read by ecosystem.config.js)
#
# NOTE: migrations run from server/ so dotenv loads server/.env. The knexfile
# production block has no fallback defaults — server/.env MUST exist on the box.

set -euo pipefail

# Exported so the Node process behind `pm2 reload ecosystem.config.js` reads them at
# config-eval time (cwd/instances). NOTE: we deliberately do NOT export NODE_ENV=production
# globally — that makes `npm install` skip devDependencies and breaks `next build`
# (Cannot find module 'tailwindcss'). NODE_ENV is set inline only where it's actually needed.
export APP_DIR="${APP_DIR:-/var/www/jyotish-stack}"
export BRANCH="${BRANCH:-main}"
export API_INSTANCES="${API_INSTANCES:-1}"
export UI_INSTANCES="${UI_INSTANCES:-1}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Jyotish Stack AI deploy starting"
log "App dir: ${APP_DIR} | Branch: ${BRANCH} | API x${API_INSTANCES} | UI x${UI_INSTANCES}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "ERROR: ${APP_DIR} is not a git checkout. Clone the repo there first." >&2
  exit 1
fi
if [ ! -f "$APP_DIR/server/.env" ]; then
  echo "ERROR: ${APP_DIR}/server/.env not found. Copy .env.production.example and fill it in." >&2
  exit 1
fi

cd "$APP_DIR"

log "Pulling latest code..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "Installing workspace dependencies (incl. build tools needed by next build)..."
npm install --include=dev

log "Running database migrations (from server/ so server/.env is loaded)..."
( cd "$APP_DIR/server" && NODE_ENV=production npm run migrate )

log "Building public Next.js app (ui-main)..."
NODE_ENV=production npm run build:main

log "Starting or reloading PM2 processes..."
if ! pm2 reload ecosystem.config.js --env production --update-env; then
  pm2 start ecosystem.config.js --env production --update-env
fi
pm2 save

log "Reloading Apache..."
sudo apache2ctl configtest && sudo systemctl reload apache2

log "Smoke-testing API health endpoint..."
ok=0
for i in 1 2 3 4 5 6; do
  if curl -fsS --max-time 5 http://127.0.0.1:5000/health >/dev/null 2>&1; then
    ok=1
    break
  fi
  log "  health check attempt ${i} failed; retrying in 3s..."
  sleep 3
done
if [ "$ok" -ne 1 ]; then
  echo "ERROR: API did not become healthy on http://127.0.0.1:5000/health" >&2
  log "Recent API logs:"
  pm2 logs jyotish-api --lines 30 --nostream || true
  exit 1
fi

log "Deployment complete."
log "API: http://127.0.0.1:5000/health"
log "UI:  http://127.0.0.1:3000"
