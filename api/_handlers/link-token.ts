// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

type H = (req: VercelRequest, res: VercelResponse) => Promise<any> | any;

// Route table → module path (loaded lazily)
const routes: Record<string, string> = {
  // Plaid
  'POST /api/link-token': './_handlers/link-token',
  'POST /api/exchange-public-token': './_handlers/exchange-public-token',

  // Sync (nested + kebab)
  'POST /api/transactions/sync': './_handlers/transactions/sync',
  'POST /api/transactions-sync': './_handlers/transactions/sync',

  // Get (nested + kebab)
  'POST /api/transactions/get': './_handlers/transactions/get',
  'POST /api/transactions-get': './_handlers/transactions/get',

  // Debug
  'GET /api/_self-test': './_handlers/_self-test',
  'GET /api/_env-check': './_handlers/_env-check',
};

function keyOf(req: VercelRequest) {
  const method = (req.method || 'GET').toUpperCase();
  const path = (req.url || '/').split('?')[0];
  return `${method} ${path}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = keyOf(req);
  const modPath = routes[key];

  if (!modPath) {
    return res.status(404).json({ error: 'NOT_FOUND', path: key, known: Object.keys(routes) });
  }

  try {
    const mod = await import(modPath).catch((e: any) => {
      console.error('[router] import failed:', modPath, e?.stack || e);
      throw { status: 500, payload: { error: 'IMPORT_FAILED', module: modPath, detail: String(e) } };
    });
    const h: H | undefined = mod?.default;
    if (!h) {
      throw { status: 500, payload: { error: 'NO_DEFAULT_EXPORT', module: modPath } };
    }
    return await h(req, res);
  } catch (err: any) {
    const status = err?.status ?? 500;
    const payload = err?.payload ?? { error: 'INTERNAL', detail: String(err) };
    console.error('[router] handler error:', key, payload);
    return res.status(status).json(payload);
  }
}