import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

function get(k: string, f?: string) { return process.env[k] ?? f; }

function plaidClient() {
  const forced = (get('FORCE_PLAID_ENV', 'production') || 'production').toLowerCase();
  const envName = forced === 'sandbox' ? 'sandbox'
                : forced === 'development' ? 'development'
                : 'production';

  const configuration = new Configuration({
    basePath: PlaidEnvironments[envName],
    baseOptions: {
      headers: {
        // Prefer per-env keys; fall back to generic if provided
        'PLAID-CLIENT-ID': get(`PLAID_CLIENT_ID_${envName.toUpperCase()}`, get('PLAID_CLIENT_ID')) as string,
        'PLAID-SECRET': get(`PLAID_SECRET_${envName.toUpperCase()}`, get('PLAID_SECRET')) as string,
      },
    },
  });

  return { client: new PlaidApi(configuration), envName };
}

export default async function sandboxAccessToken(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { client, envName } = plaidClient();

    if (envName !== 'sandbox') {
      res.status(400).json({ error: 'NOT_SANDBOX', message: 'This helper only works in Plaid sandbox.' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const initial_products = Array.isArray(body?.initial_products) && body.initial_products.length
      ? body.initial_products
      : ['transactions'];

    // 1) Create a sandbox public_token
    const pub = await client.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // First Platypus Bank (sandbox)
      initial_products,
      options: body?.options,
    });

    // 2) Exchange public_token -> access_token
    const ex = await client.itemPublicTokenExchange({
      public_token: pub.data.public_token,
    });

    res.status(200).json({
      ok: true,
      access_token: ex.data.access_token,
      item_id: ex.data.item_id,
      request_id: ex.data.request_id,
    });
  } catch (e: any) {
    res.status(500).json({ error: 'SANDBOX_TOKEN_FAILED', detail: e?.response?.data ?? e?.message ?? String(e) });
  }
}
