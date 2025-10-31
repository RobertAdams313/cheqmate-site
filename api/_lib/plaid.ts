import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

type PlaidMode = 'sandbox' | 'production';

function resolveEnv(): PlaidMode {
  const forced = (process.env.FORCE_PLAID_ENV || '').toLowerCase();
  if (forced === 'sandbox' || forced === 'production') return forced;
  const env = (process.env.PLAID_ENV || '').toLowerCase();
  return (env === 'sandbox' || env === 'production') ? env : 'production';
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

  // Pin Plaid API version (Plaid recommends pinning).
  const configuration = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': id,
        'PLAID-SECRET': sec,
        'Plaid-Version': '2020-09-14',
      },
    },
  });

  return new PlaidApi(configuration);
}

export function plaidEnv(): PlaidMode {
  return resolveEnv();
}