// api/_handlers/link-token.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CountryCode, Products } from 'plaid';
import { plaidClient, plaidEnv } from '../../_lib/plaid-env';
import { readTokenBundle } from '../_lib/secure-storage';

const redirectUri = process.env.PLAID_REDIRECT_URI || undefined;
const webhookUrl  = process.env.PLAID_WEBHOOK_URL || undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const flow: 'add' | 'update' = body.flow === 'update' ? 'update' : 'add';
    const item_id: string | undefined = body.item_id;
    const client_user_id: string =
      (body.client_user_id && String(body.client_user_id)) || `cheqmate-ios-${Date.now()}`;

    const client = plaidClient();
    const env = plaidEnv();

    const base = {
      client_name: 'CheqMate',
      language: 'en',
      country_codes: [CountryCode.Us],
      user: { client_user_id },
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      ...(webhookUrl  ? { webhook: webhookUrl } : {}),
    } as const;

    if (flow === 'update') {
      if (!item_id) return res.status(400).json({ error: 'MISSING_ITEM_ID' });
      const bundle = await readTokenBundle(item_id);
      if (!bundle?.access_token) return res.status(404).json({ error: 'NO_TOKEN_FOR_ITEM' });

      const { data } = await client.linkTokenCreate({
        ...base,
        access_token: bundle.access_token,
      } as any);

      return res.status(200).json({ link_token: data.link_token, flow: 'update', env });
    }

    // default: add
    const { data } = await client.linkTokenCreate({
      ...base,
      products: [Products.Transactions],
    } as any);

    return res.status(200).json({ link_token: data.link_token, flow: 'add', env });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const detail = err?.response?.data ?? { message: String(err) };
    console.error('[link-token] error:', detail);
    return res.status(status).json({ error: 'LINK_TOKEN_CREATE_FAILED', detail });
  }
}