import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/blob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const item_id = String(req.query.item_id ?? '');
    if (!item_id) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected ?item_id=' });
      return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'MISSING_TOKEN' });
      return;
    }

    const key = `cheqmate/enabled/${item_id}.json`;
    const file = await get(key, { token });
    // If file is missing, .blob may be undefined in some runtimes
    const txt = (file as any)?.blob ? await (file as any).blob.text() : null;

    if (!txt) {
      res.status(404).json({ error: 'NOT_FOUND', key });
      return;
    }

    let json: any;
    try { json = JSON.parse(txt); } catch {
      res.status(502).json({ error: 'PARSE_ERROR', key, raw: txt.slice(0, 200) });
      return;
    }

    // also return the canonical public URL for convenience if present
    const publicUrl = (file as any)?.url ?? null;
    res.status(200).json({ ok: true, key, publicUrl, data: json });
  } catch (e: any) {
    res.status(500).json({ error: 'GET_ENABLED_FAILED', message: e?.message ?? String(e) });
  }
}
