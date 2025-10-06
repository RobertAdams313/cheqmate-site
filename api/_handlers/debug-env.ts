import type { VercelRequest, VercelResponse } from '@vercel/node';

type EnvName = 'sandbox' | 'production';
function resolveEnv(): EnvName {
  const forced = (process.env.FORCE_PLAID_ENV || '').toLowerCase();
  if (forced === 'sandbox' || forced === 'production') return forced as EnvName;
  const env = (process.env.PLAID_ENV || '').toLowerCase();
  return (env === 'sandbox' || env === 'production') ? (env as EnvName) : 'production';
}

function resolveRedirectUri(env: EnvName): string | undefined {
  if (env === 'sandbox') return process.env.PLAID_REDIRECT_URI_SANDBOX || process.env.PLAID_REDIRECT_URI;
  return process.env.PLAID_REDIRECT_URI_PROD || process.env.PLAID_REDIRECT_URI;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const env = resolveEnv();
  const redirect = resolveRedirectUri(env);

  const payload = {
    plaid_env: env,
    redirect_uri: redirect,
    has_client_id: !!(process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID || process.env.PLAID_CLIENT_ID_PROD),
    has_secret: !!(process.env.PLAID_SECRET_SANDBOX || process.env.PLAID_SECRET || process.env.PLAID_SECRET_PROD),
    blob_public_base: process.env.BLOB_PUBLIC_BASE || null
  };

  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.status(200).send(JSON.stringify(payload));
}
