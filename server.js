// Production server for Nixpacks / Coolify / Railway / any Node host.
// Serves the built Vite app (and the prototype in /prototype) from ./dist. No dependencies.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf'
};

async function sendFile(res, file, cache) {
  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': cache
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let rel;
    try { rel = decodeURIComponent(url.pathname); } catch { res.statusCode = 400; return res.end('Bad request'); }

    let file = path.normalize(path.join(DIST, rel));
    if (file === DIST || file.startsWith(DIST + path.sep)) {
      let s = await stat(file).catch(() => null);
      if (s?.isDirectory()) { file = path.join(file, 'index.html'); s = await stat(file).catch(() => null); }
      if (s?.isFile()) {
        // Vite's built files have a content hash in the name and can be cached forever;
        // everything else (prototype, images) gets a short cache so updates show up.
        const hashed = rel.startsWith('/assets/') && /-[A-Za-z0-9_-]{8}\.(js|css)$/.test(rel);
        const cache = hashed ? 'public, max-age=31536000, immutable'
          : file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600';
        return await sendFile(res, file, cache);
      }
    }
    if (path.extname(rel)) { res.statusCode = 404; return res.end('Not found'); }
    return await sendFile(res, path.join(DIST, 'index.html'), 'no-cache');
  } catch (err) {
    console.error(err);
    if (!res.headersSent) { res.statusCode = 500; res.end('Server error'); } else res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Megito Foods site running on port ${PORT}`));
