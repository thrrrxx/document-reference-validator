import { ApprovalStatus, DocumentStatus, DocumentType } from '@prisma/client';
import { db } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

export interface ActorContext {
  id: string;
  displayName: string;
  role: string;
  ipAddress?: string;
}

function getDefaultStepsForDocument(docType: DocumentType, amount: number): Array<{ stepOrder: number; requiredRole: string }> {
  switch (docType) {
    case DocumentType.BOM:
    case DocumentType.PR:
      return [{ stepOrder: 1, requiredRole: 'ENGINEERING_PPIC' }];
    case DocumentType.PO:
      if (amount >= 50_000_000) {
        return [
          { stepOrder: 1, requiredRole: 'PROCUREMENT' },
          { stepOrder: 2, requiredRole: 'FINANCE' },
        ];
      }
      return [{ stepOrder: 1, requiredRole: 'PROCUREMENT' }];
    case DocumentType.GR:
    case DocumentType.PURCHASE_RETURN:
      return [{ stepOrder: 1, requiredRole: 'WAREHOUSE' }];
    case DocumentType.PI:
    case DocumentType.INVOICE:
    case DocumentType.PP:
    case DocumentType.CREDIT_NOTE:
      return [{ stepOrder: 1, requiredRole: 'FINANCE' }];
    default:
      return [{ stepOrder: 1, requiredRole: 'ADMIN' }];
  }
}

/**
 * Mengajukan dokumen untuk proses Multi-Level Approval berdasarkan ApprovalRule di database
 * (atau default matrix departemen & nominal jika rule kustom belum dibuat).
 */
export async function submitDocumentForApproval(documentId: string, actor: ActorContext) {
  const doc = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new Error('Dokumen tidak ditemukan.');
  }

  if (doc.status === DocumentStatus.VOID) {
    throw new Error('Dokumen berstatus VOID tidak dapat diajukan untuk approval.');
  }

  if (doc.status === DocumentStatus.APPROVED) {
    throw new Error('Dokumen sudah berstatus APPROVED.');
  }

  const docAmount = Number(doc.amount) || 0;

  // Cari rule aktif dari tabel ApprovalRule
  const dbRules = await db.approvalRule.findMany({
    where: {
      documentType: doc.documentType,
      isActive: true,
    },
    orderBy: { stepOrder: 'asc' },
  });

  const matchingRules = dbRules.filter((rule) => {
    const min = Number(rule.minAmount) || 0;
    const max = rule.maxAmount !== null ? Number(rule.maxAmount) : Infinity;
    return docAmount >= min && docAmount <= max;
  });

  const stepsToCreate =
    matchingRules.length > 0
      ? matchingRules.map((r) => ({
          ruleId: r.id,
          stepOrder: r.stepOrder,
          assignedRole: r.requiredRole,
        }))
      : getDefaultStepsForDocument(doc.documentType, docAmount).map((s) => ({
          ruleId: null,
          stepOrder: s.stepOrder,
          assignedRole: s.requiredRole,
        }));

  const oldStatus = doc.status;

  // Bersihkan task lama jika re-submit setelah REJECTED, lalu buat task baru
  await db.$transaction(async (tx) => {
    await tx.approvalTask.deleteMany({
      where: { documentId: doc.id },
    });

    await tx.approvalTask.createMany({
      data: stepsToCreate.map((step) => ({
        documentId: doc.id,
        ruleId: step.ruleId,
        stepOrder: step.stepOrder,
        assignedRole: step.assignedRole,
        status: ApprovalStatus.PENDING,
      })),
    });

    await tx.document.update({
      where: { id: doc.id },
      data: { status: DocumentStatus.PENDING_APPROVAL },
    });
  });

  await recordAuditLog({
    documentId: doc.id,
    entityType: 'DOCUMENT',
    entityId: doc.id,
    action: 'SUBMIT_FOR_APPROVAL',
    performedBy: actor.displayName,
    actorUserId: actor.id,
    ipAddress: actor.ipAddress,
    oldValues: { status: oldStatus },
    newValues: {
      status: DocumentStatus.PENDING_APPROVAL,
      steps: stepsToCreate,
    },
    details: { documentNumber: doc.documentNumber, stepCount: stepsToCreate.length },
  });

  return db.document.findUnique({
    where: { id: doc.id },
    include: { approvalTasks: { orderBy: { stepOrder: 'asc' } } },
  });
}

/**
 * Memutuskan satu tahap approval (APPROVED / REJECTED) secara berjenjang (stepOrder).
 */
