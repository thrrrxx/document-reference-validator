export type DocumentFlowCode = 'BOM' | 'PR' | 'PO' | 'GRN' | 'PI' | 'PP';

export interface DocumentFlowStep {
  step: number;
  code: DocumentFlowCode;
  label: string;
  docNumber?: string;
  status: 'present' | 'missing';
  date?: string;
  notes?: string;
}

export interface ReferenceItem {
  id: string; // e.g. 'FLOW-8921'
  title: string;
  vendor: string;
  totalAmount: string;
  status: 'complete' | 'missing';
  flowSteps: DocumentFlowStep[];
  missingDoc?: string;
  issueDetails?: string;
  validatedAt: string;
  managedBy?: string;
}

export type DocumentFlowItem = ReferenceItem;

export const FLOW_PIPELINE_ORDER: { code: DocumentFlowCode; label: string; description: string }[] = [
  { code: 'BOM', label: 'Bill of Materials', description: 'Daftar rincian material & kebutuhan komponen awal' },
  { code: 'PR', label: 'Purchase Requisition', description: 'Pengajuan permintaan pembelian kebutuhan material' },
  { code: 'PO', label: 'Purchase Order', description: 'Penerbitan pesanan pembelian resmi kepada vendor' },
  { code: 'GRN', label: 'Goods Received Note', description: 'Surat tanda penerimaan barang fisik di gudang' },
  { code: 'PI', label: 'Purchase Invoice', description: 'Faktur tagihan pembayaran yang diajukan vendor' },
  { code: 'PP', label: 'Payment Payment', description: 'Dokumen / bukti proses pembayaran lunas ke vendor' },
];

