import { put, get } from '@vercel/blob';
import { encryptJSON, decryptJSON } from './crypto';

// BASE + RW come from your env (unchanged)
const BASE = process.env.BLOB_PUBLIC_BASE; // e.g., https://<acct>.public.blob.vercel-storage.com
const RW   = process.env.BLOB_READ_WRITE_TOKEN;

function requireEnv() {
  if (!RW) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  if (!BASE) throw new Error('Missing BLOB_PUBLIC_BASE');
}

const ID = /^[a-zA-Z0-9._-]{1,64}$/;

function keyFor(kind: 'token'|'itemMeta', item_id: string) {
  if (!ID.test(item_id)) throw new Error('BAD_ITEM_ID');
  if (kind === 'token')    return `cheqmate/private/tokens/${item_id}.json`;
  if (kind === 'itemMeta') return `cheqmate/items/${item_id}.json`;
  throw new Error('Unknown kind');
}

type TokenBundle = {
  item_id: string;
  access_token: string;
  last_cursor: string | null;
  updatedAt: string;
};

export async function saveTokenBundle(item_id: string, access_token: string, last_cursor: string | null) {
  requireEnv();
  const tokenKey = keyFor('token', item_id);

  // 🔐 Data-at-rest is encrypted (AES-GCM via encryptJSON). Even with "public" Blob access,
  // the ciphertext is useless without your server key. We never return Blob URLs to clients.
  const cipher = encryptJSON<TokenBundle>({
    item_id, access_token, last_cursor, updatedAt: new Date().toISOString()
  });

  // 🔁 IMPORTANT CHANGE: access is now "public" to satisfy your project’s Blob policy.
  // We still write to a "private/" path segment to avoid accidental discovery,
  // but visibility is ultimately governed by the Blob service. Do NOT expose these URLs in responses.
  await put(tokenKey, cipher, {
    token: RW!, contentType:'application/json',
    access:'public',         // ⬅️ changed from 'private' to 'public'
    addRandomSuffix:false    // keep deterministic keys by Item ID
  });
  return { tokenKey };
}

export async function readTokenBundle(item_id: string): Promise<TokenBundle | null> {
  requireEnv();
  const tokenKey = keyFor('token', item_id);
  try {
    const resp = await get(tokenKey, { token: RW! });
    const text = await resp.text();
    return decryptJSON<TokenBundle>(text);
  } catch {
    return null;
  }
}

export async function updateCursor(item_id: string, next_cursor: string) {
  const bundle = await readTokenBundle(item_id);
  if (!bundle) throw new Error('TOKEN_BUNDLE_NOT_FOUND');
  await saveTokenBundle(item_id, bundle.access_token, next_cursor);
}

export async function writeItemMeta(item_id: string, meta: Record<string, unknown>) {
  requireEnv();
  const key = keyFor('itemMeta', item_id);
  const body = JSON.stringify({ item_id, ...meta, updatedAt: new Date().toISOString() });

  // Same visibility rationale as above.
  await put(key, body, {
    token: RW!, contentType:'application/json',
    access:'public',         // ⬅️ changed from 'private' to 'public'
    addRandomSuffix:false
  });
  return { key };
}