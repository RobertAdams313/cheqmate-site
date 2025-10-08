import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'MISSING_TOKEN', message: 'BLOB_READ_WRITE_TOKEN not set' });
      return;
    }

    const key = `cheqmate/enabled/${item_id}.json`;

    // Write as PUBLIC because your store requires public access
    await put(key, JSON.stringify({
      item_id,
      enabled,
      updatedAt: new Date().toISOString(),
    }), {
      token,
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false,
    });

    res.status(200).json({ ok: true, item_id, enabled, key });
  } catch (e: any) {
    res.status(500).json({ error: 'SET_ENABLED_FAILED', message: e?.message ?? String(e) });
  }
}
