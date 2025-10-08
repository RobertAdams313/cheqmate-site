import type { VercelRequest, VercelResponse } from '@vercel/node';

type EnvName = 'sandbox' | 'production';
function env(): EnvName {
  const f=(process.env.FORCE_PLAID_ENV||'').toLowerCase();
  if (f==='sandbox'||f==='production') return f as EnvName;
  const e=(process.env.PLAID_ENV||'').toLowerCase();
  return (e==='sandbox'||e==='production') ? (e as EnvName) : 'production';
}
function redirectUri(e: EnvName) {
  return e==='sandbox'
    ? (process.env.PLAID_REDIRECT_URI_SANDBOX || process.env.PLAID_REDIRECT_URI)
    : (process.env.PLAID_REDIRECT_URI_PROD   || process.env.PLAID_REDIRECT_URI);
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const e = env();
  const payload = {
    plaid_env: e,
    redirect_uri: redirectUri(e),
    has_client_id: !!(process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID || process.env.PLAID_CLIENT_ID_PROD),
    has_secret: !!(process.env.PLAID_SECRET_SANDBOX || process.env.PLAID_SECRET || process.env.PLAID_SECRET_PROD),
    blob_public_base: process.env.BLOB_PUBLIC_BASE || null
  };
  res.setHeader('content-type','application/json; charset=utf-8');
  res.status(200).send(JSON.stringify(payload));
}
