import type { VercelRequest, VercelResponse } from '@vercel/node';

import linkToken from './_handlers/link-token';                 // keep your existing
import exchangePublicToken from './_handlers/exchange-public-token'; // keep your existing
import transactionsSync from './_handlers/transactions/sync';
import transactionsGet from './_handlers/transactions/get';

type H = (req: VercelRequest, res: VercelResponse) => Promise<any> | any;

const routes: Record<string, H> = {
  'POST /api/link-token': linkToken,
  'POST /api/exchange-public-token': exchangePublicToken,

  // sync (nested + kebab)
  'POST /api/transactions/sync': transactionsSync,
  'POST /api/transactions-sync': transactionsSync,

  // get (nested + kebab)
  'POST /api/transactions/get': transactionsGet,
  'POST /api/transactions-get': transactionsGet,
};

function keyOf(req: VercelRequest) {
  const method = (req.method || 'GET').toUpperCase();
  const url = (req.url || '/').split('?')[0];
  return `${method} ${url}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = keyOf(req);
  const h = routes[key];
  if (!h) return res.status(404).json({ error: 'NOT_FOUND', path: key, known: Object.keys(routes) });
  try { return await h(req, res); }
  catch (e: any) {
    console.error('router error:', e?.response?.data ?? e);
    return res.status(500).json({ error: 'INTERNAL', detail: e?.response?.data ?? String(e) });
  }
}