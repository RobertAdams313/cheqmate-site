import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient } from './plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const access_token: string | undefined = req.body?.access_token;
    const start_date: string | undefined = req.body?.start_date;
    const end_date: string | undefined = req.body?.end_date;

    if (!access_token || !start_date || !end_date) {
      return res
        .status(400)
        .json({ error: 'access_token, start_date, end_date are required' });
    }

    const requestBody = {
      access_token,
      start_date,
      end_date,
      options: { include_personal_finance_category: true },
    };

    const plaidResponse = await plaidClient.transactionsGet(requestBody);
    return res.status(200).json(plaidResponse.data);
  } catch (e: any) {
    const payload = e?.response?.data ?? { error: 'internal_error' };
    console.error('[Plaid get] error', payload);
    return res.status(500).json(payload);
  }
}