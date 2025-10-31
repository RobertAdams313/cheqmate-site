import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from '../../_lib/plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const access_token: string | undefined = body?.access_token;
    const start_date: string | undefined = body?.start_date;
    const end_date: string | undefined = body?.end_date;

    if (!access_token || !start_date || !end_date) {
      return res.status(400).json({ error: 'BAD_REQUEST', detail: 'access_token, start_date, end_date are required' });
    }

    const client = plaidClient(); // ✅ instantiate client

    const requestBody = {
      access_token,
      start_date,
      end_date,
      options: { include_personal_finance_category: true },
    };

    const plaidResponse = await client.transactionsGet(requestBody);
    return res.status(200).json({
      transactions: plaidResponse.data.transactions,
      request_id: plaidResponse.data.request_id,
    });
  } catch (e: any) {
    const payload = e?.response?.data ?? { error: 'GET_FAILED' };
    console.error('[Plaid get] error', payload);
    return res.status(500).json(payload);
  }
}