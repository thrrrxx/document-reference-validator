import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (sessionCookie?.value) {
      try {
        const parsed = JSON.parse(sessionCookie.value);
        if (parsed.sessionId) {
          await db.userSession.deleteMany({ where: { id: parsed.sessionId } });
        }
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Logout session cleanup warning:', err);
  }

  const response = NextResponse.json({ success: true, message: 'Berhasil keluar' });
  response.cookies.set({
    name: 'auth_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

