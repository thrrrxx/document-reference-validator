import crypto from 'node:crypto';

/**
 * Meng-hash password menggunakan algoritma SHA-256 (64 karakter hex digest).
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Memverifikasi kesesuaian password input terhadap password tersimpan di database.
 * Mendukung:
 * 1. Verifikasi hash SHA-256 (format standar aman)
 * 2. Fallback plain text (agar akun lama tidak terkunci sebelum termigrasi)
 */
export function verifyPassword(
  plainPassword: string,
  storedPassword: string | null | undefined
): boolean {
  if (!plainPassword || !storedPassword) return false;

  const hashedInput = hashPassword(plainPassword);

  // 1. Cocokkan dengan hash SHA-256
  if (storedPassword.toLowerCase() === hashedInput.toLowerCase()) {
    return true;
  }

  // 2. Fallback jika data di database masih berupa plaintext lama
  if (storedPassword === plainPassword) {
    return true;
  }

  return false;
}
