export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Trim to remove stray spaces/newlines
  const client_id    = (process.env.PLAID_CLIENT_ID || "").trim();
  const secret       = (process.env.PLAID_SECRET || "").trim();
  const redirect_uri = (process.env.PLAID_REDIRECT_URI || "https://cheqmateios.app/plaid/return").trim();
  const env          = (process.env.PLAID_ENV || "production").toLowerCase().trim();

  if (!client_id || !secret) {
    return res.status(500).json({ error: "Missing PLAID_CLIENT_ID or PLAID_SECRET in environment" });
  }

  const base = env === "production"
    ? "https://production.plaid.com"
    : env === "development"
      ? "https://development.plaid.com"
      : "https://sandbox.plaid.com";

  const payload = {
    client_id,
    secret,
    user: { client_user_id: "demo-user-123" }, // TODO: pass your real user id
    client_name: "CheqMate",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
    redirect_uri
  };

  const r = await fetch(`${base}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await r.json();

  // Pass Plaid response through; include a tiny debug header to confirm env used
  res.setHeader("X-Plaid-Env", env);
  res.status(r.ok ? 200 : (json.status_code || 500)).json(json);
}
