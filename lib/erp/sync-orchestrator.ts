import { DocumentStatus, ValidationStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { ErpConnector, NormalizedErpDocument } from '@/lib/erp/types';
import { calculateTaxAndFx } from '@/lib/tax-fx';
import { validateAndSaveRelationInDb } from '@/lib/validators/p2p-validator';
import { recordAuditLog } from '@/lib/audit';

export interface IncrementalSyncOptions {
  connector: ErpConnector;
  syncTypes?: Array<'PO' | 'GR' | 'PI'>;
  pageSize?: number;
  maxPages?: number;
  performedBy?: string;
  actorUserId?: string;
  ipAddress?: string;
}

export interface IncrementalSyncSummary {
  success: boolean;
  syncId: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: string[];
}

async function upsertNormalizedDocument(
  doc: NormalizedErpDocument,
  performedBy: string
) {
  const taxFx = calculateTaxAndFx({
    amount: doc.amount,
    discountAmount: doc.discountAmount,
    taxRate: doc.taxRate,
    withholdingTaxRate: doc.withholdingTaxRate,
    isTaxInclusive: doc.isTaxInclusive,
    currency: doc.currency,
    exchangeRate: doc.exchangeRate,
  });

  const totalQty =
    doc.items.length > 0
      ? doc.items.reduce((sum, item) => sum + item.quantity, 0)
      : undefined;

  const savedDoc = await db.document.upsert({
    where: { documentNumber: doc.documentNumber },
    update: {
      documentType: doc.documentType,
      documentDate: doc.documentDate,
      vendor: doc.vendor,
      amount: doc.amount,
      currency: taxFx.currency,
      exchangeRate: taxFx.exchangeRate,
      baseCurrencyAmount: taxFx.baseCurrencyAmount,
      taxRate: doc.taxRate ?? 0,
      taxAmount: doc.taxAmount ?? taxFx.taxAmount,
      withholdingTaxRate: doc.withholdingTaxRate ?? 0,
      withholdingTax: taxFx.withholdingTax,
      discountAmount: taxFx.discountAmount,
      isTaxInclusive: Boolean(doc.isTaxInclusive),
      quantity: totalQty,
      referenceNumber: doc.referenceNumber,
      description: doc.description,
      externalSystem: doc.externalSystem,
      externalId: doc.externalId,
      externalUpdatedAt: doc.externalUpdatedAt ?? new Date(),
      updatedAt: new Date(),
    },
    create: {
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      referenceNumber: doc.referenceNumber,
      documentDate: doc.documentDate,
      vendor: doc.vendor,
      amount: doc.amount,
      currency: taxFx.currency,
      exchangeRate: taxFx.exchangeRate,
      baseCurrencyAmount: taxFx.baseCurrencyAmount,
      taxRate: doc.taxRate ?? 0,
      taxAmount: doc.taxAmount ?? taxFx.taxAmount,
      withholdingTaxRate: doc.withholdingTaxRate ?? 0,
      withholdingTax: taxFx.withholdingTax,
      discountAmount: taxFx.discountAmount,
      isTaxInclusive: Boolean(doc.isTaxInclusive),
      quantity: totalQty,
      status: DocumentStatus.SUBMITTED,
      validationStatus: ValidationStatus.PENDING,
      description: doc.description,
      externalSystem: doc.externalSystem,
      externalId: doc.externalId,
      externalUpdatedAt: doc.externalUpdatedAt ?? new Date(),
      createdBy: performedBy,
    },
  });

  // Sinkronkan detail SKU item jika disediakan oleh ERP
  if (doc.items.length > 0) {
    await db.documentItem.deleteMany({
      where: { documentId: savedDoc.id },
    });
    await db.documentItem.createMany({
      data: doc.items.map((item) => ({
        documentId: savedDoc.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        uom: item.uom || 'PCS',
      })),
    });
  }

  return savedDoc;
}

/**
 * Orkestrator sinkronisasi ERP bertahap (incremental + pagination loop)
 * yang juga otomatis membangun relasi & menjalankan P2P validator.
 */
export async function runErpIncrementalSync(
  options: IncrementalSyncOptions
): Promise<IncrementalSyncSummary> {
  const {
    connector,
    syncTypes = ['PO', 'GR', 'PI'],
    pageSize = 50,
    maxPages = 20,
    performedBy = 'System Sync',
    actorUserId,
    ipAddress,
  } = options;

  // Ambil watermark sinkronisasi sukses terakhir
  const lastSync = await db.syncHistory.findFirst({
    where: {
      syncType: `${connector.systemName}_INCREMENTAL`,
      status: { in: ['SUCCESS', 'PARTIAL'] },
    },
    orderBy: { completedAt: 'desc' },
  });

  const syncLog = await db.syncHistory.create({
    data: {
      syncType: `${connector.systemName}_INCREMENTAL`,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Pastikan urutan PO -> GR -> PI agar relasi parent langsung tertaut
    const orderedTypes: Array<'PO' | 'GR' | 'PI'> = ['PO', 'GR', 'PI'].filter(
      (t): t is 'PO' | 'GR' | 'PI' => syncTypes.includes(t as 'PO' | 'GR' | 'PI')
    );

    for (const docType of orderedTypes) {
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        try {
          const batch = await connector.fetchDocuments(docType, {
            page,
            pageSize,
            updatedAfter: lastSync?.completedAt ?? undefined,
          });

          for (const doc of batch.documents) {
            totalProcessed++;
            try {
              const savedDoc = await upsertNormalizedDocument(doc, performedBy);

              if (doc.parentDocumentNumber) {
                const parentDoc = await db.document.findUnique({
                  where: { documentNumber: doc.parentDocumentNumber },
                  select: { id: true },
                });
                if (parentDoc) {
                  await validateAndSaveRelationInDb({
                    sourceDocumentId: parentDoc.id,
                    targetDocumentId: savedDoc.id,
                    performedBy,
                    actorUserId,
                    ipAddress,
                  });
                }
              }

              totalSuccessful++;
            } catch (err: unknown) {
              totalFailed++;
              errors.push(
                `Gagal upsert ${docType} ${doc.documentNumber}: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }

          hasMore = batch.hasMore;
          page++;
        } catch (batchErr: unknown) {
          errors.push(
            `Error fetch ${docType} page ${page}: ${batchErr instanceof Error ? batchErr.message : String(batchErr)}`
          );
          break;
        }
      }
    }

    const isSuccess = totalFailed === 0 && errors.length === 0;
    await db.syncHistory.update({
      where: { id: syncLog.id },
      data: {
        status: isSuccess ? 'SUCCESS' : totalSuccessful > 0 ? 'PARTIAL' : 'FAILED',
        recordsProcessed: totalProcessed,
        recordsSuccessful: totalSuccessful,
        recordsFailed: totalFailed,
        errorLog: errors.length > 0 ? errors.join('\n') : null,
        completedAt: new Date(),
      },
    });

    await recordAuditLog({
      documentId: null,
      entityType: 'ERP_SYNC',
      entityId: syncLog.id,
      action: 'ERP_INCREMENTAL_SYNC',
      performedBy,
      actorUserId,
      ipAddress,
      newValues: {
        system: connector.systemName,
        syncTypes: orderedTypes,
        recordsProcessed: totalProcessed,
        recordsSuccessful: totalSuccessful,
        recordsFailed: totalFailed,
      },
    });

    return {
      success: isSuccess,
      syncId: syncLog.id,
      recordsProcessed: totalProcessed,
      recordsSuccessful: totalSuccessful,
      recordsFailed: totalFailed,
      errors,
    };
  } catch (globalErr: unknown) {
    const errorMsg = globalErr instanceof Error ? globalErr.message : String(globalErr);
    await db.syncHistory.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorLog: errorMsg,
        completedAt: new Date(),
      },
    });
    throw globalErr;
  }
}
