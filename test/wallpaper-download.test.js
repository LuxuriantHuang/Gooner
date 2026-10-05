'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { imageSize } = require('image-size');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
let fetchCalls = 0;
let response;
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'electron') return {
    net: { fetch: async () => { fetchCalls++; return response(); } },
    nativeImage: { createFromBuffer: buffer => {
      let valid = false;
      try { valid = imageSize(buffer).width > 0; } catch (_) {}
      return { isEmpty: () => !valid, toPNG: () => png };
    } }
  };
  return originalLoad.call(this, request, ...args);
};
// Load through the service so this regression fails on behavior before the helper exists.
const { WallpaperService } = (() => {
  const loader = Module._load;
  Module._load = function (request, ...args) {
    if (request === 'electron') return { ...loader.call(this, request, ...args), app: { getPath: () => os.tmpdir() } };
    return loader.call(this, request, ...args);
  };
  const result = require('../src/main/wallpaper-service');
  Module._load = loader;
  return result;
})();
Module._load = originalLoad;

async function fixture(t, urls) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gooner-wallpaper-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const service = new WallpaperService({
    getConfig: () => ({ wallpaper: { enabled: true } }),
    getMediaLibrary: () => urls.map(url => ({ type: 'image', path: url })),
    getDesktopCharacterService: () => null
  });
  service.wallpaperCacheDir = dir;
  service.setWallpapers = async entries => {
    for (const [, file] of entries) {
      assert.ok(!/^https?:/i.test(file), 'Windows must receive a local image path');
      assert.ok((await fs.stat(file)).size > 0);
    }
    return true;
  };
  fetchCalls = 0;
  return service;
}
const monitors = [{ id: 'display', width: 1920, height: 1080 }];

test('remote wallpaper becomes a cached local PNG and is reused offline', async t => {
  response = () => new Response(png);
  const service = await fixture(t, ['https://example.test/image?format=jpg']);
  assert.equal((await service._tickNormal(monitors)).changedCount, 1);
  assert.equal(fetchCalls, 1);
  response = () => { throw Error('offline'); };
  assert.equal((await service._tickNormal(monitors)).changedCount, 1);
  assert.equal(fetchCalls, 1);
});

test('HTTP failure never reaches the Windows wallpaper writer', async t => {
  response = () => new Response('unavailable', { status: 503 });
  const service = await fixture(t, ['https://example.test/broken']);
  let writes = 0;
  service.setWallpapers = async () => { writes++; return true; };
  const result = await service._tickNormal(monitors);
  assert.equal(result.changedCount, 0);
  assert.equal(writes, 0);
  assert.match(result.errors.join(' '), /503/);
});

test('HTML responses are rejected instead of saved as wallpaper', async t => {
  response = () => new Response('<html>blocked</html>');
  const service = await fixture(t, ['https://example.test/blocked']);
  service.setWallpapers = async () => { assert.fail('invalid image was applied'); };
  assert.equal((await service._tickNormal(monitors)).changedCount, 0);
});

test('local wallpapers still work without a network request', async t => {
  const service = await fixture(t, []);
  const file = path.join(service.wallpaperCacheDir, 'local.png');
  await fs.writeFile(file, png);
  service.getMediaLibrary = () => [{ type: 'image', path: file }];
  assert.equal((await service._tickNormal(monitors)).changedCount, 1);
  assert.equal(fetchCalls, 0);
});

test('stopping during a download prevents the completed image from being applied', async t => {
  let release;
  let started;
  const waiting = new Promise(resolve => { started = resolve; });
  response = () => { started(); return new Promise(resolve => { release = () => resolve(new Response(png)); }); };
  const service = await fixture(t, ['https://example.test/slow']);
  let writes = 0;
  service.setWallpapers = async () => { writes++; return true; };
  const pending = service._tickNormal(monitors);
  await waiting;
  await service.stop();
  release();
  assert.equal((await pending).changedCount, 0);
  assert.equal(writes, 0);
});

test('a focus change during download defers applying the wallpaper', async t => {
  response = () => new Response(png);
  const service = await fixture(t, ['https://example.test/focus']);
  service.getConfig = () => ({ wallpaper: { enabled: true, focusRestoreEnabled: true } });
  service._isDesktopFocused = async () => false;
  service.setWallpapers = async () => { assert.fail('applied after desktop lost focus'); };
  assert.equal((await service._tickNormal(monitors)).changedCount, 0);
});
