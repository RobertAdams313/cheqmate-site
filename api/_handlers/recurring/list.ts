import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function listRecurring(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  // Minimal placeholder shape; replace with your real normalization later.
  res.status(200).json({
    ok: true,
    groups: [],
    meta: { source: '/api/_handlers/recurring/list.ts' }
  });
}
