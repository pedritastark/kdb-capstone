-- Danny Tacos — Categorías, productos y opciones de personalización

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  activa       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id_producto             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_categoria            UUID NOT NULL REFERENCES categorias (id_categoria) ON DELETE RESTRICT,
  nombre                  TEXT NOT NULL,
  descripcion             TEXT,
  precio                  NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- disponible: agotado momentáneamente (86'd) — distinto de activo (soft-delete)
  disponible              BOOLEAN NOT NULL DEFAULT true,
  tiempo_preparacion_min  INTEGER NOT NULL DEFAULT 0,
  fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now(),
  activo                  BOOLEAN NOT NULL DEFAULT true,
  imagen_url              TEXT
);

CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON productos (id_categoria);

CREATE TABLE IF NOT EXISTS opciones_producto (
  id_opcion         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto       UUID NOT NULL REFERENCES productos (id_producto) ON DELETE CASCADE,
  tipo              tipo_opcion NOT NULL,
  nombre            TEXT NOT NULL,
  precio_adicional  NUMERIC(12,2) NOT NULL DEFAULT 0,
  obligatoria       BOOLEAN NOT NULL DEFAULT false,
  disponible        BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_opciones_producto_id_producto ON opciones_producto (id_producto);
