const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');

let serverProcess = null;
let mainWindow = null;

let isDev = false;
try {
  require.resolve('tsx/cjs');
  isDev = !app.isPackaged;
} catch (e) {
  isDev = false;
}

// In dev mode, load FileSystemService from TypeScript source via tsx
// In production, use the inlined implementation below
let FileSystemService;

if (isDev) {
  require('tsx/cjs');
  FileSystemService = require('./src/services/FileSystemService.ts').FileSystemService;
} else {
  // ============================================================
  // INLINED FileSystemService for production builds
  // This avoids importing the esbuild-bundled .cjs which breaks
  // inside asar archives due to import.meta.url / createRequire shims.
  // ============================================================
  const CACHE_TTL_MS = 60000;
  const listCache = new Map();

  // Try to load sharp, but it's optional (only for thumbnails)
  let sharp = null;
  try {
    sharp = require('sharp');
  } catch (e) {
    // sharp not available in production portable — thumbnails will be full-size
  }

  function invalidateCache(dirPath) {
    listCache.delete(dirPath);
  }

  function resolveFsPath(reqPath, mode) {
    if (mode === 'global') {
      if (reqPath && /^[a-zA-Z]:$/.test(reqPath)) {
        return reqPath + path.sep;
      }
      return reqPath ? path.normalize(reqPath) : '';
    }
    const root = path.join(os.homedir(), 'Documents', 'FlowStudio-Data');
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    const safePath = path.normalize(reqPath || '/').replace(/^(\.\.([\/\\]|$))+/, '');
    return path.join(root, safePath);
  }

  FileSystemService = {
    getDrives() {
      return new Promise((resolve, reject) => {
        exec('wmic logicaldisk get name,freespace,size', (error, stdout) => {
          if (error) return reject(error);
          const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
          const drives = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(/\s+/);
            if (parts.length >= 2) {
              let name = '', freeSpace = 0, totalSize = 0;
              if (parts.length === 3) {
                freeSpace = parseInt(parts[0], 10) || 0;
                name = parts[1];
                totalSize = parseInt(parts[2], 10) || 0;
              } else if (parts.length === 2) {
                name = parts[0];
                if (name.length > 2) name = parts[1];
              } else {
                name = parts[0];
              }
              if (name && name.endsWith(':') && totalSize > 0) {
                drives.push({ name, isDir: true, size: totalSize, freeSpace, modifiedAt: '' });
              }
            }
          }
          resolve({ files: drives });
        });
      });
    },

    getQuickAccess() {
      const homedir = app.getPath('home');
      return {
        home: homedir,
        desktop: app.getPath('desktop'),
        documents: app.getPath('documents'),
        downloads: app.getPath('downloads'),
        pictures: app.getPath('pictures'),
        videos: app.getPath('videos'),
        music: app.getPath('music')
      };
    },

    async listFiles(reqPath, mode, forceRefresh) {
      const targetPath = resolveFsPath(reqPath, mode);
      if (mode === 'global' && !targetPath) return this.getDrives();
      if (!fs.existsSync(targetPath)) {
        if (mode !== 'global') {
          fs.mkdirSync(targetPath, { recursive: true });
        } else {
          return { files: [] };
        }
      }

      if (!forceRefresh && listCache.has(targetPath)) {
        const entry = listCache.get(targetPath);
        if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
          return { files: entry.files };
        }
      }

      const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
      const batchSize = 100;
      const files = [];
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (e) => {
          const ePath = path.join(targetPath, e.name);
          let size = 0, modifiedAt = '';
          try {
            const stat = await fs.promises.stat(ePath);
            size = stat.size;
            modifiedAt = stat.mtime.toISOString();
          } catch (err) {}
          return { name: e.name, isDir: e.isDirectory(), size, modifiedAt };
        }));
        files.push(...batchResults);
      }
      files.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      listCache.set(targetPath, { timestamp: Date.now(), files });
      return { files };
    },

    async readFileString(reqPath, mode) {
      const targetPath = resolveFsPath(reqPath, mode);
      if (!fs.existsSync(targetPath)) throw new Error('Not found');
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) throw new Error('Is a directory');
      return fs.readFileSync(targetPath, 'utf8');
    },

    async readFileBase64(reqPath, mode, options) {
      const targetPath = resolveFsPath(reqPath, mode);
      if (!fs.existsSync(targetPath)) throw new Error('Not found');
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) throw new Error('Is a directory');

      if (options && options.thumb && sharp) {
        const ext = path.extname(targetPath).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
          try {
            const buffer = await sharp(targetPath).resize(256, 256, { fit: 'cover' }).toBuffer();
            return buffer.toString('base64');
          } catch (err) { /* fallback */ }
        }
      }
      return fs.readFileSync(targetPath).toString('base64');
    },

    async mkdir(targetPath, name, mode) {
      const dir = resolveFsPath(path.join(targetPath || '/', name), mode);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        invalidateCache(path.dirname(dir));
      }
      return { success: true };
    },

    async rename(oldPath, newPath, mode) {
      const oldT = resolveFsPath(oldPath, mode);
      const newT = resolveFsPath(newPath, mode);
      if (fs.existsSync(oldT)) {
        fs.renameSync(oldT, newT);
        invalidateCache(path.dirname(oldT));
        invalidateCache(path.dirname(newT));
      }
      return { success: true };
    },

    async copy(sourcePath, targetPath, mode) {
      const src = resolveFsPath(sourcePath, mode);
      const dest = resolveFsPath(targetPath, mode);
      if (!fs.existsSync(src)) throw new Error('Source not found');
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      invalidateCache(path.dirname(dest));
      return { success: true };
    },

    async delete(delPath, mode) {
      const targetPath = resolveFsPath(delPath, mode);
      if (fs.existsSync(targetPath)) {
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(targetPath);
        }
        invalidateCache(path.dirname(targetPath));
      }
      return { success: true };
    },

    async trash(delPath, mode) {
      const targetPath = resolveFsPath(delPath, mode);
      if (fs.existsSync(targetPath)) {
        await shell.trashItem(targetPath);
        invalidateCache(path.dirname(targetPath));
      }
      return { success: true };
    },

    async openDefault(reqPath, mode) {
      const targetPath = resolveFsPath(reqPath, mode);
      if (fs.existsSync(targetPath)) {
        await shell.openPath(targetPath);
      }
      return { success: true };
    },

    async getProperties(reqPath, mode) {
      const targetPath = resolveFsPath(reqPath, mode);
      if (fs.existsSync(targetPath)) {
        const stat = fs.statSync(targetPath);
        return {
          size: stat.size,
          created: stat.birthtime.toISOString(),
          modified: stat.mtime.toISOString(),
          isDirectory: stat.isDirectory()
        };
      }
      throw new Error('Not found');
    },

    async upload(targetPath, mode, arrayBuffer) {
      const dest = resolveFsPath(targetPath, mode);
      const parentDir = path.dirname(dest);
      if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
      fs.writeFileSync(dest, Buffer.from(arrayBuffer));
      invalidateCache(parentDir);
      return { success: true };
    }
  };
}

