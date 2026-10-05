const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const { findBestMediaForDisplay } = require('./media-utils');
const { shouldRunVisualOverlay, shouldRunVisualFlash, getVisualMediaFiles, getVisualFeaturesForDisplay } = require('./visual-overlay-logic');
const { mapWallpapersToDisplays } = require('../shared/wallpaper-monitor-mapping');

let overlayWindows = [];
let currentConfig = null;
let getMediaLibrary = () => [];
let flashTimer = null;
let isSchedulerRunning = false;
const synchronizedWallpaperByDisplay = new Map();

function onSchedulerStateChange(isRunning) {
  isSchedulerRunning = isRunning;
  if (currentConfig) {
    onConfigChange(currentConfig);
  }
}

function createOverlayWindow() {
  if (overlayWindows.length > 0) return;

  const displays = screen.getAllDisplays();

  displays.forEach((display, displayIndex) => {
    const { x, y, width, height } = display.bounds;

    const overlayWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      transparent: true,
      frame: false,
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false
      },
      enableLargerThanScreen: true
    });

    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    const enforceAlwaysOnTop = () => {
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      }
    };
    overlayWindow.on('restore', enforceAlwaysOnTop);
    overlayWindow.on('focus', enforceAlwaysOnTop);

    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.loadFile(path.join(__dirname, '../renderer/visual-overlay.html'));

    overlayWindow.once('ready-to-show', () => {
      overlayWindow.setBounds(display.bounds);
      overlayWindow.show();
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      sendConfigToOverlay();
    });

    overlayWindow.on('closed', () => {
      overlayWindows = overlayWindows.filter(w => w !== overlayWindow);
    });

    // Store monitor ID in the window object to filter media specifically for it later
    overlayWindow.monitorId = display.id;
    overlayWindow.displayIndex = displayIndex;
    overlayWindow.monitorBounds = display.bounds;

    overlayWindows.push(overlayWindow);
  });
}

function destroyOverlayWindow() {
  overlayWindows.forEach(w => {
    if (w && !w.isDestroyed()) {
      w.close();
    }
  });
  overlayWindows = [];
}

function scheduleNextFlash() {
  if (flashTimer) clearTimeout(flashTimer);
  
  if (!currentConfig || !currentConfig.visualIntervention) return;
  const vc = currentConfig.visualIntervention;
  const flashEnabled = vc.flashEnabled || currentConfig.hardcoreMode;
  if (!flashEnabled || !shouldRunVisualFlash(currentConfig, isSchedulerRunning)) return;

  // Calculate interval
  let intervalMs = 0;
  let jitterMs = 0;
  
  if (currentConfig.hardcoreMode) {
    intervalMs = 3 * 60 * 1000; // 3 minutes
    jitterMs = 60 * 1000;       // 1 minute jitter
  } else {
    intervalMs = (vc.flashIntervalHours * 3600 + vc.flashIntervalMinutes * 60 + vc.flashIntervalSeconds) * 1000;
    jitterMs = (vc.flashJitterHours * 3600 + vc.flashJitterMinutes * 60 + vc.flashJitterSeconds) * 1000;
  }
  
  // Ensure minimum interval is 1 second
  if (intervalMs < 1000) intervalMs = 1000;
  
  // Apply jitter (+/-)
  let delay = intervalMs + (Math.random() * 2 - 1) * jitterMs;
  if (delay < 1000) delay = 1000; // Hard minimum

  flashTimer = setTimeout(async () => {
    // Send flash trigger with specific perfectly sized media for each display
    for (const w of overlayWindows) {
      if (w && !w.isDestroyed() && getVisualFeaturesForDisplay(currentConfig.visualIntervention || {}, w.monitorId, currentConfig.hardcoreMode).flashEnabled) {
        const mediaFiles = getMediaFilesForFlash();
        const bestMedia = await findBestMediaForDisplay(mediaFiles, w.monitorBounds, currentConfig.wallpaper || {});
        w.webContents.send('visual:trigger-flash', bestMedia);
      }
    }
    scheduleNextFlash();
  }, delay);
}

function getMediaFilesForFlash() {
  if (!currentConfig) return [];
  const useOnlineMedia = currentConfig.visualIntervention?.useOnlineMedia !== false;
  return getVisualMediaFiles(getMediaLibrary(), useOnlineMedia);
}

