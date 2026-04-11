#!/bin/bash
# Bump CCR app version — run before git commit
cd /Users/willy/Projects/ccr-app

# Read current version from app.js (extract string between single quotes after APP_VERSION =)
CURRENT=$(grep "^const APP_VERSION" js/app.js | sed "s/^.*= '//;s/'.*//" )
echo "Current version: $CURRENT"

if [[ ! "$CURRENT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Could not parse version: '$CURRENT'"
  exit 1
fi

# Parse semver and bump patch
MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)
PATCH=$((PATCH + 1))
NEW="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW"

# Derive cache version number (remove dots)
CACHE_NUM=$(echo "$NEW" | tr -d '.')

# Update APP_VERSION in js/app.js and sw.js
sed -i '' "s/APP_VERSION = '[^']*'/APP_VERSION = '$NEW'/" js/app.js
sed -i '' "s/APP_VERSION = '[^']*'/APP_VERSION = '$NEW'/" sw.js

# Update CACHE_NAME in sw.js
sed -i '' "s/ccr-app-v[^']*/ccr-app-v$CACHE_NUM/" sw.js

# Update version badge in index.html
sed -i '' "s/>v[0-9][0-9.]*</>v$NEW</" index.html

echo "✅ Bumped to $NEW"
