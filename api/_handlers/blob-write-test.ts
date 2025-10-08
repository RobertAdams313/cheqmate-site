import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type','application/json');
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('No BLOB_READ_WRITE_TOKEN at runtime');
    const key = `cheqmate/debug/hello-${Date.now()}.json`;
    const r = await put(key, JSON.stringify({ ok:true, at:new Date().toISOString() }), {
      token,
      contentType: 'application/json',
      access: 'public',
      addRandomSuffix: false
    });
    res.status(200).json({
      ok: true,
      key,
      url: (r as any)?.url ?? null,
      size: (r as any)?.size ?? null
    });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message ?? String(e) });
  }
}
