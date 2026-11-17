import { NextResponse } from 'next/server';
import { ApprovalStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { submitDocumentForApproval, decideApprovalTask } from '@/lib/approval-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const approvalActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('SUBMIT'),
    documentId: z.string().min(1, 'documentId wajib diisi'),
  }),
  z.object({
    action: z.literal('DECIDE'),
    taskId: z.string().min(1, 'taskId wajib diisi'),
    decision: z.enum(['APPROVED', 'REJECTED']),
    comment: z.string().optional(),
  }),
]);

/**
 * GET /api/approvals
 * Mengambil daftar antrean ApprovalTask (filter opsional: ?status=PENDING&documentId=...)
 */
export async function GET(request: Request) {
  const auth = await requireAuth(request, ['APPROVAL_VIEW']);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') as ApprovalStatus | null;
    const documentId = searchParams.get('documentId');

    const tasks = await db.approvalTask.findMany({
      where: {
        ...(statusParam ? { status: statusParam } : {}),
        ...(documentId ? { documentId } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { stepOrder: 'asc' }],
      include: {
        document: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            referenceNumber: true,
            vendor: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil daftar approval';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/approvals
 * Mengajukan dokumen untuk approval (SUBMIT) atau memutus tahap approval (DECIDE).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = approvalActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Format payload approval tidak valid', errors: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'SUBMIT') {
      const auth = await requireAuth(request, ['FLOW_CREATE']);
      if (auth.error) return auth.error;

      const updatedDoc = await submitDocumentForApproval(parsed.data.documentId, {
        id: auth.user.id,
        displayName: auth.user.displayName,
        role: auth.user.role,
        ipAddress: auth.user.ipAddress,
      });

      return NextResponse.json({
        success: true,
        message: 'Dokumen berhasil diajukan ke antrean Multi-Level Approval.',
        data: updatedDoc,
      });
    }

    const auth = await requireAuth(request, ['APPROVAL_DECIDE']);
    if (auth.error) return auth.error;

    const updatedDoc = await decideApprovalTask({
      taskId: parsed.data.taskId,
      decision: parsed.data.decision,
      comment: parsed.data.comment,
      actor: {
        id: auth.user.id,
        displayName: auth.user.displayName,
        role: auth.user.role,
        ipAddress: auth.user.ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Keputusan ${parsed.data.decision} berhasil dicatat.`,
      data: updatedDoc,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses approval';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
