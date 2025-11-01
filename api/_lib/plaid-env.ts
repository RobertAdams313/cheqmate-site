// api/_lib/plaid-env.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

type PlaidMode = 'sandbox' | 'production';

function resolveEnv(): PlaidMode {
  const forced = (process.env.FORCE_PLAID_ENV || '').toLowerCase();
  if (forced === 'sandbox' || forced === 'production') return forced as PlaidMode;
  const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
  return (env === 'sandbox' || env === 'production') ? (env as PlaidMode) : 'production';
}

export function plaidClient(): PlaidApi {
  const env = resolveEnv();

  const id  = env === 'sandbox'
    ? (process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID)
    : (process.env.PLAID_CLIENT_ID_PROD    || process.env.PLAID_CLIENT_ID);

  const sec = env === 'sandbox'
    ? (process.env.PLAID_SECRET_SANDBOX || process.env.PLAID_SECRET)
    : (process.env.PLAID_SECRET_PROD    || process.env.PLAID_SECRET);

  if (!id || !sec) throw new Error(`Missing Plaid credentials for ${env}`);

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': id,
        'PLAID-SECRET': sec,
        // Pin Plaid API date to avoid drift
        'Plaid-Version': '2020-09-14',
      },
    },
  });

  return new PlaidApi(configuration);
}

export function plaidEnv(): PlaidMode {
  return resolveEnv();
}