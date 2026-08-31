const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 [Flow Studio] Starting Release Build Packaging...');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'Flow-Studio-Windows-x64');
const ELECTRON_DIST = path.join(ROOT_DIR, 'node_modules', 'electron', 'dist');

// 1. Build frontend & backend
console.log('📦 Step 1: Building production frontend & server bundles...');
execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
execSync('npm run build:server', { cwd: ROOT_DIR, stdio: 'inherit' });

// 2. Prepare output directory
console.log('📁 Step 2: Preparing release directory at:', OUT_DIR);
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// 3. Copy Electron prebuilt runtime
console.log('⚡ Step 3: Copying Electron runtime...');
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(ELECTRON_DIST, OUT_DIR);

// Rename electron.exe to Flow Studio.exe
const defaultExe = path.join(OUT_DIR, 'electron.exe');
const flowStudioExe = path.join(OUT_DIR, 'Flow Studio.exe');
if (fs.existsSync(defaultExe)) {
  fs.renameSync(defaultExe, flowStudioExe);
}

// 4. Create resources/app
console.log('📦 Step 4: Bundling Flow Studio application resources into resources/app...');
const appDir = path.join(OUT_DIR, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

// Copy dist, dist-server, main.cjs, preload.cjs, splash.html, icon.ico, package.json
copyRecursiveSync(path.join(ROOT_DIR, 'dist'), path.join(appDir, 'dist'));
copyRecursiveSync(path.join(ROOT_DIR, 'dist-server'), path.join(appDir, 'dist-server'));

const rootFiles = ['main.cjs', 'preload.cjs', 'splash.html', 'icon.ico', 'package.json'];
rootFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(appDir, file));
  }
});

// Also create a launcher shortcut or Start.bat in root of OUT_DIR
const launcherBat = `@echo off
start "" "%~dp0Flow Studio.exe"
`;
fs.writeFileSync(path.join(OUT_DIR, 'Start Flow Studio.bat'), launcherBat, 'utf8');

// 5. Create zip archive for GitHub Release
console.log('🗜️ Step 5: Creating zip archive for GitHub Release...');
const zipFile = path.join(ROOT_DIR, 'Flow-Studio-v1.0.0-Windows-x64.zip');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

try {
  execSync(`powershell Compress-Archive -Path "${OUT_DIR}\\*" -DestinationPath "${zipFile}" -Force`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  console.log('✅ [Flow Studio] Release zip created successfully at: ' + zipFile);
} catch (e) {
  console.warn('⚠️ Could not compress archive automatically:', e.message);
}

console.log('\n🎉 [Flow Studio] Build Complete!');
console.log('📁 Standalone Folder: ' + OUT_DIR);
console.log('📦 Release Zip (for GitHub Releases): ' + zipFile);
