// api/index.ts
// Single-entry router (works with ESM *and* CommonJS handlers)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import debugEnv from './_handlers/debug-env';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

// Use .js extensions; TS compiles to JS in Vercel.
const map: Record<string, () => Promise<any>> = {
  '/accounts/get-enabled': () => import('./_handlers/accounts/get-enabled.js'),
  '/blob-write-test': () => import('./_handlers/blob-write-test.js'),
  '/blob-debug': () => import('./_handlers/blob-debug.js'),
  // flat
  '/link-token':              () => import('./_handlers/link-token.js'),
  '/exchange-public-token':   () => import('./_handlers/exchange-public-token.js'),
  '/transactions-get':        () => import('./_handlers/transactions-get.js'),
  '/transactions-sync':       () => import('./_handlers/transactions/sync.js')
                                   .catch(() => import('./_handlers/transactions-sync.js')),
  '/transactions/sync':       () => import('./_handlers/transactions/sync.js')
                                   .catch(() => import('./_handlers/transactions-sync.js')),
  '/sandbox-access-token':    () => import('./_handlers/sandbox-access-token.js'),
  '/ping':                    () => import('./_handlers/ping.js'),
  '/debug-plaid':             () => import('./_handlers/debug-plaid.js'),

  // nested
  '/accounts/set-enabled':    () => import('./_handlers/accounts/set-enabled.js'),
  '/items/list':              () => import('./_handlers/items/list.js'),
  '/item/remove':             () => import('./_handlers/item/remove.js'),
  '/recurring/list':          () => import('./_handlers/recurring/list.js'),

  // non-API rewrite (if configured in vercel.json)
  '/plaid/return':            () => import('./_handlers/plaid-return.js'),
};

// Normalize incoming paths and keep both aliases working
function normalize(pathname: string) {
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4);
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  if (pathname === '/transactions/sync' || pathname === '/transactions-sync') return '/transactions/sync';
  return pathname;
}

// Resolve ESM default export OR CommonJS module.exports/function
function resolveHandler(mod: any): Handler {
  if (typeof mod === 'function') return mod as Handler;        // CJS: module.exports = fn
  if (typeof mod?.default === 'function') return mod.default as Handler; // ESM transpiled
  // Some CJS transpilers wrap as { default: { default: fn } } (rare)
  if (typeof mod?.default?.default === 'function') return mod.default.default as Handler;
  throw new Error('Handler export not found');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug: Plaid env/redirect check
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const pathname = urlObj.pathname.replace(/^\/api/, '');
    if (pathname === '/debug-env') { return await debugEnv(req, res); }
  } catch (_e) { /* noop */ }

  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const key = normalize(url.pathname);

    const loader = map[key];
    if (!loader) {
      res.setHeader('Content-Type', 'application/json');
      res.status(404).json({ error: 'Not Found', path: key });
      return;
    }

    const mod = await loader();
    const fn = resolveHandler(mod);
    res.setHeader('Content-Type', 'application/json');
    return fn(req, res);
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Router error', message: err?.message ?? String(err) });
  }
}
