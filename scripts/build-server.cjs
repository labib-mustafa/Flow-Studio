const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node16',
  outdir: 'dist-server',
  outExtension: { '.js': '.cjs' },
  external: [
    'electron',
    'better-sqlite3', // better-sqlite3 is a native module, must be external
    'sharp'
  ],
  format: 'cjs',
}).catch(() => process.exit(1));
