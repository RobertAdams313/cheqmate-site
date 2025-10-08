import type { VercelRequest, VercelResponse } from '@vercel/node';

const PUBLIC_BASE = process.env.BLOB_PUBLIC_BASE ?? 'https://fnkly1wmznlv1xab.public.blob.vercel-storage.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const item_id = String(req.query.item_id ?? '');
    if (!item_id) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected ?item_id=' });
      return;
    }
    const key = `cheqmate/enabled/${item_id}.json`;
    const url = `${PUBLIC_BASE}/${key}`;
    const r = await fetch(url);
    if (!r.ok) {
      res.status(404).json({ error: 'NOT_FOUND', key });
      return;
    }
    const data = await r.json();
    res.status(200).json({ ok: true, key, publicUrl: url, data });
  } catch (e:any) {
    res.status(500).json({ error: 'GET_ENABLED_FAILED', message: e?.message ?? String(e) });
  }
}
