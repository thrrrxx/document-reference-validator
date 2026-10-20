import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { db } from '@/lib/db';

const signupRequestSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z
        .string()
        .min(6, 'Password minimal 6 karakter')
        .regex(/[A-Z]/, 'Password harus mengandung minimal satu huruf besar (A-Z)')
        .regex(/[0-9]/, 'Password harus mengandung minimal satu angka (0-9)')
        .regex(/[^A-Za-z0-9]/, 'Password harus mengandung minimal satu simbol/karakter khusus (!@#$...)'),
    termsAccepted: z.boolean().refine((val) => val === true, {
        message: 'Anda harus menyetujui syarat dan ketentuan',
    }),
    captchaToken: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = signupRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: 'Format input tidak valid', errors: parsed.error.issues },
                { status: 400 }
            );
        }

        const { name, email, password, captchaToken } = parsed.data;

        // Ambil IP client (mendukung header Cloudflare cf-connecting-ip)
        const clientIp =
            request.headers.get('cf-connecting-ip') ||
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 1. Verifikasi CAPTCHA Cloudflare Turnstile
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

        // 2. Cek apakah email sudah terdaftar di Database
        try {
            const existingUser = await db.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (existingUser) {
                return NextResponse.json(
                    { message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
                    { status: 409 }
                );
            }

            // Buat pengguna baru
            const newUser = await db.user.create({
                data: {
                    name,
                    email: email.toLowerCase(),
                    password, // Untuk produksi, selalu gunakan hash seperti bcrypt/argon2
                    role: 'USER',
                    active: true,
                },
            });

            return NextResponse.json(
                {
                    message: 'Registrasi berhasil',
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                    },
                },
                { status: 201 }
            );
        } catch (dbError: any) {
            console.error('[Signup Route] Database create error:', dbError);
            return NextResponse.json(
                { message: dbError?.message || 'Gagal menyimpan akun ke database' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: 'Terjadi kesalahan pada server saat registrasi' },
            { status: 500 }
        );
    }
}
