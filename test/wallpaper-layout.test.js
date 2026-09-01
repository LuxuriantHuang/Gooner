'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateWallpaperStyle,
  normalizeWallpaperPosition
} = require('../src/shared/wallpaper-layout');

const monitorBounds = { x: 1920, y: 0, width: 2560, height: 1440 };
const virtualBounds = { x: 0, y: 0, width: 4480, height: 1440 };

test('maps standard Windows wallpaper positions to matching CSS behavior', () => {
  assert.deepEqual(calculateWallpaperStyle({ position: 'fill' }), {
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'cover'
  });
  assert.equal(calculateWallpaperStyle({ position: 'fit' }).backgroundSize, 'contain');
  assert.equal(calculateWallpaperStyle({ position: 'stretch' }).backgroundSize, '100% 100%');
  assert.equal(normalizeWallpaperPosition('unknown'), 'fill');
});

test('renders center at one image pixel per physical screen pixel', () => {
  const style = calculateWallpaperStyle({
    position: 'center',
    imageWidth: 1200,
    imageHeight: 800,
    monitorBounds,
    virtualBounds,
    scaleFactor: 2
  });

  assert.equal(style.backgroundSize, '600px 400px');
  assert.equal(style.backgroundPosition, 'center center');
});

test('keeps tiled wallpaper continuous across monitor boundaries', () => {
  const style = calculateWallpaperStyle({
    position: 'tile',
    imageWidth: 1000,
    imageHeight: 600,
    monitorBounds,
    virtualBounds,
    scaleFactor: 2
  });

  assert.equal(style.backgroundRepeat, 'repeat');
  assert.equal(style.backgroundSize, '500px 300px');
  assert.equal(style.backgroundPosition, '-460px 0px');
});

test('positions span wallpaper in one shared virtual desktop canvas', () => {
  const style = calculateWallpaperStyle({
    position: 'span',
    imageWidth: 4480,
    imageHeight: 1440,
    monitorBounds,
    virtualBounds,
    scaleFactor: 2
  });

  assert.equal(style.backgroundSize, '2240px 720px');
  assert.equal(style.backgroundPosition, '-960px 0px');
  assert.equal(style.backgroundRepeat, 'no-repeat');
});
