const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopCharacter', {
  onUpdate: (callback) => ipcRenderer.on('desktop-character:update', (_event, value) => callback(value))
});