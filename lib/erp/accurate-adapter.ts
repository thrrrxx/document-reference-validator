import { DocumentType } from '@prisma/client';
import {
  fetchAccurateApi,
  listAccuratePurchaseInvoices,
  listAccuratePurchaseOrders,
  listAccurateReceiveItems,
} from '@/lib/accurate';
import {
  ErpConnector,
  ErpFetchOptions,
  NormalizedErpDocument,
  NormalizedErpItem,
} from '@/lib/erp/types';

function extractVendorName(item: Record<string, unknown>): string {
  if (typeof item.vendor === 'object' && item.vendor !== null) {
    return String((item.vendor as { name?: string }).name || 'Accurate Vendor');
  }
  return String(item.vendor || item.vendorName || 'Accurate Vendor');
}

function extractItems(raw: Record<string, unknown>): NormalizedErpItem[] {
  const detailLines = raw.detailItem;
  if (!Array.isArray(detailLines)) return [];

  return detailLines
    .map((line: Record<string, unknown>) => {
      const itemObj = (line.item as Record<string, unknown>) || {};
      const itemCode = String(itemObj.no || line.itemNo || line.itemId || 'ITEM-AOL');
      const itemName = String(itemObj.name || line.detailName || itemCode);
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      const totalPrice = Number(line.totalPrice) || quantity * unitPrice;
      const uom =
        typeof line.itemUnit === 'object' && line.itemUnit
          ? String((line.itemUnit as { name?: string }).name || 'PCS')
          : 'PCS';
      return { itemCode, itemName, quantity, unitPrice, totalPrice, uom };
    })
    .filter((i) => i.quantity > 0);
}

/**
 * Implementasi ErpConnector untuk Accurate Online (AOL) dengan dukungan pagination
 * dan normalisasi tipe faktur ke `DocumentType.PI`.
 */
export class AccurateAdapter implements ErpConnector {
  readonly systemName = 'ACCURATE' as const;

  async fetchDocuments(
    docType: 'PO' | 'GR' | 'PI',
    options?: ErpFetchOptions
  ): Promise<{ documents: NormalizedErpDocument[]; hasMore: boolean }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;

    let response;
    let mappedType: DocumentType;

    if (docType === 'PO') {
      response = await listAccuratePurchaseOrders({ page, pageSize });
      mappedType = DocumentType.PO;
    } else if (docType === 'GR') {
      response = await listAccurateReceiveItems({ page, pageSize });
      mappedType = DocumentType.GR;
    } else {
      response = await listAccuratePurchaseInvoices({ page, pageSize });
      mappedType = DocumentType.PI;
    }

    const rows = Array.isArray(response.d) ? response.d : [];
    const documents: NormalizedErpDocument[] = rows.map((raw) => {
      const item = raw as Record<string, unknown>;
      const externalId = String(item.id || item.number || '');
      const docNumber = String(item.number || `${docType}-AOL-${externalId}`);
      const docDate = item.transDate ? new Date(String(item.transDate)) : new Date();
      const parentDoc =
        (item.poNumber as string) ||
        (item.receiveNumber as string) ||
        undefined;

      return {
        externalSystem: 'ACCURATE',
        externalId,
        documentType: mappedType,
        documentNumber: docNumber,
        referenceNumber: (item.referenceNumber as string) || undefined,
        parentDocumentNumber: parentDoc,
        documentDate: Number.isNaN(docDate.getTime()) ? new Date() : docDate,
        vendor: extractVendorName(item),
        amount: Number(item.totalAmount) || 0,
        currency: String((item.currency as { code?: string })?.code || item.currencyCode || 'IDR'),
        exchangeRate: Number(item.rate) || 1,
        taxAmount: Number(item.taxAmount) || 0,
        description:
          (item.description as string) ||
          `${docType} imported from Accurate Online #${externalId}`,
        externalUpdatedAt: item.lastUpdate
          ? new Date(String(item.lastUpdate))
          : undefined,
        items: extractItems(item),
      };
    });

    const totalPages = response.sp?.pageCount ?? 1;
    return {
      documents,
      hasMore: page < totalPages && rows.length > 0,
    };
  }

  async pushDocument(endpoint: string, payload: Record<string, unknown>) {
    return fetchAccurateApi(endpoint, { method: 'POST', body: payload });
  }
}
