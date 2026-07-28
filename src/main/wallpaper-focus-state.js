'use strict';

const ACTION_NONE = 'none';
const ACTION_APPLY_MANAGED = 'apply-managed';
const ACTION_RESTORE_ORIGINAL = 'restore-original';
const ACTION_INITIALIZE_MANAGED = 'initialize-managed';

class WallpaperFocusState {
  constructor({ desktopFocused = null, hasManagedWallpaper = false } = {}) {
    this.desktopFocused = desktopFocused;
    this.hasManagedWallpaper = hasManagedWallpaper;
    this.minimizeHoldActive = false;
    this.originalRestored = false;
  }

  setManagedWallpaperAvailable(available) {
    this.hasManagedWallpaper = Boolean(available);
  }

  resetNativeHostState() {
    this.desktopFocused = null;
    this.minimizeHoldActive = false;
    this.originalRestored = false;
  }

  handle(event, desktopFocused = null) {
    if (event === 'MINIMIZE_HOLD') {
      if (this.minimizeHoldActive) return ACTION_NONE;
      this.minimizeHoldActive = true;
      this.originalRestored = false;
      return this.hasManagedWallpaper ? ACTION_APPLY_MANAGED : ACTION_INITIALIZE_MANAGED;
    }

    if (event === 'MINIMIZE_HOLD_END') {
      this.minimizeHoldActive = false;
      return ACTION_NONE;
    }

    if (event !== 'FOCUS' || typeof desktopFocused !== 'boolean') {
      return ACTION_NONE;
    }

    const wasDesktopFocused = this.desktopFocused;
    this.desktopFocused = desktopFocused;

    if (this.minimizeHoldActive) {
      return ACTION_NONE;
    }

    if (!desktopFocused) {
      if (this.originalRestored) return ACTION_NONE;
      this.originalRestored = true;
      return ACTION_RESTORE_ORIGINAL;
    }

    this.originalRestored = false;
    if (wasDesktopFocused === true || wasDesktopFocused === null) return ACTION_NONE;
    return this.hasManagedWallpaper ? ACTION_APPLY_MANAGED : ACTION_INITIALIZE_MANAGED;
  }
}

module.exports = {
  ACTION_APPLY_MANAGED,
  ACTION_INITIALIZE_MANAGED,
  ACTION_NONE,
  ACTION_RESTORE_ORIGINAL,
  WallpaperFocusState
};