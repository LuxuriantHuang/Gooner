'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ACTION_APPLY_MANAGED,
  ACTION_INITIALIZE_MANAGED,
  ACTION_NONE,
  ACTION_RESTORE_ORIGINAL,
  WallpaperFocusState
} = require('../src/main/wallpaper-focus-state');

test('restores originals once when desktop focus moves to an application', () => {
  const state = new WallpaperFocusState({ desktopFocused: true, hasManagedWallpaper: true });

  assert.equal(state.handle('FOCUS', false), ACTION_RESTORE_ORIGINAL);
  assert.equal(state.handle('FOCUS', false), ACTION_NONE);
});

test('reapplies the managed wallpaper when desktop focus returns', () => {
  const state = new WallpaperFocusState({ desktopFocused: true, hasManagedWallpaper: true });

  state.handle('FOCUS', false);
  assert.equal(state.handle('FOCUS', true), ACTION_APPLY_MANAGED);
  assert.equal(state.handle('FOCUS', true), ACTION_NONE);
});

test('initializes only when desktop focus returns without a managed wallpaper', () => {
  const state = new WallpaperFocusState({ desktopFocused: false, hasManagedWallpaper: false });

  assert.equal(state.handle('FOCUS', true), ACTION_INITIALIZE_MANAGED);
});

test('keeps managed wallpaper through minimization caused automatic foreground changes', () => {
  const state = new WallpaperFocusState({ desktopFocused: false, hasManagedWallpaper: true });

  assert.equal(state.handle('MINIMIZE_HOLD'), ACTION_APPLY_MANAGED);
  assert.equal(state.handle('FOCUS', false), ACTION_NONE);
  assert.equal(state.handle('MINIMIZE_HOLD_END'), ACTION_NONE);
  assert.equal(state.handle('FOCUS', false), ACTION_RESTORE_ORIGINAL);
});

test('does not leave a stale minimize hold after native host state resets', () => {
  const state = new WallpaperFocusState({ desktopFocused: false, hasManagedWallpaper: true });

  state.handle('MINIMIZE_HOLD');
  state.resetNativeHostState();
  assert.equal(state.handle('FOCUS', false), ACTION_RESTORE_ORIGINAL);
});