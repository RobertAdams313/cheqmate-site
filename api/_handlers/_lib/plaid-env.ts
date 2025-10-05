// api/_handlers/_lib/plaid-env.ts
// Runtime Plaid client + environment helper for server-side handlers

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const envName = (process.env.PLAID_ENV || 'sandbox').toLowerCase() as keyof typeof PlaidEnvironments;
export const plaidEnv = PlaidEnvironments[envName];

const config = new Configuration({
  basePath: plaidEnv,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
      'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      'Plaid-Version': '2020-09-14',
    },
  },
});

export const plaidClient = new PlaidApi(config);
