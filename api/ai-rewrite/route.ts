// api/ai-rewrite/route.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing server API key' })
    return
  }

  try {
    const body = req.body
    const items = body.items ?? []

    const system = `
      You are an assistant rewriting short financial tips into one concise, actionable sentence (8–140 chars).
      Do NOT include personal data, emojis, or multi-step plans. Keep it specific and concrete.
      Return ONLY valid JSON: {"items":[{"index":0,"rewritten":"..."}, ...]}.
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify({ items }) }
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      res.status(response.status).json({ error: text })
      return
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    res.status(200).json(JSON.parse(content))
  } catch (err) {
    console.error('AI Rewrite Error:', err)
    res.status(500).json({ error: String(err) })
  }
}