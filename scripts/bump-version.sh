#!/bin/bash
# CCR App Version Bump Script
# Bumps version in all 4 locations at once:
#   1. index.html   — all ?v=X cache busters (handles ANY version)
#   2. js/app.js    — const APP_VERSION
#   3. sw.js        — const APP_VERSION
#   4. sw.js        — const CACHE_NAME (increments by 1)
#
# Version format: major.minor (no patch — goes 5.0 → 5.1 → ... → 5.9 → 6.0)
#
# Usage:
#   ./scripts/bump-version.sh minor    # 5.2 → 5.3 (or 5.9 → 6.0)
#   ./scripts/bump-version.sh major    # 5.9 → 6.0
#   ./scripts/bump-version.sh 6.0     # explicit version

set -euo pipefail
cd "$(dirname "$0")/.."

# Read current version from app.js (format: X.Y)
CURRENT=$(grep "const APP_VERSION" js/app.js | sed "s/.*'\(.*\)'.*/\1/")
if [ -z "$CURRENT" ]; then
  echo "❌ Could not read current version from js/app.js"
  exit 1
fi

if ! [[ "$CURRENT" =~ ^[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Invalid version format: '$CURRENT' (expected X.Y)"
  exit 1
fi

echo "Current version: $CURRENT"

# Parse current version
IFS='.' read -r MAJOR MINOR <<< "$CURRENT"

# Determine new version
case "${1:-minor}" in
  minor)
    if [ "$MINOR" -ge 9 ]; then
      NEW="$((MAJOR + 1)).0"
    else
      NEW="$MAJOR.$((MINOR + 1))"
    fi
    ;;
  major) NEW="$((MAJOR + 1)).0" ;;
  [0-9]*.[0-9]*) NEW="$1" ;;
  *)
    echo "Usage: $0 [minor|major|X.Y]"
    exit 1
    ;;
esac

echo "New version:     $NEW"

# Read current CACHE_NAME number
CURRENT_CACHE=$(grep "const CACHE_NAME" sw.js | sed "s/.*ccr-app-v\([0-9]*\).*/\1/")
NEW_CACHE=$((CURRENT_CACHE + 1))
echo "Cache version:   v$CURRENT_CACHE → v$NEW_CACHE"
echo ""

# 1. index.html — replace ANY ?v= version with new one
sed -i '' "s/?v=[0-9.]*/?v=$NEW/g" index.html
COUNT_HTML=$(grep -c "?v=$NEW" index.html)
echo "✅ index.html     — $COUNT_HTML cache busters → ?v=$NEW"

# 2. js/app.js — APP_VERSION
sed -i '' "s/const APP_VERSION = '$CURRENT'/const APP_VERSION = '$NEW'/" js/app.js
echo "✅ js/app.js      — APP_VERSION → $NEW"

# 3. sw.js — APP_VERSION
sed -i '' "s/const APP_VERSION = '[^']*'/const APP_VERSION = '$NEW'/" sw.js
echo "✅ sw.js          — APP_VERSION → $NEW"

# 4. sw.js — CACHE_NAME
sed -i '' "s/const CACHE_NAME = 'ccr-app-v[0-9]*'/const CACHE_NAME = 'ccr-app-v$NEW_CACHE'/" sw.js
echo "✅ sw.js          — CACHE_NAME → ccr-app-v$NEW_CACHE"

echo ""
echo "🎉 Version bumped: $CURRENT → $NEW"
echo ""
echo "Next steps:"
echo "  git add -A && git commit -m 'v$NEW' && git push"
