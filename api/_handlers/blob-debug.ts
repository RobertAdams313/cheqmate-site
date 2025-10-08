import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    hasToken: !!token,
    tokenKind: token.startsWith('vercel_blob_rw_') ? 'rw' : (token ? 'unknown' : null),
    tokenLength: token.length,
    tokenMasked: token ? token.slice(0, 12) + '...' + token.slice(-4) : null,
  });
}
