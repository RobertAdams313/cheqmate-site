export type PlaidEnv = 'production' | 'sandbox';

export function envFromFlags(opts: { demo?: boolean; token?: string }): PlaidEnv {
  if (opts.demo) return 'sandbox';
  if (opts.token?.startsWith('public-sandbox-') || opts.token?.startsWith('access-sandbox-')) return 'sandbox';
  const forced = (process.env.FORCE_PLAID_ENV || '').toLowerCase();
  if (forced === 'sandbox') return 'sandbox';
  return 'production';
}

export function baseUrlFor(env: PlaidEnv): string {
  return env === 'sandbox' ? 'https://sandbox.plaid.com' : 'https://production.plaid.com';
}

export function credsFor(env: PlaidEnv): { client_id: string; secret: string; redirect_uri?: string } {
  if (env === 'sandbox') {
    return {
      client_id: must('PLAID_CLIENT_ID_SANDBOX'),
      secret: must('PLAID_SECRET_SANDBOX'),
      redirect_uri: process.env.PLAID_REDIRECT_URI_SANDBOX
    };
  } else {
    return {
      client_id: must('PLAID_CLIENT_ID_PROD'),
      secret: must('PLAID_SECRET_PROD'),
      redirect_uri: process.env.PLAID_REDIRECT_URI_PROD
    };
  }
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
