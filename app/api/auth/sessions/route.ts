import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { parseClientInfo, formatLastActive } from '@/lib/session-detector';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getAuthenticatedUser(cookieStore: any) {
  const sessionCookie = cookieStore.get('auth_session');
  let email: string | null = null;
  let sessionId: string | null = null;

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      email = parsed.email || null;
      sessionId = parsed.sessionId || null;
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

  return { user, sessionId };
}

// 1. GET: Ambil daftar seluruh sesi aktif perangkat pengguna
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const { user, sessionId: cookieSessionId } = await getAuthenticatedUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 401 }
      );
    }

    const clientInfo = parseClientInfo(request);

    // Cari apakah sesi perangkat saat ini sudah terdaftar
    let currentSession = null;
    if (cookieSessionId) {
      currentSession = await db.userSession.findFirst({
        where: { id: cookieSessionId, userId: user.id },
      });
    }

    // Jika belum ada sesi atau cookie belum menyimpan sessionId, buat/daftarkan sesi perangkat saat ini
    let shouldUpdateCookie = false;
    if (!currentSession) {
      const newSessionToken = crypto.randomUUID();
      currentSession = await db.userSession.create({
        data: {
          userId: user.id,
          sessionToken: newSessionToken,
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os,
          ipAddress: clientInfo.ipAddress,
          location: clientInfo.location,
          lastActive: new Date(),
        },
      });
      shouldUpdateCookie = true;
    } else {
      // Update waktu aktivitas terakhir dan device info
      currentSession = await db.userSession.update({
        where: { id: currentSession.id },
        data: {
          lastActive: new Date(),
          device: clientInfo.device,
          browser: clientInfo.browser,
          os: clientInfo.os,
          ipAddress: clientInfo.ipAddress,
          location: clientInfo.location,
        },
      });
    }

    // Ambil semua sesi aktif milik user
    const dbSessions = await db.userSession.findMany({
      where: { userId: user.id },
      orderBy: { lastActive: 'desc' },
    });

    const activeSessions = dbSessions.map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      location: s.location,
      lastActive: formatLastActive(s.lastActive),
      isCurrent: s.id === currentSession.id,
    }));

    const response = NextResponse.json({
      success: true,
      sessions: activeSessions,
      currentSessionId: currentSession.id,
    });

    if (shouldUpdateCookie) {
      response.cookies.set({
        name: 'auth_session',
        value: JSON.stringify({
          email: user.email,
          sessionId: currentSession.id,
          sessionToken: currentSession.sessionToken,
          loggedInAt: Date.now(),
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('[API /api/auth/sessions GET error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memuat sesi aktif' },
      { status: 500 }
    );
  }
}

// 2. DELETE: Cabut sesi perangkat tertentu berdasarkan ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetSessionId = searchParams.get('id');

    if (!targetSessionId) {
      return NextResponse.json(
        { success: false, message: 'ID sesi harus disertakan' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const { user, sessionId: currentSessionId } = await getAuthenticatedUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Sesi pengguna tidak valid' },
        { status: 401 }
      );
    }

    // Hapus sesi dari database
    await db.userSession.deleteMany({
      where: {
        id: targetSessionId,
        userId: user.id,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Sesi perangkat berhasil dicabut',
    });

    // Jika yang dicabut adalah sesi saat ini, hapus auth cookie
    if (targetSessionId === currentSessionId) {
      response.cookies.set({
        name: 'auth_session',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error: any) {
    console.error('[API /api/auth/sessions DELETE error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal mencabut sesi perangkat' },
      { status: 500 }
    );
  }
}

// 3. POST: Aksi massal (misal: Log Out All Other Devices)
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    const cookieStore = await cookies();
    const { user, sessionId: currentSessionId } = await getAuthenticatedUser(cookieStore);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 401 }
      );
    }

    if (action === 'revoke-others') {
      if (currentSessionId) {
        await db.userSession.deleteMany({
          where: {
            userId: user.id,
            id: { not: currentSessionId },
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Berhasil keluar dari seluruh perangkat lainnya.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Aksi tidak dikenali' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API /api/auth/sessions POST error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses permintaan sesi' },
      { status: 500 }
    );
  }
}
