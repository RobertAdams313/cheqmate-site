import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, LinkTokenCreateRequest } from 'plaid';

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
    const { flow = 'add', item_id } = (req.body && typeof req.body === 'object') ? req.body : {};
    const client = sandboxClient();

    const user = { client_user_id: 'sbx-smoketest' };
    const base: LinkTokenCreateRequest = {
      client_name: 'CheqMate Sandbox',
      language: 'en',
      country_codes: [CountryCode.Us],
      user
    };

    let reqBody: LinkTokenCreateRequest;
    if (flow === 'update') {
      if (!item_id) return res.status(400).json({ error: 'MISSING_ITEM_ID' });
      reqBody = { ...base, access_token: 'access-sandbox-do-not-use-directly' as any }; // dummy to satisfy type, we override below
      // Plaid will pick update mode from access_token param; we pass it via baseOptions headers trick:
      // Instead of complicating with new client, just use /link/token/create with access_token in body:
      (reqBody as any).access_token = item_id.startsWith('access-') ? item_id : undefined; // not ideal; see note below
      // NOTE: For a strict test, you’d normally store the sandbox access_token from /sbx-exchange and pass it here.
      // For this smoke test, we’re demonstrating the endpoint wiring; if you want a full update-mode proof,
      // we can extend /sbx-exchange to persist the sandbox token bundle and then read it back here.
    } else {
      reqBody = base; // add-mode
    }

    const { data } = await client.linkTokenCreate(reqBody);
    return res.status(200).json({ link_token: data.link_token, mode: 'sandbox', flow });
  } catch (err: any) {
    return res.status(500).json({ error: 'SBX_LINK_TOKEN_FAILED', detail: err?.response?.data || err?.message || String(err) });
  }
}
