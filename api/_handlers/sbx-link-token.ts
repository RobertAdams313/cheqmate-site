import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, LinkTokenCreateRequest, Products } from 'plaid';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { flow = 'add', item_id, access_token } =
  (req.body && typeof req.body === 'object') ? req.body : {};
    const client = sandboxClient();

    const user = { client_user_id: 'sbx-smoketest' };
    const base: LinkTokenCreateRequest = {
client_name: 'CheqMate Sandbox',
      products: [Products.Transactions],
      language: 'en',
      country_codes: [CountryCode.Us],
      user
    };

    let reqBody: LinkTokenCreateRequest;
    if (flow === 'update') {
      if (!access_token) return res.status(400).json({ error: 'MISSING_ACCESS_TOKEN' });
      reqBody = { ...base, access_token };
    } else {
      reqBody = base;
    }

    const { data } = await client.linkTokenCreate(reqBody);
    return res.status(200).json({ link_token: data.link_token, mode: 'sandbox', flow });
  } catch (err: any) {
    return res.status(500).json({ error: 'SBX_LINK_TOKEN_FAILED', detail: err?.response?.data || err?.message || String(err) });
  }
}
