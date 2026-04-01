#!/bin/bash
# CCR App Version Bump Script
# Bumps version in all 4 locations at once:
#   1. index.html   — ?v=X.Y.Z cache busters
#   2. js/app.js    — const APP_VERSION = 'X.Y.Z'
#   3. sw.js        — const APP_VERSION = 'X.Y.Z'
#   4. sw.js        — const CACHE_NAME = 'ccr-app-vNN'
#
# Usage:
#   ./scripts/bump-version.sh patch    # 2.9.8 → 2.9.9
#   ./scripts/bump-version.sh minor    # 2.9.8 → 2.10.0
#   ./scripts/bump-version.sh major    # 2.9.8 → 3.0.0
#   ./scripts/bump-version.sh 3.1.0    # explicit version

set -euo pipefail
cd "$(dirname "$0")/.."

# Read current version from app.js
CURRENT=$(grep "const APP_VERSION" js/app.js | sed "s/.*'\(.*\)'.*/\1/")
if [ -z "$CURRENT" ]; then
  echo "❌ Could not read current version from js/app.js"
  exit 1
fi

echo "Current version: $CURRENT"

# Parse current version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

# Determine new version
case "${1:-patch}" in
  patch)  NEW="$MAJOR.$MINOR.$((PATCH + 1))" ;;
  minor)  NEW="$MAJOR.$((MINOR + 1)).0" ;;
  major)  NEW="$((MAJOR + 1)).0.0" ;;
  [0-9]*) NEW="$1" ;;
  *)
    echo "Usage: $0 [patch|minor|major|X.Y.Z]"
    exit 1
    ;;
esac

echo "New version:     $NEW"

# Derive cache name number (strip dots: 2.9.9 → 299, 2.10.0 → 2100)
# Use simple incrementing: read current CACHE_NAME number and +1
CURRENT_CACHE=$(grep "const CACHE_NAME" sw.js | sed "s/.*ccr-app-v\([0-9]*\).*/\1/")
NEW_CACHE=$((CURRENT_CACHE + 1))

echo "Cache version:   v$CURRENT_CACHE → v$NEW_CACHE"
echo ""

# 1. index.html — all ?v= references
sed -i '' "s/?v=$CURRENT/?v=$NEW/g" index.html
COUNT_HTML=$(grep -c "?v=$NEW" index.html)
echo "✅ index.html     — $COUNT_HTML cache busters updated"

# 2. js/app.js — APP_VERSION
sed -i '' "s/const APP_VERSION = '$CURRENT'/const APP_VERSION = '$NEW'/" js/app.js
echo "✅ js/app.js      — APP_VERSION → $NEW"

# 3. sw.js — APP_VERSION
sed -i '' "s/const APP_VERSION = '$CURRENT'/const APP_VERSION = '$NEW'/" sw.js
echo "✅ sw.js          — APP_VERSION → $NEW"

# 4. sw.js — CACHE_NAME
sed -i '' "s/const CACHE_NAME = 'ccr-app-v$CURRENT_CACHE'/const CACHE_NAME = 'ccr-app-v$NEW_CACHE'/" sw.js
echo "✅ sw.js          — CACHE_NAME → ccr-app-v$NEW_CACHE"

echo ""
echo "🎉 Version bumped: $CURRENT → $NEW"
echo ""
echo "Next steps:"
echo "  git add -A && git commit -m 'v$NEW' && git push"
