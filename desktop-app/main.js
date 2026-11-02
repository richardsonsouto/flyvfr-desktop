// Virtual Flight Report — app de Windows (Electron)
// As telas do app vêm dentro do programa (pasta web/), servidas pelo endereço interno app://flyvfr/.
// A internet continua sendo usada só para os dados (Supabase, ADS-B, meteorologia, mapas).
// Recursos nativos: conexão direta ao MSFS por SimConnect, links externos no navegador, atualização automática.
const { app, BrowserWindow, protocol, net, shell, ipcMain, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const WEB = path.join(__dirname, "web");
const ORIGIN = "app://flyvfr";
const UPDATE_URL = "https://github.com/richardsonsouto/flyvfr-desktop/releases/latest/download/";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
const stateFile = () => path.join(app.getPath("userData"), "window.json");
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), "utf8")); } catch { return {}; } }
function saveState() {
  if (!win) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch {}
}

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1360, height: st.height || 880, x: st.x, y: st.y, minWidth: 900, minHeight: 600,
    backgroundColor: "#141413", title: "Virtual Flight Report", icon: path.join(__dirname, "build", "icon.ico"),
    autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  if (st.max) win.maximize();
  win.once("ready-to-show", () => win.show());
  win.on("close", saveState);
  win.on("closed", () => { stopSim(); win = null; });

  // links para fora do app abrem no navegador do Windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN)) { e.preventDefault(); if (/^https?:|^mailto:/i.test(url)) shell.openExternal(url); }
  });
  // downloads (ex.: PDF do briefing): pergunta onde salvar
  win.webContents.session.on("will-download", (e, item) => { item.setSaveDialogOptions({ title: "Salvar arquivo" }); });

  win.loadURL(ORIGIN + "/");
}

/* ---------- arquivos do app (pasta web/) ---------- */
function serveApp() {
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname);
    if (!p || p === "/") p = "/index.html";
    const f = path.normalize(path.join(WEB, p));
    if (!f.startsWith(WEB)) return new Response("forbidden", { status: 403 });
    const target = fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(WEB, "index.html");
    return net.fetch(pathToFileURL(target).toString());
  });
}

/* ---------- SimConnect (MSFS 2020/2024) ---------- */
let sim = null, simOwner = null;
function stopSim() {
  if (sim) { try { sim.close(); } catch {} }
  sim = null;
}
async function startSim(sender) {
  stopSim();
  let SC;
  try { SC = require("node-simconnect"); } catch (e) { return { error: "simconnect-missing" }; }
  const { open, Protocol, SimConnectDataType, SimConnectPeriod, SimConnectConstants } = SC;
  let handle;
  try {
    ({ handle } = await Promise.race([
      open("Virtual Flight Report", Protocol.KittyHawk),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000)),
    ]));
  } catch (e) {
    return { error: "MSFS não encontrado (abra o simulador e carregue um voo)" };
  }
  sim = handle; simOwner = sender;
  const DEF = 1, REQ = 1, EV_PAUSE = 1;
  const F = SimConnectDataType.FLOAT64;
  const vars = [
    ["PLANE LATITUDE", "degrees"], ["PLANE LONGITUDE", "degrees"], ["PLANE ALTITUDE", "feet"], ["GROUND VELOCITY", "knots"],
    ["SIM ON GROUND", "bool"], ["VERTICAL SPEED", "feet per minute"], ["PLANE TOUCHDOWN NORMAL VELOCITY", "feet per second"],
    ["PLANE HEADING DEGREES TRUE", "degrees"], ["SIMULATION RATE", "number"], ["IS SLEW ACTIVE", "bool"],
  ];
  for (const [n, u] of vars) handle.addToDataDefinition(DEF, n, u, F);
  handle.addToDataDefinition(DEF, "TITLE", null, SimConnectDataType.STRING256);
  handle.requestDataOnSimObject(REQ, DEF, SimConnectConstants.OBJECT_ID_USER, SimConnectPeriod.SECOND);
  handle.subscribeToSystemEvent(EV_PAUSE, "Pause");
  let paused = false;
  const send = (ch, d) => { try { if (simOwner && !simOwner.isDestroyed()) simOwner.send(ch, d); } catch {} };
  handle.on("event", (ev) => { if (ev.clientEventId === EV_PAUSE) paused = ev.data === 1; });
  handle.on("simObjectData", (r) => {
    if (r.requestID !== REQ) return;
    const b = r.data;
    const d = { lat: b.readFloat64(), lon: b.readFloat64(), alt: b.readFloat64(), gs: b.readFloat64(), gnd: b.readFloat64() > 0.5,
      vs: b.readFloat64(), td: b.readFloat64(), hdg: b.readFloat64(), rate: b.readFloat64(), slew: b.readFloat64() > 0.5 };
    d.title = b.readString256(); d.pause = paused;
    send("sc:data", d);
  });
  const closed = () => { if (sim === handle) { sim = null; send("sc:closed", {}); } };
  handle.on("quit", closed); handle.on("close", closed);
  handle.on("error", closed);
  handle.on("exception", () => {});
  return { ok: true };
}
ipcMain.handle("sc:start", (e) => startSim(e.sender));
ipcMain.handle("sc:stop", () => { stopSim(); return true; });
ipcMain.handle("app:version", () => app.getVersion());

/* ---------- atualização automática ---------- */
function setupUpdates() {
  if (!app.isPackaged) return;
  let autoUpdater;
  try { ({ autoUpdater } = require("electron-updater")); } catch { return; }
  autoUpdater.setFeedURL({ provider: "generic", url: UPDATE_URL });
  autoUpdater.autoDownload = true;
  autoUpdater.on("error", () => {});
  autoUpdater.on("update-downloaded", async (info) => {
    const r = await dialog.showMessageBox(win, {
      type: "info", buttons: ["Reiniciar agora", "Depois"], defaultId: 0, cancelId: 1,
      title: "Atualização pronta", message: `A versão ${info.version} do Virtual Flight Report foi baixada.`,
      detail: "Reinicie o app para usar a nova versão. Se escolher depois, ela será instalada quando você fechar o app.",
    });
    if (r.response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.checkForUpdates().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 3600e3);
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  serveApp();
  createWindow();
  setupUpdates();
});
app.on("window-all-closed", () => app.quit());
