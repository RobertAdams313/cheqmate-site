import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function removeItem(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const { item_id } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!item_id) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { item_id }' });
      return;
    }

    // Placeholder success; integrate with your real removal logic later.
    res.status(200).json({ ok: true, item_id });
  } catch (e: any) {
    res.status(400).json({ error: 'BAD_JSON', message: e?.message ?? String(e) });
  }
}
