

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000` :

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

# 📑 Document Reference Validator (NexusTrace)

Sistem pelacakan dan validasi referensi dokumen rantai pasok manufaktur end-to-end (BOM, Purchase Request, Purchase Order, Goods Receipt, hingga Invoice). Memastikan integritas alur dokumen, kesesuaian nilai transaksi, serta rekonsiliasi data Accurate.

---

## 📌 Tech Stack & Arsitektur

| Komponen | Pilihan Teknologi |
| :--- | :--- |
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Lucide Icons |
| **State / Theme**| ThemeContext (Dark / Light Mode) |
| **Database & ORM** | PostgreSQL + Prisma ORM (Rencana) |
| **Integrasi Data** | Accurate REST API / Excel Data Import |

---

## 🗺️ Roadmap & Milestone Tracking

### Phase 1: Inisialisasi & Fondasi UI
- [x] Inisialisasi Next.js dengan App Router & TypeScript
- [x] Konfigurasi Tailwind CSS dan utilitas styling
- [x] Pembuatan komponen navigasi utama (Sidebar, MainLayout, ThemeToggle)
- [x] Perbaikan navigasi aktif (`usePathname` / routing state)
- [x] Struktur folder modular (`app`, `components`, `lib`)
- [x] Setup mock data awal (`mock-documents.ts`, `mock-references.ts`)

### Phase 2: Halaman Dashboard & Alur Dokumen
- [x] Halaman Auth (Login & Signup UI)
- [x] Halaman List Dokumen (`/dashboard/documents`)
- [x] Tab filter: All Document, Recent, Trash
- [x] UI tabel daftar dokumen (BOM, PR, PO, GR, Invoice)
- [x] Halaman Referensi Dokumen (`/dashboard/references`)
- [x] Tab status: Valid & Failed
- [x] Visualisasi indikator relasi dokumen

### Phase 3: Mesin Validasi & Logika Bisnis (Next Step)
- [ ] Aturan Validasi BOM $\rightarrow$ PR (kesesuaian item & kuantitas material)
- [ ] Aturan Validasi PR $\rightarrow$ PO (kesesuaian nomor referensi & otorisasi)
- [ ] Aturan Validasi PO $\rightarrow$ GR (toleransi selisih penerimaan barang)
- [ ] Aturan Validasi GR $\rightarrow$ Invoice (kesesuaian 3-way matching: PO, GR, Inv)
- [ ] Mekanisme deteksi status `Failed` (missing reference, amount mismatch, duplicate)

### Phase 4: Database & Integrasi Data Riil
- [ ] Setup koneksi database PostgreSQL
- [ ] Inisialisasi Prisma ORM dan pemodelan skema relasi dokumen
- [ ] Migrasi skema database (`npx prisma migrate`)
- [ ] Penggantian mock data ke database query (Server Components / Server Actions)
- [ ] Modul penarikan/impor data dari Accurate (Sync API atau parser Excel/CSV)

### Phase 5: Audit Trail & Export
- [ ] Halaman ringkasan audit log (siapa yang memverifikasi & kapan)
- [ ] Fitur export laporan selisih / dokumen gagal validasi (Excel/PDF)
- [ ] Search & filter tingkat lanjut (pencarian nomor PO/PR, tanggal, vendor)

---

## 🚀 Getting Started

### 1. Prasyarat
* Node.js LTS
* Package manager (`npm`)

### 2. Instalasi Dependensi
```bash
npm install