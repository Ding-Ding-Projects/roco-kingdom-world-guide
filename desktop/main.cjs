const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { app, BrowserWindow, ipcMain, protocol, shell } = require("electron");
const handledSquirrelEvent = require("electron-squirrel-startup");
const statusHub = require("./status-hub-client/status-hub-client.cjs");

if (handledSquirrelEvent) {
  app.quit();
} else {

protocol.registerSchemesAsPrivileged([
  {
    scheme: "roco",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false
    }
  }
]);

const appUrl = "roco://app/index.html";
const contentRoot = path.join(app.getAppPath(), "dist");
let statusClient = null;
let statusStartPromise = null;
let statusStopPromise = null;
let statusQuitStarted = false;
let allowFinalQuit = false;
let lastTerminalStatus = null;
let lastTerminalAt = null;
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" }
  });
}

function isTrustedAppFrame(event) {
  return event.senderFrame?.url === appUrl;
}

function readPublicStatus() {
  const configured = Boolean(process.env.AGENT_INGEST_TOKEN);
  if (!configured) {
    return { desktop: true, configured: false, enabled: false, state: "configuration-required", lastUpdated: null };
  }
  if (statusStopPromise) {
    const current = statusClient?.status();
    return { desktop: true, configured: true, enabled: true, state: "finishing", lastUpdated: current?.lastSuccessAt || null };
  }
  if (statusClient) {
    const current = statusClient.status();
    return {
      desktop: true,
      configured: true,
      enabled: true,
      state: current.degraded ? "unavailable" : "reporting",
      lastUpdated: current.lastSuccessAt || null
    };
  }
  return {
    desktop: true,
    configured: true,
    enabled: false,
    state: lastTerminalStatus === false ? "unconfirmed" : "off",
    lastUpdated: lastTerminalAt
  };
}

async function buildStatusContext() {
  let sourceBranch = "unknown";
  try {
    const buildInfo = JSON.parse(await fs.readFile(path.join(contentRoot, "data", "build-info.json"), "utf8"));
    if (typeof buildInfo.sourceBranch === "string" && buildInfo.sourceBranch.trim()) sourceBranch = buildInfo.sourceBranch.trim();
  } catch {}

  let worktrees = [];
  try {
    await fs.access(path.join(app.getAppPath(), ".git"));
    worktrees = await statusHub.collectWorktrees({ repoPath: app.getAppPath() });
  } catch {}

  return {
    branch: sourceBranch,
    machine: statusHub.machineLabel(),
    worktrees
  };
}

async function enableStatusReporting() {
  if (!process.env.AGENT_INGEST_TOKEN) return readPublicStatus();
  if (statusStopPromise) await statusStopPromise.catch(() => {});
  if (statusClient) return readPublicStatus();
  if (!statusStartPromise) {
    statusStartPromise = (async () => {
      const context = await buildStatusContext();
      const client = await statusHub.createStatusHubClient({
        sessionId: `roco-guide-${Date.now().toString(36)}-${randomBytes(8).toString("hex")}`,
        title: "RoCo Kingdom World Field Guide desktop session",
        repository: "Ding-Ding-Projects/roco-kingdom-world-guide",
        branch: context.branch,
        machine: context.machine,
        worktrees: context.worktrees,
        summary: "Desktop field guide opened. Guide searches, saved notes, and browsing history are not reported.",
        exitHooks: false
      });
      statusClient = client;
    })().finally(() => { statusStartPromise = null; });
  }
  await statusStartPromise;
  return readPublicStatus();
}

async function finishStatusReporting(summary) {
  if (statusStopPromise) return statusStopPromise;
  if (statusStartPromise) await statusStartPromise.catch(() => {});
  const client = statusClient;
  statusClient = null;
  if (!client) return;
  statusStopPromise = (async () => {
    const result = await client.finish("waiting", { summary });
    const finalStatus = client.status();
    lastTerminalStatus = Boolean(result?.ok);
    lastTerminalAt = finalStatus.lastSuccessAt || null;
  })().finally(() => { statusStopPromise = null; });
  await statusStopPromise;
}

ipcMain.handle("roco:status:get", (event) => {
  if (!isTrustedAppFrame(event)) throw new Error("Untrusted app message.");
  return readPublicStatus();
});

ipcMain.handle("roco:status:set", async (event, enabled) => {
  if (!isTrustedAppFrame(event)) throw new Error("Untrusted app message.");
  if (enabled === true) return enableStatusReporting();
  await finishStatusReporting("Desktop field guide reporting was turned off by the user.");
  return readPublicStatus();
});

async function serveLocalContent(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return textResponse("Method not allowed", 405);

  const url = new URL(request.url);
  if (url.hostname !== "app") return textResponse("Not found", 404);

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return textResponse("Bad request", 400);
  }
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.resolve(contentRoot, `.${pathname}`);
  const relativePath = path.relative(contentRoot, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return textResponse("Not found", 404);

  let file;
  try {
    file = await fs.readFile(filePath);
  } catch {
    return textResponse("Not found", 404);
  }

  const contentType = contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
  return new Response(request.method === "HEAD" ? null : file, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-length": String(file.byteLength),
      "content-type": contentType,
      "x-content-type-options": "nosniff"
    }
  });
}

function openWindow() {
  const window = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 760,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(app.getAppPath(), "desktop", "assets", "roco-kingdom-world-guide.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  window.webContents.session.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (_details, callback) => callback({ cancel: true })
  );
  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("roco://app/")) return;
    event.preventDefault();
    if (url.startsWith("https://")) void shell.openExternal(url);
  });
  window.once("ready-to-show", () => window.show());
  void window.loadURL(appUrl);
  return window;
}

app.setAppUserModelId("com.squirrel.RocoKingdomWorldGuide.RocoKingdomWorldGuide");

app.whenReady().then(async () => {
  await protocol.handle("roco", serveLocalContent);
  openWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  if (allowFinalQuit || (!statusClient && !statusStartPromise && !statusStopPromise)) return;
  event.preventDefault();
  if (statusQuitStarted) return;
  statusQuitStarted = true;
  void finishStatusReporting("Desktop field guide closed; reporting session ended.")
    .finally(() => {
      allowFinalQuit = true;
      app.quit();
    });
});
}
