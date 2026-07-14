const http = require('http');
const fs = require('fs');
const path = require('path');

const FILE_TO_WATCH = path.join(__dirname, 'index.html');
let clients = [];

// Watch file for changes
let fsWait = false;
fs.watch(FILE_TO_WATCH, (eventType) => {
  if (eventType === 'change') {
    if (fsWait) return;
    fsWait = setTimeout(() => {
      fsWait = false;
    }, 100); // Debounce to prevent multiple reloads on a single save
    
    console.log('File changed! Reloading clients...');
    clients.forEach(res => {
      try {
        res.write('data: reload\n\n');
      } catch (e) {}
    });
  }
});

http.createServer((req, res) => {
  // CORS Headers
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

  if (req.url === '/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        // Temporarily disable watcher trigger to prevent infinite loops during self-saving
        fsWait = true;
        fs.writeFileSync(FILE_TO_WATCH, body, 'utf8');
        console.log('Splash screen code saved successfully!');
        
        // Re-enable watcher after writing
        setTimeout(() => {
          fsWait = false;
        }, 500);

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

  res.writeHead(404);
  res.end();
}).listen(35729, () => {
  console.log('Hot reload & save server running on http://localhost:35729');
});
