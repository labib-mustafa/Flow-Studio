const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const FILE_TO_WATCH = path.join(__dirname, 'index.html');
let clients = [];

// Watch file for changes
let fsWait = false;
fs.watch(FILE_TO_WATCH, (eventType) => {
  if (eventType === 'change') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100);
    
    console.log('File changed! Reloading clients...');
    clients.forEach(res => {
      try {
        res.write('data: reload\n\n');
      } catch (e) {}
    });
  }
});

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  if (req.url.startsWith('/open-code')) {
    const urlObj = new URL(req.url, 'http://localhost:35730');
    const line = urlObj.searchParams.get('line') || '1';
    
    let editorCmd = 'code';
    if (process.env.ANTIGRAVITY_EDITOR_APP_ROOT) {
      const binName = process.platform === 'win32' ? 'antigravity-ide.cmd' : 'antigravity-ide';
      const antigravityPath = path.resolve(process.env.ANTIGRAVITY_EDITOR_APP_ROOT, '../../bin', binName);
      if (fs.existsSync(antigravityPath)) {
        editorCmd = `"${antigravityPath}"`;
      }
    }
    
    const cmd = `${editorCmd} -g "${FILE_TO_WATCH}:${line}"`;
    exec(cmd, (err) => {
      if (err) console.error('Failed to launch editor:', err);
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404);
  res.end();
}).listen(35730, () => {
  console.log('Watching index.html & SSE server running on http://localhost:35730');
});
