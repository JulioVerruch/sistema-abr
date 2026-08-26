const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("abrDesktop", {
  version: process.versions.electron,
  platform: process.platform,
});
