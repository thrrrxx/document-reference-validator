import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchAccurateApi } from '@/lib/accurate';
import { z } from 'zod';

const pushDocumentSchema = z.object({
  documentId: z.string().optional(),
  documentNumber: z.string().optional(),
  endpoint: z.string().default('/item/save.do'),
  customPayload: z.record(z.unknown()).optional(),
  performedBy: z.string().default('System Push Integration'),
});

/**
 * POST /api/accurate/push
 * Mengirim data dokumen lokal dari PostgreSQL ke Accurate Online.
 * Bisa berdasarkan `documentId` / `documentNumber` yang ada di database PostgreSQL
 * atau mengirimkan `customPayload` ke endpoint Accurate tertentu.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = pushDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format request tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const { documentId, documentNumber, endpoint, customPayload, performedBy } = parsed.data;

    let payload: Record<string, unknown> = customPayload || {};

    // Jika documentId atau documentNumber disediakan, ambil dari PostgreSQL
    if (documentId || documentNumber) {
      const doc = await db.document.findFirst({
        where: {
          OR: [
            ...(documentId ? [{ id: documentId }] : []),
            ...(documentNumber ? [{ documentNumber }] : []),
          ],
        },
      });

      if (!doc) {
        return NextResponse.json(
          { success: false, message: 'Dokumen tidak ditemukan di database PostgreSQL' },
          { status: 404 }
        );
      }

      // Default payload mapping dari model Document PostgreSQL ke parameter Accurate
      payload = {
        name: doc.description || `Item from Doc ${doc.documentNumber}`,
        no: doc.documentNumber,
        unitPrice: Number(doc.amount) || 0,
        notes: doc.notes || `Reference: ${doc.referenceNumber || '-'}`,
        itemType: 'INVENTORY',
        ...customPayload,
      };

      // Catat ke AuditLog
      await db.auditLog.create({
        data: {
          documentId: doc.id,
          action: 'PUSH_TO_ACCURATE',
          performedBy,
          details: JSON.stringify({ endpoint, payload }),
        },
      });
    }

    // Kirim request ke Accurate Online
    const response = await fetchAccurateApi(endpoint, {
      method: 'POST',
      body: payload,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim data ke Accurate Online (${endpoint})`,
      accurateResponse: response,
      payloadUsed: payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim data ke Accurate';
    console.error('[API /api/accurate/push POST error]:', error);

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
