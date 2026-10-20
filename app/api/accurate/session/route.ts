import { NextResponse } from 'next/server';
import { openAccurateDb, getAccurateEnvConfig } from '@/lib/accurate';
import { z } from 'zod';

const openDbSchema = z.object({
  dbId: z.union([z.string(), z.number()]).optional(),
  token: z.string().optional(),
});

/**
 * POST /api/accurate/session
 * Membuka koneksi database Accurate Online dan mengambil Session ID + Host.
 * Sesuai dokumentasi: GET https://account.accurate.id/api/open-db.do?id=<dbId>
 */
export async function POST(request: Request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body kosong diperbolehkan jika mengambil dari .env
    }

    const parsed = openDbSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Parameter tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const dbId = parsed.data.dbId || getAccurateEnvConfig().dbId;
    if (!dbId) {
      return NextResponse.json(
        {
          success: false,
          message: 'dbId wajib diberikan pada body { "dbId": 1156 } atau dikonfigurasi pada env ACCURATE_DB_ID',
        },
        { status: 400 }
      );
    }

    const openResult = await openAccurateDb(dbId, parsed.data.token);

    return NextResponse.json({
      success: true,
      message: 'Koneksi database Accurate berhasil dibuka',
      data: {
        dbId,
        session: openResult.session,
        host: openResult.host,
        admin: openResult.admin,
        licenseEnd: openResult.licenseEnd,
        accessibleUntil: openResult.accessibleUntil,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuka database Accurate';
    console.error('[API /api/accurate/session error]:', error);

    return NextResponse.json(
      {
        success: false,
        message,
        hint: 'Periksa kembali nilai ACCURATE_ACCESS_TOKEN dan ID Database Anda.',
      },
      { status: 500 }
    );
  }
}
