import { Pool, types } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida");
}

// Por defecto node-postgres devuelve NUMERIC/DECIMAL como string (para no
// perder precisión), pero eso rompe comparaciones (<=, <, etc.) y el
// formateo en el frontend, que esperan JS number. Como este dominio no
// necesita precisión arbitraria (son precios en COP y cantidades con pocos
// decimales), se parsean como float a nivel de driver, una sola vez, para
// toda la API.
types.setTypeParser(types.builtins.NUMERIC, (val) => parseFloat(val));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
