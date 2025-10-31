import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from './plaid-env';
import { readTokenBundle, updateCursor } from '../_lib/secure-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const item_id: string | undefined = body?.item_id;
    if (!item_id) return res.status(400).json({ error: 'item_id is required' });

    const bundle = await readTokenBundle(item_id);
    if (!bundle) return res.status(404).json({ error: 'TOKEN_BUNDLE_NOT_FOUND' });

    const client = plaidClient();

    const requestBody = {
      access_token: bundle.access_token,
      cursor: bundle.last_cursor || undefined,
      options: undefined as any,
    };

    const sync = await client.transactionsSync(requestBody);
    const { added, modified, removed, next_cursor, has_more } = sync.data;

    // Persist the latest cursor
    if (next_cursor && next_cursor !== bundle.last_cursor) {
      await updateCursor(item_id, next_cursor);
    }

    return res.status(200).json({ added, modified, removed, next_cursor, has_more });
  } catch (e: any) {
    const payload = e?.response?.data ?? { error: 'internal_error' };
    console.error('[Plaid sync] error', payload);
    return res.status(500).json(payload);
  }
}