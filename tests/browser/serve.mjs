#!/usr/bin/env node
/**
 * Static server for the browser test harness.
 *
 *   /lcards/*     -> custom_components/lcards/   (the built bundle, like HA serves it;
 *                                                 .br/.gz siblings honoured)
 *   /helpers/*    -> tests/helpers/              (fake-hass.js)
 *   /demo-data.js -> doc/.vitepress/theme/chart-demo-data.js
 *   /fixtures/*   -> tests/browser/fixtures/
 *   /vendor/*     -> node_modules/               (js-yaml for fixture parsing)
 *   /*            -> tests/browser/www/          (harness.html, harness.js)
 *
 * Usage: node tests/browser/serve.mjs [port]   (default 4870, or $LCARDS_TEST_PORT)
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.argv[2] ?? process.env.LCARDS_TEST_PORT ?? 4870);

const MOUNTS = [
    ['/lcards/', join(root, 'custom_components/lcards')],
    ['/helpers/', join(root, 'tests/helpers')],
    ['/fixtures/', join(root, 'tests/browser/fixtures')],
    ['/vendor/', join(root, 'node_modules')],
    ['/demo-data.js', join(root, 'doc/.vitepress/theme/chart-demo-data.js')],
    ['/', join(root, 'tests/browser/www')],
];

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.map': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp3': 'audio/mpeg',
    '.yaml': 'text/yaml; charset=utf-8',
};

/** Map a URL path to a file inside one of the mounts (no path escapes). */
function resolvePath(urlPath) {
    for (const [prefix, dir] of MOUNTS) {
        if (prefix.endsWith('/') ? urlPath.startsWith(prefix) : urlPath === prefix) {
            if (!prefix.endsWith('/')) return dir;
            const rel = normalize(decodeURIComponent(urlPath.slice(prefix.length))).replace(/^(\.\.[/\\])+/, '');
            const file = join(dir, rel || 'index.html');
            return file.startsWith(dir) ? file : null;
        }
    }
    return null;
}

const server = createServer((req, res) => {
    const urlPath = new URL(req.url, 'http://localhost').pathname;
    const file = resolvePath(urlPath);
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end(`not found: ${urlPath}`);
        return;
    }
    const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' };
    // Mirror HA's aiohttp FileResponse: serve a pre-compressed sibling when accepted.
    const accept = String(req.headers['accept-encoding'] ?? '');
    let body = file;
    for (const [enc, ext] of [['br', '.br'], ['gzip', '.gz']]) {
        if (accept.includes(enc) && existsSync(file + ext)) {
            body = file + ext;
            headers['content-encoding'] = enc;
            break;
        }
    }
    res.writeHead(200, headers);
    createReadStream(body).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`lcards test server on http://127.0.0.1:${port}/`);
});
