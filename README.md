# 📑 Document Reference Validator (NexusTrace)

Sistem pelacakan dan validasi referensi dokumen rantai pasok manufaktur end-to-end (BOM, Purchase Request, Purchase Order, Goods Receipt, hingga Invoice). Memastikan integritas alur dokumen, kesesuaian nilai transaksi, serta rekonsiliasi data Accurate.

---

## 🐳 Menjalankan di Device Lain Menggunakan Docker (Rekomendasi)

Agar aplikasi dapat dijalankan di device, komputer, atau server lain tanpa perlu menginstal Node.js dan PostgreSQL secara manual:

### 1. Prasyarat
- Pastikan [Docker Desktop](https://www.docker.com/products/docker-desktop/) sudah terpasang dan aktif di device tersebut.

### 2. Jalankan Kontainer
Cukup clone/copy repository ini ke device tujuan, lalu buka terminal dan jalankan:

```bash
docker compose up -d --build
```

Perintah di atas akan otomatis:
1. Menjalankan database **PostgreSQL** di background (`doc-validator-db`).
2. Menunggu database siap, lalu otomatis mengeksekusi `prisma db push` (membuat seluruh tabel database).
3. Melakukan inisialisasi **mock data & user awal** (`scripts/seed.ts`).
4. Membangun dan menjalankan server **Next.js** di `http://localhost:3000`.

### 3. Akun Login Default
Setelah kontainer aktif, buka `http://localhost:3000/auth/login` di browser:
- **Email**: `budi@nexustrace.com`
- **Password**: `password123`
*(Tersedia juga `ahmad@nexustrace.com` dan `dewi@nexustrace.com`)*

### 4. Perintah Docker Lainnya
- **Melihat log aplikasi**: `docker compose logs -f app`
- **Menghentikan kontainer**: `docker compose down`
- **Mereset database & container**: `docker compose down -v` (menghapus volume data)

---

## 💻 Menjalankan Secara Lokal (Tanpa Docker)

### Setup

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
- [x] Setup koneksi database PostgreSQL
- [x] Inisialisasi Prisma ORM dan pemodelan skema relasi dokumen (`schema.prisma`)
- [x] Sinkronisasi skema database (`npx prisma db push` & `npx prisma studio`)
- [x] Pengisian data awal PostgreSQL (`npm run db:seed`)
- [x] Modul REST API penarikan & sinkronisasi data Accurate Online (`/api/accurate/*`)
- [x] Proteksi keamanan DDoS Rate Limiting & Cloudflare Turnstile CAPTCHA

### Phase 5: Audit Trail & Export
- [x] Skema dan pencatatan audit log di database (`auditLog` & `syncHistory`)
- [ ] Fitur export laporan selisih / dokumen gagal validasi (Excel/PDF)
- [ ] Search & filter tingkat lanjut (pencarian nomor PO/PR, tanggal, vendor)



