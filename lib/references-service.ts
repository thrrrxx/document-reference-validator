import { db } from '@/lib/db';
import { DocumentType, DocumentStatus, ValidationStatus } from '@prisma/client';
import { DocumentFlowCode, DocumentFlowStep, ReferenceItem } from '@/lib/mock-references';
import { validateAndSaveRelationInDb } from '@/lib/validators/p2p-validator';
import { recordAuditLog } from '@/lib/audit';

export const PIPELINE_STEPS: { code: DocumentFlowCode; label: string; docType: DocumentType }[] = [
  { code: 'BOM', label: 'Bill of Materials', docType: DocumentType.BOM },
  { code: 'PR', label: 'Purchase Requisition', docType: DocumentType.PR },
  { code: 'PO', label: 'Purchase Order', docType: DocumentType.PO },
  { code: 'GRN', label: 'Goods Received Note', docType: DocumentType.GR },
  { code: 'PI', label: 'Purchase Invoice', docType: DocumentType.PI },
  { code: 'PP', label: 'Payment Proof', docType: DocumentType.PP },
];

const STEP_ORDER: Record<DocumentType, number> = {
  [DocumentType.BOM]: 0,
  [DocumentType.PR]: 1,
  [DocumentType.PO]: 2,
  [DocumentType.GR]: 3,
  [DocumentType.PURCHASE_RETURN]: 3,
  [DocumentType.PI]: 4,
  [DocumentType.INVOICE]: 4,
  [DocumentType.CREDIT_NOTE]: 4,
  [DocumentType.PP]: 5,
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mengambil semua alur dokumen pengadaan dari PostgreSQL
 */
export async function getAllFlowsFromDb(): Promise<ReferenceItem[]> {
  try {
    const documents = await db.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      references: {
        include: { targetDocument: true },
      },
      referencedBy: {
        include: { sourceDocument: true },
      },
      auditLogs: { take: 1, orderBy: { createdAt: 'desc' } },
      validationResults: { orderBy: { createdAt: 'desc' } },
    },
  });

  // Kelompokkan dokumen berdasarkan referenceNumber (Flow ID)
  const flowMap = new Map<string, typeof documents>();

  for (const doc of documents) {
    const flowId = doc.referenceNumber?.startsWith('FLOW-')
      ? doc.referenceNumber
      : `FLOW-DOC-${doc.id.slice(-4)}`;

    if (!flowMap.has(flowId)) {
      flowMap.set(flowId, []);
    }
    flowMap.get(flowId)!.push(doc);
  }

  const result: ReferenceItem[] = [];

  for (const [flowId, docs] of flowMap.entries()) {
    // Ambil metadata dari dokumen utama (misal PO atau dokumen pertama)
    const primaryDoc = docs.find((d) => d.documentType === DocumentType.PO) || docs[0];
    const totalAmountNum = docs.reduce((max, d) => Math.max(max, Number(d.amount) || 0), 0);
    const vendor = primaryDoc.vendor || 'Vendor Lokal';
    const title = primaryDoc.description || `Pengadaan Material [${flowId}]`;
    const managedBy = primaryDoc.createdBy || 'User Operasional';

    // Susun 6-step pipeline
    const flowSteps: DocumentFlowStep[] = PIPELINE_STEPS.map((stepMeta, index) => {
      // Cari dokumen yang sesuai dengan tipe
      const docMatch = docs.find((d) => {
        if (stepMeta.code === 'BOM') return d.documentType === DocumentType.BOM;
        if (stepMeta.code === 'PR') return d.documentType === DocumentType.PR;
        if (stepMeta.code === 'PO') return d.documentType === DocumentType.PO;
        if (stepMeta.code === 'GRN') return d.documentType === DocumentType.GR;
        if (stepMeta.code === 'PI') {
          return d.documentType === DocumentType.PI || d.documentType === DocumentType.INVOICE;
        }
        if (stepMeta.code === 'PP') return d.documentType === DocumentType.PP;
        return false;
      });

      if (docMatch) {
        return {
          step: index + 1,
          code: stepMeta.code,
          label: stepMeta.label,
          docNumber: docMatch.documentNumber,
          status: 'present',
          date: docMatch.documentDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          notes: docMatch.notes || `Tervalidasi (${docMatch.validationStatus})`,
        };
      }

      return {
        step: index + 1,
        code: stepMeta.code,
        label: stepMeta.label,
        status: 'missing',
      };
    });

    // Periksa kelengkapan alur
    const missingSteps = flowSteps.filter((s) => s.status === 'missing');
    const isComplete = missingSteps.length === 0;

    let missingDoc: string | undefined;
    let issueDetails: string | undefined;

    if (!isComplete) {
      missingDoc = missingSteps.map((m) => m.code).join(', ');
      issueDetails = `Dokumen ${missingDoc} belum terlampir pada alur pengadaan ini.`;
    }

    result.push({
      id: flowId,
      title,
      vendor,
      totalAmount: formatRupiah(totalAmountNum),
      status: isComplete ? 'complete' : 'missing',
      flowSteps,
      missingDoc,
      issueDetails,
      validatedAt: primaryDoc.updatedAt.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      managedBy,
    });
  }

    return result;
  } catch (error) {
    console.error('[getAllFlowsFromDb] Database query failed:', error);
    return [];
  }
}

