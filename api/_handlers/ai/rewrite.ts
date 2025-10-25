// api/_handlers/ai/rewrite.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

type IncomingItem = { index: number; title?: string; current: string };
type OutgoingItem = { index: number; rewritten: string };

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function requireBearer(req: VercelRequest): void {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) throw Object.assign(new Error("Missing bearer."), { status: 401 });

  const allowed = (process.env.CHEQMATE_BEARERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length > 0 && !allowed.includes(token)) {
    throw Object.assign(new Error("Unauthorized bearer."), { status: 401 });
  }
}

const rl = new Map<string, { n: number; t: number }>();
function rateLimit(req: VercelRequest) {
  const key =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();
  const bucket = rl.get(key) || { n: 0, t: now };
  if (now - bucket.t > 60_000) {
    bucket.n = 0;
    bucket.t = now;
  }
  bucket.n += 1;
  rl.set(key, bucket);
  const max = Number(process.env.RATE_PER_MINUTE || 60);
  if (bucket.n > max) throw Object.assign(new Error("Rate limit."), { status: 429 });
}

function model(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export default async function handleAiRewrite(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    requireBearer(req);
    rateLimit(req);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) return res.status(400).json({ error: "No items provided." });

    const system = [
      "You rewrite short financial tips into one concise, actionable sentence (8–140 chars).",
      "Avoid judgment, emojis, or personal data. Keep concrete and specific.",
      "Return ONLY valid JSON: {\"items\":[{\"index\":0,\"rewritten\":\"...\"}]}"
    ].join(" ");

    const user = JSON.stringify({
      items: items.map(({ index, title, current }) => ({ index, title, current })),
      rules: [
        "One sentence, 8–140 chars.",
        "Must include an action/verb.",
        "No identifiers or scores.",
        "JSON shape exactly: {items:[{index,rewritten}]}"
      ]
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });

    const r = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      }),
      signal: AbortSignal.timeout(15_000)
    });

    const data = await r.json();
    if (!r.ok) {
      const msg = typeof data === "object" ? JSON.stringify(data) : String(data);
      return res.status(r.status).json({ error: `OpenAI error: ${msg}` });
    }

    const content: string = data?.choices?.[0]?.message?.content ?? "";
    let parsed: { items: OutgoingItem[] } = { items: [] };
    try {
      parsed = JSON.parse(content);
      if (!Array.isArray(parsed.items)) throw new Error("invalid items");
    } catch {
      return res.status(502).json({ error: "Bad model output", raw: content });
    }

    const cleaned = parsed.items
      .filter((it) => Number.isInteger(it.index) && typeof it.rewritten === "string")
      .map((it) => ({ index: it.index, rewritten: it.rewritten.trim() }))
      .filter((it) => it.rewritten.length >= 8 && it.rewritten.length <= 140);

    return res.status(200).json({ items: cleaned });
  } catch (err: any) {
    const code = err?.status ?? 500;
    return res.status(code).json({ error: err?.message ?? "Server error" });
  }
}
