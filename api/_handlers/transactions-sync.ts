import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from '../../_lib/plaid-env';
import { readTokenBundle, updateCursor } from '../../_lib/secure-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const item_id: string | undefined = body?.item_id;
    if (!item_id) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'item_id is required' });

    const bundle = await readTokenBundle(item_id);
    if (!bundle?.access_token) return res.status(404).json({ error: 'ITEM_NOT_FOUND', detail: 'No token for item_id' });

    const client = plaidClient();

    const syncReq = {
      access_token: bundle.access_token,
      cursor: bundle.last_cursor || undefined,
      options: {
        include_personal_finance_category: true, // ✅ optional, but helpful
        // include_original_description: true,   // uncomment if you want this too
      } as any,
    };

    const sync = await client.transactionsSync(syncReq);
    const { added, modified, removed, next_cursor, has_more, request_id } = sync.data;

    if (next_cursor && next_cursor !== bundle.last_cursor) {
      await updateCursor(item_id, next_cursor);
    }

    return res.status(200).json({ added, modified, removed, next_cursor, has_more, request_id });
  } catch (e: any) {
    const payload = e?.response?.data ?? { error: 'SYNC_FAILED' };
    console.error('[Plaid sync] error', payload);
    return res.status(500).json(payload);
  }
}