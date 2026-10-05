'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { findNonOverlappingPopupBounds, boundsOverlap, findPopupPlacementWithEviction } = require('../src/main/popup-placement');

test('popup bounds touching with a small gap are considered overlapped', () => {
  assert.equal(boundsOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 108, y: 0, width: 100, height: 100 }), true);
  assert.equal(boundsOverlap({ x: 0, y: 0, width: 100, height: 100 }, { x: 120, y: 0, width: 100, height: 100 }), false);
});

test('tries random positions then finds a free grid position', () => {
  const area = { x: 0, y: 0, width: 600, height: 400 };
  const occupied = [{ x: 100, y: 70, width: 400, height: 260 }];
  const result = findNonOverlappingPopupBounds(area, 120, 100, occupied);
  assert.ok(result);
  assert.equal(boundsOverlap(result, occupied[0]), false);
  assert.ok(result.x >= -36 && result.x <= 516);
});

test('returns null when every allowed placement overlaps', () => {
  const area = { x: 0, y: 0, width: 220, height: 160 };
  const occupied = [{ x: -100, y: -100, width: 500, height: 400 }];
  assert.equal(findNonOverlappingPopupBounds(area, 300, 240, occupied), null);
});

test('uses an available location without closing unrelated popup bounds', () => {
  const result = findNonOverlappingPopupBounds(
    { x: 0, y: 0, width: 500, height: 400 }, 100, 100,
    [{ x: -30, y: -30, width: 150, height: 150 }],
    { attempts: 0 }
  );
  assert.ok(result);
  assert.equal(boundsOverlap(result, { x: -30, y: -30, width: 150, height: 150 }), false);
});

test('when the display is full, evicts the oldest popup until a position opens', () => {
  const oldest = { id: 'oldest', bounds: { x: -100, y: -100, width: 600, height: 400 } };
  const newer = { id: 'newer', bounds: { x: 20, y: 20, width: 50, height: 50 } };
  const plan = findPopupPlacementWithEviction(
    { x: 0, y: 0, width: 300, height: 200 }, 200, 140, [oldest, newer], { attempts: 0 }
  );
  assert.deepEqual(plan.evicted, [oldest]);
  assert.ok(plan.bounds);
  assert.equal(boundsOverlap(plan.bounds, newer.bounds), false);
});
