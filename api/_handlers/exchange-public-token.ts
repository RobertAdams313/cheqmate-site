import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from '../_lib/plaid';
import { saveTokenBundle, writeItemMeta } from '../_lib/secure-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type','application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const public_token = body?.public_token;
    if (!public_token || typeof public_token !== 'string') {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { public_token }' });
      return;
    }

    const client = plaidClient();
    const exchange = await client.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    // Initialize sync cursor as null on first exchange
    const last_cursor: string | null = null;

    // Persist sensitive bundle encrypted (token + cursor)
    const tokenOut = await saveTokenBundle(item_id, access_token, last_cursor);

    // Persist non-sensitive metadata for UI (public)
    await writeItemMeta(item_id, {
      last_cursor,          // null initially (safe, but you can remove if you prefer)
      status: 'HEALTHY',    // default status on fresh exchange
    });

    res.status(200).json({
      ok: true,
      item_id,
      // DO NOT return access_token in API response
      stored: { tokenKey: tokenOut.tokenKey }
    });
  } catch (e:any) {
    const err = e?.response?.data ?? e;
    res.status(500).json({ error: 'EXCHANGE_FAILED', detail: err });
  }
}