/**
 * Membuat Alur Dokumen Baru di Database PostgreSQL
 */
export async function createFlowInDb(data: {
  title: string;
  vendor: string;
  totalAmount: number;
  managedBy?: string;
  actorUserId?: string;
  ipAddress?: string;
  steps: Partial<
    Record<
      DocumentFlowCode,
      {
        docNumber: string;
        date?: string;
        notes?: string;
      }
    >
  >;
}): Promise<ReferenceItem> {
  const flowId = `FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdDocIds: string[] = [];
  const actorName = data.managedBy || 'User Dashboard';

  for (const stepMeta of PIPELINE_STEPS) {
    const stepData = data.steps[stepMeta.code];
    if (stepData && stepData.docNumber && stepData.docNumber.trim() !== '') {
      const docDate = stepData.date ? new Date(stepData.date) : new Date();

      const createdDoc = await db.document.create({
        data: {
          documentType: stepMeta.docType,
          documentNumber: stepData.docNumber.trim(),
          referenceNumber: flowId,
          documentDate: docDate,
          vendor: data.vendor,
          amount: data.totalAmount,
          currency: 'IDR',
          description: data.title,
          notes: stepData.notes || `Tahap ${stepMeta.code} pada alur ${flowId}`,
          status: DocumentStatus.SUBMITTED,
          validationStatus: ValidationStatus.VALID,
          createdBy: actorName,
        },
      });

      createdDocIds.push(createdDoc.id);

      // Catat ke AuditLog (append-only dengan snapshot newValues)
      await recordAuditLog({
        documentId: createdDoc.id,
        entityType: 'DOCUMENT',
        entityId: createdDoc.id,
        action: 'CREATE_DOCUMENT_STEP',
        performedBy: actorName,
        actorUserId: data.actorUserId,
        ipAddress: data.ipAddress,
        newValues: {
          flowId,
          documentType: createdDoc.documentType,
          documentNumber: createdDoc.documentNumber,
          vendor: createdDoc.vendor,
          amount: Number(createdDoc.amount),
          status: createdDoc.status,
        },
        details: { flowId, step: stepMeta.code, docNumber: stepData.docNumber },
      });
    }
  }

  // Buat relasi berurutan di documentRelation jika ada >= 2 dokumen dan jalankan validator transisi
  for (let i = 0; i < createdDocIds.length - 1; i++) {
    try {
      await validateAndSaveRelationInDb({
        sourceDocumentId: createdDocIds[i],
        targetDocumentId: createdDocIds[i + 1],
        relationData: { amount: data.totalAmount },
        performedBy: actorName,
        actorUserId: data.actorUserId,
        ipAddress: data.ipAddress,
      });
    } catch {
      // Abaikan jika sudah ada
    }
  }

  const allFlows = await getAllFlowsFromDb();
  const newFlow = allFlows.find((f) => f.id === flowId);
  if (!newFlow) {
    throw new Error('Gagal mengambil alur dokumen yang baru dibuat dari database.');
  }

  return newFlow;
}

/**
 * Melengkapi / Menambahkan dokumen pada alur yang sudah ada
 */
export async function linkDocumentToFlowInDb(data: {
  flowId: string;
  code: DocumentFlowCode;
  docNumber: string;
  date?: string;
  notes?: string;
  performedBy?: string;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<ReferenceItem> {
  const stepMeta = PIPELINE_STEPS.find((p) => p.code === data.code);
  if (!stepMeta) {
    throw new Error(`Kode tahap ${data.code} tidak valid`);
  }

  const actorName = data.performedBy || 'User Dashboard';
  const normalizedDocNumber = data.docNumber.trim();

  // Ambil dokumen yang sudah ada pada flow ini untuk mewarisi judul, vendor, & amount
  const existingDocs = await db.document.findMany({
    where: { referenceNumber: data.flowId },
  });

  // Tangkap state lama jika documentNumber sudah pernah ada sebelumnya (untuk diff audit)
  const existingTarget = await db.document.findUnique({
    where: { documentNumber: normalizedDocNumber },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      referenceNumber: true,
      vendor: true,
      amount: true,
      notes: true,
      status: true,
    },
  });

  const parent = existingDocs[0];
  const vendor = parent?.vendor || 'Vendor';
  const amount = parent ? Number(parent.amount) : 0;
  const description = parent?.description || `Alur ${data.flowId}`;

  const docDate = data.date ? new Date(data.date) : new Date();

  // Simpan dokumen baru ke PostgreSQL
  const newDoc = await db.document.upsert({
    where: { documentNumber: normalizedDocNumber },
    update: {
      referenceNumber: data.flowId,
      documentType: stepMeta.docType,
      vendor,
      amount,
      notes: data.notes || `Dilengkapi melalui alur ${data.flowId}`,
      updatedAt: new Date(),
    },
    create: {
      documentType: stepMeta.docType,
      documentNumber: normalizedDocNumber,
      referenceNumber: data.flowId,
      documentDate: docDate,
      vendor,
      amount,
      currency: 'IDR',
      description,
      notes: data.notes || `Dilengkapi melalui alur ${data.flowId}`,
      status: DocumentStatus.APPROVED,
      validationStatus: ValidationStatus.VALID,
      createdBy: actorName,
    },
  });

  // Hubungkan relasi sesuai urutan tahap PIPELINE_STEPS (BOM -> PR -> PO -> GR -> PI -> PP)
  const currentRank = STEP_ORDER[newDoc.documentType];
  const otherDocs = existingDocs
    .filter((d) => d.id !== newDoc.id)
    .sort((a, b) => STEP_ORDER[a.documentType] - STEP_ORDER[b.documentType]);

  const precedingDocs = otherDocs.filter((d) => STEP_ORDER[d.documentType] < currentRank);
  const succeedingDocs = otherDocs.filter((d) => STEP_ORDER[d.documentType] > currentRank);

  const prevDoc = precedingDocs[precedingDocs.length - 1];
  const nextDoc = succeedingDocs[0];

  if (prevDoc) {
    try {
      await validateAndSaveRelationInDb({
        sourceDocumentId: prevDoc.id,
        targetDocumentId: newDoc.id,
        relationData: { amount },
        performedBy: actorName,
        actorUserId: data.actorUserId,
        ipAddress: data.ipAddress,
      });
    } catch {
      // Abaikan jika relasi sudah ada
    }
  }

  if (nextDoc) {
    try {
      await validateAndSaveRelationInDb({
        sourceDocumentId: newDoc.id,
        targetDocumentId: nextDoc.id,
        relationData: { amount },
        performedBy: actorName,
        actorUserId: data.actorUserId,
        ipAddress: data.ipAddress,
      });
    } catch {
      // Abaikan jika relasi sudah ada
    }
  }

  // Catat AuditLog secara append-only dengan before/after diff
  await recordAuditLog({
    documentId: newDoc.id,
    entityType: 'DOCUMENT',
    entityId: newDoc.id,
    action: existingTarget ? 'UPDATE_LINK_DOCUMENT_STEP' : 'LINK_DOCUMENT_STEP',
    performedBy: actorName,
    actorUserId: data.actorUserId,
    ipAddress: data.ipAddress,
    oldValues: existingTarget
      ? {
          ...existingTarget,
          amount: Number(existingTarget.amount),
        }
      : null,
    newValues: {
      id: newDoc.id,
      documentType: newDoc.documentType,
      documentNumber: newDoc.documentNumber,
      referenceNumber: newDoc.referenceNumber,
      vendor: newDoc.vendor,
      amount: Number(newDoc.amount),
      notes: newDoc.notes,
      status: newDoc.status,
    },
    details: { flowId: data.flowId, step: data.code, docNumber: normalizedDocNumber },
  });

  const allFlows = await getAllFlowsFromDb();
  const updatedFlow = allFlows.find((f) => f.id === data.flowId);
  if (!updatedFlow) {
    throw new Error('Alur dokumen tidak ditemukan.');
  }

  return updatedFlow;
}

/**
 * Menghapus seluruh dokumen pada satu alur dari PostgreSQL
 */
export async function deleteFlowFromDb(
  flowId: string,
  actor?: { performedBy?: string; actorUserId?: string; ipAddress?: string }
) {
  const selectFields = {
    id: true,
    documentNumber: true,
    documentType: true,
    referenceNumber: true,
    vendor: true,
    amount: true,
    status: true,
  };

  // 1. Cari dokumen berdasarkan referenceNumber (Flow ID standar seperti FLOW-8921)
  let docs = await db.document.findMany({
    where: { referenceNumber: flowId },
    select: selectFields,
  });

  // 2. Fallback: jika tidak ditemukan via referenceNumber, periksa apakah flowId merupakan format fallback (FLOW-DOC-<suffix>) atau ID dokumen langsung
  if (docs.length === 0) {
    if (flowId.startsWith('FLOW-DOC-')) {
      const suffix = flowId.replace('FLOW-DOC-', '');
      docs = await db.document.findMany({
        where: {
          OR: [
            { id: { endsWith: suffix } },
            { id: flowId },
            { documentNumber: suffix },
          ],
        },
        select: selectFields,
      });
    } else {
      docs = await db.document.findMany({
        where: {
          OR: [
            { id: flowId },
            { documentNumber: flowId },
          ],
        },
        select: selectFields,
      });
    }
  }

  const docIds = docs.map((d) => d.id);

  if (docIds.length === 0) {
    throw new Error(`Alur atau dokumen "${flowId}" tidak ditemukan di database.`);
  }

  // Catat AuditLog penghapusan sebelum dokumen dihapus (append-only, auditLog lama dipertahankan via SetNull)
  await recordAuditLog({
    documentId: null,
    entityType: 'FLOW',
    entityId: flowId,
    action: 'DELETE_FLOW',
    performedBy: actor?.performedBy || 'User Dashboard',
    actorUserId: actor?.actorUserId,
    ipAddress: actor?.ipAddress,
    oldValues: docs.map((d) => ({
      ...d,
      amount: Number(d.amount),
    })),
    details: { flowId, deletedCount: docIds.length },
  });

  // Hapus relations, items, validation results, dan syncHistory terkait (auditLog tetap utuh!)
  await db.documentRelation.deleteMany({
    where: {
      OR: [{ sourceDocumentId: { in: docIds } }, { targetDocumentId: { in: docIds } }],
    },
  });
  await db.documentItem.deleteMany({
    where: { documentId: { in: docIds } },
  });
  await db.validationResult.deleteMany({
    where: { documentId: { in: docIds } },
  });
  await db.syncHistory.deleteMany({
    where: { documentId: { in: docIds } },
  });

  const deleteResult = await db.document.deleteMany({
    where: { id: { in: docIds } },
  });

  return { success: true, count: deleteResult.count };
}

