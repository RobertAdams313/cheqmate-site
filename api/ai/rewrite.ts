import type { VercelRequest, VercelResponse } from '@vercel/node';

type InItem = { index: number; current: string; title?: string };
type OutItem = { index: number; rewritten: string };

function bad(res: VercelResponse, code: number, msg: string) {
  return res.status(code).json({ error: msg });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return bad(res, 405, 'Method Not Allowed');
    }

    const auth = req.headers['authorization'];
      return bad(res, 401, 'Missing or invalid Authorization header');
    }
    // TODO: Verify bearer against your auth/session if desired.

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !Array.isArray(body.items)) {
      return bad(res, 400, 'Body must be {"items":[{"index":number,"current":string}]}');
    }

    const items: InItem[] = body.items.map((i: any) => ({
      index: Number(i?.index),
      current: String(i?.current ?? ''),
      title: i?.title ? String(i.title) : undefined,
    }));
    if (items.some(i => !Number.isFinite(i.index) || !i.current)) {
      return bad(res, 400, 'Each item requires numeric "index" and non-empty "current"');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return bad(res, 500, 'Server missing OPENAI_API_KEY');

    const system = [
      'You rewrite short financial tips as one concise, actionable sentence (8–140 chars).',
      'No emojis, no personal data, no moralizing, no multi-step plans.',
      'Return ONLY valid JSON: {"items":[{"index":0,"rewritten":"..."}]}'
    ].join(' ');

    const userPayload = JSON.stringify({
      items: items.map(i => ({ index: i.index, current: i.current, title: i.title })),
      rules: [
        'One sentence, 8–140 chars.',
        'Action-oriented wording.',
        'Neutral, specific, concrete.',
        'Only JSON output with {index, rewritten}.'
      ]
    });

    const bodyReq = {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPayload }
      ]
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyReq),
    });

    const text = await resp.text();
    if (!resp.ok) return bad(res, resp.status, `OpenAI error: ${text.slice(0, 500)}`);

    const parsed = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    const content = parsed.choices?.[0]?.message?.content ?? '';
    let modelJson: any;
    try { modelJson = JSON.parse(content); }
    catch { return bad(res, 502, 'Model did not return valid JSON content'); }

    const outItems: OutItem[] = Array.isArray(modelJson.items)
      ? modelJson.items.map((x: any) => ({ index: Number(x?.index), rewritten: String(x?.rewritten ?? '') }))
      : [];

    const byIdx = new Map(outItems.map(i => [i.index, i.rewritten]));
    const merged: OutItem[] = items.map(i => ({
      index: i.index,
      rewritten: (byIdx.get(i.index) || i.current).toString().trim()
    }));

    return res.status(200).json({ items: merged });
  } catch (err) {
    console.error('rewrite handler error', err);
    return bad(res, 500, 'Internal error');
  }
}
