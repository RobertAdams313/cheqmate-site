import type { VercelRequest, VercelResponse } from '@vercel/node';
import handleAiRewrite from './_handlers/ai/rewrite';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<any>|any;

const routes: Record<string, Handler> = {
  'POST /ai/rewrite': handleAiRewrite,
};

export default async function main(req: VercelRequest, res: VercelResponse) {
  try {
    const key = `${req.method?.toUpperCase()} ${req.url?.split('?')[0].replace(/^\/api/, '')}`;
    const h = routes[key];
    if (!h) {
      res.setHeader('Allow', 'POST');
      return res.status(404).json({ error: `No route for ${key}` });
    }
    return await h(req, res);
  } catch (e: any) {
    console.error('api/index error', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}
