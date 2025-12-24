// File: electron/main.cjs
// Load environment variables from .env.local ONLY

const path = require("path");
const fs = require("fs");

// ONLY load .env.local - no other env files
// For dev: uses .env.local from project root
// For packaged: uses .env.local copied to standalone directory
try {
  const dotenv = require("dotenv");
  
  // Try project root first (development)
  const envLocalPath = path.resolve(__dirname, "../.env.local");
  // Try standalone directory (packaged build)
  const standaloneEnvLocalPath = path.resolve(__dirname, "../.next/standalone/.env.local");

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log("[Electron] Loaded .env.local from project root");
  } else if (fs.existsSync(standaloneEnvLocalPath)) {
    dotenv.config({ path: standaloneEnvLocalPath });
    console.log("[Electron] Loaded .env.local from standalone directory");
  } else {
    console.log("[Electron] No .env.local found - using system environment variables");
  }
} catch (err) {
  // dotenv not available - this is OK in production with system env vars
  console.log("[Electron] dotenv not available (using system environment variables)");
}

// Log critical environment variables for debugging (mask sensitive values)
console.log("[Electron] Environment check:");
console.log("  NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("  PORT:", process.env.PORT || "not set");
console.log("  AUTH_SECRET:", process.env.AUTH_SECRET ? "✓ set (" + process.env.AUTH_SECRET.length + " chars)" : "✗ MISSING");
console.log("  AUTH_DISCORD_ID:", process.env.AUTH_DISCORD_ID ? "✓ set" : "✗ MISSING");
console.log("  AUTH_DISCORD_SECRET:", process.env.AUTH_DISCORD_SECRET ? "✓ set" : "✗ MISSING");
console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ MISSING");
console.log("  NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "not set (using default)");
console.log("  ELECTRON_BUILD:", process.env.ELECTRON_BUILD || "not set");

const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  dialog,
  session,
} = require("electron");
const { spawn } = require("child_process");
const http = require("http");

// Production detection: packaged apps or explicit ELECTRON_PROD flag
const isDev = !app.isPackaged && process.env.ELECTRON_PROD !== "true";
const enableDevTools = isDev || process.env.ELECTRON_DEV_TOOLS === "true";
const port = parseInt(process.env.PORT || "3222", 10);

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;

// Window state storage
const windowStateFile = path.join(app.getPath("userData"), "window-state.json");

/**
 * @param {...any} args
 */
const log = (...args) => {
  console.log("[Electron]", ...args);
};

/**
 * Load saved window state
 * @returns {{width: number, height: number, x?: number, y?: number, isMaximized: boolean}}
 */
const loadWindowState = () => {
  try {
    if (fs.existsSync(windowStateFile)) {
      const data = fs.readFileSync(windowStateFile, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    log("Failed to load window state:", err);
  }

  // Default window state
  return {
    width: 1200,
    height: 800,
    isMaximized: false,
  };
};

/**
 * Save current window state
 * @param {BrowserWindow} window
 */
const saveWindowState = (window) => {
  try {
    const bounds = window.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized(),
    };
    fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2));
    log("Window state saved");
  } catch (err) {
    log("Failed to save window state:", err);
  }
};

