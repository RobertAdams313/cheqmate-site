export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Vercel parses JSON automatically for Node runtimes ≥ v18
  const { public_token } = req.body || {};
  if (!public_token) return res.status(400).json({ error: "missing public_token" });

  const r = await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      public_token
    })
  });

  const json = await r.json();
  res.status(r.ok ? 200 : (json.status_code || 500)).json(json);
}
