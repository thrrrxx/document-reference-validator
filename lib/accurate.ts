import { db } from '@/lib/db';
import { DocumentType, DocumentStatus, ValidationStatus } from '@prisma/client';

/**
 * Konfigurasi Integrasi Accurate Online (AOL)
 * Berdasarkan dokumentasi resmi: https://accurate.id/api-integration/api-example/
 */
export interface AccurateConfig {
  accessToken: string;
  dbId?: number | string;
  host?: string;
}

export interface AccurateDbItem {
  id: number;
  alias: string;
  admin: boolean;
  trial: boolean;
  licenseEnd?: string;
  accessibleUntil?: string;
  [key: string]: unknown;
}

export interface AccurateOpenDbResponse {
  s: boolean;
  d: string[];
  session: string;
  host: string;
  admin: boolean;
  dataVersion?: number;
  licenseEnd?: string;
  accessibleUntil?: string;
  trial?: boolean;
}

export interface AccurateListResponse<T = Record<string, unknown>> {
  s: boolean;
  d: T[];
  sp?: {
    page: number;
    pageSize: number;
    pageCount: number;
    rowCount: number;
    start?: number;
    limit?: number | null;
  };
}

export interface AccurateDetailResponse<T = Record<string, unknown>> {
  s: boolean;
  d: T;
  r?: Record<string, unknown>;
}

// In-memory cache untuk session dan host agar tidak membuka koneksi DB Accurate berulang-ulang
let cachedSession: {
  session: string;
  host: string;
  dbId: string | number;
  expiresAt: number;
} | null = null;

/**
 * Mendapatkan konfigurasi token & dbId dari environment
 */
export function getAccurateEnvConfig(): AccurateConfig {
  const accessToken = process.env.ACCURATE_ACCESS_TOKEN || '';
  const dbId = process.env.ACCURATE_DB_ID || '';
  const host = process.env.ACCURATE_API_HOST || 'https://public.accurate.id';

  return {
    accessToken,
    dbId,
    host,
  };
}

/**
 * 1. Mendapatkan daftar database Accurate Online
 * Endpoint: GET https://account.accurate.id/api/db-list.do
 * Header: Authorization: Bearer <accessToken>
 */
export async function getAccurateDbList(customToken?: string): Promise<AccurateDbItem[]> {
  const token = customToken || getAccurateEnvConfig().accessToken;
  if (!token) {
    throw new Error('ACCURATE_ACCESS_TOKEN tidak ditemukan di environment atau parameter');
  }

  const url = 'https://account.accurate.id/api/db-list.do';
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    // Pastikan mengikuti redirect HTTP 308 sesuai dokumentasi Accurate
    redirect: 'follow',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengambil daftar database Accurate (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  if (!json.s) {
    throw new Error(`Accurate API Error (db-list): ${JSON.stringify(json.d || json)}`);
  }

  return (json.d as AccurateDbItem[]) || [];
}

/**
 * 2. Mendapatkan session dan host dari Database (Open DB)
 * Endpoint: GET https://account.accurate.id/api/open-db.do?id=<id>
 * Header: Authorization: Bearer <accessToken>
 * 
 * Host yang dikembalikan menentukan prefix URL API Accurate berikutnya.
 */
export async function openAccurateDb(
  dbIdParam?: string | number,
  customToken?: string
): Promise<AccurateOpenDbResponse> {
  const token = customToken || getAccurateEnvConfig().accessToken;
  const dbId = dbIdParam || getAccurateEnvConfig().dbId;

  if (!token) {
    throw new Error('ACCURATE_ACCESS_TOKEN tidak ditemukan');
  }
  if (!dbId) {
    throw new Error('ID Database Accurate (dbId) wajib diisi atau diset di ACCURATE_DB_ID');
  }

  // Gunakan cache session jika masih berlaku (misalnya 15 menit)
  if (
    cachedSession &&
    cachedSession.dbId === dbId &&
    cachedSession.expiresAt > Date.now()
  ) {
    return {
      s: true,
      d: ['Menggunakan session aktif dari cache'],
      session: cachedSession.session,
      host: cachedSession.host,
      admin: true,
    };
  }

  const url = `https://account.accurate.id/api/open-db.do?id=${encodeURIComponent(dbId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membuka database Accurate (${res.status}): ${errorText}`);
  }

  const json: AccurateOpenDbResponse = await res.json();
  if (!json.s || !json.session) {
    throw new Error(`Accurate API Error (open-db): ${JSON.stringify(json.d || json)}`);
  }

  // Simpan ke cache selama 20 menit
  cachedSession = {
    session: json.session,
    host: json.host || 'https://public.accurate.id',
    dbId,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return json;
}

