import { DocumentStatus, DocumentType, ValidationStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { calculateTaxAndFx, TaxFxResult } from '@/lib/tax-fx';
import { validateAndSaveRelationInDb } from '@/lib/validators/p2p-validator';
import { recordAuditLog } from '@/lib/audit';

const importRowSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
  documentNumber: z.string().min(1, 'documentNumber wajib diisi'),
  documentDate: z.string().min(1, 'documentDate wajib diisi'),
  vendor: z.string().optional().default('Vendor Umum'),
  amount: z.coerce.number().min(0, 'amount harus >= 0'),
  currency: z.string().optional().default('IDR'),
  exchangeRate: z.coerce.number().positive().optional().default(1),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  withholdingTaxRate: z.coerce.number().min(0).max(100).optional().default(0),
  isTaxInclusive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || String(v).toLowerCase() === 'true' || v === '1'),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  referenceNumber: z.string().optional(),
  parentDocumentNumber: z.string().optional(),
  description: z.string().optional(),
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

export interface ImportPreviewRow {
  rowNumber: number;
  status: 'NEW' | 'UPDATE' | 'ERROR';
  errors: string[];
  data?: ImportRowInput;
  taxFx?: TaxFxResult;
}

export interface ImportPreviewReport {
  summary: {
    totalRows: number;
    newCount: number;
    updateCount: number;
    errorCount: number;
  };
  rows: ImportPreviewRow[];
}

/**
 * Parser CSV standar RFC-4180 (mendukung delimiter ',' maupun ';' dari Excel Indonesia, serta UTF-8 BOM).
 */
export function parseCsvText(csvText: string): Array<{ rowNumber: number; raw: Record<string, string> }> {
  const cleaned = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];

  const firstNewline = cleaned.indexOf('\n');
  const headerLine = firstNewline >= 0 ? cleaned.slice(0, firstNewline) : cleaned;
  const delimiter = headerLine.split(';').length > headerLine.split(',').length ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const results: Array<{ rowNumber: number; raw: Record<string, string> }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) record[h] = values[idx] ?? '';
    });
    results.push({ rowNumber: i + 1, raw: record });
  }

  return results;
}

/**
 * Fase 1 Import (Dry-Run Preview): Memvalidasi format, menghitung PPN/PPh/FX,
 * dan mendeteksi duplikat di database tanpa menulis perubahan apapun.
 */
