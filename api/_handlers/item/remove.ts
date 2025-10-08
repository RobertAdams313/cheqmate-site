import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { readAccessToken, saveAccessToken, removeAccessToken } from ('../_lib/storage.js');

function env(k: string, f?: string) { return process.env[k] ?? f; }
function plaidClient() {
  const forced = (env('FORCE_PLAID_ENV', 'production') || 'production').toLowerCase();
  const envName = forced === 'sandbox' ? 'sandbox'
                : forced === 'development' ? 'development'
                : 'production';

  const configuration = new Configuration({
    basePath: PlaidEnvironments[envName],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': env('PLAID_CLIENT_ID_' + envName.toUpperCase(), process.env.PLAID_CLIENT_ID) as string,
        'PLAID-SECRET': env('PLAID_SECRET_' + envName.toUpperCase(), process.env.PLAID_SECRET) as string,
      },
    },
  });
  return new PlaidApi(configuration);
}

export default async function removeItem(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    let { access_token, item_id } = body;

    if (access_token && item_id) {
      await saveAccessToken(item_id, access_token);
    }
    if (!access_token && item_id) {
      access_token = await readAccessToken(item_id);
    }
    if (!access_token) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { access_token } or { item_id }' });
      return;
    }

    const client = plaidClient();
    const out = await client.itemRemove({ access_token });

    if (item_id) {
      await removeAccessToken(item_id).catch(() => {});
    }

    res.status(200).json({ ok: true, removed: true, request_id: out.data?.request_id });
  } catch (e: any) {
    const err = e?.response?.data ?? e;
    res.status(500).json({ error: 'ITEM_REMOVE_FAILED', detail: err });
  }
}
