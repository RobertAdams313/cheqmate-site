import { NextRequest, NextResponse } from 'next/server'
import { PlaidEnvironments } from 'plaid'

function resolveEnv(): 'sandbox' | 'production' {
  const env = (process.env.PLAID_ENV || '').toLowerCase()
  return env === 'production' ? 'production' : 'sandbox'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const flow: string = (body?.flow || 'add').toString()
    const accessToken: string | undefined = body?.access_token

    const env = resolveEnv()
    const PLAID_BASE = PlaidEnvironments[env]

    const CLIENT_ID =
      env === 'sandbox'
        ? (process.env.PLAID_CLIENT_ID_SANDBOX || process.env.PLAID_CLIENT_ID)
        : (process.env.PLAID_CLIENT_ID_PROD    || process.env.PLAID_CLIENT_ID)

    const SECRET =
      env === 'sandbox'
        ? (process.env.PLAID_SECRET_SANDBOX || process.env.PLAID_SECRET)
        : (process.env.PLAID_SECRET_PROD    || process.env.PLAID_SECRET)

    const REDIRECT =
      env === 'sandbox'
        ? (process.env.PLAID_REDIRECT_URI_SANDBOX || process.env.PLAID_REDIRECT_URI)
        : (process.env.PLAID_REDIRECT_URI_PROD    || process.env.PLAID_REDIRECT_URI)

    const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1'

    const common: any = {
      client_id: CLIENT_ID,
      secret: SECRET,
      user: { client_user_id: CLIENT_USER_ID },
      products: ['transactions'],
      redirect_uri: REDIRECT,
      language: 'en',
      country_codes: ['US'],
    }

    let createReq: any
    if (flow === 'update') {
      if (!accessToken) {
        return NextResponse.json(
          { error: 'access_token is required for update mode' },
          { status: 400 }
        )
      }
      createReq = { ...common, access_token: accessToken }
    } else {
      createReq = common
    }

    const r = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    })

    const json = await r.json()
    if (!r.ok) return NextResponse.json(json, { status: r.status })

    return NextResponse.json({ link_token: json.link_token })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 })
  }
}
