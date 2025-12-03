const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  /**
   * @param {string} channel
   * @param {unknown} data
   */
  send: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  /**
   * @param {string} channel
   * @param {(...args: unknown[]) => void} func
   */
  receive: (channel, func) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  /**
   * @param {(key: string) => void} callback
   */
  onMediaKey: (callback) => {
    ipcRenderer.on('media-key', (_event, key) => callback(key));
  },
  removeMediaKeyListener: () => {
    ipcRenderer.removeAllListeners('media-key');
  },
});