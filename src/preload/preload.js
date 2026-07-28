const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mediaPopup', {
  getState: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  pickConfigFile: () => ipcRenderer.invoke('config:pickFile'),
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  createProfile: (payload) => ipcRenderer.invoke('profiles:create', payload),
  renameProfile: (payload) => ipcRenderer.invoke('profiles:rename', payload),
  switchProfile: (path) => ipcRenderer.invoke('profiles:switch', path),
  deleteProfile: (id) => ipcRenderer.invoke('profiles:delete', id),
  selectConfigFile: () => ipcRenderer.invoke('config:selectFile'),
  saveConfigAs: () => ipcRenderer.invoke('config:saveAs'),
  generatePopupText: (payload) => ipcRenderer.invoke('ai:generatePopupText', payload),
  listAiModels: (payload) => ipcRenderer.invoke('ai:listModels', payload),
  testAiInteraction: () => ipcRenderer.invoke('ai:testInteraction'),
  showAiTextPopup: (payload) => ipcRenderer.invoke('ai:showTextPopup', payload),
  showWebsitePopup: (payload) => ipcRenderer.invoke('website:showPopup', payload),
  listProcesses: () => ipcRenderer.invoke('process:list'),
  chooseFolders: () => ipcRenderer.invoke('folders:choose'),
  chooseDesktopCharacterFolder: () => ipcRenderer.invoke('desktop-character:chooseFolder'),
  chooseImage: () => ipcRenderer.invoke('dialog:chooseImage'),
  saveAvatar: (base64Data, cardId) => ipcRenderer.invoke('file:saveAvatar', base64Data, cardId),
  openFolder: (folderPath) => ipcRenderer.invoke('folders:open', folderPath),
  scanMedia: () => ipcRenderer.invoke('media:scan'),
  start: () => ipcRenderer.invoke('scheduler:start'),
  pause: () => ipcRenderer.invoke('scheduler:pause'),
  stop: () => ipcRenderer.invoke('scheduler:stop'),
  closeAll: () => ipcRenderer.invoke('popups:closeAll'),
  testWallpaper: () => ipcRenderer.invoke('wallpaper:test'),
  refreshDesktopCharacter: () => ipcRenderer.invoke('desktop-character:refresh'),
  testOnlineMedia: () => ipcRenderer.invoke('media:testOnline'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onStateUpdate: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('state:update', listener);
    return () => ipcRenderer.removeListener('state:update', listener);
  },
  onHardcoreUnlock: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('hardcore:unlock', listener);
    return () => ipcRenderer.removeListener('hardcore:unlock', listener);
  },
  getStats: () => ipcRenderer.invoke('stats:get')
});

contextBridge.exposeInMainWorld('viewerPopup', {
  getMedia: (id) => ipcRenderer.invoke('viewer:getMedia', id),
  mediaLoaded: () => ipcRenderer.invoke('viewer:mediaLoaded'),
  close: () => ipcRenderer.invoke('viewer:close'),
  showInFolder: (path) => ipcRenderer.invoke('viewer:showInFolder', path),
  fitWindow: (mediaWidth, mediaHeight) => ipcRenderer.invoke('viewer:fitWindow', mediaWidth, mediaHeight),
  onCloseButtonTextUpdate: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('viewer:closeButtonTextUpdated', listener);
    return () => ipcRenderer.removeListener('viewer:closeButtonTextUpdated', listener);
  },
  onOpacityUpdate: (callback) => {
    const listener = (_event, opacity) => callback(opacity);
    ipcRenderer.on('viewer:setOpacity', listener);
    return () => ipcRenderer.removeListener('viewer:setOpacity', listener);
  }
});

contextBridge.exposeInMainWorld('aiTextPopup', {
  getPayload: (id) => ipcRenderer.invoke('aiPopup:getPayload', id),
  reply: (id, text) => ipcRenderer.invoke('aiPopup:reply', id, text),
  close: () => ipcRenderer.invoke('aiPopup:close'),
  fitWindow: (contentHeight) => ipcRenderer.invoke('aiPopup:fitWindow', contentHeight)
});
