#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 Starting Document Reference Validator Container"
echo "=========================================================="

# 1. Menentukan host & port database PostgreSQL
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

# Ekstrak host & port dari DATABASE_URL jika format URL valid
if [ -n "$DATABASE_URL" ]; then
  PARSED_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  PARSED_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:[0-9]*@.*:\([0-9]*\)\/.*/\1/p')
  if [ -n "$PARSED_HOST" ]; then
    DB_HOST="$PARSED_HOST"
  fi
  if [ -n "$PARSED_PORT" ]; then
    DB_PORT="$PARSED_PORT"
  fi
fi

echo "--> Menunggu database PostgreSQL di ${DB_HOST}:${DB_PORT} siap..."
MAX_RETRIES=40
COUNT=0
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "--> [PERINGATAN] Database belum merespon setelah $MAX_RETRIES detik. Melanjutkan proses..."
    break
  fi
  sleep 1
done

if [ $COUNT -lt $MAX_RETRIES ]; then
  echo "--> ✅ Database PostgreSQL aktif dan siap menerima koneksi!"
fi

# 2. Sinkronisasi skema database Prisma (membuat/memperbarui tabel otomatis)
echo "--> Sinkronisasi skema Prisma ke database..."
npx prisma db push --skip-generate

# 3. Jalankan seeding awal jika diaktifkan dan database masih baru
if [ "$SEED_ON_START" = "true" ]; then
  echo "--> Memeriksa apakah database memerlukan initial data seeding..."
  ALREADY_SEEDED=$(node -e '
    import("pg").then(async ({ Client }) => {
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      try {
        await client.connect();
        const res = await client.query("SELECT COUNT(*) FROM \"user\"");
        await client.end();
        console.log(parseInt(res.rows[0].count, 10) > 0 ? "yes" : "no");
      } catch (e) {
        console.log("no");
      }
    });
  ')

  if [ "$ALREADY_SEEDED" = "no" ]; then
    echo "--> Database kosong terdeteksi. Menjalankan scripts/seed.ts..."
    npx tsx scripts/seed.ts || echo "--> Info: Seeding selesai dengan catatan."
  else
    echo "--> Database sudah terisi data. Seeding otomatis dilewati untuk menjaga integritas data."
  fi
fi

# 4. Menjalankan perintah utama (default: npm run start)
echo "--> 🌐 Menjalankan server aplikasi..."
exec "$@"
