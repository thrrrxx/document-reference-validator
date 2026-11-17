import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toleranceSchema = z.object({
  name: z.string().min(2).default('DEFAULT_GLOBAL'),
  category: z.string().min(2).default('GLOBAL'),
  qtyTolerancePercent: z.number().min(0).max(50).default(0),
  priceTolerancePercent: z.number().min(0).max(50).default(0),
  amountToleranceAbsolute: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/tolerances
 * Mengambil konfigurasi ambang batas toleransi validasi P2P.
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['FLOW_READ']);
  if (auth.error) return auth.error;

  try {
    const tolerances = await db.validationTolerance.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: tolerances });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil konfigurasi toleransi';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/tolerances
 * Menyimpan atau memperbarui konfigurasi toleransi selisih kuantitas, harga, dan nominal pembulatan.
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request, ['FLOW_VALIDATE']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = toleranceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format konfigurasi toleransi tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await db.validationTolerance.findUnique({
      where: { name: parsed.data.name },
    });

    const tolerance = await db.validationTolerance.upsert({
      where: { name: parsed.data.name },
      update: {
        category: parsed.data.category,
        qtyTolerancePercent: parsed.data.qtyTolerancePercent,
        priceTolerancePercent: parsed.data.priceTolerancePercent,
        amountToleranceAbsolute: parsed.data.amountToleranceAbsolute,
        isActive: parsed.data.isActive,
      },
      create: parsed.data,
    });

    await recordAuditLog({
      documentId: null,
      entityType: 'VALIDATION_TOLERANCE',
      entityId: tolerance.id,
      action: existing ? 'UPDATE_TOLERANCE' : 'CREATE_TOLERANCE',
      performedBy: auth.user.displayName,
      actorUserId: auth.user.id,
      ipAddress: auth.user.ipAddress,
      oldValues: existing
        ? {
            qtyTolerancePercent: Number(existing.qtyTolerancePercent),
            priceTolerancePercent: Number(existing.priceTolerancePercent),
            amountToleranceAbsolute: Number(existing.amountToleranceAbsolute),
            isActive: existing.isActive,
          }
        : null,
      newValues: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi toleransi berhasil disimpan.',
      data: tolerance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan toleransi';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
