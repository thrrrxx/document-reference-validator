import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    let user = null;

    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session.email) {
          user = await db.user.findUnique({
            where: { email: String(session.email).toLowerCase() },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              active: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        }
      } catch (err) {
        console.warn('Gagal membaca auth_session cookie:', err);
      }
    }

    // Fallback: Jika cookie belum terbentuk, ambil user terbaru di database
    if (!user) {
      user = await db.user.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data pengguna di database' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('[API /api/auth/me GET error]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data profil' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    let targetEmail: string | null = null;
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        targetEmail = session.email;
      } catch {
        // ignore
      }
    }

    let existingUser = null;
    if (targetEmail) {
      existingUser = await db.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
    }
    if (!existingUser) {
      existingUser = await db.user.findFirst({ orderBy: { createdAt: 'desc' } });
    }

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan di database' },
        { status: 404 }
      );
    }

    // Periksa apakah email baru sudah dipakai oleh akun pengguna lain
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailConflict = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailConflict && emailConflict.id !== existingUser.id) {
        return NextResponse.json(
          { success: false, message: 'Email sudah digunakan oleh akun lain' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: existingUser.id },
      data: {
        name: name !== undefined ? name : existingUser.name,
        email: email ? email.toLowerCase() : existingUser.email,
        role: role !== undefined ? role : existingUser.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Profil Berhasil Disimpan',
      user: updatedUser,
    });

    // Selalu pastikan auth_session tersinkronisasi dengan email pengguna terkini
    response.cookies.set({
      name: 'auth_session',
      value: JSON.stringify({ email: updatedUser.email, loggedInAt: Date.now() }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[API /api/auth/me PATCH error]:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar oleh pengguna lain' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memperbarui profil di database' },
      { status: 500 }
    );
  }
}
