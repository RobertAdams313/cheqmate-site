// /api/item/remove.ts
// Revokes a Plaid Item and deletes its token from local storage.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'
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

const tokensFile = path.join('/tmp', 'tokens.json')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { item_id } = req.body ?? {}
    if (!item_id) return res.status(400).json({ error: 'Missing item_id' })

    const tokens: Record<string,string> = fs.existsSync(tokensFile)
      ? JSON.parse(fs.readFileSync(tokensFile, 'utf8'))
      : {}

    const access_token = tokens[item_id]
    if (!access_token) return res.status(404).json({ error: 'Item not found' })

    await plaid.itemRemove({ access_token })
    delete tokens[item_id]
    fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2))

    return res.status(200).json({ ok: true })
  } catch (err:any) {
    const status = err?.response?.status ?? 500
    const data = err?.response?.data ?? { error: err.message }
    return res.status(status).json(data)
  }
}
