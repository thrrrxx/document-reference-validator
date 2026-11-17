import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { previewBulkImport, commitBulkImport } from '@/lib/bulk-import';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const importRequestSchema = z.object({
  action: z.enum(['PREVIEW', 'COMMIT']),
  csvText: z.string().optional(),
  rows: z.array(z.record(z.unknown())).optional(),
  skipErrors: z.boolean().optional().default(false),
});

/**
 * POST /api/import
 * 2-Phase Idempotent Bulk Import (Dry-Run Preview -> Transactional Commit) untuk CSV / Excel.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request, ['FLOW_CREATE']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = importRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Payload import tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data.csvText ?? parsed.data.rows;
    if (!input || (typeof input === 'string' && !input.trim()) || (Array.isArray(input) && input.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Data csvText atau rows wajib diisi.' },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'PREVIEW') {
      const report = await previewBulkImport(input);
      return NextResponse.json({
        success: true,
        phase: 'PREVIEW',
        data: report,
      });
    }

    const result = await commitBulkImport(
      input,
      {
        id: auth.user.id,
        displayName: auth.user.displayName,
        ipAddress: auth.user.ipAddress,
      },
      { skipErrors: parsed.data.skipErrors }
    );

    return NextResponse.json({
      success: true,
      phase: 'COMMIT',
      message: `Bulk import selesai: ${result.summary.successful} dokumen berhasil disimpan.`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses bulk import';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
