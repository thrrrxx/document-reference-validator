import { NextResponse } from 'next/server';
import { getAccurateDbList } from '@/lib/accurate';

/**
 * GET /api/accurate/databases
 * Mengambil daftar database Accurate Online yang dapat diakses pengguna.
 * Sesuai dokumentasi: GET https://account.accurate.id/api/db-list.do
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || undefined;

    const databases = await getAccurateDbList(token);

    return NextResponse.json({
      success: true,
      message: 'Berhasil mengambil daftar database Accurate Online',
      count: databases.length,
      data: databases,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memanggil API Accurate';
    console.error('[API /api/accurate/databases error]:', error);

    return NextResponse.json(
      {
        success: false,
        message,
        hint: 'Pastikan ACCURATE_ACCESS_TOKEN sudah diset di file .env atau dikirim via query ?token=',
      },
      { status: 500 }
    );
  }
}
