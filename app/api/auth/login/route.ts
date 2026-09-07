import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginRequestSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

// Demo account credentials
const DEMO_USER = {
    email: 'demo@example.com',
    password: 'password123',
    name: 'Demo User',
    role: 'ADMIN',
};

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

        const { email, password, rememberMe } = parsed.data;

        // Validasi kredensial (saat ini menggunakan akun demo)
        if (email.toLowerCase() !== DEMO_USER.email.toLowerCase() || password !== DEMO_USER.password) {
            return NextResponse.json(
                { message: 'Email atau password salah' },
                { status: 401 }
            );
        }

        const response = NextResponse.json(
            {
                message: 'Login berhasil',
                user: {
                    email: DEMO_USER.email,
                    name: DEMO_USER.name,
                    role: DEMO_USER.role,
                },
            },
            { status: 200 }
        );

        // Set session cookie sederhana (HTTP-only)
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 hari vs 1 hari
        response.cookies.set({
            name: 'auth_session',
            value: JSON.stringify({ email: DEMO_USER.email, loggedInAt: Date.now() }),
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
