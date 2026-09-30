-- Danny Tacos — Usuarios (staff) y clientes

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  correo        TEXT NOT NULL UNIQUE,
  -- No existe en src/types/index.ts (useAuth hoy simula el login), pero es
  -- necesario para autenticación real contra la base de datos.
  password_hash TEXT NOT NULL,
  rol           rol_usuario NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  correo      TEXT,
  telefono    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS direcciones (
  id_direccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente   UUID NOT NULL REFERENCES clientes (id_cliente) ON DELETE CASCADE,
  direccion    TEXT NOT NULL,
  referencia   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direcciones_id_cliente ON direcciones (id_cliente);
