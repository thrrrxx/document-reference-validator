import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { db } from '@/lib/db';

const loginRequestSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
    rememberMe: z.boolean().optional(),
    captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: 'Format input tidak valid', errors: parsed.error.issues },
                { status: 400 }
            );
        }

        const { email, password, rememberMe, captchaToken } = parsed.data;

        // Ambil Real IP client dari header Cloudflare atau proxy
        const clientIp =
            request.headers.get('cf-connecting-ip') ||
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 1. Verifikasi Cloudflare Turnstile CAPTCHA (Proteksi DDoS & Bot)
        const captchaResult = await verifyTurnstileToken(captchaToken, clientIp);
        if (!captchaResult.success) {
            return NextResponse.json(
                {
                    message: captchaResult.message || 'Verifikasi keamanan (CAPTCHA) gagal.',
                    errorCodes: captchaResult.errorCodes,
                },
                { status: 403 }
            );
        }

        // 2. Autentikasi Pengguna langsung dari Database PostgreSQL
        let authenticatedUser: { id: string; email: string; name: string | null; role: string } | null = null;

        try {
            const dbUser = await db.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (dbUser && dbUser.active && dbUser.password === password) {
                authenticatedUser = {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    role: dbUser.role,
                };
            }
        } catch (dbErr) {
            console.error('[Login Route] Database query failed:', dbErr);
        }

        if (!authenticatedUser) {
            return NextResponse.json(
                { message: 'Email atau password salah' },
                { status: 401 }
            );
        }

        const response = NextResponse.json(
            {
                message: 'Login berhasil',
                user: authenticatedUser,
            },
            { status: 200 }
        );

        // Catat sesi login perangkat ke database
        let userSession = null;
        try {
            const { parseClientInfo } = await import('@/lib/session-detector');
            const crypto = await import('crypto');
            const clientInfo = parseClientInfo(request);
            userSession = await db.userSession.create({
                data: {
                    userId: authenticatedUser.id,
                    sessionToken: crypto.randomUUID(),
                    device: clientInfo.device,
                    browser: clientInfo.browser,
                    os: clientInfo.os,
                    ipAddress: clientInfo.ipAddress,
                    location: clientInfo.location,
                    lastActive: new Date(),
                },
            });
        } catch (sessionErr) {
            console.warn('Gagal mencatat sesi perangkat ke database:', sessionErr);
        }

        // Set session cookie (HTTP-only)
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 hari vs 1 hari
        response.cookies.set({
            name: 'auth_session',
            value: JSON.stringify({
                email: authenticatedUser.email,
                sessionId: userSession?.id,
                loggedInAt: Date.now(),
            }),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Terjadi kesalahan pada server' },
            { status: 500 }
        );
    }
}
