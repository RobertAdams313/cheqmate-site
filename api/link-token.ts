// api/link-token.ts
// Vercel serverless endpoint for Plaid Link token creation.
// Honors env selection via ?env=, body.env, or FORCE_PLAID_ENV (default: production).
// Add-mode => institution picker (no access_token/institution_id). Update-mode => requires access_token.

import type { VercelRequest, VercelResponse } from '@vercel/node';

function resolveEnv(req: VercelRequest) {
  const q = (req.query?.env ?? req.body?.env ?? process.env.FORCE_PLAID_ENV ?? 'production').toString();
  const v = q.toLowerCase();
  return v === 'sandbox' ? 'sandbox' : 'production';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const which = resolveEnv(req);                      // 'production' | 'sandbox'
  const isSandbox = which === 'sandbox';
  const PLAID_BASE = isSandbox ? 'https://sandbox.plaid.com' : 'https://production.plaid.com';

  const CLIENT_ID  = isSandbox ? process.env.PLAID_CLIENT_ID_SANDBOX  : process.env.PLAID_CLIENT_ID_PROD;
  const SECRET     = isSandbox ? process.env.PLAID_SECRET_SANDBOX     : process.env.PLAID_SECRET_PROD;
  const REDIRECT   = isSandbox ? process.env.PLAID_REDIRECT_URI_SANDBOX : process.env.PLAID_REDIRECT_URI_PROD;
  const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1';

  // Fail fast if any required vars are missing for this environment
  const missing: string[] = [];
  if (!CLIENT_ID) missing.push('client_id');
  if (!SECRET) missing.push('secret');
  if (!REDIRECT) missing.push('redirect_uri');
  if (missing.length) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: `Missing required fields for ${which}: ${missing.join(', ')}`
    });
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
      if (!accessToken) return res.status(400).json({ error: 'access_token is required for update mode' });
      createReq = { ...common, access_token: accessToken };
    } else {
      // ✅ Add-mode: fresh link (shows institution picker)
      createReq = { ...common };
    }

    const r = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const json = await r.json();
    if (!r.ok) {
      console.error('Plaid error', which, json);
      return res.status(r.status).json(json);
    }

    console.log(`[Plaid link-token] env=${which} flow=${flow} link_token=${String(json.link_token).slice(0,12)}...`);
    return res.status(200).json({ link_token: json.link_token });
  } catch (e: any) {
    console.error('link-token handler failed:', e);
    return res.status(500).json({ error: e?.message || 'unknown' });
  }
}
