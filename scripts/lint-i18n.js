const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../src/renderer/index.html');
const i18nPath = path.join(__dirname, '../src/shared/i18n.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const i18nContent = fs.readFileSync(i18nPath, 'utf-8');

// Find all data-i18n keys in HTML
const regex = /data-i18n="([^"]+)"/g;
const htmlKeys = new Set();
let match;
while ((match = regex.exec(htmlContent)) !== null) {
  htmlKeys.add(match[1]);
}

// Find all defined keys in i18n.js
// We look for patterns like 'some.key':
const i18nRegex = /'([^']+)':/g;
const i18nKeys = new Set();
while ((match = i18nRegex.exec(i18nContent)) !== null) {
  i18nKeys.add(match[1]);
}

let missing = false;
console.log('Checking for missing i18n keys...');
for (const key of htmlKeys) {
  if (!i18nKeys.has(key)) {
    console.error(`❌ MISSING KEY IN i18n.js: "${key}"`);
    missing = true;
  }
}

if (missing) {
  console.error('\nLINT FAILED: Please add the missing keys to src/shared/i18n.js');
  process.exit(1);
} else {
  console.log('✅ All keys are present!');
  process.exit(0);
}
