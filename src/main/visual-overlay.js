const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { findBestMediaForDisplay } = require('./media-utils');
const { mapWallpapersToDisplays } = require('../shared/wallpaper-monitor-mapping');

let overlayWindows = [];
let currentConfig = null;
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
  const enabled = vc.enabled || currentConfig.hardcoreMode;
  const flashEnabled = vc.flashEnabled || currentConfig.hardcoreMode;
  
  if (!enabled || !flashEnabled) return;

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
      if (w && !w.isDestroyed()) {
        const mediaFiles = getMediaFilesForFlash();
        const bestMedia = await findBestMediaForDisplay(mediaFiles, w.monitorBounds, currentConfig.wallpaper || {});
        w.webContents.send('visual:trigger-flash', bestMedia);
      }
    }
    scheduleNextFlash();
  }, delay);
}

function getMediaFilesForFlash() {
  let mediaFiles = [];
  if (!currentConfig) return mediaFiles;
  const sourceFolders = currentConfig.folders || [];
  const folderPaths = sourceFolders.map(f => typeof f === 'string' ? f : f.path).filter(Boolean);
  
  if (folderPaths.length > 0) {
    for (const p of folderPaths) {
      if (fs.existsSync(p)) {
        try {
          const files = fs.readdirSync(p);
          const validFiles = files.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'].includes(ext);
          }).map(f => path.join(p, f));
          mediaFiles = mediaFiles.concat(validFiles);
        } catch (err) {}
      }
    }
  }
  return mediaFiles;
}

function onConfigChange(config) {
  currentConfig = config;
  const vc = config.visualIntervention || {};
  const hasVisualFeature = vc.enabled
    || vc.ghostEnabled
    || vc.xrayEnabled
    || vc.waterfallEnabled
    || vc.flashEnabled;
  const enabled = (hasVisualFeature && isSchedulerRunning) || config.hardcoreMode;

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
    const isWaterfall = currentConfig.hardcoreMode || vc.waterfallEnabled;
    const mediaFiles = getMediaFilesForFlash();

    // Iterate through all overlay windows
    for (const overlayWindow of overlayWindows) {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
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
          ghostEnabled: vc.ghostEnabled || false,
          ghostSyncWithWallpaper: vc.ghostSyncWithWallpaper || false,
          synchronizedWallpaper: synchronizedWallpaperByDisplay.get(overlayWindow.displayIndex) || null,
          xrayEnabled: vc.xrayEnabled || false,
          waterfallEnabled: isWaterfall,
          ghostOpacity: vc.ghostOpacity || 5,
          ghostIntervalMinutes: vc.ghostIntervalMinutes ?? 5,
          ghostIntervalSeconds: vc.ghostIntervalSeconds ?? 0,
          xrayRadius: vc.xrayRadius || 200,
          xrayOpacity: vc.xrayOpacity !== undefined ? vc.xrayOpacity : 60,
          waterfallSpeed: vc.waterfallSpeed || 50,
          waterfallCount: vc.waterfallCount || 15,
          waterfallSize: vc.waterfallSize || 150,
          waterfallOpacity: vc.waterfallOpacity ?? 60,
          flashEnabled: currentConfig.hardcoreMode || vc.flashEnabled,
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
  onConfigChange,
  onSchedulerStateChange,
  onWallpapersApplied
};
