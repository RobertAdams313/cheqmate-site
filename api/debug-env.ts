import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidEnv, resolveRedirectUri } from './_lib/plaid';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('content-type','application/json; charset=utf-8');
  return res.status(200).send(JSON.stringify({
    plaid_env: plaidEnv(),
    redirect_uri: resolveRedirectUri(),
    has_client_id: !!(process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID || process.env.PLAID_CLIENT_ID_PROD),
    has_secret: !!(process.env.PLAID_SECRET_SANDBOX || process.env.PLAID_SECRET || process.env.PLAID_SECRET_PROD)
  }));
}
