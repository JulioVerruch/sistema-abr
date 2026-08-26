const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");

const { DESKTOP_CONFIG } = require("./app-config.cjs");

const isDev = !app.isPackaged;

const APP_URL =
  process.env.ABR_DESKTOP_URL ||
  (isDev ? DESKTOP_CONFIG.devUrl : DESKTOP_CONFIG.productionUrl);

let mainWindow = null;

function isAllowedAppUrl(url) {
  try {
    const target = new URL(url);
    const appUrl = new URL(APP_URL);

    // Durante desenvolvimento, permite apenas o localhost
    // configurado. Em produção, permite apenas a origem oficial.
    return target.protocol === appUrl.protocol && target.host === appUrl.host;
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#0d0e0d",
    autoHideMenuBar: true,
    title: "ABR Agro | Gestão Agropecuária",
    icon: path.join(__dirname, "..", "public", "logo", "abr-agro.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedAppUrl(url)) {
      return {
        action: "allow",
      };
    }

    void shell.openExternal(url);
    return {
      action: "deny",
    };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedAppUrl(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.loadURL(APP_URL).catch((error) => {
    console.error("[ABR Desktop] Falha ao carregar:", error);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Não persistimos credenciais localmente no Electron.
  // A autenticação continua no servidor da aplicação.
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    },
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
