#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true

if [ -f /tmp/arwa-bot.pid ] && kill -0 "$(cat /tmp/arwa-bot.pid)" 2>/dev/null; then
  :
else
  TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8815380813:AAEXeMVA_M5BrmUPajoHoyK4YLBhLwhYMCY}" \
  TELEGRAM_OWNER_ID="${TELEGRAM_OWNER_ID:-8471762251}" \
    npx tsx bot/index.ts >>/tmp/arwa-bot.log 2>&1 &
  echo $! >/tmp/arwa-bot.pid
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
