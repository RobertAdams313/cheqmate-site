// api/debug-plaid.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const env = (req.query.env ?? process.env.FORCE_PLAID_ENV ?? 'production').toString().toLowerCase();
  const sandbox = env === 'sandbox';
  const has = {
    PLAID_CLIENT_ID_PROD: !!process.env.PLAID_CLIENT_ID_PROD,
    PLAID_SECRET_PROD: !!process.env.PLAID_SECRET_PROD,
    PLAID_REDIRECT_URI_PROD: !!process.env.PLAID_REDIRECT_URI_PROD,
    PLAID_CLIENT_ID_SANDBOX: !!process.env.PLAID_CLIENT_ID_SANDBOX,
    PLAID_SECRET_SANDBOX: !!process.env.PLAID_SECRET_SANDBOX,
    PLAID_REDIRECT_URI_SANDBOX: !!process.env.PLAID_REDIRECT_URI_SANDBOX,
    FORCE_PLAID_ENV: process.env.FORCE_PLAID_ENV || null
  };
  return res.status(200).json({ router: 'vercel-node', resolved_env: sandbox ? 'sandbox' : 'production', has });
}
