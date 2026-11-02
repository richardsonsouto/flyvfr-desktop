// Ponte segura entre as telas do app e os recursos nativos do Windows.
const { contextBridge, ipcRenderer } = require("electron");

const on = (ch, cb) => { const f = (_e, d) => cb(d); ipcRenderer.on(ch, f); return () => ipcRenderer.removeListener(ch, f); };

contextBridge.exposeInMainWorld("vfrNative", {
  platform: "windows",
  version: () => ipcRenderer.invoke("app:version"),
  simconnect: {
    start: () => ipcRenderer.invoke("sc:start"),
    stop: () => ipcRenderer.invoke("sc:stop"),
    onData: (cb) => on("sc:data", cb),
    onClosed: (cb) => on("sc:closed", cb),
  },
});
