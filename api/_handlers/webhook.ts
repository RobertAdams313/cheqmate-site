import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Plaid will POST here. Configure this URL in the Plaid Dashboard.
 * We intentionally do not trust body shape; just log minimal metadata.
 * Your app can enqueue refresh work based on `webhook_type` and `webhook_code`.
 */
export default async function webhook(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const webhook_type: string | undefined = body?.webhook_type;
    const webhook_code: string | undefined = body?.webhook_code;
    const item_id: string | undefined = body?.item_id;

    // In production, enqueue a job to call /transactions-sync for the item.
    console.log('[Plaid webhook]', { webhook_type, webhook_code, item_id });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'WEBHOOK_ERROR' });
  }
}