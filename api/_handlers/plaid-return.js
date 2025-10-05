export default function handler(req, res) {
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.writeHead(302, { Location: `https://cheqmateios.app/plaid/return-app${qs}` });
  res.end();
}