// ============================================================
// Backend server management
// ============================================================
let detectedBackendPort = null;

function startBackend() {
  return new Promise((resolve) => {
    if (isDev) {
      console.log('Running in development mode. Assuming backend is started externally.');
      resolve(3001);
      return;
    }

    console.log('Starting backend server process...');
    let serverPath = path.join(__dirname, 'dist-server', 'server.cjs');
    if (serverPath.includes('app.asar')) {
      serverPath = serverPath.replace('app.asar', 'app.asar.unpacked');
    }
    console.log(`[Main] Server path: ${serverPath}`);
    let resolved = false;

    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      console.log(`[Backend]: ${text}`);
      // Parse the port from the server's stdout announcement
      const match = text.match(/Server running on http:\/\/127\.0\.0\.1:(\d+)/);
      if (match && !resolved) {
        resolved = true;
        detectedBackendPort = parseInt(match[1], 10);
        console.log(`[Main] Detected backend port: ${detectedBackendPort}`);
        resolve(detectedBackendPort);
      }
    });

    serverProcess.stderr.on('data', (data) => console.error(`[Backend Error]: ${data}`));
    serverProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    // Safety timeout: if server doesn't announce port within 15s, give up gracefully
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('[Main] Backend did not announce port within 15 seconds');
        resolve(null);
      }
    }, 15000);
  });
}

let splashWindow = null;
let splashStartTime = 0;

