// api/link-token.ts
// Vercel serverless endpoint for Plaid Link token creation.
// Supports add-mode (institution picker) and update-mode (relink existing item).
// 2025-10-05 – Fixed to avoid defaulting to update-mode when flow="add".
//               No access_token or institution_id in add-mode = Plaid institution picker.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLAID_BASE = 'https://production.plaid.com';
const CLIENT_ID  = process.env.PLAID_CLIENT_ID_PROD!;
const SECRET     = process.env.PLAID_SECRET_PROD!;
const REDIRECT   = process.env.PLAID_REDIRECT_URI_PROD!;
const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const flow = String(req.body?.flow ?? 'add');
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
      if (!accessToken) {
        return res.status(400).json({ error: 'access_token is required for update mode' });
      }
      // Update-mode: reauthenticate existing item
      createReq = { ...common, access_token: accessToken };
    } else {
      // ✅ Add-mode: brand new Link session (shows institution picker)
      createReq = { ...common };
    }

    const plaidResp = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const json = await plaidResp.json();
    if (!plaidResp.ok) {
      console.error('Plaid error', json);
      return res.status(plaidResp.status).json(json);
    }

    console.log(`[Plaid link-token] flow=${flow} link_token=${json.link_token?.slice(0, 12)}...`);
    return res.status(200).json({ link_token: json.link_token });
  } catch (e: any) {
    console.error('link-token handler failed:', e);
    return res.status(500).json({ error: e?.message || 'unknown' });
  }
}
