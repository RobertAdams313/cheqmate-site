// /api/link-token.ts
// Creates a Plaid Link token.
// Supports both add-mode and update-mode (re-auth).
//
// POST body:
//   { flow: "add" }
//   { flow: "update", item_id: "ITEM_ID" }

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const env = process.env.PLAID_ENV ?? 'production'
const redirectUri = process.env.PLAID_REDIRECT_URI ?? undefined
const webhookUrl  = process.env.PLAID_WEBHOOK_URL ?? undefined

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

const tokensFile = path.join('/tmp', 'tokens.json')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { flow, item_id } = req.body ?? {}

    if (flow === 'update') {
      if (!item_id) return res.status(400).json({ error: 'Missing item_id for update' })
      const tokens: Record<string,string> = fs.existsSync(tokensFile)
        ? JSON.parse(fs.readFileSync(tokensFile, 'utf8'))
        : {}
      const access_token = tokens[item_id]
      if (!access_token) return res.status(404).json({ error: 'No access_token for item_id' })

      const resp = await plaid.linkTokenCreate({
        client_name: 'CheqMate',
        language: 'en',
        country_codes: [CountryCode.Us],
        user: { client_user_id: 'cheqmate-user' }, // replace with your real user id
        access_token, // <-- update-mode
        redirect_uri: redirectUri,
        webhook: webhookUrl,
      })

      return res.status(200).json({ link_token: resp.data.link_token })
    }

    // Default: add flow
    const resp = await plaid.linkTokenCreate({
      client_name: 'CheqMate',
      language: 'en',
      country_codes: [CountryCode.Us],
      user: { client_user_id: 'cheqmate-user' }, // replace with your real user id
      products: [Products.Transactions],
      redirect_uri: redirectUri,
      webhook: webhookUrl,
    })

    return res.status(200).json({ link_token: resp.data.link_token })
  } catch (err: any) {
    const status = err?.response?.status ?? 500
    const data = err?.response?.data ?? { error: err?.message ?? 'unknown_error' }
    return res.status(status).json(data)
  }
}
