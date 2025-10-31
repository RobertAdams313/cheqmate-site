// api/index.ts — single-entry router

import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

const map: Record<string, () => Promise<any>> = {
  '/link-token':            () => import('./_handlers/link-token.js'),
  '/exchange-public-token': () => import('./_handlers/exchange-public-token.js'),
  '/transactions-get':      () => import('./_handlers/transactions-get.js'),
  '/transactions/sync':     () => import('./_handlers/transactions-sync.js'),
  '/webhook':               () => import('./_handlers/webhook.js'),

  // Diagnostics (unchanged)
  '/ping':                  () => import('./_handlers/ping.js'),
  '/debug-plaid':           () => import('./_handlers/debug-plaid.js'),
};

function normalize(pathname: string) {
  if (pathname.startsWith('/api/')) pathname = pathname.slice(4);
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  if (pathname === '/transactions-sync') return '/transactions/sync';
  return pathname;
}

function resolveHandler(mod: any): Handler {
  if (typeof mod === 'function') return mod as Handler;
  if (typeof mod?.default === 'function') return mod.default as Handler;
  if (typeof mod?.default?.default === 'function') return mod.default.default as Handler;
  throw new Error('Handler export not found');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const key = normalize(urlObj.pathname);
    const loader = map[key];
    if (!loader) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Not Found', path: key });
    }
    const mod = await loader();
    const fn = resolveHandler(mod);
    res.setHeader('Content-Type', 'application/json');
    return fn(req, res);
  } catch (err: any) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Router error', message: err?.message ?? String(err) });
  }
}