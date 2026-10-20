import { db } from '@/lib/db';
import { DocumentType, DocumentStatus, ValidationStatus } from '@prisma/client';
import { DocumentFlowCode, DocumentFlowStep, ReferenceItem } from '@/lib/mock-references';

export const PIPELINE_STEPS: { code: DocumentFlowCode; label: string; docType: DocumentType }[] = [
  { code: 'BOM', label: 'Bill of Materials', docType: DocumentType.BOM },
  { code: 'PR', label: 'Purchase Requisition', docType: DocumentType.PR },
  { code: 'PO', label: 'Purchase Order', docType: DocumentType.PO },
  { code: 'GRN', label: 'Goods Received Note', docType: DocumentType.GR },
  { code: 'PI', label: 'Purchase Invoice', docType: DocumentType.INVOICE },
  { code: 'PP', label: 'Payment Proof', docType: DocumentType.PP },
];

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
  const documents = await db.document.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      references: true,
      referencedBy: true,
      auditLogs: { take: 1, orderBy: { createdAt: 'desc' } },
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
        if (stepMeta.code === 'PI') return d.documentType === DocumentType.INVOICE;
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
}

/**
 * Membuat Alur Dokumen Baru di Database PostgreSQL
 */
export async function createFlowInDb(data: {
  title: string;
  vendor: string;
  totalAmount: number;
  managedBy?: string;
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
          createdBy: data.managedBy || 'User Dashboard',
        },
      });

      createdDocIds.push(createdDoc.id);

      // Catat ke AuditLog
      await db.auditLog.create({
        data: {
          documentId: createdDoc.id,
          action: 'CREATE_DOCUMENT_STEP',
          performedBy: data.managedBy || 'User Dashboard',
          details: JSON.stringify({ flowId, step: stepMeta.code, docNumber: stepData.docNumber }),
        },
      });
    }
  }

  // Buat relasi berurutan di documentReference jika ada >= 2 dokumen
  for (let i = 0; i < createdDocIds.length - 1; i++) {
    try {
      await db.documentReference.create({
        data: {
          sourceDocumentId: createdDocIds[i],
          targetDocumentId: createdDocIds[i + 1],
          amount: data.totalAmount,
          validationStatus: ValidationStatus.VALID,
        },
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
}): Promise<ReferenceItem> {
  const stepMeta = PIPELINE_STEPS.find((p) => p.code === data.code);
  if (!stepMeta) {
    throw new Error(`Kode tahap ${data.code} tidak valid`);
  }

  // Ambil dokumen yang sudah ada pada flow ini untuk mewarisi judul, vendor, & amount
  const existingDocs = await db.document.findMany({
    where: { referenceNumber: data.flowId },
  });

  const parent = existingDocs[0];
  const vendor = parent?.vendor || 'Vendor';
  const amount = parent ? Number(parent.amount) : 0;
  const description = parent?.description || `Alur ${data.flowId}`;

  const docDate = data.date ? new Date(data.date) : new Date();

  // Simpan dokumen baru ke PostgreSQL
  const newDoc = await db.document.upsert({
    where: { documentNumber: data.docNumber.trim() },
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
      documentNumber: data.docNumber.trim(),
      referenceNumber: data.flowId,
      documentDate: docDate,
      vendor,
      amount,
      currency: 'IDR',
      description,
      notes: data.notes || `Dilengkapi melalui alur ${data.flowId}`,
      status: DocumentStatus.APPROVED,
      validationStatus: ValidationStatus.VALID,
      createdBy: data.performedBy || 'User Dashboard',
    },
  });

  // Catat AuditLog
  await db.auditLog.create({
    data: {
      documentId: newDoc.id,
      action: 'LINK_DOCUMENT_STEP',
      performedBy: data.performedBy || 'User Dashboard',
      details: JSON.stringify({ flowId: data.flowId, step: data.code, docNumber: data.docNumber }),
    },
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
export async function deleteFlowFromDb(flowId: string) {
  const docs = await db.document.findMany({
    where: { referenceNumber: flowId },
    select: { id: true },
  });

  const docIds = docs.map((d) => d.id);

  if (docIds.length > 0) {
    // Hapus references & audit logs
    await db.documentReference.deleteMany({
      where: {
        OR: [{ sourceDocumentId: { in: docIds } }, { targetDocumentId: { in: docIds } }],
      },
    });
    await db.auditLog.deleteMany({
      where: { documentId: { in: docIds } },
    });
    await db.validationResult.deleteMany({
      where: { documentId: { in: docIds } },
    });
    await db.document.deleteMany({
      where: { id: { in: docIds } },
    });
  }

  return { success: true, count: docIds.length };
}
