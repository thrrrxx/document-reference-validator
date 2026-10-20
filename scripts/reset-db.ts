import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:shpower123@localhost:5432/document_reference_validator?schema=public';
  console.log('Connecting to PostgreSQL to reset all data...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Truncating tables in reverse dependency order...');
    await client.query('DELETE FROM "validationResult";');
    await client.query('DELETE FROM "auditLog";');
    await client.query('DELETE FROM "syncHistory";');
    await client.query('DELETE FROM "documentReference";');
    await client.query('DELETE FROM "document";');
    await client.query('DELETE FROM "user";');

    await client.query('COMMIT');
    console.log('✅ Semua tabel PostgreSQL berhasil dikosongkan (0 baris tersisa).');

    const counts = await client.query(`
      SELECT 
        (SELECT count(*) FROM "document") AS doc_count,
        (SELECT count(*) FROM "documentReference") AS ref_count,
        (SELECT count(*) FROM "user") AS user_count
    `);
    console.log('Verifikasi jumlah baris saat ini:', counts.rows[0]);

    await client.end();
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Gagal mereset database:', err);
    process.exit(1);
  }
}

resetDatabase();
