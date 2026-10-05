'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const originalLoad = Module._load;
Module._load = function loadWithElectronStub(request, parent, isMain) {
  if (request === 'electron') {
    return { app: { getPath: () => 'C:\\Temp' } };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { WallpaperService } = require('../src/main/wallpaper-service');
Module._load = originalLoad;

function createService(config, notifications = []) {
  const service = new WallpaperService({
    getConfig: () => config,
    getMediaLibrary: () => [],
    getDesktopCharacterService: () => null,
    onWallpapersApplied: (entries, monitors) => notifications.push({ entries, monitors })
  });
  service.cachedMonitors = [
    { id: 'display-1', x: 0, y: 0, width: 1920, height: 1080, position: 'fill' }
  ];
  service.scheduleNextTick = () => {};
  // These are state-machine tests; never query or change the developer's desktop.
  service.initScript = async () => {};
  service.getMonitors = async () => service.cachedMonitors || [];
  service.getCurrentWallpaper = async () => 'original.jpg';
  service.setWallpapers = async () => true;
  service._startFocusPolling = () => {};
  return service;
}

test('enabling ghost sync publishes the visible wallpaper without rotating', () => {
  const config = {
    wallpaper: { enabled: true, focusRestoreEnabled: true },
    visualIntervention: { ghostSyncWithWallpaper: true }
  };
  const notifications = [];
  const service = createService(config, notifications);
  service.focusState.desktopFocused = true;
  service.lastAppliedWallpapers.set('display-1', 'managed.jpg');
  let tickCount = 0;
  service.tick = () => {
    tickCount += 1;
    return Promise.resolve();
  };

  service.onConfigChange(
    {
      wallpaper: { enabled: true, focusRestoreEnabled: true },
      visualIntervention: { ghostSyncWithWallpaper: false }
    },
    config
  );

  assert.equal(tickCount, 0);
  assert.deepEqual(notifications[0].entries, [['display-1', 'managed.jpg']]);
});

test('enabling ghost sync while unfocused publishes the restored original', () => {
  const config = {
    wallpaper: { enabled: true, focusRestoreEnabled: true },
    visualIntervention: { ghostSyncWithWallpaper: true }
  };
  const notifications = [];
  const service = createService(config, notifications);
  service.focusState.desktopFocused = false;
  service.originalWallpapers.set('display-1', 'original.jpg');
  service.lastAppliedWallpapers.set('display-1', 'managed.jpg');

  service.onConfigChange(
    {
      wallpaper: { enabled: true, focusRestoreEnabled: true },
      visualIntervention: { ghostSyncWithWallpaper: false }
    },
    config
  );

  assert.deepEqual(notifications[0].entries, [['display-1', 'original.jpg']]);
});

test('restore and reapply notify the overlay only after successful writes', async () => {
  const config = {
    wallpaper: { enabled: true, focusRestoreEnabled: true },
    visualIntervention: { ghostSyncWithWallpaper: true }
  };
  const notifications = [];
  const service = createService(config, notifications);
  service.originalWallpapers.set('display-1', 'original.jpg');
  service.lastAppliedWallpapers.set('display-1', 'managed.jpg');
  service.setWallpapers = async () => true;

  await service._restoreOriginalWallpapers();
  await service._reapplyLastAppliedWallpapers();

  assert.deepEqual(notifications.map(item => item.entries), [
    [['display-1', 'original.jpg']],
    [['display-1', 'managed.jpg']]
  ]);
});

test('a scheduled tick while unfocused does not select or queue a new wallpaper', async () => {
  const config = {
    wallpaper: {
      enabled: true,
      characterEnabled: false,
      focusRestoreEnabled: true
    },
    visualIntervention: { ghostSyncWithWallpaper: true }
  };
  const service = createService(config);
  service._isDesktopFocused = async () => false;
  let monitorReads = 0;
  service.getMonitors = async () => {
    monitorReads += 1;
    return service.cachedMonitors;
  };

  const result = await service.tick();

  assert.equal(result, '桌面当前不可见，已跳过本轮壁纸更换');
  assert.equal(monitorReads, 0);
  assert.equal(service.lastAppliedWallpapers.size, 0);
});

test('the first startup tick bootstraps wallpaper even when hidden startup is unfocused', async () => {
  const config = {
    wallpaper: {
      enabled: true,
      characterEnabled: false,
      focusRestoreEnabled: true
    },
    visualIntervention: { ghostSyncWithWallpaper: false }
  };
  const service = createService(config);
  service._isDesktopFocused = async () => false;
  let tickArgs = null;
  service.tick = async (...args) => {
    tickArgs = args;
  };

  await service.start();

  assert.deepEqual(tickArgs, [false, { ignoreFocus: true }]);
  assert.equal(service.focusState.desktopFocused, false);
  await service.stop();
});

test('startup does not query focus when focus restore is disabled', async () => {
  const config = {
    wallpaper: {
      enabled: true,
      characterEnabled: false,
      focusRestoreEnabled: false
    },
    visualIntervention: { ghostSyncWithWallpaper: false }
  };
  const service = createService(config);
  service.initScript = async () => {};
  service.getMonitors = async () => service.cachedMonitors;
  service.getCurrentWallpaper = async () => 'original.jpg';
  service._startFocusPolling = () => {};
  service._isDesktopFocused = async () => {
    throw new Error('focus must not be queried when focus restore is disabled');
  };
  let tickCount = 0;
  service.tick = async () => {
    tickCount += 1;
  };

  await service.start();

  assert.equal(tickCount, 1);
  await service.stop();
});
