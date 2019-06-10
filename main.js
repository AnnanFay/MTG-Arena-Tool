const electron = require("electron");

const {
  dialog,
  app,
  globalShortcut,
  Menu,
  MenuItem,
  Tray,
  clipboard
} = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const Store = require("electron-store");

var rememberStore = new Store({
  name: "remember",
  defaults: {}
});

//const OVERLAY_DRAFT = 5;
const { OVERLAY_DRAFT } = require("./shared/constants.js");

app.setAppUserModelId("com.github.manuel777.mtgatool");

// Adds debug features like hotkeys for triggering dev tools and reload
require("electron-debug")({ showDevTools: false });
console.log(process.platform);

const debugBack = false;
const debugIPC = false;

var mainWindow;
var updaterWindow;
var background;
var overlays = [undefined, undefined, undefined, undefined];
var overlaysAlpha = [false, false, false, false];
var overlaysTimeout = [null, null, null, null];
var mainTimeout = null;
var overlaysShow = false;
var overlays_settings = null;
var tray = null;
var closeToTray = true;
let autoLogin = false;
let launchToTray = false;

const ipc = electron.ipcMain;

var mainLoaded = false;
var backLoaded = false;
var firstSettingsRead = true;

const singleLock = app.requestSingleInstanceLock();

app.on("second-instance", () => {
  if (updaterWindow) {
    showWindow();
  } else if (mainWindow.isVisible()) {
    if (mainWindow.isMinimized()) {
      showWindow();
    }
  } else {
    showWindow();
  }
});

if (!singleLock) {
  console.log("We dont have single instance lock! quitting the app.");
  app.quit();
}

app.on("ready", () => {
  if (app.isPackaged) {
    startUpdater();
  } else {
    require("devtron").install();
    startApp();
  }
});

