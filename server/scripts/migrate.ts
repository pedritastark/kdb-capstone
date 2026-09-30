// Aplica migrations/000X_*.sql (todo menos el seed) en orden, contra DATABASE_URL.
// Idempotente: registra cada archivo aplicado en schema_migrations y no lo repite.
// Uso: DATABASE_URL=... npm run migrate

import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está definida");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const migrationsDir = path.join(__dirname, "..", "..", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && !f.includes("seed"))
    .sort();

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows } = await client.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations",
    );
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`= ${file} (ya aplicada)`);
        continue;
      }
      const sql = readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`> aplicando ${file}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ok`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Fallo aplicando ${file}: ${(err as Error).message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log("Migraciones al día.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
