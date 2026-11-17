import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { exportDocumentsToCsv } from '@/lib/bulk-import';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/export
 * Mengekspor seluruh dokumen beserta informasi Pajak, FX (IDR), & Status Validasi ke CSV (UTF-8 BOM).
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['FLOW_READ']);
  if (auth.error) return auth.error;

  try {
    const csvContent = await exportDocumentsToCsv();
    const filename = `validex-documents-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengekspor data dokumen';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
