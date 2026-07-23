"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  app,
  Menu,
  nativeImage,
  shell,
  Tray,
} = require("electron");
const { resolveRuntimePaths } = require("./config");
const { startClipDropEngine } = require("./engine");
const { installBundledPlugin } = require("./plugin-installer");
const { createTrayMenuTemplate } = require("./tray-menu");

let tray = null;
let engine = null;
let status = "starting";
let quitting = false;
let logFile = null;

function log(message, error) {
  const line = `[${new Date().toISOString()}] ${message}${
    error ? `: ${error.stack || error.message || error}` : ""
  }\n`;
  if (logFile) {
    fs.appendFileSync(logFile, line);
  }
}

function loginEnabled() {
  return app.getLoginItemSettings().openAtLogin;
}

function setLaunchAtLogin(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
  });
  renderMenu();
}

async function stopEngine() {
  const activeEngine = engine;
  engine = null;
  if (activeEngine) {
    await activeEngine.stop();
  }
}

async function startEngine() {
  status = "starting";
  renderMenu();
  await stopEngine();

  const repositoryRoot = path.resolve(__dirname, "../..");
  const paths = resolveRuntimePaths({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    repositoryRoot,
  });
  engine = await startClipDropEngine({ paths });
  const health = await fetch("http://127.0.0.1:47821/health").then((response) =>
    response.json());
  status = health.ready ? "ready" : "unavailable";
  log(`Engine started with status ${status}`);
  renderMenu();
}

async function restart() {
  try {
    await startEngine();
  } catch (error) {
    status = "unavailable";
    log("Could not restart ClipDrop", error);
    renderMenu();
  }
}

async function quit() {
  if (quitting) {
    return;
  }
  quitting = true;
  await stopEngine().catch((error) => log("Could not stop ClipDrop", error));
  app.quit();
}

function renderMenu() {
  if (!tray) {
    return;
  }
  tray.setContextMenu(
    Menu.buildFromTemplate(
      createTrayMenuTemplate({
        status,
        launchAtLogin: loginEnabled(),
        actions: {
          openLogs: () => shell.openPath(path.dirname(logFile)),
          restart,
          setLaunchAtLogin,
          quit,
        },
      }),
    ),
  );
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "assets", "trayTemplate.svg");
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip("ClipDrop");
  renderMenu();
}

async function ensurePluginInstalled() {
  if (!app.isPackaged) {
    return;
  }
  const marker = path.join(
    app.getPath("userData"),
    `premiere-panel-${app.getVersion()}.installed`,
  );
  if (fs.existsSync(marker)) {
    return;
  }
  await installBundledPlugin({
    packagePath: path.join(
      process.resourcesPath,
      "installer",
      "ClipDrop.ccx",
    ),
  });
  fs.writeFileSync(marker, new Date().toISOString());
  log("Premiere panel installed");
}

async function initialize() {
  if (process.platform === "darwin") {
    app.dock.hide();
  }
  const logDirectory = app.getPath("logs");
  fs.mkdirSync(logDirectory, { recursive: true });
  logFile = path.join(logDirectory, "clipdrop.log");

  const loginMarker = path.join(app.getPath("userData"), "login-item-configured");
  if (!fs.existsSync(loginMarker)) {
    setLaunchAtLogin(true);
    fs.writeFileSync(loginMarker, new Date().toISOString());
  }

  createTray();
  await ensurePluginInstalled().catch((error) =>
    log("Could not install the Premiere panel", error));
  await restart();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => renderMenu());
  app.on("before-quit", (event) => {
    if (!quitting) {
      event.preventDefault();
      quit();
    }
  });
  app.whenReady().then(initialize).catch((error) => {
    status = "unavailable";
    log("ClipDrop could not start", error);
    renderMenu();
  });
}