/**
 * @param {number} startPort
 * @returns {Promise<number>}
 */
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const address = server.address();
      const port =
        typeof address === "object" && address !== null
          ? address.port
          : startPort;
      server.close(() => {
        log(`Found available port: ${port}`);
        resolve(port);
      });
    });
    server.on("error", () => {
      log(`Port ${startPort} in use, trying ${startPort + 1}`);
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

/**
 * @param {number} port
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
const waitForServer = (port, maxAttempts = 30) => {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkServer = () => {
      log(
        `Checking server on port ${port} (attempt ${attempts + 1}/${maxAttempts})`,
      );
      http
        .get(`http://localhost:${port}`, (res) => {
          log(`Server responded with status: ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve(true);
          } else {
            retry();
          }
        })
        .on("error", (err) => {
          log(`Server check error: ${err.message}`);
          retry();
        });
    };

    const retry = () => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 1000);
      } else {
        log("Server failed to start after max attempts");
        resolve(false);
      }
    };

    checkServer();
  });
};

const startServer = async () => {
  const serverPort = await findAvailablePort(port);

  // Determine paths - standalone directory contains everything
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  const serverPath = path.join(standaloneDir, "server.js");

  log("Paths:");
  log("  Standalone dir:", standaloneDir);
  log("  Server:", serverPath);
  log("  isPackaged:", app.isPackaged);

  // Check if server.js exists
  if (!fs.existsSync(serverPath)) {
    const error = `Server file not found: ${serverPath}`;
    log("ERROR:", error);
    dialog.showErrorBox("Server Error", error);
    throw new Error(error);
  }

  log("Server file exists, starting...");

  return new Promise((resolve, reject) => {
    // Run server from standalone directory (it contains .next/static and public)
    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: serverPort.toString(),
        HOSTNAME: "localhost",
        NODE_ENV: "production",
      },
      cwd: standaloneDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess.stdout?.on("data", (data) => {
      log("[Server STDOUT]:", data.toString().trim());
    });

    serverProcess.stderr?.on("data", (data) => {
      log("[Server STDERR]:", data.toString().trim());
    });

    serverProcess.on("error", (err) => {
      log("[Server ERROR]:", err);
      reject(err);
    });

    serverProcess.on("exit", (code, signal) => {
      log(`[Server EXIT] Code: ${code}, Signal: ${signal}`);
    });

    // Wait for server to be ready
    waitForServer(serverPort).then((ready) => {
      if (ready) {
        log(`Server started successfully on port ${serverPort}`);
        resolve(serverPort);
      } else {
        const error = "Server failed to respond after 30 seconds";
        log("ERROR:", error);
        reject(new Error(error));
      }
    });
  });
};

const createWindow = async () => {
  log("Creating window...");
  log(`Mode: ${isDev ? "Development" : "Production"}`);
  log(`Packaged: ${app.isPackaged}`);
  log(`ELECTRON_PROD: ${process.env.ELECTRON_PROD}`);
  log(`Dev Tools Enabled: ${enableDevTools}`);
  let serverUrl;

  if (isDev) {
    log("Development mode - connecting to dev server");
    serverUrl = `http://localhost:${port}`;
  } else {
    log("Production mode - starting bundled server");
    try {
      const serverPort = await startServer();
      serverUrl = `http://localhost:${serverPort}`;
      log(`Will load URL: ${serverUrl}`);
    } catch (err) {
      log("FATAL ERROR starting server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      dialog.showErrorBox(
        "Server Start Failed",
        `Failed to start the application server:\n\n${errorMessage}\n\nCheck the console for details.`,
      );
      app.quit();
      return;
    }
  }

  // Load saved window state
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: enableDevTools,
      // Enable persistent storage partition
      partition: "persist:darkfloor-art",
    },
    icon: path.join(__dirname, "../public/icon.png"),
    backgroundColor: "#000000",
    show: false,
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on resize and move
  mainWindow.on("resize", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("move", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("maximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.webContents.on("did-start-loading", () => {
    log("Page started loading");
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log("Page finished loading");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      log("Page failed to load:", errorCode, errorDescription);
    },
  );

  mainWindow.once("ready-to-show", () => {
    log("Window ready to show");
    mainWindow?.show();
    if (enableDevTools) {
      mainWindow?.webContents.openDevTools();
    }
  });

  log(`Loading URL: ${serverUrl}`);
  mainWindow.loadURL(serverUrl);

  mainWindow.on("close", () => {
    // Save window state before closing
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("closed", () => {
    log("Window closed");
    mainWindow = null;
  });

  registerMediaKeys();
};

const registerMediaKeys = () => {
  try {
    globalShortcut.register("MediaPlayPause", () => {
      mainWindow?.webContents.send("media-key", "play-pause");
    });

    globalShortcut.register("MediaNextTrack", () => {
      mainWindow?.webContents.send("media-key", "next");
    });

    globalShortcut.register("MediaPreviousTrack", () => {
      mainWindow?.webContents.send("media-key", "previous");
    });
    log("Media keys registered");
  } catch (err) {
    log("Failed to register media keys:", err);
  }
};

app.whenReady().then(() => {
  log("App ready");

  // Configure session persistence
  const ses = session.defaultSession;

  // Set persistent storage path for cookies and cache
  const userDataPath = app.getPath("userData");
  log("User data path:", userDataPath);

  // Log storage path
  log("Storage path:", ses.getStoragePath());

  // Set cookie persistence - cookies won't expire on app restart
  ses.cookies.on("changed", (_event, cookie, cause, removed) => {
    if (!removed && isDev) {
      log(`Cookie set: ${cookie.name} (${cause})`);
    }
  });

  // Flush cookie store to ensure persistence
  ses.cookies.flushStore().then(() => {
    log("Session configured with persistent storage");
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Gracefully shutdown the server process
 * @returns {Promise<void>}
 */
const shutdownServer = () => {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }

    log("Shutting down server gracefully...");

    // Try graceful shutdown first (SIGTERM)
    serverProcess.kill("SIGTERM");

    // Force kill after 5 seconds if not stopped
    const killTimeout = setTimeout(() => {
      if (serverProcess) {
        log("Force killing server process");
        serverProcess.kill("SIGKILL");
      }
    }, 5000);

    serverProcess.on("exit", () => {
      clearTimeout(killTimeout);
      log("Server process terminated");
      serverProcess = null;
      resolve();
    });
  });
};

app.on("window-all-closed", async () => {
  log("All windows closed");
  await shutdownServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", async (event) => {
  log("App will quit");
  event.preventDefault();

  globalShortcut.unregisterAll();

  // Flush cookies before quitting to ensure they're saved
  try {
    await session.defaultSession.cookies.flushStore();
    log("Cookies flushed to disk");
  } catch (err) {
    log("Error flushing cookies:", err);
  }

  await shutdownServer();

  app.exit(0);
});

if (!isDev) {
  Menu.setApplicationMenu(null);
}

process.on("uncaughtException", (err) => {
  log("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  log("Unhandled rejection:", err);
});
