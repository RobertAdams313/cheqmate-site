import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolvePlaidEnv } from '../lib/plaid';
export default function handler(req: VercelRequest, res: VercelResponse) {
  const envOverride = (req.query.env as string) || (req.headers['x-plaid-env'] as string);
  const resolved = resolvePlaidEnv(envOverride);
  res.status(200).json({
    router: 'vercel-functions',
    resolved_env: resolved,
    has: {
      PLAID_CLIENT_ID_PROD: !!process.env.PLAID_CLIENT_ID_PROD,
      PLAID_SECRET_PROD: !!process.env.PLAID_SECRET_PROD,
      PLAID_REDIRECT_URI_PROD: !!process.env.PLAID_REDIRECT_URI_PROD,
      PLAID_CLIENT_ID_SANDBOX: !!process.env.PLAID_CLIENT_ID_SANDBOX,
      PLAID_SECRET_SANDBOX: !!process.env.PLAID_SECRET_SANDBOX,
      PLAID_REDIRECT_URI_SANDBOX: !!process.env.PLAID_REDIRECT_URI_SANDBOX,
      FORCE_PLAID_ENV: process.env.FORCE_PLAID_ENV || null
    }
  });
}
