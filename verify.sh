#!/bin/bash

echo "========================================="
echo "CCR Church App - Build Verification"
echo "========================================="
echo ""

# Check for required files
echo "Checking required files..."
files=(
  "index.html"
  "manifest.json"
  "sw.js"
  "icon-192.svg"
  "icon-512.svg"
  "css/app.css"
  "js/app.js"
  "js/auth.js"
  "js/prayer.js"
  "js/schedule.js"
  "js/bulletin.js"
  "js/bible.js"
  "js/library.js"
  "js/giving.js"
  "js/vote.js"
  "js/sermons.js"
  "js/settings.js"
)

missing=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file MISSING"
    missing=$((missing + 1))
  fi
done

echo ""
echo "========================================="
if [ $missing -eq 0 ]; then
  echo "✅ All required files present!"
else
  echo "❌ $missing files missing"
  exit 1
fi
echo "========================================="
echo ""

# Check JavaScript syntax
echo "Checking JavaScript syntax..."
js_errors=0
for file in js/*.js; do
  if node -c "$file" 2>/dev/null; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file has syntax errors"
    js_errors=$((js_errors + 1))
  fi
done

echo ""
echo "========================================="
if [ $js_errors -eq 0 ]; then
  echo "✅ All JavaScript files have valid syntax!"
else
  echo "❌ $js_errors files have syntax errors"
  exit 1
fi
echo "========================================="
echo ""

# Check if all pages are routed
echo "Checking app.js routes..."
routes=("login" "prayer" "giving" "library" "bible" "sermons" "schedule" "bulletin" "vote" "settings")
for route in "${routes[@]}"; do
  if grep -q "case '$route':" js/app.js; then
    echo "  ✅ Route: $route"
  else
    echo "  ❌ Route missing: $route"
  fi
done

echo ""
echo "========================================="
echo "✅ Build verification complete!"
echo "========================================="
echo ""
echo "To test the app:"
echo "  1. Run: python3 -m http.server 8000"
echo "  2. Open: http://localhost:8000"
echo "  3. Login with any credentials (mock auth)"
echo ""
echo "For detailed test instructions, see TEST_INSTRUCTIONS.md"
