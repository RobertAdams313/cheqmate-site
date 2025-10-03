export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const payload = {
    client_id: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    user: { client_user_id: "demo-user-123" }, // TODO: replace with your real user id
    client_name: "CheqMate",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
    redirect_uri: "https://cheqmateios.app/plaid/return"
  };

  const r = await fetch("https://sandbox.plaid.com/link/token/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const json = await r.json();
  res.status(r.ok ? 200 : (json.status_code || 500)).json(json);
}
