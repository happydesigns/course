import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('playground/.output/public');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/course/')) { res.writeHead(404).end(); return; }
  const file = resolve(root, decodeURIComponent(url.pathname.slice('/course/'.length)));
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  for (const candidate of [file, file + '.html', resolve(file, 'index.html')]) {
    try { const body = await readFile(candidate); res.writeHead(200, { 'content-type': types[extname(candidate)] || 'application/octet-stream' }).end(body); return; } catch {}
  }
  res.writeHead(404).end();
}).listen(4173, '127.0.0.1');
