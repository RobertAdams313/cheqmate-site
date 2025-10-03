export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const client_id = (process.env.PLAID_CLIENT_ID || "").trim();
  const secret    = (process.env.PLAID_SECRET || "").trim();
  const env       = (process.env.PLAID_ENV || "production").toLowerCase().trim();

  const base = env === "production"
    ? "https://production.plaid.com"
    : env === "development"
      ? "https://development.plaid.com"
      : "https://sandbox.plaid.com";

  const { public_token } = req.body || {};
  if (!public_token) return res.status(400).json({ error: "missing public_token" });

  const r = await fetch(`${base}/item/public_token/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id, secret, public_token })
  });

  const json = await r.json();
  res.setHeader("X-Plaid-Env", env);
  res.status(r.ok ? 200 : (json.status_code || 500)).json(json);
}
