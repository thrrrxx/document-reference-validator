import { NextResponse } from 'next/server';
import {
  getAllFlowsFromDb,
  createFlowInDb,
  linkDocumentToFlowInDb,
  deleteFlowFromDb,
} from '@/lib/references-service';
import { z } from 'zod';

const createFlowSchema = z.object({
  title: z.string().min(2, 'Judul pengadaan wajib diisi'),
  vendor: z.string().min(2, 'Nama vendor wajib diisi'),
  totalAmount: z.number().min(0, 'Nilai nominal harus >= 0'),
  managedBy: z.string().optional(),
  steps: z.record(
    z.object({
      docNumber: z.string(),
      date: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
});

const linkDocSchema = z.object({
  flowId: z.string().min(1, 'Flow ID wajib diisi'),
  code: z.enum(['BOM', 'PR', 'PO', 'GRN', 'PI', 'PP']),
  docNumber: z.string().min(1, 'Nomor dokumen wajib diisi'),
  date: z.string().optional(),
  notes: z.string().optional(),
  performedBy: z.string().optional(),
});

/**
 * GET /api/references
 * Mengambil seluruh alur dokumen pengadaan dari PostgreSQL.
 */
export async function GET() {
  try {
    const flows = await getAllFlowsFromDb();

    const total = flows.length;
    const missing = flows.filter((f) => f.status === 'missing').length;
    const complete = flows.filter((f) => f.status === 'complete').length;

    return NextResponse.json({
      success: true,
      data: flows,
      stats: {
        total,
        missing,
        complete,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data dari database';
    console.error('[API /api/references GET error]:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/references
 * Membuat alur pengadaan baru beserta dokumen-dokumennya di PostgreSQL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createFlowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format data tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const newFlow = await createFlowInDb(parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: 'Alur dokumen berhasil disimpan ke PostgreSQL',
        data: newFlow,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat alur dokumen di database';
    console.error('[API /api/references POST error]:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/references
 * Melengkapi dokumen pada alur yang berstatus "missing" di PostgreSQL.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = linkDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format data tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const updatedFlow = await linkDocumentToFlowInDb(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Dokumen ${parsed.data.code} berhasil ditambahkan ke alur ${parsed.data.flowId}`,
      data: updatedFlow,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal melengkapi dokumen di database';
    console.error('[API /api/references PATCH error]:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * DELETE /api/references?flowId=FLOW-1234
 * Menghapus alur dokumen dari PostgreSQL.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');

    if (!flowId) {
      return NextResponse.json(
        { success: false, message: 'Parameter ?flowId= wajib diisi' },
        { status: 400 }
      );
    }

    const result = await deleteFlowFromDb(flowId);

    return NextResponse.json({
      success: true,
      message: `Alur dokumen ${flowId} berhasil dihapus (${result.count} record terhapus)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus alur dokumen';
    console.error('[API /api/references DELETE error]:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