/**
 * 3. Base Caller untuk API Accurate (Transaksi & Master Data)
 * Menyertakan Header:
 * - Authorization: Bearer <accessToken>
 * - X-Session-ID: <session>
 * Dan prefix URL: <host>/accurate/api/<path>
 */
export async function fetchAccurateApi<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    params?: Record<string, string | number | boolean | undefined>;
    body?: Record<string, unknown> | URLSearchParams;
    customToken?: string;
    customDbId?: string | number;
  } = {}
): Promise<T> {
  const token = options.customToken || getAccurateEnvConfig().accessToken;
  const dbSession = await openAccurateDb(options.customDbId, token);

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Pastikan URL diawali dengan host yang didapat dari open-db
  const baseUrl = `${dbSession.host.replace(/\/$/, '')}/accurate/api${cleanPath}`;

  const url = new URL(baseUrl);
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-Session-ID': dbSession.session,
    Accept: 'application/json',
  };

  let requestBody: string | undefined;

  if (options.method === 'POST') {
    if (options.body instanceof URLSearchParams) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      requestBody = options.body.toString();
    } else if (options.body) {
      // Accurate Online menerima URLSearchParams atau form-encoded/JSON
      const formParams = new URLSearchParams();
      Object.entries(options.body).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
        }
      });
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      requestBody = formParams.toString();
    }
  }

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: requestBody,
    redirect: 'follow', // Mengatasi HTTP 308 jika Accurate memindahkan host
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Jika session kadaluarsa (HTTP 401 / session invalid), reset cache
    if (res.status === 401 || errorText.toLowerCase().includes('session')) {
      cachedSession = null;
    }
    throw new Error(`Accurate API call failed (${res.status}) on ${cleanPath}: ${errorText}`);
  }

  return (await res.json()) as T;
}

/**
 * 4. Helper API: Barang & Jasa (Item)
 * Sesuai dokumentasi:
 * - List: GET /accurate/api/item/list.do
 * - Detail: GET /accurate/api/item/detail.do?id=...
 * - Save: POST /accurate/api/item/save.do
 */
