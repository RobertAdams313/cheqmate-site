import handler from '../../../api/_handlers/exchange-public-token'
export const dynamic = 'force-dynamic'
export async function POST(req: Request) {
  // Next.js App Router adapter
  // @ts-ignore - the handler likely accepts (req,res) style; wrap if needed
  const { NextResponse } = await import('next/server')
  // Minimal adapter: forward Request body into handler by creating a mock req/res if your handler expects them.
  // If your _handlers module already exports a Next.js-compatible function, you can re-export here instead.
  // For now, keep the pages route (api/exchange-public-token.ts) as the primary entry point.
  return NextResponse.json({ error: 'Use /api/exchange-public-token (pages route) in this deployment' }, { status: 400 })
}
