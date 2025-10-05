import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Optional helper (present in your repo under api/_handlers/plaid-env.js); falls back to process.env
let resolveEnv: ((key: string, fallback?: string) => string | undefined) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pe = require('../plaid-env.js');
  resolveEnv = (k: string, f?: string) => pe?.get?.(k) ?? process.env[k] ?? f;
} catch {
  resolveEnv = (k: string, f?: string) => process.env[k] ?? f;
}

function plaidClient() {
  const forced = (resolveEnv!.call(null, 'FORCE_PLAID_ENV', 'production') || 'production').toLowerCase();
  const envName = forced === 'sandbox' ? 'sandbox'
                : forced === 'development' ? 'development'
                : 'production';

  const configuration = new Configuration({
    basePath: PlaidEnvironments[envName],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': resolveEnv!.call(null, 'PLAID_CLIENT_ID_' + envName.toUpperCase(), process.env.PLAID_CLIENT_ID) as string,
        'PLAID-SECRET': resolveEnv!.call(null, 'PLAID_SECRET_' + envName.toUpperCase(), process.env.PLAID_SECRET) as string,
      },
    },
  });
  return new PlaidApi(configuration);
}

export default async function listRecurring(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const access_token: string | undefined = body?.access_token;
    const account_ids: string[] | undefined = body?.account_ids;

    if (!access_token) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Expected { access_token }' });
      return;
    }

    const client = plaidClient();

    const plaidResp = await client.transactionsRecurringGet({
      access_token,
      options: account_ids && account_ids.length ? { account_ids } : undefined,
    });

    const groups = (plaidResp.data?.groups ?? []).map(g => ({
      group_id: g.group_id,
      frequency: g.frequency,
      category: g.category?.[0] ?? null,
      merchant_name: g.merchant_name ?? g.name ?? null,
      last_amount: g.last_amount?.amount ?? null,
      last_currency: g.last_amount?.iso_currency_code ?? null,
      status: g.status,
      last_date: g.last_date ?? null,
      next_date: g.next_date ?? null,
    }));

    res.status(200).json({
      ok: true,
      groups,
      meta: { source: '/api/_handlers/recurring/list.ts', total: groups.length },
    });
  } catch (e: any) {
    const err = e?.response?.data ?? e;
    res.status(500).json({ error: 'TX_RECURRING_FAILED', detail: err });
  }
}