export async function listAccurateItems(params?: {
  fields?: string;
  itemType?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryParams: Record<string, string | number> = {
    fields: params?.fields || 'id,name,no,itemType,unitPrice',
    'sp.page': params?.page || 1,
    'sp.pageSize': params?.pageSize || 50,
  };

  if (params?.itemType) {
    queryParams['filter.itemType'] = params.itemType;
  }

  return fetchAccurateApi<AccurateListResponse<{
    id: number;
    no: string;
    name: string;
    itemType?: string;
    unitPrice?: number;
    [key: string]: unknown;
  }>>('/item/list.do', {
    method: 'GET',
    params: queryParams,
  });
}

export async function getAccurateItemDetail(id: number | string) {
  return fetchAccurateApi<AccurateDetailResponse>('/item/detail.do', {
    method: 'GET',
    params: { id },
  });
}

export async function saveAccurateItem(item: {
  name: string;
  itemType: 'INVENTORY' | 'NON_INVENTORY' | 'SERVICE' | 'GROUP';
  no?: string;
  unitPrice?: number;
  notes?: string;
  id?: number | string; // Jika update data
}) {
  return fetchAccurateApi<AccurateDetailResponse>('/item/save.do', {
    method: 'POST',
    body: item as unknown as Record<string, unknown>,
  });
}

/**
 * 5. Helper API: Transaksi Pesanan Pembelian (Purchase Order)
 * Endpoint: /accurate/api/purchase-order/list.do
 */
export async function listAccuratePurchaseOrders(params?: {
  page?: number;
  pageSize?: number;
}) {
  return fetchAccurateApi<AccurateListResponse<{
    id: number;
    number: string;
    transDate: string;
    vendorName?: string;
    totalAmount?: number;
    status?: string;
    [key: string]: unknown;
  }>>('/purchase-order/list.do', {
    method: 'GET',
    params: {
      fields: 'id,number,transDate,vendor,totalAmount,status,description',
      'sp.page': params?.page || 1,
      'sp.pageSize': params?.pageSize || 50,
    },
  });
}

/**
 * 6. Helper API: Faktur Pembelian (Purchase Invoice)
 * Endpoint: /accurate/api/purchase-invoice/list.do
 */
export async function listAccuratePurchaseInvoices(params?: {
  page?: number;
  pageSize?: number;
}) {
  return fetchAccurateApi<AccurateListResponse<{
    id: number;
    number: string;
    transDate: string;
    vendorName?: string;
    totalAmount?: number;
    [key: string]: unknown;
  }>>('/purchase-invoice/list.do', {
    method: 'GET',
    params: {
      fields: 'id,number,transDate,vendor,totalAmount,description',
      'sp.page': params?.page || 1,
      'sp.pageSize': params?.pageSize || 50,
    },
  });
}

/**
 * 7. Helper API: Penerimaan Barang (Goods Receipt / Receive Item)
 * Endpoint: /accurate/api/receive-item/list.do
 */
export async function listAccurateReceiveItems(params?: {
  page?: number;
  pageSize?: number;
}) {
  return fetchAccurateApi<AccurateListResponse<{
    id: number;
    number: string;
    transDate: string;
    vendorName?: string;
    [key: string]: unknown;
  }>>('/receive-item/list.do', {
    method: 'GET',
    params: {
      fields: 'id,number,transDate,vendor,description',
      'sp.page': params?.page || 1,
      'sp.pageSize': params?.pageSize || 50,
    },
  });
}

/**
 * =========================================================================
 * 8. ENGINE SINKRONISASI ACCURATE KE DATABASE POSTGRESQL (PRISMA)
 * =========================================================================
 * Menarik data Purchase Orders, Receive Items, Purchase Invoices & Items dari Accurate
 * dan melakukan upsert ke tabel `document`, `syncHistory`, dan `auditLog`.
 */
export async function syncAccurateToPostgre(options?: {
  syncTypes?: ('PO' | 'GR' | 'INVOICE' | 'ITEMS')[];
  performedBy?: string;
}) {
  const syncTypes = options?.syncTypes || ['PO', 'GR', 'INVOICE'];
  const performedBy = options?.performedBy || 'System Accurate Sync';

  const syncLog = await db.syncHistory.create({
    data: {
      syncType: `ACCURATE_IMPORT_${syncTypes.join('_')}`,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // A. Sinkronisasi Purchase Orders (PO)
    if (syncTypes.includes('PO')) {
      try {
        const poData = await listAccuratePurchaseOrders({ page: 1, pageSize: 50 });
        if (poData.s && Array.isArray(poData.d)) {
          for (const item of poData.d) {
            totalProcessed++;
            try {
              const docNum = item.number || `PO-AOL-${item.id}`;
              const docDate = item.transDate ? new Date(item.transDate) : new Date();
              const amount = Number(item.totalAmount) || 0;
              const vendor = typeof item.vendor === 'object' && item.vendor
                ? (item.vendor as { name?: string }).name || 'Accurate Vendor'
                : String(item.vendor || item.vendorName || 'Accurate Vendor');

              await db.document.upsert({
                where: { documentNumber: docNum },
                update: {
                  documentType: DocumentType.PO,
                  documentDate: docDate,
                  vendor,
                  amount,
                  description: (item.description as string) || `PO imported from Accurate Online #${item.id}`,
                  updatedAt: new Date(),
                },
                create: {
                  documentType: DocumentType.PO,
                  documentNumber: docNum,
                  documentDate: docDate,
                  vendor,
                  amount,
                  currency: 'IDR',
                  status: DocumentStatus.SUBMITTED,
                  validationStatus: ValidationStatus.PENDING,
                  description: (item.description as string) || `PO imported from Accurate Online #${item.id}`,
                  createdBy: performedBy,
                },
              });
              totalSuccessful++;
            } catch (err: unknown) {
              totalFailed++;
              errors.push(`Gagal simpan PO ${item.number}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`Error fetch PO AOL: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // B. Sinkronisasi Penerimaan Barang (GR / Goods Receipt)
    if (syncTypes.includes('GR')) {
      try {
        const grData = await listAccurateReceiveItems({ page: 1, pageSize: 50 });
        if (grData.s && Array.isArray(grData.d)) {
          for (const item of grData.d) {
            totalProcessed++;
            try {
              const docNum = item.number || `GR-AOL-${item.id}`;
              const docDate = item.transDate ? new Date(item.transDate) : new Date();
              const vendor = typeof item.vendor === 'object' && item.vendor
                ? (item.vendor as { name?: string }).name || 'Accurate Vendor'
                : String(item.vendor || item.vendorName || 'Accurate Vendor');

              await db.document.upsert({
                where: { documentNumber: docNum },
                update: {
                  documentType: DocumentType.GR,
                  documentDate: docDate,
                  vendor,
                  description: (item.description as string) || `Goods Receipt dari Accurate #${item.id}`,
                  updatedAt: new Date(),
                },
                create: {
                  documentType: DocumentType.GR,
                  documentNumber: docNum,
                  documentDate: docDate,
                  vendor,
                  amount: 0,
                  currency: 'IDR',
                  status: DocumentStatus.APPROVED,
                  validationStatus: ValidationStatus.PENDING,
                  description: (item.description as string) || `Goods Receipt dari Accurate #${item.id}`,
                  createdBy: performedBy,
                },
              });
              totalSuccessful++;
            } catch (err: unknown) {
              totalFailed++;
              errors.push(`Gagal simpan GR ${item.number}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`Error fetch GR AOL: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // C. Sinkronisasi Faktur Pembelian (INVOICE)
    if (syncTypes.includes('INVOICE')) {
      try {
        const invData = await listAccuratePurchaseInvoices({ page: 1, pageSize: 50 });
        if (invData.s && Array.isArray(invData.d)) {
          for (const item of invData.d) {
            totalProcessed++;
            try {
              const docNum = item.number || `INV-AOL-${item.id}`;
              const docDate = item.transDate ? new Date(item.transDate) : new Date();
              const amount = Number(item.totalAmount) || 0;
              const vendor = typeof item.vendor === 'object' && item.vendor
                ? (item.vendor as { name?: string }).name || 'Accurate Vendor'
                : String(item.vendor || item.vendorName || 'Accurate Vendor');

              await db.document.upsert({
                where: { documentNumber: docNum },
                update: {
                  documentType: DocumentType.INVOICE,
                  documentDate: docDate,
                  vendor,
                  amount,
                  description: (item.description as string) || `Invoice imported from Accurate #${item.id}`,
                  updatedAt: new Date(),
                },
                create: {
                  documentType: DocumentType.INVOICE,
                  documentNumber: docNum,
                  documentDate: docDate,
                  vendor,
                  amount,
                  currency: 'IDR',
                  status: DocumentStatus.SUBMITTED,
                  validationStatus: ValidationStatus.PENDING,
                  description: (item.description as string) || `Invoice imported from Accurate #${item.id}`,
                  createdBy: performedBy,
                },
              });
              totalSuccessful++;
            } catch (err: unknown) {
              totalFailed++;
              errors.push(`Gagal simpan Invoice ${item.number}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`Error fetch Invoice AOL: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Update status sync history
    const isSuccess = totalFailed === 0;
    await db.syncHistory.update({
      where: { id: syncLog.id },
      data: {
        status: isSuccess ? 'SUCCESS' : (totalSuccessful > 0 ? 'PARTIAL' : 'FAILED'),
        recordsProcessed: totalProcessed,
        recordsSuccessful: totalSuccessful,
        recordsFailed: totalFailed,
        errorLog: errors.length > 0 ? errors.join('\n') : null,
        completedAt: new Date(),
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
