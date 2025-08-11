const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  
  if (req.url === '/notes' && req.method === 'POST') {
    console.log('Note received!');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: 'test-123', success: true }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

const port = 8080;
server.listen(port, () => {
  console.log(`Simple server running on port ${port}`);
  console.log(`Health: http://localhost:${port}/health`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});