#!/usr/bin/env node
/** Bump CCR app version — run before git commit */
const fs = require('fs');
const path = require('path');

const dir = '/Users/willy/Projects/ccr-app';
const files = {
  app: path.join(dir, 'js/app.js'),
  sw:  path.join(dir, 'sw.js'),
  ih:  path.join(dir, 'index.html')
};

function read(f) { return fs.readFileSync(f, 'utf8'); }
function write(f, c) { fs.writeFileSync(f, c); }

let content = read(files.app);
const m = content.match(/APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/);
if (!m) { console.error('Could not find APP_VERSION'); process.exit(1); }
const [, major, minor, patch] = m.map(Number);
const next = `${major}.${minor}.${patch+1}`;
console.log(`Bumping ${major}.${minor}.${patch} → ${next}`);

['app', 'sw'].forEach(k => {
  let c = read(files[k]);
  c = c.replace(/APP_VERSION = '\d+\.\d+\.\d+'/g, `APP_VERSION = '${next}'`);
  if (k === 'sw') c = c.replace(/ccr-app-v\d+/g, `ccr-app-v${next}`);
  write(files[k], c);
});

let ih = read(files.ih);
ih = ih.replace(/>v\d+\.\d+\.\d+</g, `>v${next}<`);
write(files.ih, ih);

console.log(`✅ Bumped to ${next}`);