function createSplashWindow() {
  splashStartTime = Date.now();
  splashWindow = new BrowserWindow({
    width: 720,
    height: 480,
    icon: path.join(__dirname, 'icon.ico'),
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: false,
    center: true,
    show: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath).catch(e => console.error('[Main] Splash load error:', e));
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ============================================================
// Window creation
// ============================================================
function createWindow(backendPort) {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 768,
    title: 'Flow-Studio',
    icon: path.join(__dirname, 'icon.ico'),
    show: false, // Don't show main window until content is loaded
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.removeMenu();

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[Main] MainWindow did-fail-load: ${code} - ${desc} for ${url}`);
  });

  const showMainAndCloseSplash = () => {
    const elapsed = Date.now() - splashStartTime;
    const remaining = Math.max(0, 1200 - elapsed);

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.maximize();
        mainWindow.show();
        mainWindow.focus();
      }
    }, remaining);
  };

  mainWindow.once('ready-to-show', showMainAndCloseSplash);

  // Fallback in case ready-to-show doesn't trigger quickly
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      showMainAndCloseSplash();
    }
  }, 8000);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const targetPort = backendPort || 3009;
    console.log(`Loading production app at http://127.0.0.1:${targetPort}`);
    mainWindow.loadURL(`http://127.0.0.1:${targetPort}`);
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ============================================================
// IPC handlers
// ============================================================
ipcMain.handle('fs:getDrives', async () => await FileSystemService.getDrives());
ipcMain.handle('fs:getQuickAccess', () => FileSystemService.getQuickAccess());
ipcMain.handle('fs:listFiles', async (event, reqPath, mode, forceRefresh) => await FileSystemService.listFiles(reqPath, mode, forceRefresh));
ipcMain.handle('fs:readFileString', async (event, reqPath, mode) => await FileSystemService.readFileString(reqPath, mode));
ipcMain.handle('fs:readFileBase64', async (event, reqPath, mode, options) => await FileSystemService.readFileBase64(reqPath, mode, options));
ipcMain.handle('fs:mkdir', async (event, targetPath, name, mode) => await FileSystemService.mkdir(targetPath, name, mode));
ipcMain.handle('fs:rename', async (event, oldPath, newPath, mode) => await FileSystemService.rename(oldPath, newPath, mode));
ipcMain.handle('fs:copy', async (event, sourcePath, targetPath, mode) => await FileSystemService.copy(sourcePath, targetPath, mode));
ipcMain.handle('fs:delete', async (event, delPath, mode) => await FileSystemService.delete(delPath, mode));
ipcMain.handle('fs:trash', async (event, delPath, mode) => await FileSystemService.trash(delPath, mode));
ipcMain.handle('fs:openDefault', async (event, reqPath, mode) => await FileSystemService.openDefault(reqPath, mode));
ipcMain.handle('fs:getProperties', async (event, reqPath, mode) => await FileSystemService.getProperties(reqPath, mode));
ipcMain.handle('fs:createFile', async (event, targetPath, name, mode) => {
  const destDir = resolveFsPath(targetPath, mode);
  const destFile = path.join(destDir, name);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destFile, '');
  invalidateCache(destDir);
  return { success: true };
});
ipcMain.handle('fs:upload', async (event, targetPath, mode, arrayBuffer) => await FileSystemService.upload(targetPath, mode, arrayBuffer));
ipcMain.handle('fs:selectFolder', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Data Storage Directory',
    defaultPath: defaultPath && fs.existsSync(defaultPath) ? defaultPath : undefined,
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true };
  }
  return { path: result.filePaths[0] };
});

// Project folder management
const sanitizeProjectName = (name) => name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'Unnamed Project';

const getProjectsRoot = () => {
  const configPath = path.join(process.cwd(), 'flowstudio.config.json');
  let dataPath = path.join(os.homedir(), 'Documents', 'FlowStudio-Data');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (cfg.dataPath) dataPath = cfg.dataPath;
    } catch (e) {}
  }
  const projectsRoot = path.join(dataPath, 'Projects');
  if (!fs.existsSync(projectsRoot)) fs.mkdirSync(projectsRoot, { recursive: true });
  return { projectsRoot, dataPath };
};

ipcMain.handle('projects:getFolder', (event, projectId, projectName) => {
  try {
    if (!projectId) return { path: null };
    const { projectsRoot, dataPath } = getProjectsRoot();

    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    // 1. Try to find by .flow-id
    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFilePath = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFilePath)) {
        const id = fs.readFileSync(idFilePath, 'utf-8').trim();
        if (id === projectId) {
          return { path: folderPath, folderName: dirent.name, dataPath };
        }
      }
    }

    // 2. Try to find by exact name (Legacy fallback)
    if (projectName) {
      const safeName = sanitizeProjectName(projectName);
      const legacyPath = path.join(projectsRoot, safeName);
      if (fs.existsSync(legacyPath)) {
        // Claim it by writing .flow-id
        fs.writeFileSync(path.join(legacyPath, '.flow-id'), projectId, 'utf-8');
        return { path: legacyPath, folderName: safeName, dataPath };
      }
    }

    return { path: null, dataPath };
  } catch (e) {
    return { path: null };
  }
});

