import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
export type PlaidEnv = 'production' | 'sandbox';

export function resolvePlaidEnv(input?: string | null): PlaidEnv {
  const fromArg = (input || '').toLowerCase();
  if (fromArg === 'sandbox') return 'sandbox';
  if (fromArg === 'production') return 'production';
  const forced = (process.env.FORCE_PLAID_ENV || '').toLowerCase();
  if (forced === 'sandbox' || forced === 'production') return forced as PlaidEnv;
  return 'production';
}

export function getPlaidCreds(env: PlaidEnv) {
  if (env === 'sandbox') {
    return {
      client_id: process.env.PLAID_CLIENT_ID_SANDBOX!,
      secret: process.env.PLAID_SECRET_SANDBOX!,
      redirect_uri: process.env.PLAID_REDIRECT_URI_SANDBOX!,
      basePath: PlaidEnvironments.sandbox,
      baseName: 'sandbox'
    };
  }
  return {
    client_id: process.env.PLAID_CLIENT_ID_PROD!,
    secret: process.env.PLAID_SECRET_PROD!,
    redirect_uri: process.env.PLAID_REDIRECT_URI_PROD!,
    basePath: PlaidEnvironments.production,
    baseName: 'production'
  };
}

export function plaidClient(env: PlaidEnv) {
  const { client_id, secret, basePath } = getPlaidCreds(env);
  const configuration = new Configuration({
    basePath,
    baseOptions: { headers: { 'PLAID-CLIENT-ID': client_id, 'PLAID-SECRET': secret } },
  });
  return new PlaidApi(configuration);
}
