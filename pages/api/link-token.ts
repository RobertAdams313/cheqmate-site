// pages/api/link-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const PLAID_BASE = 'https://production.plaid.com';
const CLIENT_ID  = process.env.PLAID_CLIENT_ID_PROD!;
const SECRET     = process.env.PLAID_SECRET_PROD!;
const REDIRECT   = process.env.PLAID_REDIRECT_URI_PROD!;
const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const flow = String((req.body?.flow ?? 'add'));
    const accessToken: string | undefined = req.body?.access_token;

    const common: any = {
      client_id: CLIENT_ID,
      secret: SECRET,
      client_name: 'CheqMate',
      language: 'en',
      country_codes: ['US'],
      redirect_uri: REDIRECT,
      user: { client_user_id: CLIENT_USER_ID },
      products: ['transactions'],
    };

    let createReq: any;

    if (flow === 'update') {
      if (!accessToken) return res.status(400).json({ error: 'access_token is required for update mode' });
      createReq = { ...common, access_token: accessToken };
    } else {
      // ✅ Add-mode: brand new Link session (institution picker)
      createReq = { ...common };
    }

    const r = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const json = await r.json();
    if (!r.ok) return res.status(r.status).json(json);

    return res.status(200).json({ link_token: json.link_token });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'unknown' });
  }
}
