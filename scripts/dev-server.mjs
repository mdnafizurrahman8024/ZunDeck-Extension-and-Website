import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const START_PORT = 4173;
const MAX_PORT = 4250;
const PORT_FILE = path.join(ROOT_DIR, '.zundeck-dev-port');

function safeResolvePath(urlPath) {
  let decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded === '/' || decoded === '') {
    decoded = '/apps/web/index.html';
  }
  let resolved = path.normalize(path.join(ROOT_DIR, decoded));
  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }

  // 1. Direct path check
  if (fs.existsSync(resolved)) {
    return resolved;
  }

  // 2. Fallback to apps/web/ (resolves root-relative /css/, /js/, /assets/, /favicon.*)
  const webPath = path.normalize(path.join(ROOT_DIR, 'apps', 'web', decoded));
  if (webPath.startsWith(ROOT_DIR) && fs.existsSync(webPath)) {
    return webPath;
  }

  // 3. Fallback to core/
  const corePath = path.normalize(path.join(ROOT_DIR, 'core', decoded));
  if (corePath.startsWith(ROOT_DIR) && fs.existsSync(corePath)) {
    return corePath;
  }

  return resolved;
}

function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const filePath = safeResolvePath(req.url);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${req.url}`);
      return;
    }

    let targetFile = filePath;
    if (stats.isDirectory()) {
      targetFile = path.join(filePath, 'index.html');
      if (!fs.existsSync(targetFile)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`404 Index Not Found: ${req.url}`);
        return;
      }
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetFile);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  });
}

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.close();
        resolve(null);
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      try {
        fs.writeFileSync(PORT_FILE, String(port), 'utf8');
      } catch {}
      resolve({ server, port });
    });

    server.listen(port, '0.0.0.0');
  });
}

export async function startServer(initialPort = START_PORT) {
  let port = initialPort;
  while (port <= MAX_PORT) {
    const result = await tryListen(port);
    if (result) {
      const activeUrl = `http://localhost:${result.port}`;
      console.log(`\n======================================================`);
      console.log(`  ZunDeck Live Preview Server Ready`);
      console.log(`  Local URL:    ${activeUrl}`);
      console.log(`  Network:      http://127.0.0.1:${result.port}`);
      console.log(`  Active Root:  ${ROOT_DIR}`);
      console.log(`  Default App:  ${activeUrl}/apps/web/index.html`);
      console.log(`======================================================\n`);
      return result;
    }
    port += 1;
  }
  throw new Error(`Failed to bind server between ports ${START_PORT} and ${MAX_PORT}`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start ZunDeck dev server:', err);
    process.exit(1);
  });
}
