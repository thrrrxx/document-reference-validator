import { DocumentStatus, DocumentType, ValidationStatus } from '@prisma/client';
import { db } from '@/lib/db';

export interface StageLeadTimeMetric {
  transition: string;
  label: string;
  avgHours: number;
  avgDays: number;
  sampleCount: number;
}

export interface OpenPoAgingItem {
  id: string;
  documentNumber: string;
  referenceNumber: string | null;
  vendor: string;
  amount: number;
  currency: string;
  documentDate: string;
  ageDays: number;
  bucket: '0-7d' | '8-14d' | '15-30d' | '>30d';
}

export interface GrniItem {
  id: string;
  documentNumber: string;
  referenceNumber: string | null;
  vendor: string;
  estimatedAmount: number;
  documentDate: string;
  ageDays: number;
}

export interface ExceptionQueueItem {
  relationId: string;
  flowId: string | null;
  sourceNumber: string;
  sourceType: DocumentType;
  targetNumber: string;
  targetType: DocumentType;
  validationStatus: ValidationStatus;
  discrepancy: string | null;
  updatedAt: string;
}

export interface ExecutiveAnalyticsData {
  generatedAt: string;
  summary: {
    totalDocuments: number;
    pendingApprovals: number;
    openPoCount: number;
    grniCount: number;
    grniEstimatedValueIdr: number;
    exceptionCount: number;
    bottleneckStage: string | null;
  };
  leadTimeMetrics: StageLeadTimeMetric[];
  poAgingBuckets: Record<'0-7d' | '8-14d' | '15-30d' | '>30d', number>;
  openPoList: OpenPoAgingItem[];
  grniList: GrniItem[];
  exceptionQueue: ExceptionQueueItem[];
}

const TRANSITION_DEFINITIONS: Array<{
  key: string;
  label: string;
  from: DocumentType[];
  to: DocumentType[];
}> = [
  { key: 'BOM_TO_PR', label: 'BOM → PR', from: [DocumentType.BOM], to: [DocumentType.PR] },
  { key: 'PR_TO_PO', label: 'PR → PO', from: [DocumentType.PR], to: [DocumentType.PO] },
  { key: 'PO_TO_GR', label: 'PO → GR', from: [DocumentType.PO], to: [DocumentType.GR] },
  {
    key: 'GR_TO_PI',
    label: 'GR → PI',
    from: [DocumentType.GR],
    to: [DocumentType.PI, DocumentType.INVOICE],
  },
  {
    key: 'PI_TO_PP',
    label: 'PI → PP',
    from: [DocumentType.PI, DocumentType.INVOICE],
    to: [DocumentType.PP],
  },
];

