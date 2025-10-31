import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from '../_lib/plaid';
import { saveTokenBundle, writeItemMeta } from '../_lib/secure-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const public_token = body?.public_token || body?.publicToken;
    if (!public_token || typeof public_token !== 'string') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { public_token }' });
    }

    const client = plaidClient();
    const exchange = await client.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    // Initialize sync cursor as null for a fresh Item
    const last_cursor: string | null = null;

    await saveTokenBundle(item_id, access_token, last_cursor);
    await writeItemMeta(item_id, { last_cursor, status: 'HEALTHY' });

    // Never return the access_token to clients.
    return res.status(200).json({ ok: true, item_id });
  } catch (e: any) {
    const detail = e?.response?.data ?? e?.message ?? e;
    console.error('[exchange-public-token] error', detail);
    return res.status(500).json({ error: 'EXCHANGE_FAILED', detail });
  }
}