import { NextResponse } from 'next/server';
import { syncAccurateToPostgre, getAccurateEnvConfig } from '@/lib/accurate';
import { db } from '@/lib/db';
import { z } from 'zod';

const syncRequestSchema = z.object({
  syncTypes: z.array(z.enum(['PO', 'GR', 'INVOICE', 'ITEMS'])).optional(),
  performedBy: z.string().optional(),
});

/**
 * GET /api/accurate/sync
 * Melihat riwayat sinkronisasi Accurate Online dengan database PostgreSQL.
 */
export async function GET() {
  try {
    const config = getAccurateEnvConfig();
    const hasToken = Boolean(config.accessToken);
    const hasDbId = Boolean(config.dbId);

    // Ambil riwayat sync dari PostgreSQL
    const syncHistory = await db.syncHistory.findMany({
      orderBy: { startedAt: 'desc' },
      take: 25,
      include: {
        document: {
          select: {
            documentNumber: true,
            documentType: true,
            vendor: true,
          },
        },
      },
    });

    // Hitung total dokumen di PostgreSQL berdasarkan tipe
    const docCounts = await db.document.groupBy({
      by: ['documentType'],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      environmentConfig: {
        hasToken,
        hasDbId,
        dbId: config.dbId || null,
        host: config.host || 'https://public.accurate.id',
      },
      documentStats: docCounts.reduce((acc, curr) => {
        acc[curr.documentType] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
      historyCount: syncHistory.length,
      history: syncHistory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil riwayat sinkronisasi';
    console.error('[API /api/accurate/sync GET error]:', error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accurate/sync
 * Memicu sinkronisasi data transaksi & dokumen dari Accurate Online ke PostgreSQL.
 * Body opsional:
 * {
 *   "syncTypes": ["PO", "GR", "INVOICE"],
 *   "performedBy": "Admin User"
 * }
 */
export async function POST(request: Request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body kosong diperbolehkan (default sync semua tipe)
    }

    const parsed = syncRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format request tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await syncAccurateToPostgre({
      syncTypes: parsed.data.syncTypes,
      performedBy: parsed.data.performedBy || 'API Manual Trigger',
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Sinkronisasi Accurate ke PostgreSQL berhasil'
        : 'Sinkronisasi selesai dengan beberapa catatan / error',
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menjalankan sinkronisasi';
    console.error('[API /api/accurate/sync POST error]:', error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
