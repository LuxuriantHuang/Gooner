const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const asarPath = path.join(projectRoot, 'dist', 'win-unpacked', 'resources', 'app.asar');
const requiredModules = ['bittorrent-dht', 'simple-peer', 'image-size'];

if (!fs.existsSync(asarPath)) {
  console.error(`Packaged app was not found: ${asarPath}`);
  process.exit(1);
}

const asarCli = path.join(projectRoot, 'node_modules', '@electron', 'asar', 'bin', 'asar.js');
const result = spawnSync(process.execPath, [asarCli, 'list', asarPath], {
  cwd: projectRoot,
  encoding: 'utf8'
});

if (result.error || result.status !== 0) {
  console.error('Could not inspect the packaged app.asar. Ensure electron-builder dependencies are installed.');
  if (result.error) console.error(result.error.message);
  process.exit(result.status || 1);
}

const archiveEntries = result.stdout
  .split(/\r?\n/)
  .map((entry) => entry.replaceAll('\\', '/'));
const missing = requiredModules.filter((moduleName) => {
  const modulePath = `/node_modules/${moduleName}/`;
  return !archiveEntries.some((entry) => entry.startsWith(modulePath));
});

if (missing.length > 0) {
  console.error(`Packaged app is missing runtime dependencies: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`Verified packaged runtime dependencies: ${requiredModules.join(', ')}`);
