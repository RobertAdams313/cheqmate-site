import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setItemEnabled } from '../_lib/storage';

export default async function setEnabled(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { item_id, enabled } = body;

    if (!item_id || typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { item_id, enabled }' });
      return;
    }

    await setItemEnabled(item_id, enabled);
    res.status(200).json({ ok: true, item_id, enabled });
  } catch (e: any) {
    res.status(500).json({ error: 'SET_ENABLED_FAILED', message: e?.message ?? String(e) });
  }
}
