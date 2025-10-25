// api/index.ts - tiny method+path router for Vercel serverless
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleAiRewrite from "./_handlers/ai/rewrite";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<any> | any;

const routes: Record<string, Handler> = {
  "POST /ai/rewrite": handleAiRewrite
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "https://local");
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const key = `${method} ${path}`;
  const h = routes[key];
  if (h) return h(req, res);
  return res.status(404).json({ error: "Not found", routeTried: key });
}