export async function previewBulkImport(
  input: string | Array<Record<string, unknown>>
): Promise<ImportPreviewReport> {
  const parsedRows =
    typeof input === 'string'
      ? parseCsvText(input)
      : input.map((raw, idx) => ({ rowNumber: idx + 1, raw }));

  const candidateNumbers = parsedRows
    .map((r) => String(r.raw.documentNumber || '').trim())
    .filter(Boolean);

  const existingDocs =
    candidateNumbers.length > 0
      ? await db.document.findMany({
          where: { documentNumber: { in: candidateNumbers } },
          select: { documentNumber: true },
        })
      : [];
  const existingSet = new Set(existingDocs.map((d) => d.documentNumber));

  const rows: ImportPreviewRow[] = [];
  let newCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  for (const entry of parsedRows) {
    const validated = importRowSchema.safeParse(entry.raw);
    if (!validated.success) {
      errorCount++;
      rows.push({
        rowNumber: entry.rowNumber,
        status: 'ERROR',
        errors: validated.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      continue;
    }

    const parsedDate = new Date(validated.data.documentDate);
    if (Number.isNaN(parsedDate.getTime())) {
      errorCount++;
      rows.push({
        rowNumber: entry.rowNumber,
        status: 'ERROR',
        errors: ['documentDate: Format tanggal tidak valid (gunakan YYYY-MM-DD)'],
      });
      continue;
    }

    const taxFx = calculateTaxAndFx({
      amount: validated.data.amount,
      discountAmount: validated.data.discountAmount,
      taxRate: validated.data.taxRate,
      withholdingTaxRate: validated.data.withholdingTaxRate,
      isTaxInclusive: validated.data.isTaxInclusive,
      currency: validated.data.currency,
      exchangeRate: validated.data.exchangeRate,
    });

    const isUpdate = existingSet.has(validated.data.documentNumber.trim());
    if (isUpdate) updateCount++;
    else newCount++;

    rows.push({
      rowNumber: entry.rowNumber,
      status: isUpdate ? 'UPDATE' : 'NEW',
      errors: [],
      data: validated.data,
      taxFx,
    });
  }

  return {
    summary: {
      totalRows: rows.length,
      newCount,
      updateCount,
      errorCount,
    },
    rows,
  };
}

/**
 * Fase 2 Import (Commit): Mengeksekusi upsert idempoten ke PostgreSQL beserta DocumentItem,
 * menautkan relasi parentDocumentNumber, dan mencatat SyncHistory + AuditLog.
 */
export async function commitBulkImport(
  input: string | Array<Record<string, unknown>>,
  actor: { id: string; displayName: string; ipAddress?: string },
  options?: { skipErrors?: boolean }
) {
  const preview = await previewBulkImport(input);

  if (preview.summary.errorCount > 0 && !options?.skipErrors) {
    throw new Error(
      `Terdapat ${preview.summary.errorCount} baris tidak valid. Perbaiki data atau aktifkan opsi skipErrors.`
    );
  }

  const validRows = preview.rows.filter(
    (r): r is ImportPreviewRow & { data: ImportRowInput; taxFx: TaxFxResult } =>
      r.status !== 'ERROR' && Boolean(r.data) && Boolean(r.taxFx)
  );

  const syncLog = await db.syncHistory.create({
    data: {
      syncType: 'CSV_BULK_IMPORT',
      status: 'RUNNING',
      recordsProcessed: preview.summary.totalRows,
      startedAt: new Date(),
    },
  });

  let successful = 0;
  let failed = preview.summary.errorCount;
  const linkQueue: Array<{ parentNumber: string; childId: string }> = [];

  try {
    await db.$transaction(async (tx) => {
      for (const row of validRows) {
        const d = row.data;
        const fx = row.taxFx;
        const docNumber = d.documentNumber.trim();
        const docDate = new Date(d.documentDate);

        const savedDoc = await tx.document.upsert({
          where: { documentNumber: docNumber },
          update: {
            documentType: d.documentType,
            documentDate: docDate,
            vendor: d.vendor,
            amount: d.amount,
            currency: fx.currency,
            exchangeRate: fx.exchangeRate,
            baseCurrencyAmount: fx.baseCurrencyAmount,
            taxRate: d.taxRate,
            taxAmount: fx.taxAmount,
            withholdingTaxRate: d.withholdingTaxRate,
            withholdingTax: fx.withholdingTax,
            discountAmount: fx.discountAmount,
            isTaxInclusive: d.isTaxInclusive,
            quantity: d.quantity,
            referenceNumber: d.referenceNumber || undefined,
            description: d.description || `Bulk Import (${d.documentType})`,
            externalSystem: 'CSV_IMPORT',
            externalId: `${d.documentType}:${docNumber}`,
            externalUpdatedAt: new Date(),
          },
          create: {
            documentType: d.documentType,
            documentNumber: docNumber,
            referenceNumber: d.referenceNumber || undefined,
            documentDate: docDate,
            vendor: d.vendor,
            amount: d.amount,
            currency: fx.currency,
            exchangeRate: fx.exchangeRate,
            baseCurrencyAmount: fx.baseCurrencyAmount,
            taxRate: d.taxRate,
            taxAmount: fx.taxAmount,
            withholdingTaxRate: d.withholdingTaxRate,
            withholdingTax: fx.withholdingTax,
            discountAmount: fx.discountAmount,
            isTaxInclusive: d.isTaxInclusive,
            quantity: d.quantity,
            status: DocumentStatus.SUBMITTED,
            validationStatus: ValidationStatus.PENDING,
            description: d.description || `Bulk Import (${d.documentType})`,
            externalSystem: 'CSV_IMPORT',
            externalId: `${d.documentType}:${docNumber}`,
            externalUpdatedAt: new Date(),
            createdBy: actor.displayName,
          },
        });

        if (d.itemCode && d.quantity && d.quantity > 0) {
          await tx.documentItem.create({
            data: {
              documentId: savedDoc.id,
              itemCode: d.itemCode.trim(),
              itemName: d.itemName?.trim() || d.itemCode.trim(),
              quantity: d.quantity,
              unitPrice: d.unitPrice ?? 0,
              totalPrice: d.quantity * (d.unitPrice ?? 0),
            },
          });
        }

        if (d.parentDocumentNumber) {
          linkQueue.push({
            parentNumber: d.parentDocumentNumber.trim(),
            childId: savedDoc.id,
          });
        }

        successful++;
      }
    });

    // Jalankan relasi & validator transisi di luar tx untuk dokumen yang memiliki parentDocumentNumber
    for (const link of linkQueue) {
      const parent = await db.document.findUnique({
        where: { documentNumber: link.parentNumber },
        select: { id: true },
      });
      if (parent) {
        await validateAndSaveRelationInDb({
          sourceDocumentId: parent.id,
          targetDocumentId: link.childId,
          performedBy: actor.displayName,
          actorUserId: actor.id,
          ipAddress: actor.ipAddress,
        });
      }
    }

    await db.syncHistory.update({
      where: { id: syncLog.id },
      data: {
        status: failed === 0 ? 'SUCCESS' : 'PARTIAL',
        recordsSuccessful: successful,
        recordsFailed: failed,
        completedAt: new Date(),
      },
    });

    await recordAuditLog({
      documentId: null,
      entityType: 'BULK_IMPORT',
      entityId: syncLog.id,
      action: 'BULK_IMPORT_DOCUMENTS',
      performedBy: actor.displayName,
      actorUserId: actor.id,
      ipAddress: actor.ipAddress,
      newValues: {
        totalRows: preview.summary.totalRows,
        successful,
        failed,
      },
    });

    return {
      success: true,
      syncId: syncLog.id,
      summary: {
        totalRows: preview.summary.totalRows,
        successful,
        failed,
        linkedRelations: linkQueue.length,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.syncHistory.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        errorLog: errMsg,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Mengekspor seluruh dokumen beserta status validasi, pajak, dan nilai IDR ke format CSV UTF-8 BOM.
 */
export async function exportDocumentsToCsv(): Promise<string> {
  const docs = await db.document.findMany({
    orderBy: [{ referenceNumber: 'asc' }, { documentDate: 'desc' }],
  });

  const headers = [
    'FlowID',
    'DocumentType',
    'DocumentNumber',
    'DocumentDate',
    'Vendor',
    'Currency',
    'ExchangeRate',
    'Amount',
    'TaxRate',
    'TaxAmount',
    'WithholdingTaxRate',
    'WithholdingTax',
    'BaseCurrencyAmountIDR',
    'Status',
    'ValidationStatus',
    'CreatedBy',
  ];

  const rows = docs.map((d) =>
    [
      d.referenceNumber || '',
      d.documentType,
      d.documentNumber,
      d.documentDate.toISOString().slice(0, 10),
      d.vendor || '',
      d.currency,
      Number(d.exchangeRate),
      Number(d.amount),
      Number(d.taxRate || 0),
      Number(d.taxAmount || 0),
      Number(d.withholdingTaxRate || 0),
      Number(d.withholdingTax || 0),
      Number(d.baseCurrencyAmount ?? d.amount),
      d.status,
      d.validationStatus,
      d.createdBy || '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return `\uFEFF${headers.join(',')}\n${rows.join('\n')}`;
}
