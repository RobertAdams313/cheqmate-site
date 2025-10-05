import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function listItems(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  // Allow POST (your earlier test used POST), but GET is fine too.
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  res.status(200).json({
    ok: true,
    items: [],
    meta: { source: '/api/_handlers/items/list.ts' }
  });
}
