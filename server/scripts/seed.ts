// Aplica SOLO migrations/0007_seed_data.sql — se corre a mano, nunca en el
// pipeline de deploy automático (evita reinsertar clientes/pedidos demo en
// cada deploy a producción). Es seguro re-ejecutarlo: el SQL usa
// ON CONFLICT DO NOTHING en todos los INSERT.
// Uso: DATABASE_URL=... npm run seed

import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está definida");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  const seedPath = path.join(__dirname, "..", "..", "migrations", "0007_seed_data.sql");
  const sql = readFileSync(seedPath, "utf8");

  const client = await pool.connect();
  try {
    console.log("> aplicando 0007_seed_data.sql...");
    await client.query(sql);
    console.log("ok");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
