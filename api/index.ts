// api/index.ts
// Single-entry router to keep Hobby plan under the 12-function limit.
// It dispatches to your existing handlers without removing features.

import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

// We import handlers from api-handlers/* so Vercel doesn't create extra
// serverless functions for each file in /api.
const map: Record<string, () => Promise<{ default: Handler }>> = {
  // flat
  '/link-token':              () => import('./_handlers/link-token'),
  '/exchange-public-token':   () => import('./_handlers/exchange-public-token'),
  '/transactions-get':        () => import('./_handlers/transactions-get'),
  '/transactions-sync':       () => import('./_handlers/transactions/sync').catch(() => import('./_handlers/transactions-sync')),
  '/transactions/sync':       () => import('./_handlers/transactions/sync').catch(() => import('./_handlers/transactions-sync')),
  '/sandbox-access-token':    () => import('./_handlers/sandbox-access-token'),
  '/ping':                    () => import('./_handlers/ping'),
  '/debug-plaid':             () => import('./_handlers/debug-plaid'),
  '/plaid/return':            () => import('./_handlers/plaid-return'),

  // nested
  '/accounts/set-enabled':    () => import('./_handlers/accounts/set-enabled'),
  '/items/list':              () => import('./_handlers/items/list'),
  '/item/remove':             () => import('./_handlers/item/remove'),
  '/recurring/list':          () => import('./_handlers/recurring/list'),
};

// Normalizes incoming path and preserves old aliases.
function normalize(pathname: string) {
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4);
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  if (pathname === '/transactions/sync' || pathname === '/transactions-sync') return '/transactions/sync';
  return pathname;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Ensure JSON by default; individual handlers can override.
    res.setHeader('Content-Type', 'application/json');
    return mod.default(req, res);
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: 'Router error', message: err?.message ?? String(err) });
  }
}
