const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rocoDesktop", Object.freeze({
  getStatus: () => ipcRenderer.invoke("roco:status:get"),
  setStatusEnabled: (enabled) => ipcRenderer.invoke("roco:status:set", enabled === true)
}));
