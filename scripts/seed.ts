import { Client } from 'pg';
import crypto from 'node:crypto';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:shpower123@localhost:5432/document_reference_validator?schema=public';

async function seed() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to PostgreSQL for seeding...');

  try {
    await client.query('BEGIN');

    // 1. Clean existing records (in reverse FK order)
    console.log('Cleaning existing data...');
    await client.query('DELETE FROM "validationResult"');
    await client.query('DELETE FROM "auditLog"');
    await client.query('DELETE FROM "syncHistory"');
    await client.query('DELETE FROM "documentReference"');
    await client.query('DELETE FROM "document"');
    await client.query('DELETE FROM "user"');

    // 2. Seed Users
    console.log('Seeding users...');
    const users = [
      {
        id: crypto.randomUUID(),
        email: 'demo@example.com',
        name: 'Demo User',
        password: 'password123',
        role: 'ADMIN',
        active: true,
      },
      {
        id: crypto.randomUUID(),
        email: 'budi@nexustrace.com',
        name: 'Budi Santoso',
        password: 'password123',
        role: 'PROCUREMENT',
        active: true,
      },
      {
        id: crypto.randomUUID(),
        email: 'ahmad@nexustrace.com',
        name: 'Ahmad Fauzi',
        password: 'password123',
        role: 'IT_PURCHASING',
        active: true,
      },
      {
        id: crypto.randomUUID(),
        email: 'dewi@nexustrace.com',
        name: 'Dewi Lestari',
        password: 'password123',
        role: 'FINANCE',
        active: true,
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO "user" (id, email, name, password, role, active, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [u.id, u.email, u.name, u.password, u.role, u.active]
      );
    }

    // 3. Define Document Flows & Documents
    console.log('Seeding documents and references...');
    
    interface SeedDoc {
      docType: 'BOM' | 'PR' | 'PO' | 'GR' | 'INVOICE';
      docNumber: string;
      refNumber?: string;
      docDate: string;
      vendor: string;
      amount: number;
      description: string;
      status: 'APPROVED' | 'SUBMITTED' | 'DRAFT';
      validationStatus: 'VALID' | 'FAILED' | 'PENDING';
      notes?: string;
      createdBy: string;
    }

    interface FlowDefinition {
      id: string;
      title: string;
      vendor: string;
      totalAmount: number;
      status: 'complete' | 'missing';
      manager: string;
      docs: SeedDoc[];
      references: {
        sourceNum: string;
        targetNum: string;
        amount: number;
        validationStatus: 'VALID' | 'FAILED' | 'PENDING';
        failureReason?: string;
      }[];
      validationIssues?: {
        targetDocNum: string;
        ruleName: string;
        description: string;
        passed: boolean;
        message: string;
      }[];
    }

    const flows: FlowDefinition[] = [
      {
        id: 'FLOW-8921',
        title: 'Perakitan Panel Distribusi Daya Listrik Tier-3 Data Center',
        vendor: 'PT. Datacenter Solusi Utama',
        totalAmount: 285000000,
        status: 'complete',
        manager: 'Budi Santoso',
        docs: [
          { docType: 'BOM', docNumber: 'BOM-2026-0042', docDate: '2026-01-08', vendor: 'PT. Datacenter Solusi Utama', amount: 285000000, description: 'Master list 24 komponen kelistrikan', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Budi Santoso' },
          { docType: 'PR', docNumber: 'PR-2026-0104', refNumber: 'BOM-2026-0042', docDate: '2026-01-10', vendor: 'PT. Datacenter Solusi Utama', amount: 285000000, description: 'Pengajuan pembelian panel listrik Tier-3', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Budi Santoso' },
          { docType: 'PO', docNumber: 'PO-2026-0312', refNumber: 'PR-2026-0104', docDate: '2026-01-14', vendor: 'PT. Datacenter Solusi Utama', amount: 285000000, description: 'Pesanan resmi panel distribusi daya', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Budi Santoso' },
          { docType: 'GR', docNumber: 'GRN-2026-0520', refNumber: 'PO-2026-0312', docDate: '2026-01-22', vendor: 'PT. Datacenter Solusi Utama', amount: 285000000, description: 'Penerimaan fisik barang di DC Hall 2', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Budi Santoso' },
          { docType: 'INVOICE', docNumber: 'PI-2026-1189', refNumber: 'GRN-2026-0520', docDate: '2026-01-25', vendor: 'PT. Datacenter Solusi Utama', amount: 285000000, description: 'Faktur tagihan panel Tier-3 lunas 3-Way match', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
        ],
        references: [
          { sourceNum: 'BOM-2026-0042', targetNum: 'PR-2026-0104', amount: 285000000, validationStatus: 'VALID' },
          { sourceNum: 'PR-2026-0104', targetNum: 'PO-2026-0312', amount: 285000000, validationStatus: 'VALID' },
          { sourceNum: 'PO-2026-0312', targetNum: 'GRN-2026-0520', amount: 285000000, validationStatus: 'VALID' },
          { sourceNum: 'GRN-2026-0520', targetNum: 'PI-2026-1189', amount: 285000000, validationStatus: 'VALID' },
        ],
      },
      {
        id: 'FLOW-8920',
        title: 'Pengadaan Switch Core Cisco Catalyst & Modul Fiber SFP+',
        vendor: 'PT. Jaringan Dinamika Telematika',
        totalAmount: 120000000,
        status: 'missing',
        manager: 'Ahmad Fauzi',
        docs: [
          { docType: 'BOM', docNumber: 'BOM-2026-0038', docDate: '2026-02-12', vendor: 'PT. Jaringan Dinamika Telematika', amount: 120000000, description: 'Spesifikasi teknis jaringan approved', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Ahmad Fauzi' },
          { docType: 'PO', docNumber: 'PO-2026-0488', refNumber: 'BOM-2026-0038', docDate: '2026-02-18', vendor: 'PT. Jaringan Dinamika Telematika', amount: 120000000, description: 'PO terbit langsung tanpa PR', status: 'APPROVED', validationStatus: 'FAILED', notes: 'PO diterbitkan langsung dari BOM melompati PR', createdBy: 'Ahmad Fauzi' },
          { docType: 'GR', docNumber: 'GRN-2026-0610', refNumber: 'PO-2026-0488', docDate: '2026-02-26', vendor: 'PT. Jaringan Dinamika Telematika', amount: 120000000, description: 'Barang fisik diterima tim IT Ops', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Ahmad Fauzi' },
          { docType: 'INVOICE', docNumber: 'PI-2026-2004', refNumber: 'GRN-2026-0610', docDate: '2026-03-02', vendor: 'PT. Jaringan Dinamika Telematika', amount: 120000000, description: 'Invoice masuk sistem penagihan', status: 'APPROVED', validationStatus: 'PENDING', createdBy: 'Dewi Lestari' },
        ],
        references: [
          { sourceNum: 'BOM-2026-0038', targetNum: 'PO-2026-0488', amount: 120000000, validationStatus: 'FAILED', failureReason: 'PO-2026-0488 terbit langsung dari BOM tanpa adanya dokumen PR awal.' },
          { sourceNum: 'PO-2026-0488', targetNum: 'GRN-2026-0610', amount: 120000000, validationStatus: 'VALID' },
          { sourceNum: 'GRN-2026-0610', targetNum: 'PI-2026-2004', amount: 120000000, validationStatus: 'VALID' },
        ],
        validationIssues: [
          { targetDocNum: 'PO-2026-0488', ruleName: 'RULE_PR_MANDATORY', description: 'Setiap PO wajib memiliki referensi Purchase Requisition (PR)', passed: false, message: 'PR dilewati / tidak ditemukan pada sistem ERP' },
        ],
      },
      {
        id: 'FLOW-8919',
        title: 'Pabrikasi Struktur Rangka Meja & Workstation Ergonomis',
        vendor: 'CV. Karya Megah Interior',
        totalAmount: 48200000,
        status: 'missing',
        manager: 'Rian Pratama',
        docs: [
          { docType: 'PR', docNumber: 'PR-2026-0230', docDate: '2026-02-12', vendor: 'CV. Karya Megah Interior', amount: 48200000, description: 'Pengajuan 20 unit workstation ergonomis', status: 'APPROVED', validationStatus: 'FAILED', notes: 'Dibuat tanpa melampirkan master BOM komponen', createdBy: 'Rian Pratama' },
          { docType: 'PO', docNumber: 'PO-2026-0512', refNumber: 'PR-2026-0230', docDate: '2026-02-16', vendor: 'CV. Karya Megah Interior', amount: 48200000, description: 'PO resmi 20 unit workstation', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Rian Pratama' },
          { docType: 'GR', docNumber: 'GRN-2026-0740', refNumber: 'PO-2026-0512', docDate: '2026-02-24', vendor: 'CV. Karya Megah Interior', amount: 48200000, description: 'Diterima gudang GA', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Rian Pratama' },
          { docType: 'INVOICE', docNumber: 'PI-2026-3105', refNumber: 'GRN-2026-0740', docDate: '2026-03-01', vendor: 'CV. Karya Megah Interior', amount: 48200000, description: 'Faktur penagihan vendor interior', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
        ],
        references: [
          { sourceNum: 'PR-2026-0230', targetNum: 'PO-2026-0512', amount: 48200000, validationStatus: 'VALID' },
          { sourceNum: 'PO-2026-0512', targetNum: 'GRN-2026-0740', amount: 48200000, validationStatus: 'VALID' },
          { sourceNum: 'GRN-2026-0740', targetNum: 'PI-2026-3105', amount: 48200000, validationStatus: 'VALID' },
        ],
        validationIssues: [
          { targetDocNum: 'PR-2026-0230', ruleName: 'RULE_BOM_MANDATORY', description: 'PR fabrikasi harus memiliki rujukan Bill of Materials (BOM)', passed: false, message: 'PR dibuat tanpa master BOM komponen fabrikasi' },
        ],
      },
      {
        id: 'FLOW-8918',
        title: 'Pengadaan Modul Kontrol HVAC & Sensor Suhu Otomatis Gedung',
        vendor: 'PT. Daya Prima Elektrika',
        totalAmount: 94500000,
        status: 'complete',
        manager: 'Dewi Lestari',
        docs: [
          { docType: 'BOM', docNumber: 'BOM-2026-0051', docDate: '2026-01-03', vendor: 'PT. Daya Prima Elektrika', amount: 94500000, description: 'BOM modul sensor & kabel kontrol', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
          { docType: 'PR', docNumber: 'PR-2026-0155', refNumber: 'BOM-2026-0051', docDate: '2026-01-05', vendor: 'PT. Daya Prima Elektrika', amount: 94500000, description: 'PR otomatis modul otomatisasi gedung', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
          { docType: 'PO', docNumber: 'PO-2026-0220', refNumber: 'PR-2026-0155', docDate: '2026-01-09', vendor: 'PT. Daya Prima Elektrika', amount: 94500000, description: 'PO resmi sensor HVAC', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
          { docType: 'GR', docNumber: 'GRN-2026-0410', refNumber: 'PO-2026-0220', docDate: '2026-01-15', vendor: 'PT. Daya Prima Elektrika', amount: 94500000, description: 'Barang diinspeksi QA gudang', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
          { docType: 'INVOICE', docNumber: 'PI-2026-0922', refNumber: 'GRN-2026-0410', docDate: '2026-01-18', vendor: 'PT. Daya Prima Elektrika', amount: 94500000, description: 'Invoice diverifikasi tim Akuntansi', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Dewi Lestari' },
        ],
        references: [
          { sourceNum: 'BOM-2026-0051', targetNum: 'PR-2026-0155', amount: 94500000, validationStatus: 'VALID' },
          { sourceNum: 'PR-2026-0155', targetNum: 'PO-2026-0220', amount: 94500000, validationStatus: 'VALID' },
          { sourceNum: 'PO-2026-0220', targetNum: 'GRN-2026-0410', amount: 94500000, validationStatus: 'VALID' },
          { sourceNum: 'GRN-2026-0410', targetNum: 'PI-2026-0922', amount: 94500000, validationStatus: 'VALID' },
        ],
      },
      {
        id: 'FLOW-8917',
        title: 'Perakitan Server Blade & Penyediaan Komponen SSD NVMe Enterprise',
        vendor: 'PT. Sentra Komputindo Jaya',
        totalAmount: 145000000,
        status: 'missing',
        manager: 'Hendro Prasetyo',
        docs: [
          { docType: 'BOM', docNumber: 'BOM-2026-0029', docDate: '2026-01-06', vendor: 'PT. Sentra Komputindo Jaya', amount: 145000000, description: 'BOM server blade storage', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Hendro Prasetyo' },
          { docType: 'PR', docNumber: 'PR-2026-0188', refNumber: 'BOM-2026-0029', docDate: '2026-01-10', vendor: 'PT. Sentra Komputindo Jaya', amount: 145000000, description: 'PR alokasi IT Engineering', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Hendro Prasetyo' },
          { docType: 'PO', docNumber: 'PO-2026-0290', refNumber: 'PR-2026-0188', docDate: '2026-01-15', vendor: 'PT. Sentra Komputindo Jaya', amount: 145000000, description: 'PO komponen server', status: 'APPROVED', validationStatus: 'VALID', createdBy: 'Hendro Prasetyo' },
          { docType: 'INVOICE', docNumber: 'PI-2026-1402', refNumber: 'PO-2026-0290', docDate: '2026-02-05', vendor: 'PT. Sentra Komputindo Jaya', amount: 145000000, description: 'Tagihan vendor ditahan tanpa GRN', status: 'SUBMITTED', validationStatus: 'FAILED', notes: 'Surat tanda terima GRN gudang belum ada', createdBy: 'Dewi Lestari' },
        ],
        references: [
          { sourceNum: 'BOM-2026-0029', targetNum: 'PR-2026-0188', amount: 145000000, validationStatus: 'VALID' },
          { sourceNum: 'PR-2026-0188', targetNum: 'PO-2026-0290', amount: 145000000, validationStatus: 'VALID' },
          { sourceNum: 'PO-2026-0290', targetNum: 'PI-2026-1402', amount: 145000000, validationStatus: 'FAILED', failureReason: 'Invoice tagihan sudah diajukan, namun GRN fisik belum diunggah.' },
        ],
        validationIssues: [
          { targetDocNum: 'PI-2026-1402', ruleName: 'RULE_GRN_BEFORE_INVOICE', description: 'Penerimaan fisik barang (GRN) wajib terverifikasi sebelum faktur disetujui', passed: false, message: 'Surat tanda terima GRN gudang belum ditemukan' },
        ],
      },
    ];

    const docIdMap = new Map<string, string>();

    // Insert all documents
    for (const flow of flows) {
      for (const d of flow.docs) {
        const id = crypto.randomUUID();
        docIdMap.set(d.docNumber, id);

        await client.query(
          `INSERT INTO "document" (
            id, "documentType", "documentNumber", "referenceNumber",
            "documentDate", vendor, amount, currency, description,
            notes, status, "validationStatus", "createdBy", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
          [
            id,
            d.docType,
            d.docNumber,
            d.refNumber || null,
            new Date(d.docDate).toISOString(),
            d.vendor,
            d.amount,
            'IDR',
            d.description,
            d.notes || null,
            d.status,
            d.validationStatus,
            d.createdBy,
          ]
        );

        // Add Audit Log
        await client.query(
          `INSERT INTO "auditLog" (id, "documentId", action, "performedBy", details, "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            crypto.randomUUID(),
            id,
            'DOCUMENT_CREATED',
            d.createdBy,
            `Dokumen ${d.docNumber} (${d.docType}) berhasil dibuat dengan nilai IDR ${d.amount.toLocaleString()}`,
          ]
        );
      }
    }

    // Insert document references
    for (const flow of flows) {
      for (const ref of flow.references) {
        const sourceId = docIdMap.get(ref.sourceNum);
        const targetId = docIdMap.get(ref.targetNum);

        if (!sourceId || !targetId) {
          console.warn(`Skipping reference ${ref.sourceNum} -> ${ref.targetNum}: missing doc ID`);
          continue;
        }

        await client.query(
          `INSERT INTO "documentReference" (
            id, "sourceDocumentId", "targetDocumentId", "referenceDate",
            "itemCount", amount, "validationStatus", "failureReason",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, NOW(), NOW())`,
          [
            crypto.randomUUID(),
            sourceId,
            targetId,
            1,
            ref.amount,
            ref.validationStatus,
            ref.failureReason || null,
          ]
        );
      }

      // Insert validation issues if any
      if (flow.validationIssues) {
        for (const vi of flow.validationIssues) {
          const docId = docIdMap.get(vi.targetDocNum);
          if (docId) {
            await client.query(
              `INSERT INTO "validationResult" (
                id, "documentId", "ruleName", "ruleDescription",
                passed, message, severity, "createdAt"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
              [
                crypto.randomUUID(),
                docId,
                vi.ruleName,
                vi.description,
                vi.passed,
                vi.message,
                vi.passed ? 'INFO' : 'ERROR',
              ]
            );
          }
        }
      }
    }

    // 4. Seed Sync History
    console.log('Seeding sync history...');
    await client.query(
      `INSERT INTO "syncHistory" (
        id, "syncType", status, "recordsProcessed", "recordsSuccessful",
        "recordsFailed", "errorLog", "startedAt", "completedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '58 minute')`,
      [
        crypto.randomUUID(),
        'ACCURATE_ERP_IMPORT',
        'SUCCESS',
        24,
        24,
        0,
        null,
      ]
    );

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed, rolled back:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
