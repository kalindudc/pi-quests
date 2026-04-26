#!/usr/bin/env bash
# Clean up all logs and tmp test files

set -euo pipefail

echo "==> Cleaning up logs..."
rm -rf /tmp/logs/pi-quests/*.log
rm -rf "$HOME/.pi/agent/sessions/"*tmp-pi-quests-test*
touch /tmp/logs/pi-quests/debug.log

echo "==> Cleaning up pi caches..."
rm -rf .pi/git
rm -rf .pi/npm

echo "==> Running pi update..."
pi update

echo ""
echo "Cleanup complete."
