import { createServer } from "http";
import { URL } from "url";
import type { IncomingMessage, ServerResponse } from "http";
import handleAiRewrite from "./_handlers/ai/rewrite";

// Minimal adapter to look like VercelRequest/VercelResponse enough for our handler.
type VercelReq = IncomingMessage & {
  body?: any;
  query?: Record<string, string>;
  cookies?: Record<string, string>;
  // fields our handler reads:
  socket: IncomingMessage["socket"];
};
type VercelRes = ServerResponse;

const PORT = Number(process.env.PORT || 3000);

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
    });
  });
}

createServer(async (req: VercelReq, res: VercelRes) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    const path = url.pathname;

    // Basic query/cookies
    req.query = Object.fromEntries(url.searchParams.entries());
    req.cookies = {};
    const cookie = req.headers.cookie;
    if (cookie) {
      cookie.split(";").forEach((p) => {
        const [k, ...v] = p.trim().split("=");
        req.cookies![decodeURIComponent(k)] = decodeURIComponent(v.join("=") || "");
      });
    }

    // Only route we expose locally:
    if (path === "/api/ai/rewrite") {
      req.body = await parseBody(req);
      // Our handler expects default export (req,res)
      // It will set status & JSON as needed.
      // @ts-ignore - handler signature matches enough
      return handleAiRewrite(req, res);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not found", path }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err?.message || "Server error" }));
  }
}).listen(PORT, () => {
  console.log(`Local dev server listening on http://localhost:${PORT}`);
});
