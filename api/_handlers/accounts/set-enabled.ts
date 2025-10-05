import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    // TODO: Persist the enabled flag for item_id in your storage.
    // e.g., await itemsStore.setEnabled(item_id, enabled)

    res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      message: 'Attach persistence layer to store enabled flag for item_id',
      item_id,
      enabled,
    });
  } catch (e: any) {
    res.status(400).json({ error: 'BAD_JSON', message: e?.message ?? String(e) });
  }
}
