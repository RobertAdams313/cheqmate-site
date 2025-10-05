import type { VercelRequest, VercelResponse } from '@vercel/node';
import { envFromFlags, baseUrlFor, credsFor } from '../lib/plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const access_token: string | undefined = req.body?.access_token;
    const start_date: string | undefined = req.body?.start_date;
    const end_date: string | undefined = req.body?.end_date;

    if (!access_token || !start_date || !end_date) {
      return res.status(400).json({ error: 'access_token, start_date, end_date are required' });
    }

    const env = envFromFlags({ token: access_token });
    const base = baseUrlFor(env);
    const { client_id, secret } = credsFor(env);

    const body = {
      client_id,
      secret,
      access_token,
      start_date,
      end_date,
      options: { include_personal_finance_category: true }
    };

    const r = await fetch(`${base}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    if (r.status < 200 || r.status >= 300) {
      console.error(`[Plaid get] HTTP ${r.status}: ${text}`);
      return res.status(r.status).send(text);
    }
    const json = JSON.parse(text);
    return res.status(200).json(json);
  } catch (e: any) {
    console.error('[Plaid get] error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
