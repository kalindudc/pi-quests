#!/usr/bin/env bash
# Tail debug log in real time
# Run in a second terminal alongside 'npm run dev'

set -euo pipefail

mkdir -p tmp/
rm -rf /tmp/logs/pi-quests
mkdir -p /tmp/logs/pi-quests && touch /tmp/logs/pi-quests/debug.log
rm -rf tmp/logs
ln -s /tmp/logs/pi-quests tmp/logs

echo "Tailing ./tmp/logs/debug.log  (Ctrl+C to stop)"
tail -f -n 100 ./tmp/logs/debug.log
