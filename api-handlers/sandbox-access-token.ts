import type { VercelRequest, VercelResponse } from '@vercel/node';
import { plaidClient, resolvePlaidEnv } from '../lib/plaid';
import { Products } from 'plaid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = resolvePlaidEnv((req.query.env as string) || (req.headers['x-plaid-env'] as string));
    if (env !== 'sandbox') {
      return res.status(400).json({ error: 'ONLY_SANDBOX_SUPPORTED' });
    }

    const client = plaidClient(env);

    // ✅ Valid request body for Plaid Sandbox
    const publicTokenResp = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508',              // Plaid Test Institution
      initial_products: [Products.Transactions], // just Transactions
    });

    // ✅ Exchange that public token for an access token
    const exchangeResp = await client.itemPublicTokenExchange({
      public_token: publicTokenResp.data.public_token,
    });

    res.status(200).json({
      env,
      access_token: exchangeResp.data.access_token,
      item_id: exchangeResp.data.item_id,
    });
  } catch (err: any) {
    console.error('api/sandbox-access-token error', err?.response?.data || err);
    res.status(500).json({
      error: 'SANDBOX_TOKEN_FAILED',
      detail: err?.response?.data || err?.message,
    });
  }
}