export async function getExecutiveAnalytics(): Promise<ExecutiveAnalyticsData> {
  try {
    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;

    const [documents, relations, pendingApprovals] = await Promise.all([
      db.document.findMany({
        where: { status: { not: DocumentStatus.VOID } },
        include: {
          references: {
            include: {
              targetDocument: {
                select: { id: true, documentType: true, status: true, amount: true },
              },
            },
          },
          referencedBy: {
            include: {
              sourceDocument: {
                select: { id: true, documentType: true, status: true, amount: true },
              },
            },
          },
        },
        orderBy: { documentDate: 'desc' },
      }),
      db.documentRelation.findMany({
        include: {
          sourceDocument: {
            select: {
              id: true,
              documentType: true,
              documentNumber: true,
              referenceNumber: true,
              documentDate: true,
              status: true,
            },
          },
          targetDocument: {
            select: {
              id: true,
              documentType: true,
              documentNumber: true,
              referenceNumber: true,
              documentDate: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      db.approvalTask.count({ where: { status: 'PENDING' } }),
    ]);

    // 1. Lead-Time Bottleneck per transisi
    const leadTimeMetrics: StageLeadTimeMetric[] = TRANSITION_DEFINITIONS.map((def) => {
      const matching = relations.filter(
        (r) =>
          def.from.includes(r.sourceDocument.documentType) &&
          def.to.includes(r.targetDocument.documentType) &&
          r.sourceDocument.status !== DocumentStatus.VOID &&
          r.targetDocument.status !== DocumentStatus.VOID
      );

      if (matching.length === 0) {
        return {
          transition: def.key,
          label: def.label,
          avgHours: 0,
          avgDays: 0,
          sampleCount: 0,
        };
      }

      const totalHours = matching.reduce((sum, rel) => {
        const diffMs = Math.max(
          0,
          rel.targetDocument.documentDate.getTime() - rel.sourceDocument.documentDate.getTime()
        );
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);

      const avgHours = Number((totalHours / matching.length).toFixed(1));
      return {
        transition: def.key,
        label: def.label,
        avgHours,
        avgDays: Number((avgHours / 24).toFixed(1)),
        sampleCount: matching.length,
      };
    });

    const activeMetrics = leadTimeMetrics.filter((m) => m.sampleCount > 0);
    const slowest =
      activeMetrics.length > 0
        ? activeMetrics.reduce((max, curr) => (curr.avgHours > max.avgHours ? curr : max))
        : null;

    // 2. Open PO Aging (PO tanpa GR aktif)
    const poAgingBuckets: Record<'0-7d' | '8-14d' | '15-30d' | '>30d', number> = {
      '0-7d': 0,
      '8-14d': 0,
      '15-30d': 0,
      '>30d': 0,
    };

    const openPoList: OpenPoAgingItem[] = [];
    for (const doc of documents) {
      if (doc.documentType !== DocumentType.PO) continue;
      const hasActiveGr = doc.references.some(
        (r) =>
          r.targetDocument.documentType === DocumentType.GR &&
          r.targetDocument.status !== DocumentStatus.VOID
      );
      if (hasActiveGr) continue;

      const ageDays = Math.max(0, Math.floor((now - doc.documentDate.getTime()) / msPerDay));
      const bucket: '0-7d' | '8-14d' | '15-30d' | '>30d' =
        ageDays <= 7 ? '0-7d' : ageDays <= 14 ? '8-14d' : ageDays <= 30 ? '15-30d' : '>30d';

      poAgingBuckets[bucket]++;
      openPoList.push({
        id: doc.id,
        documentNumber: doc.documentNumber,
        referenceNumber: doc.referenceNumber,
        vendor: doc.vendor || 'Vendor Umum',
        amount: Number(doc.baseCurrencyAmount ?? doc.amount) || 0,
        currency: doc.currency,
        documentDate: doc.documentDate.toISOString().slice(0, 10),
        ageDays,
        bucket,
      });
    }

    // 3. GRNI (Goods Received Not Invoiced): GR tanpa PI/INVOICE aktif
    const grniList: GrniItem[] = [];
    for (const doc of documents) {
      if (doc.documentType !== DocumentType.GR) continue;
      const hasActiveInvoice = doc.references.some(
        (r) =>
          (r.targetDocument.documentType === DocumentType.PI ||
            r.targetDocument.documentType === DocumentType.INVOICE) &&
          r.targetDocument.status !== DocumentStatus.VOID
      );
      if (hasActiveInvoice) continue;

      const parentPoAmount = doc.referencedBy.find(
        (r) => r.sourceDocument.documentType === DocumentType.PO
      )?.sourceDocument.amount;
      const estimatedAmount = Number(doc.baseCurrencyAmount ?? doc.amount) || Number(parentPoAmount) || 0;
      const ageDays = Math.max(0, Math.floor((now - doc.documentDate.getTime()) / msPerDay));

      grniList.push({
        id: doc.id,
        documentNumber: doc.documentNumber,
        referenceNumber: doc.referenceNumber,
        vendor: doc.vendor || 'Vendor Umum',
        estimatedAmount,
        documentDate: doc.documentDate.toISOString().slice(0, 10),
        ageDays,
      });
    }

    const grniEstimatedValueIdr = grniList.reduce((sum, item) => sum + item.estimatedAmount, 0);

    // 4. Exception Queue (relasi INVALID / WARNING / FAILED)
    const exceptionQueue: ExceptionQueueItem[] = relations
      .filter(
        (r) =>
          r.validationStatus === ValidationStatus.INVALID ||
          r.validationStatus === ValidationStatus.WARNING ||
          r.validationStatus === ValidationStatus.FAILED
      )
      .slice(0, 20)
      .map((r) => ({
        relationId: r.id,
        flowId: r.targetDocument.referenceNumber || r.sourceDocument.referenceNumber,
        sourceNumber: r.sourceDocument.documentNumber,
        sourceType: r.sourceDocument.documentType,
        targetNumber: r.targetDocument.documentNumber,
        targetType: r.targetDocument.documentType,
        validationStatus: r.validationStatus,
        discrepancy: r.discrepancy,
        updatedAt: r.updatedAt.toISOString(),
      }));

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDocuments: documents.length,
        pendingApprovals,
        openPoCount: openPoList.length,
        grniCount: grniList.length,
        grniEstimatedValueIdr,
        exceptionCount: exceptionQueue.length,
        bottleneckStage: slowest ? `${slowest.label} (${slowest.avgDays} hari)` : null,
      },
      leadTimeMetrics,
      poAgingBuckets,
      openPoList: openPoList.slice(0, 15),
      grniList: grniList.slice(0, 15),
      exceptionQueue,
    };
  } catch (error) {
    console.error('[getExecutiveAnalytics] Database error:', error);
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDocuments: 0,
        pendingApprovals: 0,
        openPoCount: 0,
        grniCount: 0,
        grniEstimatedValueIdr: 0,
        exceptionCount: 0,
        bottleneckStage: null,
      },
      leadTimeMetrics: TRANSITION_DEFINITIONS.map((d) => ({
        transition: d.key,
        label: d.label,
        avgHours: 0,
        avgDays: 0,
        sampleCount: 0,
      })),
      poAgingBuckets: { '0-7d': 0, '8-14d': 0, '15-30d': 0, '>30d': 0 },
      openPoList: [],
      grniList: [],
      exceptionQueue: [],
    };
  }
}

export interface LineageNode {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  stageColumn: number;
  documentDate: string;
  vendor: string;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  taxAmount: number;
  withholdingTax: number;
  status: DocumentStatus;
  validationStatus: ValidationStatus;
  createdBy: string | null;
  itemCount: number;
  items: Array<{
    itemCode: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface LineageEdge {
  id: string;
  sourceId: string;
  targetId: string;
  validationStatus: ValidationStatus;
  discrepancy: string | null;
  amount: number;
}

export interface FlowLineageGraph {
  flowId: string;
  nodes: LineageNode[];
  edges: LineageEdge[];
  auditLogs: Array<{
    id: string;
    action: string;
    performedBy: string;
    createdAt: string;
    details: string | null;
  }>;
}

const STAGE_COLUMN_MAP: Record<DocumentType, number> = {
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

/**
 * Mengambil graf lineage dokumen (DAG) lengkap beserta relasi bercabang 1:N / N:1 dan audit log untuk suatu Flow ID.
 */
export async function getFlowLineageGraph(flowId: string): Promise<FlowLineageGraph> {
  let docs = await db.document.findMany({
    where: { referenceNumber: flowId },
    include: {
      items: true,
      references: true,
      referencedBy: true,
    },
    orderBy: { documentDate: 'asc' },
  });

  if (docs.length === 0 && flowId.startsWith('FLOW-DOC-')) {
    const suffix = flowId.replace('FLOW-DOC-', '');
    docs = await db.document.findMany({
      where: {
        OR: [{ id: { endsWith: suffix } }, { documentNumber: suffix }],
      },
      include: {
        items: true,
        references: true,
        referencedBy: true,
      },
    });
  }

  const docIds = docs.map((d) => d.id);
  const relations =
    docIds.length > 0
      ? await db.documentRelation.findMany({
          where: {
            OR: [{ sourceDocumentId: { in: docIds } }, { targetDocumentId: { in: docIds } }],
          },
        })
      : [];

  const auditLogs =
    docIds.length > 0
      ? await db.auditLog.findMany({
          where: {
            OR: [{ documentId: { in: docIds } }, { entityId: flowId }],
          },
          orderBy: { createdAt: 'desc' },
          take: 25,
        })
      : [];

  const nodes: LineageNode[] = docs.map((d) => ({
    id: d.id,
    documentType: d.documentType,
    documentNumber: d.documentNumber,
    stageColumn: STAGE_COLUMN_MAP[d.documentType] ?? 0,
    documentDate: d.documentDate.toISOString().slice(0, 10),
    vendor: d.vendor || 'Vendor Umum',
    amount: Number(d.amount) || 0,
    currency: d.currency,
    baseCurrencyAmount: Number(d.baseCurrencyAmount ?? d.amount) || 0,
    taxAmount: Number(d.taxAmount) || 0,
    withholdingTax: Number(d.withholdingTax) || 0,
    status: d.status,
    validationStatus: d.validationStatus,
    createdBy: d.createdBy,
    itemCount: d.items.length,
    items: d.items.map((it) => ({
      itemCode: it.itemCode,
      itemName: it.itemName,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
    })),
  }));

  const docIdSet = new Set(docIds);
  const edges: LineageEdge[] = relations
    .filter((r) => docIdSet.has(r.sourceDocumentId) && docIdSet.has(r.targetDocumentId))
    .map((r) => ({
      id: r.id,
      sourceId: r.sourceDocumentId,
      targetId: r.targetDocumentId,
      validationStatus: r.validationStatus,
      discrepancy: r.discrepancy,
      amount: Number(r.amount) || 0,
    }));

  return {
    flowId,
    nodes,
    edges,
    auditLogs: auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      performedBy: a.performedBy,
      createdAt: a.createdAt.toISOString(),
      details: a.details,
    })),
  };
}
