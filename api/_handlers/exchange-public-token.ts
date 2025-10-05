import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from '../_lib/plaid';
import { saveTokenBundle, writeItemMeta } from '../_lib/secure-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const public_token = body?.public_token || body?.publicToken;

    if (!public_token || typeof public_token !== 'string') {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { public_token }' });
      return;
    }

    const client = plaidClient();
    const exchange = await client.itemPublicTokenExchange({ public_token });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    // Initialize sync cursor as null for a fresh Item
    const last_cursor: string | null = null;

    // Persist sensitive bundle (server-side)
    const tokenOut = await saveTokenBundle(item_id, access_token, last_cursor);

    // Persist non-sensitive metadata used by UI
    await writeItemMeta(item_id, {
      last_cursor,        // null initially
      status: 'HEALTHY',
    });

    // ── Conditional return of access_token to minimize ripple in iOS client ──
    const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
    const exposeByEnv = env !== 'production' && process.env.EXPOSE_ACCESS_TOKEN === '1';
    const exposeByHeader = req.headers['x-debug-expose-token'] === '1';
    const shouldExposeToken = exposeByEnv || exposeByHeader;

    const response: any = {
      ok: true,
      item_id,
      stored: { tokenKey: tokenOut.tokenKey },
    };

    // Keep iOS happy if it expects {itemID, accessToken}
    if (shouldExposeToken) {
      response.access_token = access_token;
    }

    res.status(200).json(response);
  } catch (e: any) {
    // Surface Plaid error details when available
    const detail = e?.response?.data ?? e?.message ?? e;
    console.error('[exchange-public-token] error', detail);
    res.status(500).json({ error: 'EXCHANGE_FAILED', detail });
  }
}