ipcMain.handle('projects:createFolder', (event, projectId, projectName) => {
  try {
    if (!projectId || !projectName) return { path: null };
    const { projectsRoot, dataPath } = getProjectsRoot();

    const safeName = sanitizeProjectName(projectName);
    let folderName = safeName;
    let newFolder = path.join(projectsRoot, folderName);
    let counter = 2;

    while (fs.existsSync(newFolder)) {
      folderName = `${safeName} ${counter}`;
      newFolder = path.join(projectsRoot, folderName);
      counter++;
    }

    fs.mkdirSync(newFolder, { recursive: true });
    fs.writeFileSync(path.join(newFolder, '.flow-id'), projectId, 'utf-8');

    return { path: newFolder, folderName, dataPath };
  } catch (e) {
    return { path: null };
  }
});

ipcMain.handle('projects:openFolder', async (event, projectId, projectName) => {
  try {
    if (!projectId) return { success: false, error: 'projectId is required' };
    const { projectsRoot } = getProjectsRoot();

    let targetPath = null;

    // 1. Find by .flow-id marker
    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFile = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFile) && fs.readFileSync(idFile, 'utf-8').trim() === projectId) {
        targetPath = folderPath;
        break;
      }
    }

    // 2. Find by project name (legacy) or create new folder
    if (!targetPath && projectName) {
      const safeName = sanitizeProjectName(projectName);
      const byName = path.join(projectsRoot, safeName);
      if (fs.existsSync(byName)) {
        fs.writeFileSync(path.join(byName, '.flow-id'), projectId, 'utf-8');
        targetPath = byName;
      } else {
        fs.mkdirSync(byName, { recursive: true });
        fs.writeFileSync(path.join(byName, '.flow-id'), projectId, 'utf-8');
        targetPath = byName;
      }
    }

    if (targetPath && fs.existsSync(targetPath)) {
      // shell.openPath uses ShellExecute on Windows — correctly focuses the window
      const err = await shell.openPath(targetPath);
      if (err) {
        console.error('[openFolder] shell.openPath error:', err);
        // Fallback: use cmd /c start
        const winPath = targetPath.replace(/\//g, '\\');
        spawn('cmd.exe', ['/c', 'start', '', winPath], { detached: true, stdio: 'ignore', shell: false }).unref();
      }
      return { success: true, path: targetPath };
    }

    return { success: false, error: 'Could not find or create project folder' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('projects:renameFolder', (event, projectId, newProjectName) => {
  try {
    if (!projectId || !newProjectName) return { success: false };
    const { projectsRoot } = getProjectsRoot();

    const directories = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    let targetFolder = null;
    for (const dirent of directories) {
      const folderPath = path.join(projectsRoot, dirent.name);
      const idFilePath = path.join(folderPath, '.flow-id');
      if (fs.existsSync(idFilePath)) {
        const id = fs.readFileSync(idFilePath, 'utf-8').trim();
        if (id === projectId) {
          targetFolder = dirent.name;
          break;
        }
      }
    }

    if (targetFolder) {
      const safeName = sanitizeProjectName(newProjectName);
      
      if (targetFolder !== safeName) {
        let folderName = safeName;
        let newPath = path.join(projectsRoot, folderName);
        let counter = 2;

        while (fs.existsSync(newPath)) {
          folderName = `${safeName} ${counter}`;
          newPath = path.join(projectsRoot, folderName);
          counter++;
        }

        const oldPath = path.join(projectsRoot, targetFolder);
        fs.renameSync(oldPath, newPath);
      }
    }
    return { success: true };
  } catch (e) {
    return { success: false };
  }
});


// ============================================================
// App lifecycle
// ============================================================
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.flowstudio.app');
  }
  createSplashWindow();
  // Allow UI event loop tick to display splash screen instantly before starting backend
  await new Promise(r => setTimeout(r, 100));
  const backendPort = await startBackend();
  createWindow(backendPort);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(detectedBackendPort);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('Terminating backend server process...');
    serverProcess.kill('SIGINT');
  }
});
