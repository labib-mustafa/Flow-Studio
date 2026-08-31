const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.scripts['build:server'] = 'node scripts/build-server.cjs';
pkg.scripts['package'] = 'npm run build && npm run build:server && electron-builder';

// Add electron-builder configuration
pkg.build = {
  appId: "com.flowstudio.app",
  productName: "Flow Studio",
  directories: {
    output: "release"
  },
  files: [
    "dist/**/*",
    "dist-server/**/*",
    "main.cjs",
    "preload.cjs",
    "package.json",
    "flowstudio.config.json"
  ],
  win: {
    target: ["nsis", "portable"]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('package.json updated for electron-builder');
