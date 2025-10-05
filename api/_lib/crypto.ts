// AES-256-GCM JSON encrypt/decrypt (Node runtime)
import crypto from 'crypto';

function keyFromEnv(): Buffer {
  const b64 = process.env.ENC_KEY_BASE64 || '';
  if (!b64) throw new Error('Missing ENC_KEY_BASE64');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENC_KEY_BASE64 must be 32 bytes (base64)');
  return key;
}

export function encryptJSON<T>(obj: T): string {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = { v:1, alg:'aes-256-gcm', iv: iv.toString('base64'), tag: tag.toString('base64'), ct: ct.toString('base64') };
  return JSON.stringify(payload);
}

export function decryptJSON<T = any>(payloadJSON: string): T {
  const key = keyFromEnv();
  const payload = JSON.parse(payloadJSON);
  if (!payload || payload.alg !== 'aes-256-gcm') throw new Error('Unsupported payload');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ct = Buffer.from(payload.ct, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString('utf8'));
}
