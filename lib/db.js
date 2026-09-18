const { neon } = require('@neondatabase/serverless');

let initialized;

function sqlClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Database connection is not configured');
  return neon(url);
}

async function ensureSchema() {
  if (!initialized) {
    const sql = sqlClient();
    initialized = sql`
      CREATE TABLE IF NOT EXISTS site_data (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  }
  await initialized;
}

async function readData(key) {
  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`SELECT value, updated_at FROM site_data WHERE key = ${key}`;
  return rows[0] || null;
}

async function readAll() {
  await ensureSchema();
  const sql = sqlClient();
  return sql`SELECT key, value, updated_at FROM site_data`;
}

async function writeData(key, value) {
  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`
    INSERT INTO site_data (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
    RETURNING updated_at
  `;
  return rows[0];
}

module.exports = { readData, readAll, writeData };
