// /api/recurring/list.ts
// Vercel serverless function (TypeScript / Node 18+)
//
// POST body:
//   { access_token: string, account_ids?: string[] }
// Response:
//   { inflow: [...], outflow: [...] }  // directly from Plaid

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const env = process.env.PLAID_ENV ?? 'production'
const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
        'PLAID-SECRET': process.env.PLAID_SECRET ?? '',
      },
    },
  })
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { access_token, account_ids } = req.body ?? {}
    if (!access_token) return res.status(400).json({ error: 'Missing access_token' })

    const resp = await plaid.transactionsRecurringGet({
      access_token,
      options: account_ids && Array.isArray(account_ids) && account_ids.length > 0
        ? { account_ids }
        : undefined
    })

    return res.status(200).json(resp.data)
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const data = err?.response?.data ?? { error: 'unknown_error' }
    return res.status(status).json(data)
  }
}
