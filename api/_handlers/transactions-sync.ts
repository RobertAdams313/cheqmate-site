import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from './plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const access_token: string | undefined = req.body?.access_token;
    const cursor: string | undefined = req.body?.cursor;
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const requestBody = { access_token, cursor };

    const plaidResponse = await plaidClient.transactionsSync(requestBody);
    return res.status(200).json(plaidResponse.data);
  } catch (e: any) {
    // Surface Plaid error payload when available for easier debugging
    const payload = e?.response?.data ?? { error: 'internal_error' };
    console.error('[Plaid sync] error', payload);
    return res.status(500).json(payload);
  }
}