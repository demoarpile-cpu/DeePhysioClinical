const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

const getSecret = () => process.env.INTEGRATION_SECRET || process.env.JWT_SECRET || 'deephysio-integration-secret';

const deriveKey = (secret, salt) => crypto.scryptSync(secret, salt, KEY_LENGTH);

const encryptConfig = (payload) => {
  if (payload == null) return null;
  const plainText = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(getSecret(), salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${salt.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptConfig = (encryptedPayload) => {
  if (!encryptedPayload) return null;
  const [saltB64, ivB64, tagB64, cipherB64] = String(encryptedPayload).split(':');
  if (!saltB64 || !ivB64 || !tagB64 || !cipherB64) return null;
  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(cipherB64, 'base64');
  const key = deriveKey(getSecret(), salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  try {
    return JSON.parse(decrypted);
  } catch (_) {
    return decrypted;
  }
};

module.exports = {
  encryptConfig,
  decryptConfig
};