export const MOCK_REFERENCES: ReferenceItem[] = [
  {
    id: 'FLOW-8921',
    title: 'Perakitan Panel Distribusi Daya Listrik Tier-3 Data Center',
    vendor: 'PT. Datacenter Solusi Utama',
    totalAmount: 'Rp 285.000.000',
    status: 'complete',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0042', status: 'present', date: '08 Jan 2026', notes: 'Master list 24 komponen kelistrikan tervalidasi' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0104', status: 'present', date: '10 Jan 2026', notes: 'Approved Head of Infrastructure' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0312', status: 'present', date: '14 Jan 2026', notes: 'PO diterbitkan ke vendor rekanan' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0520', status: 'present', date: '22 Jan 2026', notes: 'Diterima utuh di DC Hall 2' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-1189', status: 'present', date: '25 Jan 2026', notes: 'Faktur pajak & invoice 3-Way matched' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-0811', status: 'present', date: '30 Jan 2026', notes: 'Pelunasan transfer bank terverifikasi' },
    ],
    validatedAt: '10 mins ago',
    managedBy: 'Budi Santoso (Procurement Lead)',
  },
  {
    id: 'FLOW-8920',
    title: 'Pengadaan Switch Core Cisco Catalyst & Modul Fiber SFP+',
    vendor: 'PT. Jaringan Dinamika Telematika',
    totalAmount: 'Rp 120.000.000',
    status: 'missing',
    missingDoc: 'PR (Purchase Requisition)',
    issueDetails: 'PO-2026-0488 terbit langsung dari BOM tanpa adanya dokumen PR awal. Seharusnya alur wajib memiliki PR yang di-approve sebelum PO dibuat.',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0038', status: 'present', date: '12 Feb 2026', notes: 'Spesifikasi teknis jaringan approved' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', status: 'missing', notes: 'PR dilewati / tidak ditemukan pada sistem ERP' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0488', status: 'present', date: '18 Feb 2026', notes: 'PO terbit langsung tanpa PR' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0610', status: 'present', date: '26 Feb 2026', notes: 'Barang fisik diterima tim IT Ops' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-2004', status: 'present', date: '02 Mar 2026', notes: 'Invoice masuk sistem penagihan' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-1502', status: 'present', date: '06 Mar 2026', notes: 'Pembayaran tertahan validasi PR' },
    ],
    validatedAt: '35 mins ago',
    managedBy: 'Ahmad Fauzi (IT Purchasing)',
  },
  {
    id: 'FLOW-8919',
    title: 'Pabrikasi Struktur Rangka Meja & Workstation Ergonomis',
    vendor: 'CV. Karya Megah Interior',
    totalAmount: 'Rp 48.200.000',
    status: 'missing',
    missingDoc: 'BOM (Bill of Materials)',
    issueDetails: 'PR-2026-0230 dibuat tanpa melampirkan master BOM komponen fabrikasi meja kerja, melanggar urutan dokumen baku (BOM → PR).',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', status: 'missing', notes: 'Master list komponen fabrikasi belum diinput' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0230', status: 'present', date: '12 Feb 2026', notes: 'Diajukan bagian General Affairs' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0512', status: 'present', date: '16 Feb 2026', notes: 'PO resmi 20 unit workstation' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0740', status: 'present', date: '24 Feb 2026', notes: 'Diterima gudang GA' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-3105', status: 'present', date: '01 Mar 2026', notes: 'Faktur penagihan vendor' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-2210', status: 'present', date: '05 Mar 2026', notes: 'Bukti transfer kas' },
    ],
    validatedAt: '2 hours ago',
    managedBy: 'Rian Pratama (General Affairs)',
  },
  {
    id: 'FLOW-8918',
    title: 'Pengadaan Modul Kontrol HVAC & Sensor Suhu Otomatis Gedung',
    vendor: 'PT. Daya Prima Elektrika',
    totalAmount: 'Rp 94.500.000',
    status: 'complete',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0051', status: 'present', date: '03 Jan 2026', notes: 'BOM modul sensor & kabel kontrol' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0155', status: 'present', date: '05 Jan 2026', notes: 'PR otomatis dari modul ERP' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0220', status: 'present', date: '09 Jan 2026', notes: 'PO resmi telah terbit' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0410', status: 'present', date: '15 Jan 2026', notes: 'Barang diinspeksi QA gudang' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-0922', status: 'present', date: '18 Jan 2026', notes: 'Invoice diverifikasi tim Akuntansi' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-0640', status: 'present', date: '22 Jan 2026', notes: 'Transfer via virtual account B2B' },
    ],
    validatedAt: 'Yesterday',
    managedBy: 'Dewi Lestari (Finance & Accounting)',
  },
  {
    id: 'FLOW-8917',
    title: 'Perakitan Server Blade & Penyediaan Komponen SSD NVMe Enterprise',
    vendor: 'PT. Sentra Komputindo Jaya',
    totalAmount: 'Rp 145.000.000',
    status: 'missing',
    missingDoc: 'GRN (Goods Received Note)',
    issueDetails: 'Invoice tagihan PI-2026-1402 sudah diajukan vendor, namun dokumen tanda terima barang (GRN) fisik di gudang belum diunggah atau diverifikasi.',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0029', status: 'present', date: '06 Jan 2026', notes: 'BOM server blade storage' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0188', status: 'present', date: '10 Jan 2026', notes: 'PR alokasi IT Engineering' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0290', status: 'present', date: '15 Jan 2026', notes: 'PO komponen server' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', status: 'missing', notes: 'Surat tanda terima GRN gudang belum ada' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-1402', status: 'present', date: '05 Feb 2026', notes: 'Tagihan vendor ditahan' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-0955', status: 'present', date: '10 Feb 2026', notes: 'Draft pembayaran disiapkan' },
    ],
    validatedAt: '1 day ago',
    managedBy: 'Hendro Prasetyo (Procurement Officer)',
  },
  {
    id: 'FLOW-8916',
    title: 'Pengadaan Spare Part Mekanikal & Kelistrikan Generator Set 50kVA',
    vendor: 'PT. Mega Elektrika Mandiri',
    totalAmount: 'Rp 65.000.000',
    status: 'complete',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0063', status: 'present', date: '01 Jan 2026', notes: 'BOM maintenance rutin genset' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0090', status: 'present', date: '02 Jan 2026', notes: 'PR perawatan fasilitas kantor' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0180', status: 'present', date: '06 Jan 2026', notes: 'PO paket part resmi' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0330', status: 'present', date: '14 Jan 2026', notes: 'Part diinspeksi teknisi gedung' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-0741', status: 'present', date: '20 Jan 2026', notes: 'Invoice disetujui tanpa selisih' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-0511', status: 'present', date: '25 Jan 2026', notes: 'Bukti transfer kliring BI-FAST' },
    ],
    validatedAt: '2 days ago',
    managedBy: 'Siti Rahma (Audit & Compliance)',
  },
  {
    id: 'FLOW-8915',
    title: 'Pengadaan Laptop ThinkPad & Monitor IPS 27-inch Divisi Dev',
    vendor: 'PT. Sentra Komputindo Jaya',
    totalAmount: 'Rp 92.000.000',
    status: 'missing',
    missingDoc: 'PP (Payment Payment)',
    issueDetails: 'Alur dokumen sudah mencapai tahap Purchase Invoice (PI-2026-3890), namun bukti pembayaran akhir (Payment Payment / PP) belum selesai diproses atau belum diunggah.',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0077', status: 'present', date: '10 Feb 2026', notes: 'Daftar alokasi laptop & peripheral dev' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0310', status: 'present', date: '14 Feb 2026', notes: 'PR diajukan Engineering Lead' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0560', status: 'present', date: '18 Feb 2026', notes: 'PO pengadaan 12 unit laptop' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0810', status: 'present', date: '24 Feb 2026', notes: 'Barang diterima lengkap di IT support' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-3890', status: 'present', date: '01 Mar 2026', notes: 'Invoice lolos verifikasi pajak' },
      { step: 6, code: 'PP', label: 'Payment Payment', status: 'missing', notes: 'Bukti transfer pembayaran PP belum ada' },
    ],
    validatedAt: '3 days ago',
    managedBy: 'Budi Santoso (Procurement Lead)',
  },
  {
    id: 'FLOW-8914',
    title: 'Fabrikasi Rakit Baterai UPS Modular 120kVA Data Center',
    vendor: 'PT. Daya Prima Elektrika',
    totalAmount: 'Rp 160.000.000',
    status: 'complete',
    flowSteps: [
      { step: 1, code: 'BOM', label: 'Bill of Materials', docNumber: 'BOM-2026-0080', status: 'present', date: '20 Jan 2026', notes: 'BOM 40 cell baterai gel & rack' },
      { step: 2, code: 'PR', label: 'Purchase Requisition', docNumber: 'PR-2026-0410', status: 'present', date: '24 Jan 2026', notes: 'PR disetujui Head of Facilities' },
      { step: 3, code: 'PO', label: 'Purchase Order', docNumber: 'PO-2026-0710', status: 'present', date: '28 Jan 2026', notes: 'PO diterbitkan ke vendor' },
      { step: 4, code: 'GRN', label: 'Goods Received Note', docNumber: 'GRN-2026-0950', status: 'present', date: '08 Feb 2026', notes: 'Uji fungsi tegangan & GRN di-approve' },
      { step: 5, code: 'PI', label: 'Purchase Invoice', docNumber: 'PI-2026-4412', status: 'present', date: '14 Feb 2026', notes: 'Faktur pajak lengkap' },
      { step: 6, code: 'PP', label: 'Payment Payment', docNumber: 'PP-2026-3390', status: 'present', date: '20 Feb 2026', notes: 'Settlement lunas rekening koran' },
    ],
    validatedAt: '4 days ago',
    managedBy: 'Ahmad Fauzi (IT Purchasing)',
  },
];
