import { put } from '@vercel/blob';
import { encryptJSON, decryptJSON } from './crypto';

const BASE = process.env.BLOB_PUBLIC_BASE; // https://<host>.public.blob.vercel-storage.com
const RW = process.env.BLOB_READ_WRITE_TOKEN;

function requireEnv() {
  if (!RW) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  if (!BASE) throw new Error('Missing BLOB_PUBLIC_BASE');
}

const ID = /^[a-zA-Z0-9._-]{1,64}$/;

function keyFor(kind: 'token'|'itemMeta', item_id: string) {
  if (!ID.test(item_id)) throw new Error('BAD_ITEM_ID');
  if (kind === 'token')   return `cheqmate/private/tokens/${item_id}.json`;
  if (kind === 'itemMeta')return `cheqmate/items/${item_id}.json`;
  throw new Error('Unknown kind');
}

export async function saveTokenBundle(item_id: string, access_token: string, last_cursor: string | null) {
  requireEnv();
  const tokenKey = keyFor('token', item_id);
  const cipher = encryptJSON({ item_id, access_token, last_cursor, updatedAt: new Date().toISOString() });
  await put(tokenKey, cipher, { token: RW!, contentType:'application/json', access:'public', addRandomSuffix:false });
  return { tokenKey, publicUrl: `${BASE}/${tokenKey}` };
}

export async function writeItemMeta(item_id: string, meta: Record<string, unknown>) {
  requireEnv();
  const key = keyFor('itemMeta', item_id);
  const body = JSON.stringify({ item_id, ...meta, updatedAt: new Date().toISOString() });
  await put(key, body, { token: RW!, contentType:'application/json', access:'public', addRandomSuffix:false });
  return { key, publicUrl: `${BASE}/${key}` };
}
