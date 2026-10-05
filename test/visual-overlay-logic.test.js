const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRunVisualOverlay, shouldRunVisualFlash, getVisualMediaFiles, getVisualFeaturesForDisplay } = require('../src/main/visual-overlay-logic');

test('visual features can run independently from popup scheduler when configured', () => {
  const config = { hardcoreMode: false, visualIntervention: { ghostEnabled: true, independentOfScheduler: true } };
  assert.equal(shouldRunVisualOverlay(config, false), true);
  config.visualIntervention.independentOfScheduler = false;
  assert.equal(shouldRunVisualOverlay(config, false), false);
  assert.equal(shouldRunVisualOverlay(config, true), true);
});

test('flash feature follows the same independent-run setting as the visual overlay', () => {
  const config = { hardcoreMode: false, visualIntervention: { flashEnabled: true, independentOfScheduler: true } };
  assert.equal(shouldRunVisualFlash(config, false), true);
  config.visualIntervention.independentOfScheduler = false;
  assert.equal(shouldRunVisualFlash(config, false), false);
  assert.equal(shouldRunVisualFlash(config, true), true);
});

test('visual media pool respects online media switch and supports scanned recursive media', () => {
  const library = [
    { path: 'C:/media/nested/a.jpg' },
    { path: 'https://example.test/b.jpg', url: 'https://example.test/b.jpg' }
  ];
  assert.deepEqual(getVisualMediaFiles(library, false), ['C:/media/nested/a.jpg']);
  assert.deepEqual(getVisualMediaFiles(library, true), ['C:/media/nested/a.jpg', 'https://example.test/b.jpg']);
});

test('visual effects honor their individual display selections while empty selections keep all displays', () => {
  const visual = {
    ghostEnabled: true,
    ghostDisplayIds: [2],
    xrayEnabled: true,
    xrayDisplayIds: [],
    waterfallEnabled: true,
    waterfallDisplayIds: [1],
    flashEnabled: true,
    flashDisplayIds: [2]
  };
  assert.deepEqual(getVisualFeaturesForDisplay(visual, 1), {
    ghostEnabled: false, xrayEnabled: true, waterfallEnabled: true, flashEnabled: false
  });
  assert.deepEqual(getVisualFeaturesForDisplay(visual, 2), {
    ghostEnabled: true, xrayEnabled: true, waterfallEnabled: false, flashEnabled: true
  });
});
