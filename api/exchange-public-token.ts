import type { VercelRequest, VercelResponse } from '@vercel/node';
import { envFromFlags, baseUrlFor, credsFor } from '../lib/plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const public_token: string | undefined = req.body?.public_token;
    if (!public_token) return res.status(400).json({ error: 'public_token is required' });

    const env = envFromFlags({ token: public_token });
    const base = baseUrlFor(env);
    const { client_id, secret } = credsFor(env);

    const body = { client_id, secret, public_token };

    const r = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    if (r.status < 200 || r.status >= 300) {
      console.error(`[Plaid exchange] HTTP ${r.status}: ${text}`);
      return res.status(r.status).send(text);
    }
    const json = JSON.parse(text);
    // normalize for your iOS client
    const exchange = {
      item_id: json.item_id,
      access_token: json.access_token,
      request_id: json.request_id,
    };
    console.log(`[Plaid exchange] ok env=${env} item_id=${exchange.item_id}`);
    return res.status(200).json(exchange);
  } catch (e: any) {
    console.error('[Plaid exchange] error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
