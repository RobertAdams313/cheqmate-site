import type { VercelRequest, VercelResponse } from '@vercel/node';

function env(k: string) { return process.env[k]; }

export default async function debugPlaid(req: VercelRequest, res: VercelResponse) {
  const forced = (env('FORCE_PLAID_ENV') || '').toLowerCase();
  const resolved_env =
    forced === 'sandbox' ? 'sandbox' :
    forced === 'development' ? 'development' :
    forced === 'production' ? 'production' :
    (env('PLAID_ENV') || 'production');

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    router: 'vercel-node',
    resolved_env,
    has: {
      PLAID_CLIENT_ID_PROD: !!env('PLAID_CLIENT_ID_PROD'),
      PLAID_SECRET_PROD: !!env('PLAID_SECRET_PROD'),
      PLAID_REDIRECT_URI_PROD: !!env('PLAID_REDIRECT_URI_PROD'),
      PLAID_CLIENT_ID_SANDBOX: !!env('PLAID_CLIENT_ID_SANDBOX'),
      PLAID_SECRET_SANDBOX: !!env('PLAID_SECRET_SANDBOX'),
      PLAID_REDIRECT_URI_SANDBOX: !!env('PLAID_REDIRECT_URI_SANDBOX'),
      FORCE_PLAID_ENV: env('FORCE_PLAID_ENV') || null,
    }
  });
}
