import type { VercelRequest, VercelResponse } from '@vercel/node';
import { envFromFlags, baseUrlFor, credsFor } from '../lib/plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const access_token: string | undefined = req.body?.access_token;
    const cursor: string | undefined = req.body?.cursor;
    if (!access_token) return res.status(400).json({ error: 'access_token is required' });

    const env = envFromFlags({ token: access_token });
    const base = baseUrlFor(env);
    const { client_id, secret } = credsFor(env);

    const body = { client_id, secret, access_token, cursor };

    const r = await fetch(`${base}/transactions/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    if (r.status < 200 || r.status >= 300) {
      console.error(`[Plaid sync] HTTP ${r.status}: ${text}`);
      return res.status(r.status).send(text);
    }
    const json = JSON.parse(text);
    return res.status(200).json(json);
  } catch (e: any) {
    console.error('[Plaid sync] error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
