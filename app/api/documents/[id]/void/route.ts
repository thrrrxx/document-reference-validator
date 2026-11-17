import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { voidDocumentInDb } from '@/lib/approval-service';

const voidSchema = z.object({
  reason: z.string().min(3, 'Alasan pembatalan (VOID) minimal 3 karakter'),
});

/**
 * POST /api/documents/[id]/void
 * Membatalkan dokumen secara aman (VOID) tanpa menghapus histori & audit log.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['DOCUMENT_VOID']);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = voidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Alasan VOID tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const voidedDoc = await voidDocumentInDb({
      documentId: id,
      reason: parsed.data.reason,
      actor: {
        id: auth.user.id,
        displayName: auth.user.displayName,
        role: auth.user.role,
        ipAddress: auth.user.ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dokumen ${voidedDoc.documentNumber} berhasil di-VOID.`,
      data: voidedDoc,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan dokumen';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
