export default function handler(req, res) {
  const cid = (process.env.PLAID_CLIENT_ID || "").trim();
  const sec = (process.env.PLAID_SECRET || "").trim();
  res.json({
    env: (process.env.PLAID_ENV || "production").toLowerCase().trim(),
    client_id_len: cid.length,
    secret_len: sec.length,
    redirect_uri: (process.env.PLAID_REDIRECT_URI || "https://cheqmateios.app/plaid/return").trim()
  });
}
