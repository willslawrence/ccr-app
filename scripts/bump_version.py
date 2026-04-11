#!/usr/bin/env python3
"""Bump CCR app version before git commit."""
import re
import sys
from pathlib import Path

APP_DIR = Path('/Users/willy/Projects/ccr-app')

# Find current version
app_js = APP_DIR / 'js' / 'app.js'
content = app_js.read_text()
m = re.search(r"APP_VERSION = '(\d+)\.(\d+)\.(\d+)'", content)
if not m:
    print("ERROR: Could not find APP_VERSION"); sys.exit(1)

major, minor, patch = int(m.group(1)), int(m.group(2)), int(m.group(3))
new = f"{major}.{minor}.{patch+1}"
print(f"Bumping {major}.{minor}.{patch} → {new}")

# Update app.js
content = re.sub(r"APP_VERSION = '\d+\.\d+\.\d+'", f"APP_VERSION = '{new}'", content)
app_js.write_text(content)

# Update sw.js
sw = APP_DIR / 'sw.js'
sw_content = sw.read_text()
sw_content = re.sub(r"APP_VERSION = '\d+\.\d+\.\d+'", f"APP_VERSION = '{new}'", sw_content)
sw_content = re.sub(r"ccr-app-v\d+", f"ccr-app-v{new}", sw_content)
sw.write_text(sw_content)

# Update FAB badge in index.html
ih = APP_DIR / 'index.html'
ih_content = ih.read_text()
ih_content = re.sub(r">(v\d+\.\d+\.\d+)<", f">{new}<", ih_content)
ih.write_text(ih_content)

print(f"✅ Done — all files updated to {new}")
