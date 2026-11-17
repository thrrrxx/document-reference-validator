import { DocumentType } from '@prisma/client';

export type SupportedErpSystem = 'ACCURATE' | 'YONYOU' | 'SAP' | 'CSV_IMPORT';

export interface NormalizedErpItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  uom?: string;
}

export interface NormalizedErpDocument {
  externalSystem: SupportedErpSystem;
  externalId: string;
  documentType: DocumentType;
  documentNumber: string;
  referenceNumber?: string;
  parentDocumentNumber?: string;
  documentDate: Date;
  vendor: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  taxRate?: number;
  taxAmount?: number;
  withholdingTaxRate?: number;
  discountAmount?: number;
  isTaxInclusive?: boolean;
  description?: string;
  externalUpdatedAt?: Date;
  items: NormalizedErpItem[];
}

export interface ErpFetchOptions {
  page?: number;
  pageSize?: number;
  updatedAfter?: Date;
}

export interface ErpConnector {
  readonly systemName: SupportedErpSystem;
  fetchDocuments(
    docType: 'PO' | 'GR' | 'PI',
    options?: ErpFetchOptions
  ): Promise<{
    documents: NormalizedErpDocument[];
    hasMore: boolean;
  }>;
  pushDocument(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<unknown>;
}