export async function decideApprovalTask(params: {
  taskId: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
  actor: ActorContext;
}) {
  const { taskId, decision, comment, actor } = params;

  const task = await db.approvalTask.findUnique({
    where: { id: taskId },
    include: {
      document: {
        include: {
          approvalTasks: { orderBy: { stepOrder: 'asc' } },
        },
      },
    },
  });

  if (!task) {
    throw new Error('Approval task tidak ditemukan.');
  }

  if (task.document.status === DocumentStatus.VOID) {
    throw new Error('Dokumen berstatus VOID tidak dapat diproses.');
  }

  if (task.status !== ApprovalStatus.PENDING) {
    throw new Error(`Approval task ini sudah diputuskan dengan status ${task.status}.`);
  }

  // Validasi urutan stepOrder: tidak boleh melompati step sebelumnya
  const earlierPending = task.document.approvalTasks.find(
    (t) => t.stepOrder < task.stepOrder && t.status === ApprovalStatus.PENDING
  );
  if (earlierPending) {
    throw new Error(
      `Menunggu persetujuan tahap sebelumnya (Step ${earlierPending.stepOrder} - ${earlierPending.assignedRole}).`
    );
  }

  // Validasi otorisasi role penanggung jawab step ini
  const actorRole = actor.role.toUpperCase();
  const requiredRole = task.assignedRole.toUpperCase();
  if (actorRole !== 'ADMIN' && actorRole !== 'USER' && actorRole !== requiredRole) {
    throw new Error(
      `Role "${actor.role}" tidak berwenang memutuskan tahap ini (membutuhkan role ${task.assignedRole}).`
    );
  }

  const now = new Date();
  const nextApprovalStatus =
    decision === 'APPROVED' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

  let nextDocStatus: DocumentStatus = task.document.status;

  await db.$transaction(async (tx) => {
    await tx.approvalTask.update({
      where: { id: task.id },
      data: {
        status: nextApprovalStatus,
        decidedByUserId: actor.id,
        decidedByName: actor.displayName,
        comment: comment || null,
        decidedAt: now,
      },
    });

    if (decision === 'REJECTED') {
      // Tandai step selanjutnya sebagai SKIPPED dan dokumen menjadi REJECTED
      await tx.approvalTask.updateMany({
        where: {
          documentId: task.documentId,
          stepOrder: { gt: task.stepOrder },
          status: ApprovalStatus.PENDING,
        },
        data: { status: ApprovalStatus.SKIPPED },
      });
      nextDocStatus = DocumentStatus.REJECTED;
      await tx.document.update({
        where: { id: task.documentId },
        data: { status: DocumentStatus.REJECTED },
      });
    } else {
      // Cek apakah masih ada step PENDING tersisa
      const remainingPending = task.document.approvalTasks.filter(
        (t) => t.id !== task.id && t.status === ApprovalStatus.PENDING
      );
      if (remainingPending.length === 0) {
        nextDocStatus = DocumentStatus.APPROVED;
        await tx.document.update({
          where: { id: task.documentId },
          data: { status: DocumentStatus.APPROVED },
        });
      }
    }
  });

  await recordAuditLog({
    documentId: task.documentId,
    entityType: 'APPROVAL_TASK',
    entityId: task.id,
    action: decision === 'APPROVED' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    performedBy: actor.displayName,
    actorUserId: actor.id,
    ipAddress: actor.ipAddress,
    oldValues: {
      taskStatus: ApprovalStatus.PENDING,
      documentStatus: task.document.status,
    },
    newValues: {
      taskStatus: nextApprovalStatus,
      documentStatus: nextDocStatus,
      comment: comment || null,
    },
    details: {
      documentNumber: task.document.documentNumber,
      stepOrder: task.stepOrder,
      assignedRole: task.assignedRole,
    },
  });

  return db.document.findUnique({
    where: { id: task.documentId },
    include: { approvalTasks: { orderBy: { stepOrder: 'asc' } } },
  });
}

/**
 * Membatalkan (VOID) dokumen secara aman tanpa menghapus jejak data atau audit log.
 * Menolak pembatalan jika masih ada dokumen hilir (downstream) aktif yang bergantung padanya.
 */
export async function voidDocumentInDb(params: {
  documentId: string;
  reason: string;
  actor: ActorContext;
}) {
  const { documentId, reason, actor } = params;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: {
      references: {
        include: {
          targetDocument: {
            select: { id: true, documentNumber: true, documentType: true, status: true },
          },
        },
      },
    },
  });

  if (!doc) {
    throw new Error('Dokumen tidak ditemukan.');
  }

  if (doc.status === DocumentStatus.VOID) {
    throw new Error(`Dokumen ${doc.documentNumber} sudah berstatus VOID.`);
  }

  // Cek apakah ada dokumen downstream aktif (belum VOID/REJECTED) yang bergantung pada dokumen ini
  const activeDownstream = doc.references
    .map((r) => r.targetDocument)
    .filter((t) => t.status !== DocumentStatus.VOID && t.status !== DocumentStatus.REJECTED);

  if (activeDownstream.length > 0) {
    const list = activeDownstream.map((d) => `${d.documentType}:${d.documentNumber}`).join(', ');
    throw new Error(
      `Tidak dapat membatalkan (VOID) ${doc.documentNumber} karena masih digunakan oleh dokumen hilir aktif: ${list}. Batalkan dokumen hilir tersebut terlebih dahulu.`
    );
  }

  const now = new Date();
  const oldStatus = doc.status;

  const updated = await db.$transaction(async (tx) => {
    await tx.approvalTask.updateMany({
      where: { documentId: doc.id, status: ApprovalStatus.PENDING },
      data: { status: ApprovalStatus.SKIPPED },
    });

    return tx.document.update({
      where: { id: doc.id },
      data: {
        status: DocumentStatus.VOID,
        voidedAt: now,
        voidedBy: actor.displayName,
        voidReason: reason,
      },
    });
  });

  await recordAuditLog({
    documentId: doc.id,
    entityType: 'DOCUMENT',
    entityId: doc.id,
    action: 'VOID_DOCUMENT',
    performedBy: actor.displayName,
    actorUserId: actor.id,
    ipAddress: actor.ipAddress,
    oldValues: {
      status: oldStatus,
      voidedAt: null,
    },
    newValues: {
      status: DocumentStatus.VOID,
      voidedAt: now.toISOString(),
      voidReason: reason,
    },
    details: { documentNumber: doc.documentNumber, reason },
  });

  return updated;
}
