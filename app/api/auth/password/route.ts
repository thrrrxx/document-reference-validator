import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini dan password baru harus diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password baru minimal harus 8 karakter' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    let email: string | null = null;
    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value);
        email = parsed.email;
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // Cek password saat ini (mendukung hash SHA-256 dan plain text lama)
    if (user.password && !verifyPassword(currentPassword, user.password)) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini tidak sesuai' },
        { status: 400 }
      );
    }

    // Perbarui password di database dengan hash SHA-256
    await db.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });


    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui di database!',
    });
  } catch (error: any) {
    console.error('[API /api/auth/password error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memperbarui password' },
      { status: 500 }
    );
  }
}
