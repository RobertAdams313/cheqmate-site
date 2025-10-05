// app/api/link-token/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PLAID_BASE = 'https://production.plaid.com';
const CLIENT_ID  = process.env.PLAID_CLIENT_ID_PROD!;
const SECRET     = process.env.PLAID_SECRET_PROD!;
const REDIRECT   = process.env.PLAID_REDIRECT_URI_PROD!;
const CLIENT_USER_ID = process.env.PLAID_CLIENT_USER_ID || 'cheqmate-user-1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const flow: string = (body?.flow || 'add').toString();
    const accessToken: string | undefined = body?.access_token;

    const common: any = {
      client_id: CLIENT_ID,
      secret: SECRET,
      client_name: 'CheqMate',
      language: 'en',
      country_codes: ['US'],
      redirect_uri: REDIRECT,
      user: { client_user_id: CLIENT_USER_ID },
      products: ['transactions'],
    };

    let createReq: any;

    if (flow === 'update') {
      if (!accessToken) {
        return NextResponse.json(
          { error: 'access_token is required for update mode' },
          { status: 400 }
        );
      }
      createReq = { ...common, access_token: accessToken };
    } else {
      // ✅ Add-mode: fresh link (shows institution picker)
      createReq = { ...common };
    }

    const r = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createReq),
    });

    const json = await r.json();
    if (!r.ok) return NextResponse.json(json, { status: r.status });

    return NextResponse.json({ link_token: json.link_token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 });
  }
}
