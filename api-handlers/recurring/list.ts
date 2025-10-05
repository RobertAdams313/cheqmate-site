// /api/recurring/list.ts
// Normalizes Plaid Recurring Transactions into { income: [...], bills: [...] }.
//
// POST body:
//   { access_token: string, account_ids?: string[] }
//
// Response (normalized):
//   {
//     income: [{
//       id, merchant, category, frequency, estimated_amount, last_date, next_date, account_ids
//     }],
//     bills:  [{
//       id, merchant, category, frequency, estimated_amount, last_date, next_date, account_ids
//     }]
//   }
//
// Notes:
// - We keep types intentionally loose (any) to survive minor schema diffs across Plaid SDK versions.
// - If Plaid adds fields, they pass through in the "raw" object under each normalized group.
//
// Docs: Recurring Transactions overview and API reference.  (See Plaid docs)
//

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

    // Call Plaid
    const plaidResp = await plaid.transactionsRecurringGet({
      access_token,
      options: account_ids && Array.isArray(account_ids) && account_ids.length > 0
        ? { account_ids }
        : undefined
    })

    const data: any = plaidResp.data

    // Plaid typically returns separate arrays for inflows and outflows. We normalize below.
    const inflowStreams  = data.inflow_streams  || data.inflows  || []
    const outflowStreams = data.outflow_streams || data.outflows || []

    // Helper to safely extract fields from Plaid's stream objects
    const mapStream = (s: any) => {
      // Common fields we expect from Plaid recurring streams:
      // - stream_id / id
      // - merchant_name / merchant
      // - personal_finance_category / category
      // - frequency
      // - last_date / last_occurrence_date
      // - next_date / next_estimated_date
      // - last_amount / average_amount / estimated_amount
      // - account_ids (array)
      const id =
        s.stream_id ?? s.id ?? s.group_id ?? `${(s.merchant_name || s.merchant || 'unknown')}-${s.frequency ?? 'unknown'}`
      const merchant =
        s.merchant_name ?? s.merchant ?? s.counterparty_name ?? s.name ?? 'Unknown'
      const category =
        (s.personal_finance_category?.primary ?? s.category?.primary ?? s.category?.detailed) ??
        s.category ?? null
      const frequency = s.frequency ?? s.cadence ?? null
      const estimated_amount =
        s.estimated_amount ?? s.average_amount ?? s.last_amount ?? null
      const last_date =
        s.last_date ?? s.last_occurrence_date ?? s.last_seen_date ?? null
      const next_date =
        s.next_date ?? s.next_estimated_date ?? s.upcoming_date ?? null
      const account_ids =
        s.account_ids ?? (Array.isArray(s.account_id) ? s.account_id : (s.account_id ? [s.account_id] : []))

      return {
        id: String(id),
        merchant: merchant ? String(merchant) : 'Unknown',
        category: category ? String(category) : null,
        frequency: frequency ? String(frequency) : null,
        estimated_amount: typeof estimated_amount === 'number' ? estimated_amount : (estimated_amount?.amount ?? null),
        last_date: last_date ?? null,
        next_date: next_date ?? null,
        account_ids: Array.isArray(account_ids) ? account_ids : [],
        raw: s, // keep original for future fields without breaking the client
      }
    }

    const normalized = {
      income: (inflowStreams as any[]).map(mapStream),
      bills:  (outflowStreams as any[]).map(mapStream),
    }

    return res.status(200).json(normalized)
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const data = err?.response?.data ?? { error: 'unknown_error' }
    return res.status(status).json(data)
  }
}
