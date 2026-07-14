import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import { codeInspectorPlugin } from 'code-inspector-plugin';

// Read backendPort from flowstudio.config.json
let backendPort = 3009;
try {
  const configPath = path.resolve(__dirname, 'flowstudio.config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.backendPort) {
      backendPort = config.backendPort;
    }
  }
} catch (e) {
  console.warn('[Vite Config] Failed to read backendPort from config, falling back to 3009');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Resolve the Antigravity IDE command path dynamically
  let editorCmd = 'code';
  if (process.env.ANTIGRAVITY_EDITOR_APP_ROOT) {
    const binName = process.platform === 'win32' ? 'antigravity-ide.cmd' : 'antigravity-ide';
    const antigravityPath = path.resolve(process.env.ANTIGRAVITY_EDITOR_APP_ROOT, '../../bin', binName);
    if (fs.existsSync(antigravityPath)) {
      editorCmd = antigravityPath;
    }
  }
  if (editorCmd === 'code' && process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const antigravityPath = path.resolve(process.env.LOCALAPPDATA, 'Programs/Antigravity IDE/bin/antigravity-ide.cmd');
    if (fs.existsSync(antigravityPath)) {
      editorCmd = antigravityPath;
    }
  }

  // Set CODE_EDITOR environment variable to override launch-ide auto-detection
  process.env.CODE_EDITOR = editorCmd;

  return {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
        editor: editorCmd as any,
      }),
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'html2canvas': 'html2canvas-pro',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': `http://127.0.0.1:${backendPort}`,
      },
    },
  };
});
