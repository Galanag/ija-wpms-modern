#!/bin/bash
# Restart the API cleanly (kill by port, not by pattern that can match this shell).
PROJ=/home/gal/Desktop/dashboard/ija-wpms-modern
mkdir -p /tmp/ija

# Free the API port if something is holding it.
PID=$(ss -tlnp 2>/dev/null | grep ':4000' | grep -oP 'pid=\K[0-9]+' | head -1)
if [ -n "$PID" ]; then kill "$PID" 2>/dev/null; sleep 1; fi

cd "$PROJ/apps/api" || exit 1
setsid nohup node dist/main.js > /tmp/ija/api.log 2>&1 < /dev/null &
echo "api pid $!"
