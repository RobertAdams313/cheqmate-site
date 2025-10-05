import { get, put, del, head } from '@vercel/blob';

const BUCKET_PREFIX = 'cheqmate';

function requireToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN for @vercel/blob');
  }
}

async function readJSON<T>(key: string): Promise<T | null> {
  requireToken();
  const fullKey = `${BUCKET_PREFIX}/${key}`;
  const exists = await head(fullKey).catch(() => null);
  if (!exists) return null;

  const file = await get(fullKey);
  const text = await file?.blob?.text?.() ?? null;
  if (!text) return null;
  return JSON.parse(text) as T;
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  requireToken();
  const fullKey = `${BUCKET_PREFIX}/${key}`;
  await put(fullKey, JSON.stringify(value), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    // Some SDK versions support allowUpdate; if not, same-key put overwrites.
    // @ts-ignore
    allowUpdate: true,
  });
}

async function deleteKey(key: string): Promise<void> {
  requireToken();
  const fullKey = `${BUCKET_PREFIX}/${key}`;
  await del(fullKey).catch(() => {});
}

export async function setItemEnabled(item_id: string, enabled: boolean) {
  await writeJSON(`enabled/${item_id}.json`, { item_id, enabled, updatedAt: new Date().toISOString() });
}
export async function getItemEnabled(item_id: string): Promise<boolean | null> {
  const v = await readJSON<{ item_id: string; enabled: boolean }>(`enabled/${item_id}.json`);
  return v?.enabled ?? null;
}

export async function saveAccessToken(item_id: string, access_token: string) {
  await writeJSON(`tokens/${item_id}.json`, { item_id, access_token, updatedAt: new Date().toISOString() });
}
export async function readAccessToken(item_id: string): Promise<string | null> {
  const v = await readJSON<{ item_id: string; access_token: string }>(`tokens/${item_id}.json`);
  return v?.access_token ?? null;
}
export async function removeAccessToken(item_id: string) {
  await deleteKey(`tokens/${item_id}.json`);
}
