// /api/link-token
// POST { flow: "add" }  OR  { flow: "update", item_id: "ITEM_ID" }
// Optionally include { client_user_id: "user-123" } for unique users.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from '../_lib/plaid';
import { readTokenBundle } from '../_lib/secure-storage';

const redirectUri = process.env.PLAID_REDIRECT_URI || undefined;
const webhookUrl  = process.env.PLAID_WEBHOOK_URL || undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

    const { flow = 'add', item_id, client_user_id } =
      (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};

    const user_id = (client_user_id && String(client_user_id)) || 'cheqmate-user';
    const client = plaidClient();

    const base = {
      client_name: 'CheqMate',
      language: 'en',
      country_codes: [CountryCode.Us],
      user: { client_user_id: user_id },
      redirect_uri: redirectUri, // Required for iOS OAuth flows (Universal Link)
      webhook: webhookUrl || undefined,
    } as const;

    if (flow === 'update') {
      if (!item_id) return res.status(400).json({ error: 'MISSING_ITEM_ID' });
      const bundle = await readTokenBundle(item_id);
      if (!bundle) return res.status(404).json({ error: 'NO_TOKEN_FOR_ITEM' });

      const { data } = await client.linkTokenCreate({
        ...base,
        access_token: bundle.access_token,
      });
      return res.status(200).json({ link_token: data.link_token, flow: 'update' });
    }

    // default: add
    const { data } = await client.linkTokenCreate({
      ...base,
      products: [Products.Transactions],
    });
    return res.status(200).json({ link_token: data.link_token, flow: 'add' });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const data = err?.response?.data ?? { error: err?.message ?? 'unknown_error' };
    return res.status(status).json(data);
  }
}