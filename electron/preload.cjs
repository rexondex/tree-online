const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gameWindow', { configure: (settings) => ipcRenderer.invoke('game:configureWindow', settings) });
