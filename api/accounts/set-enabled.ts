// /api/accounts/set-enabled.ts
// Persists per-account "enabled" state locally (or in DB later).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'

const stateFile = path.join('/tmp', 'account_state.json')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { item_id, account_id, enabled } = req.body ?? {}
    if (!item_id || !account_id) return res.status(400).json({ error: 'Missing fields' })

    const store: Record<string, Record<string, boolean>> = fs.existsSync(stateFile)
      ? JSON.parse(fs.readFileSync(stateFile, 'utf8'))
      : {}

    if (!store[item_id]) store[item_id] = {}
    store[item_id][account_id] = !!enabled
    fs.writeFileSync(stateFile, JSON.stringify(store, null, 2))
    return res.status(200).json({ ok: true })
  } catch (err:any) {
    return res.status(500).json({ error: err.message })
  }
}
