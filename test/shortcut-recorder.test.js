const test = require('node:test');
const assert = require('node:assert/strict');
const { formatKeyEvent } = require('../src/shared/shortcut-recorder');

test('modifier-only key presses do not become a shortcut key', () => {
  assert.equal(formatKeyEvent({ key: 'Control', ctrlKey: true }), null);
  assert.equal(formatKeyEvent({ key: 'Alt', altKey: true }), null);
  assert.equal(formatKeyEvent({ key: 'Shift', shiftKey: true }), null);
});

test('shortcut chords contain each modifier once and format space correctly', () => {
  assert.equal(formatKeyEvent({ key: 'k', ctrlKey: true, shiftKey: true }), 'Ctrl+Shift+K');
  assert.equal(formatKeyEvent({ key: ' ', ctrlKey: true }), 'Ctrl+Space');
});
