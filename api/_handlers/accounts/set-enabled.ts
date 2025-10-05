import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function setEnabled(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const { item_id, enabled } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!item_id || typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { item_id, enabled }' });
      return;
    }

    // Placeholder success; wire to your real update logic later.
    res.status(200).json({ ok: true, item_id, enabled });
  } catch (e: any) {
    res.status(400).json({ error: 'BAD_JSON', message: e?.message ?? String(e) });
  }
}