function onConfigChange(config) {
  currentConfig = config;
  const enabled = shouldRunVisualOverlay(config, isSchedulerRunning);

  if (enabled) {
    if (overlayWindows.length === 0) {
      createOverlayWindow();
    } else {
      sendConfigToOverlay();
    }
    scheduleNextFlash();
  } else {
    destroyOverlayWindow();
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  }
}

async function sendConfigToOverlay() {
  if (overlayWindows.length > 0 && currentConfig) {
    const vc = currentConfig.visualIntervention || {};
    const mediaFiles = getMediaFilesForFlash();

    // Iterate through all overlay windows
    for (const overlayWindow of overlayWindows) {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        const features = getVisualFeaturesForDisplay(vc, overlayWindow.monitorId, currentConfig.hardcoreMode);
        // Pre-filter media specific to this monitor's resolution/ratio so ghost and xray pick nice fits
        const displayMediaFiles = [];
        
        if (mediaFiles.length > 0) {
          // Since we want standard media rotation in ghost/xray to also fit nicely, we can pre-filter.
          // But filtering thousands of images synchronously would be slow.
          // For now, we will send all media, BUT we will let Ghost/XRay fetch individually via IPC,
          // OR we just send all media and if the user wants perfect aspect ratio, we handle it via IPC.
          // Wait! Let's just pick 100 perfectly fitting images and send them as the pool for this display.
          const maxCandidates = Math.min(mediaFiles.length, 100);
          for (let i = 0; i < maxCandidates; i++) {
             const best = await findBestMediaForDisplay(mediaFiles, overlayWindow.monitorBounds, currentConfig.wallpaper || {});
             if (best && !displayMediaFiles.includes(best)) {
                displayMediaFiles.push(best);
             }
          }
          if (displayMediaFiles.length === 0) displayMediaFiles.push(...mediaFiles);
        }

        overlayWindow.webContents.send('visual:update-config', {
          ghostEnabled: features.ghostEnabled,
          ghostSyncWithWallpaper: vc.ghostSyncWithWallpaper || false,
          synchronizedWallpaper: synchronizedWallpaperByDisplay.get(overlayWindow.displayIndex) || null,
          xrayEnabled: features.xrayEnabled,
          waterfallEnabled: features.waterfallEnabled,
          ghostOpacity: vc.ghostOpacity || 5,
          ghostIntervalMinutes: vc.ghostIntervalMinutes ?? 5,
          ghostIntervalSeconds: vc.ghostIntervalSeconds ?? 0,
          xrayRadius: vc.xrayRadius || 200,
          xrayOpacity: vc.xrayOpacity !== undefined ? vc.xrayOpacity : 60,
          waterfallSpeed: vc.waterfallSpeed || 50,
          waterfallCount: vc.waterfallCount || 15,
          waterfallSize: vc.waterfallSize || 150,
          waterfallOpacity: vc.waterfallOpacity ?? 60,
          flashEnabled: features.flashEnabled,
          mediaFiles: displayMediaFiles.length > 0 ? displayMediaFiles : mediaFiles,
          allMediaFiles: mediaFiles,
          hardcore: currentConfig.hardcoreMode
        });
      }

    }
  }
}

function onWallpapersApplied(entries, monitors = []) {
  const displays = screen.getAllDisplays();
  const toDipPoint = typeof screen.screenToDipPoint === 'function'
    ? point => screen.screenToDipPoint(point)
    : null;
  const assignments = mapWallpapersToDisplays(entries, monitors, displays, toDipPoint);
  for (const { displayIndex, sync } of assignments) {
    synchronizedWallpaperByDisplay.set(displayIndex, sync);
    console.log(`[VisualOverlay] Synced display ${displayIndex} to wallpaper: ${sync.media} (${sync.position})`);
  }
  for (const overlayWindow of overlayWindows) {
    if (!overlayWindow || overlayWindow.isDestroyed()) continue;
    const sync = synchronizedWallpaperByDisplay.get(overlayWindow.displayIndex) || null;
    overlayWindow.webContents.send('visual:wallpaper-sync', sync);
  }
}

module.exports = {
  setMediaLibraryProvider(provider) {
    getMediaLibrary = typeof provider === 'function' ? provider : () => [];
  },
  onConfigChange,
  onSchedulerStateChange,
  onWallpapersApplied
};
