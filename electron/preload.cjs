const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getPlatform: () => process.platform,
  getModelsStatus: () => ipcRenderer.invoke('get-models-status'),
  loadModel: (modelFileName) => ipcRenderer.invoke('load-model', modelFileName),
  unloadModel: () => ipcRenderer.invoke('unload-model'),
  generateComment: (data) => ipcRenderer.invoke('generate-comment', data),
  stopGeneration: () => ipcRenderer.invoke('stop-generation'),
  onChunk: (callback) => {
    const subscription = (event, chunk) => callback(chunk);
    ipcRenderer.on('comment-chunk', subscription);
    return () => ipcRenderer.removeListener('comment-chunk', subscription);
  },
  onStatus: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on('model-status', subscription);
    return () => ipcRenderer.removeListener('model-status', subscription);
  }
});
