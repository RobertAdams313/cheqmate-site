import { NextResponse, NextRequest } from "next/server";

export const runtime = "edge"; // fast + cost effective

type InItem = { index: number; title: string; current: string };
type OutItem = { index: number; rewritten: string };

function unauthorized(msg = "Unauthorized") {
  return new NextResponse(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(msg = "Bad Request") {
  return new NextResponse(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  // --- Auth: require a bearer you already issue to the iOS app ---
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return unauthorized("Missing bearer");

  // If you want extra checks, parse/verify here (e.g., JWT or DB lookup).
  const bearer = match[1].trim();
  if (!bearer) return unauthorized("Invalid bearer");

  // --- Parse input payload ---
  let body: { items?: InItem[] } | null = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest("Expected { items: [{index,title,current}] }");
  }

  // --- Env key ---
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse(JSON.stringify({ error: "Server missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  // --- Build prompt (strict JSON out) ---
  const system = [
    "You rewrite short finance tips into one concise, actionable sentence (8–140 chars).",
    "No emojis. Neutral tone. Avoid multi-step plans or judgments.",
    "Return ONLY valid JSON: {\"items\":[{\"index\":0,\"rewritten\":\"...\"}, ...]}",
  ].join(" ");

  const user = JSON.stringify({
    items,
    rules: [
      "One sentence, 8–140 chars",
      "Make it actionable (small lever/next step)",
      "No PII, no emojis, no judgments",
      "Return JSON with fields {index, rewritten}",
    ],
  });

  // --- Call OpenAI Chat Completions ---
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new NextResponse(JSON.stringify({ error: `Upstream error`, detail: text }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  type OpenAIResponse = {
    choices: { message: { content?: string } }[];
  };

  const data = (await resp.json()) as OpenAIResponse;
  const content = data?.choices?.[0]?.message?.content || "";

  // Parse model JSON
  let out: { items?: OutItem[] } | null = null;
  try {
    out = JSON.parse(content);
  } catch {
    // If the model returns stray text, try to extract JSON
    const match = content.match(/\{[\s\S]*\}$/);
    if (match) {
      try { out = JSON.parse(match[0]); } catch {}
    }
  }

  // Validate shape
  if (!out?.items || !Array.isArray(out.items)) {
    return new NextResponse(JSON.stringify({ error: "Malformed model output", raw: content }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  // Final sanity checks per item (length, action-ish)
  const actionHints = ["set","add","try","move","shift","reduce","trim","cap","swap","align","redirect","budget","re-allocate","pull"];
  const cleaned: OutItem[] = out.items
    .filter((x) => typeof x?.index === "number" && typeof x?.rewritten === "string")
    .map((x) => ({ index: x.index, rewritten: x.rewritten.trim() }))
    .filter((x) => x.rewritten.length >= 8 && x.rewritten.length <= 140)
    .filter((x) => actionHints.some((h) => x.rewritten.toLowerCase().includes(h)));

  return NextResponse.json({ items: cleaned }, { headers: corsHeaders() });
}
