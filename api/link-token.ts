import type { VercelRequest, VercelResponse } from '@vercel/node';
import { envFromFlags, baseUrlFor, credsFor } from '../lib/plaid-env';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const flow = String(req.body?.flow ?? 'add');                   // 'add' | 'update'
    const accessToken: string | undefined = req.body?.access_token; // only for 'update'
    const demo = req.body?.demo === true;                           // <- from iOS
    const env = envFromFlags({ demo });
    const base = baseUrlFor(env);
    const { client_id, secret, redirect_uri } = credsFor(env);

    const common: any = {
      client_id,
      secret,
      client_name: 'CheqMate',
      language: 'en',
      country_codes: ['US'],
    };
    if (redirect_uri) common.redirect_uri = redirect_uri;

    // Your earlier request-construction rule (pure add vs update)
    let createReq: any;
    if (flow === 'update') {
      if (!accessToken) return res.status(400).json({ error: 'access_token is required for update mode' });
      createReq = { ...common, access_token: accessToken };
      console.log(`[Plaid link-token] mode=update env=${env} has_access_token=1`);
    } else {
      createReq = { ...common }; // NO access_token in pure add
      console.log(`[Plaid link-token] mode=add env=${env} has_access_token=0`);
    }

    const r = await fetch(`${base}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const text = await r.text();
    if (r.status < 200 || r.status >= 300) {
      console.error(`[Plaid link-token] HTTP ${r.status}: ${text}`);
      return res.status(r.status).send(text);
    }
    const json = JSON.parse(text);
    const token: string | undefined = json.link_token;
    console.log(`[Plaid link-token] ok env=${env} token_prefix=${typeof token === 'string' ? token.split('-').slice(0,2).join('-')+'-' : 'n/a'}`);
    return res.status(200).json({ link_token: token });
  } catch (e: any) {
    console.error('[Plaid link-token] error', e?.message || e);
    return res.status(500).json({ error: 'internal_error' });
  }
}
