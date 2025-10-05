import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient, resolvePlaidEnv } from '../lib/plaid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const envOverride = (req.query.env as string) || (req.headers['x-plaid-env'] as string);
    const env = resolvePlaidEnv(envOverride);
    const client = plaidClient(env);

    const { access_token, cursor } = req.body || {};
    if (!access_token) {
      return res.status(400).json({ error: 'INVALID_ACCESS_TOKEN', message: 'access_token required' });
    }

    const added: any[] = [];
    const modified: any[] = [];
    const removed: any[] = [];
    let nextCursor: string | null = cursor || null;

    // loop until has_more is false
    while (true) {
      const syncResp = await client.transactionsSync({
        access_token,
        cursor: nextCursor || undefined,
        count: 500,
      });
      added.push(...(syncResp.data.added || []));
      modified.push(...(syncResp.data.modified || []));
      removed.push(...(syncResp.data.removed || []));
      nextCursor = syncResp.data.next_cursor || null;
      if (!syncResp.data.has_more) break;
    }

    res.status(200).json({ router: 'vercel-functions', env, added, modified, removed, next_cursor: nextCursor });
  } catch (err: any) {
    console.error('api/transactions-sync error', err?.response?.data || err);
    res.status(500).json({ error: 'TX_SYNC_FAILED', detail: err?.response?.data || err?.message });
  }
}
