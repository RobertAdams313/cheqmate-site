// /api/items/list.ts
// Returns linked Items + accounts with "enabled" merged from account_state.json.
//
// tokens.json shape: { "<item_id>": "<access_token>", ... }
// account_state.json shape: { "<item_id>": { "<account_id>": true/false, ... }, ... }

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
const stateFile  = path.join('/tmp', 'account_state.json')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const tokens: Record<string,string> = fs.existsSync(tokensFile)
      ? JSON.parse(fs.readFileSync(tokensFile, 'utf8'))
      : {}
    const state: Record<string, Record<string, boolean>> = fs.existsSync(stateFile)
      ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
      : {}

    const results: any[] = []

    for (const [item_id, access_token] of Object.entries(tokens)) {
      try {
        const resp = await plaid.accountsGet({ access_token })
        const perItemState = state[item_id] ?? {}

        results.push({
          item_id,
          institution_name: 'Unknown', // TODO: use items/get + institutions/get_by_id if you store institution_id
          accounts: resp.data.accounts.map(acct => ({
            account_id: acct.account_id,
            name: acct.name,
            mask: acct.mask,
            subtype: acct.subtype,
            enabled: perItemState.hasOwnProperty(acct.account_id)
              ? !!perItemState[acct.account_id]
              : true
          }))
        })
      } catch (e) {
        console.error(e)
      }
    }

    return res.status(200).json(results)
  } catch (err:any) {
    return res.status(500).json({ error: err.message })
  }
}
