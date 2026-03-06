const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

function proxyJira(req, res) {
  const parsed = url.parse(req.url, true);
  const targetPath = parsed.query.path;

  if (!targetPath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing "path" query parameter' }));
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing Authorization header' }));
    return;
  }

  const site = req.headers['x-atlassian-site'] || 'equityprime.atlassian.net';

  const options = {
    hostname: site,
    path: targetPath,
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };

  const proxy = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
  });

  proxy.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, X-Atlassian-Site, Content-Type',
    });
    res.end();
    return;
  }

  // API proxy
  if (parsed.pathname === '/api/jira') {
    proxyJira(req, res);
    return;
  }

  // Serve the widget HTML
  if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
    fs.readFile(path.join(__dirname, 'jira-widget.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading widget');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Jira Widget Server running at http://localhost:${PORT}`);
  console.log('Open that URL in your browser to use the widget.');
});
