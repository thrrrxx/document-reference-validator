import crypto from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt:';
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS: crypto.ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
};

/**
 * Meng-hash password menggunakan algoritma scrypt (memory-hard KDF, RFC 7914)
 * dengan salt acak unik 16-byte per password.
 * Format output: `scrypt:<salt_hex>:<derived_key_hex>`
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  const salt = crypto.randomBytes(SCRYPT_SALT_BYTES).toString('hex');
  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS)
    .toString('hex');

  return `${SCRYPT_PREFIX}${salt}:${derivedKey}`;
}

/**
 * Mengecek apakah hash tersimpan masih menggunakan format lama (SHA-256 / plaintext)
 * dan perlu di-upgrade ke scrypt saat pengguna berhasil login.
 */
export function needsRehash(storedPassword: string | null | undefined): boolean {
  if (!storedPassword) return false;
  return !storedPassword.startsWith(SCRYPT_PREFIX);
}

/**
 * Memverifikasi kesesuaian password input terhadap password tersimpan di database
 * menggunakan perbandingan constant-time (tahan terhadap timing attack).
 * Mendukung:
 * 1. Format standar aman scrypt (`scrypt:<salt>:<hash>`)
 * 2. Fallback hash SHA-256 lama (agar akun lama tetap bisa login lalu di-upgrade)
 * 3. Fallback plain text lama
 */
export function verifyPassword(
  plainPassword: string,
  storedPassword: string | null | undefined
): boolean {
  if (!plainPassword || !storedPassword) return false;

  // 1. Verifikasi format scrypt modern
  if (storedPassword.startsWith(SCRYPT_PREFIX)) {
    const parts = storedPassword.split(':');
    if (parts.length !== 3) return false;

    const [, salt, keyHex] = parts;
    if (!salt || !keyHex) return false;

    try {
      const storedKey = Buffer.from(keyHex, 'hex');
      if (storedKey.length !== SCRYPT_KEYLEN) return false;

      const derivedKey = crypto.scryptSync(
        plainPassword,
        salt,
        SCRYPT_KEYLEN,
        SCRYPT_OPTIONS
      );
      return crypto.timingSafeEqual(storedKey, derivedKey);
    } catch {
      return false;
    }
  }

  // 2. Fallback: Cocokkan dengan hash SHA-256 lama (64 karakter hex)
  if (storedPassword.length === 64 && /^[0-9a-f]{64}$/i.test(storedPassword)) {
    const legacyHash = crypto
      .createHash('sha256')
      .update(plainPassword)
      .digest();
    const storedHash = Buffer.from(storedPassword, 'hex');
    if (storedHash.length === legacyHash.length) {
      return crypto.timingSafeEqual(storedHash, legacyHash);
    }
  }

  // 3. Fallback: Jika data di database masih berupa plaintext lama
  return storedPassword === plainPassword;
}
