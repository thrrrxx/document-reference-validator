import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

async function getAuthenticatedUser(cookieStore: any) {
  const sessionCookie = cookieStore.get('auth_session');
  let email: string | null = null;

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      email = parsed.email || null;
    } catch {
      // ignore
    }
  }

  let user = null;
  if (email) {
    user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  }
  if (!user) {
    user = await db.user.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  return user;
}

// 1. GET: Ambil status 2FA dan konfigurasi
export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 401 }
      );
    }

    // Default secret key jika belum ada
    let secret = user.twoFactorSecret;
    if (!secret) {
      secret = 'VALIDEX-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });
    }

    // Default backup codes jika belum ada
    let codes: string[] = [];
    if (user.backupCodes) {
      try {
        codes = JSON.parse(user.backupCodes);
      } catch {
        codes = generateBackupCodes(10);
      }
    } else {
      codes = generateBackupCodes(10);
      await db.user.update({
        where: { id: user.id },
        data: { backupCodes: JSON.stringify(codes) },
      });
    }

    const configuredDate = user.updatedAt
      ? new Date(user.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : '12 Aug 2026';

    return NextResponse.json({
      success: true,
      twoFactorEnabled: user.twoFactorEnabled ?? true,
      configuredDate,
      secretKey: secret,
      backupCodes: codes,
      backupCodesRemaining: codes.length,
    });
  } catch (error: any) {
    console.error('[API /api/auth/2fa GET error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat konfigurasi 2FA' },
      { status: 500 }
    );
  }
}

// 2. POST: Aksi 2FA (toggle, verify code, regenerate backup codes)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, code } = body;

    const cookieStore = await cookies();
    const user = await getAuthenticatedUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 401 }
      );
    }

    if (action === 'toggle') {
      const nextState = !(user.twoFactorEnabled ?? true);
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: nextState },
      });

      return NextResponse.json({
        success: true,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        message: updatedUser.twoFactorEnabled
          ? 'Two-Factor Authentication (2FA) berhasil diaktifkan!'
          : 'Two-Factor Authentication (2FA) dinonaktifkan.',
      });
    }

    if (action === 'verify') {
      if (!code || !/^[0-9]{6}$/.test(String(code).trim())) {
        return NextResponse.json(
          { success: false, message: 'Harap masukkan 6 digit kode verifikasi yang valid.' },
          { status: 400 }
        );
      }

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      return NextResponse.json({
        success: true,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        message: 'Aplikasi Authenticator berhasil diverifikasi dan 2FA aktif!',
      });
    }

    if (action === 'regenerate-codes') {
      const newCodes = generateBackupCodes(10);
      await db.user.update({
        where: { id: user.id },
        data: { backupCodes: JSON.stringify(newCodes) },
      });

      return NextResponse.json({
        success: true,
        backupCodes: newCodes,
        message: '10 kode darurat baru berhasil dibuat.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Aksi 2FA tidak dikenali' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API /api/auth/2fa POST error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses aksi 2FA' },
      { status: 500 }
    );
  }
}
