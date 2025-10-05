// api/[...route].ts
// Single-entry router to keep Hobby plan under the 12-function limit.
// It dispatches to your existing handlers without removing features.

import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

const map: Record<string, () => Promise<{ default: Handler }>> = {
  // flat
  '/link-token':              () => import('./link-token'),
  '/exchange-public-token':   () => import('./exchange-public-token'),
  '/transactions-get':        () => import('./transactions-get'),
  '/transactions-sync':       () => import('./transactions/sync').catch(() => import('./transactions-sync')),
  '/transactions/sync':       () => import('./transactions/sync').catch(() => import('./transactions-sync')),
  '/sandbox-access-token':    () => import('./sandbox-access-token'),
  '/ping':                    () => import('./ping'),
  '/debug-plaid':             () => import('./debug-plaid'),

  // nested
  '/accounts/set-enabled':    () => import('./accounts/set-enabled'),
  '/items/list':              () => import('./items/list'),
  '/item/remove':             () => import('./item/remove'),
  '/recurring/list':          () => import('./recurring/list'),
};

// Optional: allow callers to hit the old paths unchanged.
// This normalizes "/api/transactions/sync" and "/api/transactions-sync".
function normalize(pathname: string) {
  // strip leading "/api" if present
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4);
  if (!pathname.startsWith('/')) pathname = '/' + pathname;

  // untrail
  if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);

  // alias support (keep both hyphen and folder variants working)
  if (pathname === '/transactions/sync' || pathname === '/transactions-sync') return '/transactions/sync';
  return pathname;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const key = normalize(url.pathname);

    const loader = map[key];
    if (!loader) {
      res.status(404).json({ error: 'Not Found', path: key });
      return;
    }

    const mod = await loader();
    return mod.default(req, res);
  } catch (err: any) {
    res.status(500).json({ error: 'Router error', message: err?.message ?? String(err) });
  }
}
