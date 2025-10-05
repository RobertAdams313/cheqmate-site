// /api/transactions-sync
// Returns a single /transactions/sync page (cursor-aware).
// ESM, Vercel serverless compatible.

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

function plaidClient() {
  const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
  const basePath = PlaidEnvironments[env] || PlaidEnvironments.sandbox;
  const config = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': (process.env.PLAID_CLIENT_ID || '').trim(),
        'PLAID-SECRET': (process.env.PLAID_SECRET || '').trim(),
      },
    },
  });
  return new PlaidApi(config);
}

async function readJSON(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { access_token, cursor } = await readJSON(req);
    if (!access_token) return res.status(400).json({ error: 'access_token required' });

    const plaid = plaidClient();
    const { data } = await plaid.transactionsSync({
      access_token,
      cursor: cursor || undefined,
      options: { include_personal_finance_category: true },
    });

    res.status(200).json({
      added: data.added,
      modified: data.modified,
      removed: (data.removed || []).map(t => ({ transaction_id: t.transaction_id })),
      next_cursor: data.next_cursor,
      has_more: data.has_more,
    });
  } catch (e) {
    const status = e?.response?.status || 500;
    const payload = e?.response?.data || e.message || String(e);
    res.status(status).json(typeof payload === 'string' ? { error: payload } : payload);
  }
}
