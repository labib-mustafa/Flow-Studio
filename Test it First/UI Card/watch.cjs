const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const FILE_TO_WATCH = path.join(__dirname, 'index.html');
let clients = [];

let fsWait = false;
fs.watch(FILE_TO_WATCH, (eventType) => {
  if (eventType === 'change') {
    if (fsWait) return;
    fsWait = setTimeout(() => { fsWait = false; }, 100);
    console.log('File changed! Reloading clients...');
    clients.forEach(res => { try { res.write('data: reload\n\n'); } catch (e) {} });
  }
});

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
    return;
  }

  if (req.url.startsWith('/open-code')) {
    const urlObj = new URL(req.url, 'http://localhost:35732');
    const line = urlObj.searchParams.get('line') || '1';
    let editorCmd = 'code';
    if (process.env.ANTIGRAVITY_EDITOR_APP_ROOT) {
      const binName = process.platform === 'win32' ? 'antigravity-ide.cmd' : 'antigravity-ide';
      const antigravityPath = path.resolve(process.env.ANTIGRAVITY_EDITOR_APP_ROOT, '../../bin', binName);
      if (fs.existsSync(antigravityPath)) editorCmd = antigravityPath;
    }
    if (editorCmd === 'code' && process.platform === 'win32' && process.env.LOCALAPPDATA) {
      const antigravityPath = path.resolve(process.env.LOCALAPPDATA, 'Programs/Antigravity IDE/bin/antigravity-ide.cmd');
      if (fs.existsSync(antigravityPath)) editorCmd = antigravityPath;
    }
    const filePath = path.join(__dirname, 'index.html');
    const cmd = `"${editorCmd}" -g "${filePath}:${line}"`;
    console.log(`Opening code at line ${line}...`);
    exec(cmd, (err) => {
      if (err) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, error: err.message })); }
      else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true })); }
    });
    return;
  }

  if (req.url === '/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        fsWait = true;
        fs.writeFileSync(FILE_TO_WATCH, body, 'utf8');
        console.log('UI Card sandbox saved successfully!');
        setTimeout(() => { fsWait = false; }, 500);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('Failed to save file:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync(FILE_TO_WATCH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) { res.writeHead(500); res.end('Error loading index.html: ' + err.message); }
    return;
  }

  res.writeHead(404);
  res.end();
}).listen(35732, () => {
  console.log('Hot reload & save server running on http://localhost:35732');
});
