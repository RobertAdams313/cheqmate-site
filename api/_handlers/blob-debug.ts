import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ hasToken: !!process.env.BLOB_READ_WRITE_TOKEN });
}
