// api/link-token.ts
// Vercel serverless (Node) endpoint to create Plaid Link tokens.
// - Honors env selection via ?env= / body.env / FORCE_PLAID_ENV (production default)
// - Add-mode => institution picker (NO access_token, NO institution_id)
// - Update-mode => requires access_token
// - Defensive logging + clear 4xx/5xx errors

import type { VercelRequest, VercelResponse } from '@vercel/node';

function resolveEnv(req: VercelRequest) {
  const raw = (req.query?.env ?? req.body?.env ?? process.env.FORCE_PLAID_ENV ?? 'production').toString().toLowerCase();
  return raw === 'sandbox' ? 'sandbox' : 'production';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const which = resolveEnv(req);                       // 'production' | 'sandbox'
  const isSandbox = which === 'sandbox';
  const PLAID_BASE = isSandbox ? 'https://sandbox.plaid.com' : 'https://production.plaid.com';

  const CLIENT_ID  = isSandbox ? process.env.PLAID_CLIENT_ID_SANDBOX   : process.env.PLAID_CLIENT_ID_PROD;
  const SECRET     = isSandbox ? process.env.PLAID_SECRET_SANDBOX      : process.env.PLAID_SECRET_PROD;
  const REDIRECT   = isSandbox ? process.env.PLAID_REDIRECT_URI_SANDBOX: process.env.PLAID_REDIRECT_URI_PROD;
  const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1';

  // Fail fast on missing env for the selected environment
  const missing: string[] = [];
  if (!CLIENT_ID) missing.push('client_id');
  if (!SECRET) missing.push('secret');
  if (!REDIRECT) missing.push('redirect_uri');
  if (missing.length) {
    console.error('[Plaid link-token] missing env for', which, missing);
    return res.status(400).json({
      error_code: 'MISSING_FIELDS',
      error_message: `Missing required fields for ${which}: ${missing.join(', ')}`,
    });
  }

  try {
    const flow = String(req.body?.flow ?? 'add');                    // 'add' | 'update'
    const accessToken: string | undefined = req.body?.access_token;
    // Note: we INTENTIONALLY ignore any institution_id for add-mode so the picker shows.

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

    // 👇 Enforce mode explicitly
    let createReq: any;
    if (flow === 'update') {
      if (!accessToken) {
        return res.status(400).json({ error: 'access_token is required for update mode' });
      }
      createReq = { ...common, access_token: accessToken };
      console.log('[Plaid link-token] mode=update env=%s has_access_token=1', which);
    } else {
      createReq = { ...common }; // ✅ pure add-mode
      console.log('[Plaid link-token] mode=add env=%s has_access_token=0', which);
    }

    // Create the link token
    const r = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const json = await r.json().catch(() => ({} as any));
    if (!r.ok) {
      console.error('[Plaid link-token] Plaid error', which, r.status, json);
      return res.status(r.status).json(json);
    }

    console.log('[Plaid link-token] ok env=%s token_prefix=%s', which, String(json.link_token).slice(0, 16));
    return res.status(200).json({ link_token: json.link_token });
  } catch (e: any) {
    console.error('[Plaid link-token] handler failed:', e?.stack || e?.message || e);
    return res.status(500).json({ error: 'FUNCTION_INVOCATION_FAILED' });
  }
}
