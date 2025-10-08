export default async function plaidReturn(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, route: '/plaid/return' });
}
