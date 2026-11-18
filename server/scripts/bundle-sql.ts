// Junta schema + seed en UN solo archivo SQL (supabase/setup.sql) para pegarlo
// en el SQL Editor de Supabase y crear la base desde cero, sin credenciales.
// Orden: migraciones 0001..N (sin seed) -> registro en schema_migrations
// (para que `npm run migrate` no las repita) -> seed (0007).
// Uso: npm run bundle-sql   (regenerar si cambian las migraciones)

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(__dirname, "..", "..");
const migrationsDir = path.join(root, "migrations");
const todos = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
const seed = todos.filter((f) => f.includes("seed"));
const schema = todos.filter((f) => !f.includes("seed"));

const bloque = (titulo: string, file: string) =>
  `-- ════════════════════════════════════════════════════════════\n-- ${titulo}: ${file}\n-- ════════════════════════════════════════════════════════════\n${readFileSync(path.join(migrationsDir, file), "utf8").trim()}\n`;

const partes = [
  `-- Danny Tacos — creación completa de la base de datos (GENERADO, no editar a mano).\n` +
    `-- Regenerar con: cd server && npm run bundle-sql\n` +
    `-- Ejecutar en una base VACÍA (Supabase → SQL Editor → pegar → Run).\n` +
    `-- Incluye: esquema, RLS, registro de migraciones y datos demo (menú + usuarios).\n` +
    `-- IMPORTANTE: los usuarios demo usan la contraseña "danny2026"; cámbiala (ver README).\n`,
  `CREATE TABLE IF NOT EXISTS schema_migrations (\n  filename TEXT PRIMARY KEY,\n  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n`,
  ...schema.map((f) => bloque("Migración", f)),
  `-- Registra las migraciones como aplicadas para que \`npm run migrate\` no las repita.\n` +
    `INSERT INTO schema_migrations (filename) VALUES\n${schema.map((f) => `  ('${f}')`).join(",\n")}\nON CONFLICT DO NOTHING;\n`,
  ...seed.map((f) => bloque("Datos demo", f)),
];

mkdirSync(path.join(root, "supabase"), { recursive: true });
const out = path.join(root, "supabase", "setup.sql");
writeFileSync(out, partes.join("\n"));
console.log(`OK -> supabase/setup.sql (${schema.length} migraciones + ${seed.length} seed)`);
