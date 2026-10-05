'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getVirtualBounds,
  mapWallpapersToDisplays,
  filterMonitorsByDisplayIds
} = require('../src/shared/wallpaper-monitor-mapping');

test('calculates virtual bounds for monitors with negative coordinates', () => {
  const monitors = [
    { x: -1920, y: 0, width: 1920, height: 1080 },
    { x: 0, y: -200, width: 2560, height: 1440 }
  ];

  assert.deepEqual(getVirtualBounds(monitors), {
    x: -1920,
    y: -200,
    width: 4480,
    height: 1440
  });
});

test('maps same-resolution monitors by physical center instead of enumeration order', () => {
  const monitors = [
    { id: 'right', x: 1920, y: 0, width: 1920, height: 1080, position: 'fill' },
    { id: 'left', x: 0, y: 0, width: 1920, height: 1080, position: 'fit' }
  ];
  const displays = [
    { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
    { bounds: { x: 1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
  ];

  const assignments = mapWallpapersToDisplays(
    [['right', 'right.jpg'], ['left', 'left.jpg']],
    monitors,
    displays,
    point => point
  );

  assert.deepEqual(assignments.map(item => [item.displayIndex, item.sync.media, item.sync.position]), [
    [1, 'right.jpg', 'fill'],
    [0, 'left.jpg', 'fit']
  ]);
});

test('maps physical monitor coordinates through Electron DIP conversion', () => {
  const monitors = [
    { id: 'scaled', x: 0, y: 0, width: 3840, height: 2160, position: 'span' },
    { id: 'secondary', x: 3840, y: 0, width: 1920, height: 1080, position: 'span' }
  ];
  const displays = [
    { bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 1.5 },
    { bounds: { x: 2560, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 }
  ];
  const screenToDipPoint = point => (
    point.x < 3840
      ? { x: point.x / 1.5, y: point.y / 1.5 }
      : { x: 2560 + (point.x - 3840), y: point.y }
  );

  const assignments = mapWallpapersToDisplays(
    [['secondary', 'secondary.jpg'], ['scaled', 'scaled.jpg']],
    monitors,
    displays,
    screenToDipPoint
  );

  assert.equal(assignments[0].displayIndex, 1);
  assert.equal(assignments[1].displayIndex, 0);
  assert.equal(assignments[1].sync.scaleFactor, 1.5);
  assert.deepEqual(assignments[0].sync.virtualBounds, {
    x: 0,
    y: 0,
    width: 5760,
    height: 2160
  });
});

test('filters native wallpaper monitors using selected Electron display IDs', () => {
  const monitors = [
    { id: 'native-left', x: -1920, y: 0, width: 1920, height: 1080 },
    { id: 'native-right', x: 0, y: 0, width: 2560, height: 1440 }
  ];
  const displays = [
    { id: 11, bounds: { x: -1920, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
    { id: 22, bounds: { x: 0, y: 0, width: 1280, height: 720 }, scaleFactor: 2 }
  ];
  const selected = filterMonitorsByDisplayIds(monitors, [22], displays, point => point);
  assert.deepEqual(selected.map(monitor => monitor.id), ['native-right']);
  assert.deepEqual(filterMonitorsByDisplayIds(monitors, [], displays), monitors);
});
