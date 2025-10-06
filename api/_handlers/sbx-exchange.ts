import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, SandboxPublicTokenCreateRequest } from 'plaid';

function sandboxClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET_SANDBOX     || process.env.PLAID_SECRET;
  if (!clientId || !secret) throw new Error('Missing sandbox client id/secret');
  const cfg = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: { headers: { 'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': secret } }
  });
  return new PlaidApi(cfg);
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const client = sandboxClient();

    // 1) Create a sandbox public_token
    const createReq: SandboxPublicTokenCreateRequest = {
      institution_id: 'ins_109508', // First Platypus Bank (sandbox)
      initial_products: [Products.Transactions],
      options: { webhook: 'https://example.com/sbx-webhook' }
    };
    const { data: created } = await client.sandboxPublicTokenCreate(createReq);

    // 2) Exchange it (server-side)
    const { data: exchanged } = await client.itemPublicTokenExchange({ public_token: created.public_token });

    // NOTE: We are NOT storing the sandbox access_token; this is a smoke test only.
    // If you want to store it in your blob in the same format as prod, we can wire that next.

    res.setHeader('content-type','application/json; charset=utf-8');
    return res.status(200).send(JSON.stringify({
      mode: 'sandbox',
      item_id: exchanged.item_id,
      access_token_preview: exchanged.access_token?.slice(0,8) + '…', // redacted
      public_token_preview: created.public_token?.slice(0,8) + '…'
    }));
  } catch (err: any) {
    res.status(500).json({ error: 'SBX_EXCHANGE_FAILED', detail: err?.response?.data || err?.message || String(err) });
  }
}
