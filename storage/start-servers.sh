#!/bin/bash
# Daemonize the IJA API + WEB so they survive the launching shell.
PROJ=/home/gal/Desktop/dashboard/ija-wpms-modern
mkdir -p /tmp/ija
cd "$PROJ/apps/api" || exit 1
setsid nohup node dist/main.js > /tmp/ija/api.log 2>&1 < /dev/null &
echo "api pid $!"
cd "$PROJ/apps/web" || exit 1
PORT=3001 setsid nohup pnpm dev > /tmp/ija/web.log 2>&1 < /dev/null &
echo "web pid $!"