function startUpdater() {
  updaterWindow = createUpdaterWindow();

  updaterWindow.webContents.on("did-finish-load", function() {
    updaterWindow.show();
  });

  let betaChannel = rememberStore.get("settings.beta_channel");
  if (betaChannel) {
    autoUpdater.allowPrerelease = true;
  }

  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on("update-not-available", info => {
  console.log("Update not available", info);
  if (mainWindow) {
    mainWindow.webContents.send("set_update_state", "Client up to date!");
  }
  startApp();
});
autoUpdater.on("error", err => {
  if (mainWindow) {
    mainWindow.webContents.send("set_update_state", "Update error.");
  }
  console.log("Update error: ", err);
  startApp();
});
autoUpdater.on("download-progress", progressObj => {
  updaterWindow.webContents.send("update_progress", progressObj);
});
autoUpdater.on("update-downloaded", info => {
  console.log("Update downloaded: ", info);
  installUpdate();
});

function installUpdate() {
  autoUpdater.quitAndInstall(true, true);
}

function startApp() {
  mainWindow = createMainWindow();
  background = createBackgroundWindow();

  globalShortcut.register("Alt+Shift+D", () => {
    if (!background.isVisible()) background.show();
    else background.hide();
    background.toggleDevTools();
    mainWindow.toggleDevTools();
    overlays.forEach(overlay => {
      if (overlay) {
        overlay.toggleDevTools();
      }
    });
  });

  mainWindow.webContents.once("dom-ready", () => {
    mainLoaded = true;
    if (backLoaded == true) {
      background.webContents.send("set_renderer_state", 1);
    }
  });

  background.webContents.once("dom-ready", () => {
    backLoaded = true;
    if (mainLoaded == true) {
      background.webContents.send("set_renderer_state", 1);
    }
  });

  // If we destroy updater before creating another renderer
  // Electron shuts down the whole app.
  if (updaterWindow) {
    updaterWindow.destroy();
    updaterWindow = undefined;
  }

  ipc.on("ipc_switch", function(event, method, from, arg, to) {
    if (debugIPC && method != "log_read") {
      if (
        debugIPC == 2 &&
        method != "set_status" &&
        method != "set_db" &&
        method != "background_set_history_data"
      ) {
        console.log("IPC ", method + ": " + JSON.stringify(arg));
      } else {
        console.log("IPC ", method, "From:", from, "To:", to);
      }
    }
    switch (method) {
      case "ipc_log":
        console.log("IPC LOG: ", arg);
        break;

      case "ipc_error":
        console.log("IPC ERROR: ", arg);
        break;

      case "set_settings":
        setSettings(arg);
        break;

      case "settings_updated":
        mainWindow.webContents.send("settings_updated");
        overlays.forEach(overlay => {
          if (overlay) {
            overlay.webContents.send("settings_updated");
          }
        });
        break;

      case "player_data_refresh":
        mainWindow.webContents.send("player_data_refresh");
        overlays.forEach(overlay => {
          overlay.webContents.send("player_data_refresh");
        });
        break;

      case "set_db":
        mainWindow.webContents.send("set_db", arg);
        overlays.forEach(overlay => {
          overlay.webContents.send("set_db", arg);
        });
        if (autoLogin) {
          background.webContents.send("auto_login");
        }
        break;

      case "popup":
        mainWindow.webContents.send("popup", arg.text, arg.time);
        if (arg.progress) {
          // set progress to <0 to disable
          // set progress to >1 for indeterminate time
          mainWindow.setProgressBar(arg.progress);
        }
        break;

      case "renderer_window_minimize":
        mainWindow.minimize();
        break;

      // to main js / window handling
      case "overlay_show":
        overlaysShow = true;
        overlays_settings.forEach((settings, index) => {
          let overlay = overlays[index];
          if (overlay && settings.show) {
            if (settings.mode == OVERLAY_DRAFT && arg == 2) {
              overlayShow(overlay, true);
            } else if (settings.mode !== OVERLAY_DRAFT && arg == 1) {
              overlayShow(overlay, true);
            }
          }
        });
        break;

      case "overlay_close":
        overlaysShow = false;
        overlays_settings.forEach((settings, index) => {
          let overlay = overlays[index];
          if (overlay && settings.show && settings.show_always == false) {
            if (settings.mode == OVERLAY_DRAFT && arg == 2) {
              overlayShow(overlay, false);
            } else if (settings.mode !== OVERLAY_DRAFT && arg == 1) {
              overlayShow(overlay, false);
            }
          }
        });
        break;

      case "overlay_minimize":
        if (overlays[arg] && !overlays[arg].isMinimized()) {
          overlays[arg].minimize();
        }
        break;

      case "renderer_set_bounds":
        mainWindow.setBounds(arg);
        break;

      case "show_background":
        background.show();
        break;

      case "renderer_show":
        showWindow();
        break;

      case "renderer_hide":
        hideWindow();
        break;

      case "renderer_window_close":
        if (closeToTray) {
          hideWindow();
        } else {
          quit();
        }
        break;

      case "set_close_to_tray":
        closeToTray = arg;
        break;

      case "force_open_settings":
        mainWindow.webContents.send("force_open_settings", true);
        showWindow();
        break;

      case "set_clipboard":
        clipboard.writeText(arg);
        break;

      case "reset_overlay_pos":
        overlays.forEach(overlay => {
          overlay.setPosition(0, 0);
        });
        break;

      case "updates_check":
        startUpdater();
        break;

      case "export_txt":
        dialog.showSaveDialog(
          {
            filters: [
              {
                name: "txt",
                extensions: ["txt"]
              }
            ],
            defaultPath: "~/" + arg.name + ".txt"
          },
          function(file_path) {
            if (file_path) {
              fs.writeFile(file_path, arg.str, function(err) {
                if (err) {
                  dialog.showErrorBox("Error", err);
                  return;
                }
              });
            }
          }
        );
        break;

      case "export_csvtxt":
        dialog.showSaveDialog(
          {
            filters: [
              {
                name: "csv",
                extensions: ["csv"]
              },
              {
                name: "txt",
                extensions: ["txt"]
              }
            ],
            defaultPath: "~/" + arg.name + ".csv"
          },
          function(file_path) {
            if (file_path) {
              fs.writeFile(file_path, arg.str, function(err) {
                if (err) {
                  dialog.showErrorBox("Error", err);
                  return;
                }
              });
            }
          }
        );
        break;

      default:
        if (to == 0) background.webContents.send(method, arg);
        if (to == 1) mainWindow.webContents.send(method, arg);
        if (to == 2) {
          overlays.forEach(overlay => {
            if (overlay) {
              overlay.webContents.send(method, arg);
            }
          });
        }
        break;
    }
  });

  //
  ipc.on("set_draft_cards", function(event, pack, picks, packn, pickn) {
    overlays_settings.forEach((settings, index) => {
      if (settings.mode == OVERLAY_DRAFT) {
        let overlay = overlays[index];
        overlay.webContents.send("set_draft_cards", pack, picks, packn, pickn);
      }
    });
  });

  //
  ipc.on("set_turn", function(
    event,
    playerSeat,
    turnPhase,
    turnStep,
    turnNumber,
    turnActive,
    turnPriority,
    turnDecision
  ) {
    overlays_settings.forEach((settings, index) => {
      if (settings.mode !== OVERLAY_DRAFT) {
        let overlay = overlays[index];
        overlay.webContents.send(
          "set_turn",
          playerSeat,
          turnPhase,
          turnStep,
          turnNumber,
          turnActive,
          turnPriority,
          turnDecision
        );
      }
    });
  });
}

function setSettings(settings) {
  app.setLoginItemSettings({
    openAtLogin: settings.startup
  });
  closeToTray = settings.close_to_tray;
  autoLogin = settings.auto_login;
  launchToTray = settings.launch_to_tray;

  if (!launchToTray && firstSettingsRead) {
    showWindow();
  }

  overlays_settings = settings.overlays;

  updateOverlays(settings);
  firstSettingsRead = false;
}

// Catch exceptions
process.on("uncaughtException", function(err) {
  console.log("Uncaught exception;");
  console.log(err.stack);
  //console.log('Current chunk:',  currentChunk);
});

function onClosed() {
  mainWindow = null;
}

function onOverlayClosed() {
  //  overlay = null;
}

function hideWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  }
}

function toggleWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    if (!mainWindow.isMinimized()) {
      mainWindow.minimize();
    } else {
      showWindow();
    }
  } else {
    showWindow();
  }
}

function showWindow() {
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
  }
  if (updaterWindow && !updaterWindow.isVisible()) {
    updaterWindow.show();
  }
}

function quit() {
  app.quit();
}

function saveWindowPos() {
  var obj = {};
  var bounds = mainWindow.getBounds();
  var pos = mainWindow.getPosition();
  obj.width = Math.floor(bounds.width);
  obj.height = Math.floor(bounds.height);
  obj.x = Math.floor(pos[0]);
  obj.y = Math.floor(pos[1]);
  background.webContents.send("windowBounds", obj);
}

function createUpdaterWindow() {
  const win = new electron.BrowserWindow({
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    center: true,
    show: false,
    width: 320,
    height: 240,
    title: "Updater",
    icon: "icon.png",
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.loadURL(`file://${__dirname}/window_updater/index.html`);

  return win;
}

function createBackgroundWindow() {
  const win = new electron.BrowserWindow({
    frame: false,
    x: 0,
    y: 0,
    show: debugBack,
    width: 640,
    height: 480,
    title: "Background",
    icon: "icon.png",
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.loadURL(`file://${__dirname}/window_background/index.html`);
  win.on("closed", onClosed);

  return win;
}

function createMainWindow() {
  const win = new electron.BrowserWindow({
    backgroundColor: "#000",
    frame: false,
    show: false,
    width: 800,
    height: 600,
    title: "MTG Arena Tool",
    icon: "icon.png",
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.loadURL(`file://${__dirname}/window_main/index.html`);
  win.on("closed", onClosed);

  let iconPath = path.join(__dirname, "icon-tray.png");
  if (process.platform == "win32") {
    iconPath = path.join(__dirname, "icon.ico");
  }
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        showWindow();
      }
    },
    {
      label: "Quit",
      click: () => {
        quit();
      }
    }
  ]);
  tray.on("double-click", toggleWindow);
  tray.setToolTip("MTG Arena Tool");
  tray.setContextMenu(contextMenu);

  win.on("resize", () => {
    saveWindowPos();
  });

  win.on("move", function() {
    if (mainTimeout) {
      clearTimeout(mainTimeout);
      mainTimeout = null;
    }
    mainTimeout = setTimeout(function() {
      saveWindowPos();
      mainTimeout = null;
    }, 100);
  });

  return win;
}

function createOverlay(settings, index) {
  let alphaEnabled = settings.alpha_back < 1;
  console.log(
    `bounds x: ${settings.bounds.x} y: ${settings.bounds.y} w: ${
      settings.bounds.width
    } h: ${settings.bounds.height} `
  );
  const over = new electron.BrowserWindow({
    transparent: alphaEnabled,
    frame: false,
    alwaysOnTop: settings.ontop,
    x: settings.bounds.x,
    y: settings.bounds.y,
    width: settings.bounds.width,
    height: settings.bounds.height,
    show: false,
    title: "MTG Arena Tool",
    icon: "iconoverlay.png",
    webPreferences: {
      nodeIntegration: true
    }
  });
  over.loadURL(`file://${__dirname}/window_overlay/index.html`);
  over.on("closed", onOverlayClosed);

  over.on("resize", function() {
    saveOverlayPos(index);
  });

  over.on("move", function() {
    //console.log(new Date().getTime());
    let timer = overlaysTimeout[index];
    if (timer) {
      clearTimeout(timer);
    }
    overlaysTimeout[index] = setTimeout(function() {
      saveOverlayPos(index);
      overlaysTimeout[index] = null;
    }, 100);
  });

  over.once("did-finish-load", function() {
    over.webContents.send("set_overlay_index", index);
  });

  return over;
}

function saveOverlayPos(index) {
  if (!overlays[index]) return false;

  var obj = {};
  var bounds = overlays[index].getBounds();
  var pos = overlays[index].getPosition();
  obj.width = Math.floor(bounds.width);
  obj.height = Math.floor(bounds.height);
  obj.x = Math.floor(pos[0]);
  obj.y = Math.floor(pos[1]);

  //console.log(`${index} moved to x:${bounds.x} y:${bounds.y}`);
  background.webContents.send("overlayBounds", index, obj);
}

function overlayShow(overlay, show) {
  if (show && !overlay.isVisible()) {
    overlay.showInactive();
  } else if (!show && overlay.isVisible()) {
    overlay.hide();
  }
}

function overlaySetSettings(overlay, settings, index) {
  overlay.setAlwaysOnTop(settings.ontop, "floating");
  overlay.setBounds(settings.bounds);
  if (overlaysShow || settings.show == false) {
    overlayShow(overlay, settings.show);
  }
  if (settings.show_always == true) {
    overlayShow(overlay, true);
  }

  let oldAlphaEnabled = overlaysAlpha[index];
  let alphaEnabled = settings.alpha_back < 1;
  if (oldAlphaEnabled != alphaEnabled) {
    recreateOverlay(overlay, settings, index);
  }
  overlaysAlpha[index] = alphaEnabled;
}

function recreateOverlay(overlay, settings, index) {
  if (overlay) {
    overlay.destroy();
    overlay = createOverlay(settings, index);
    overlays[index] = overlay;
  }
  return overlay;
}

function updateOverlays(settings) {
  settings.overlays.forEach((overlaySettings, index) => {
    let overlay = overlays[index];
    if (!overlay) {
      overlay = createOverlay(overlaySettings, index);
      overlays[index] = overlay;
    }

    overlay.webContents.send("set_overlay_index", index);

    overlaySetSettings(overlay, overlaySettings, index);
  });
}

app.on("window-all-closed", () => {
  quit();
});

app.on("activate", () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
  }
});
