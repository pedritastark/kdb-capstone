-- Danny Tacos — creación completa de la base de datos (GENERADO, no editar a mano).
-- Regenerar con: cd server && npm run bundle-sql
-- Ejecutar en una base VACÍA (Supabase → SQL Editor → pegar → Run).
-- Incluye: esquema, RLS, registro de migraciones y datos demo (menú + usuarios).
-- IMPORTANTE: los usuarios demo usan la contraseña "danny2026"; cámbiala (ver README).

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- Migración: 0001_extensions_and_enums.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Extensiones y tipos ENUM del dominio
-- Debe ejecutarse antes que cualquier otra migración.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'cocina', 'caja');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_opcion AS ENUM ('proteina', 'salsa', 'picante', 'adicional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_entrega AS ENUM ('mesa', 'recogida', 'domicilio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_pedido AS ENUM (
    'recibido', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE medio_pago AS ENUM ('efectivo', 'nequi', 'daviplata', 'llave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_pago AS ENUM ('pendiente', 'reportado', 'confirmado', 'rechazado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimiento_inventario AS ENUM (
    'entrada', 'consumo', 'perdida', 'ajuste', 'devolucion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_notificacion AS ENUM (
    'nuevo_pedido', 'pago_reportado', 'inventario_bajo', 'pedido_listo', 'cancelacion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_notificacion AS ENUM ('leida', 'no_leida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_control_ingrediente AS ENUM ('cantidad', 'disponibilidad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- No existe como enum en src/types/index.ts (Notificacion.destinatario es string),
-- pero los mocks solo usan estos 3 valores; se normaliza aquí.
DO $$ BEGIN
  CREATE TYPE destinatario_notificacion AS ENUM ('cocina', 'caja', 'cliente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- Migración: 0002_usuarios_clientes.sql
-- ════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════
-- Migración: 0003_catalogo.sql
-- ════════════════════════════════════════════════════════════
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

-- ════════════════════════════════════════════════════════════
-- Migración: 0004_inventario.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Ingredientes, receta por producto (BOM) y ledger de inventario

CREATE TABLE IF NOT EXISTS ingredientes (
  id_ingrediente   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  unidad_medida    TEXT NOT NULL,
  tipo_control     tipo_control_ingrediente NOT NULL,
  cantidad_actual  NUMERIC(10,3) NOT NULL DEFAULT 0,
  cantidad_minima  NUMERIC(10,3) NOT NULL DEFAULT 0,
  disponible       BOOLEAN NOT NULL DEFAULT true,
  activo           BOOLEAN NOT NULL DEFAULT true
);

-- Receta / bill of materials: cuánto de cada ingrediente consume una unidad de un producto.
CREATE TABLE IF NOT EXISTS producto_ingredientes (
  id_producto         UUID NOT NULL REFERENCES productos (id_producto) ON DELETE CASCADE,
  id_ingrediente      UUID NOT NULL REFERENCES ingredientes (id_ingrediente) ON DELETE RESTRICT,
  cantidad_requerida  NUMERIC(10,3) NOT NULL,
  PRIMARY KEY (id_producto, id_ingrediente)
);

CREATE INDEX IF NOT EXISTS idx_producto_ingredientes_id_ingrediente
  ON producto_ingredientes (id_ingrediente);

-- Ledger append-only de movimientos de stock. id_pedido referencia pedidos,
-- pero esa tabla se crea en 0005_pedidos.sql; la FK se añade allí al final
-- (ALTER TABLE) para no invertir el agrupamiento temático de los archivos.
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ingrediente     UUID NOT NULL REFERENCES ingredientes (id_ingrediente) ON DELETE RESTRICT,
  id_pedido          UUID,
  tipo_movimiento    tipo_movimiento_inventario NOT NULL,
  cantidad           NUMERIC(10,3) NOT NULL,
  cantidad_anterior  NUMERIC(10,3) NOT NULL,
  cantidad_nueva     NUMERIC(10,3) NOT NULL,
  motivo             TEXT,
  fecha_movimiento   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_id_ingrediente
  ON movimientos_inventario (id_ingrediente);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_id_pedido
  ON movimientos_inventario (id_pedido);

-- Mantiene ingredientes.cantidad_actual sincronizada con el ledger,
-- replicando la lógica de useInventario.registrarMovimiento del frontend:
-- entrada/devolucion suman, consumo/perdida/ajuste restan, sin bajar de 0.
CREATE OR REPLACE FUNCTION fn_aplicar_movimiento_inventario()
RETURNS TRIGGER AS $$
DECLARE
  delta NUMERIC(10,3);
BEGIN
  IF NEW.tipo_movimiento IN ('entrada', 'devolucion') THEN
    delta := NEW.cantidad;
  ELSE
    delta := -NEW.cantidad;
  END IF;

  UPDATE ingredientes
  SET cantidad_actual = GREATEST(cantidad_actual + delta, 0)
  WHERE id_ingrediente = NEW.id_ingrediente;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aplicar_movimiento_inventario ON movimientos_inventario;
CREATE TRIGGER trg_aplicar_movimiento_inventario
  AFTER INSERT ON movimientos_inventario
  FOR EACH ROW
  EXECUTE FUNCTION fn_aplicar_movimiento_inventario();

-- ════════════════════════════════════════════════════════════
-- Migración: 0005_pedidos.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Pedidos, sus líneas de detalle, opciones elegidas e historial de estados

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente           UUID NOT NULL REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
  id_direccion         UUID REFERENCES direcciones (id_direccion) ON DELETE SET NULL,
  id_usuario           UUID NOT NULL REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
  codigo               TEXT NOT NULL UNIQUE,
  tipo_entrega         tipo_entrega NOT NULL,
  estado               estado_pedido NOT NULL DEFAULT 'recibido',
  subtotal             NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_domicilio      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total                NUMERIC(12,2) NOT NULL DEFAULT 0,
  tiempo_estimado_min  INTEGER,
  observaciones        TEXT,
  fecha_pedido         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Máquina de estados (aplicada por la API, no forzada en la base de datos):
--   recibido -> confirmado -> en_preparacion -> listo
--     -> en_camino -> entregado   (solo si tipo_entrega = 'domicilio')
--     -> entregado                (mesa / recogida, sin paso en_camino)
--   cancelado es terminal y alcanzable desde cualquier estado.
-- Ver siguienteEstado() en src/hooks/usePedidos.tsx.

CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos (fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_id_cliente ON pedidos (id_cliente);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id_detalle       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido        UUID NOT NULL REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  id_producto      UUID NOT NULL REFERENCES productos (id_producto) ON DELETE RESTRICT,
  -- nombre_producto / precio_unitario quedan congelados al crear el pedido
  -- (snapshot), para no alterar pedidos históricos si el producto cambia después.
  nombre_producto  TEXT NOT NULL,
  cantidad         INTEGER NOT NULL,
  precio_unitario  NUMERIC(12,2) NOT NULL,
  subtotal         NUMERIC(12,2) NOT NULL,
  observaciones    TEXT
);

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_id_pedido ON detalle_pedidos (id_pedido);
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_id_producto ON detalle_pedidos (id_producto);

CREATE TABLE IF NOT EXISTS detalle_opciones (
  id_detalle_opcion  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_detalle         UUID NOT NULL REFERENCES detalle_pedidos (id_detalle) ON DELETE CASCADE,
  id_opcion          UUID NOT NULL REFERENCES opciones_producto (id_opcion) ON DELETE RESTRICT,
  -- mismo criterio de snapshot que detalle_pedidos
  nombre_opcion      TEXT NOT NULL,
  precio_adicional   NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_detalle_opciones_id_detalle ON detalle_opciones (id_detalle);

CREATE TABLE IF NOT EXISTS historial_estados (
  id_historial     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido        UUID NOT NULL REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  id_usuario       UUID NOT NULL REFERENCES usuarios (id_usuario) ON DELETE RESTRICT,
  estado_anterior  estado_pedido,
  estado_nuevo     estado_pedido NOT NULL,
  observacion      TEXT,
  hora_cambio      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historial_estados_id_pedido ON historial_estados (id_pedido);

-- Completa el FK diferido desde 0004_inventario.sql (movimientos_inventario
-- se crea antes que pedidos por agrupamiento temático de archivos).
DO $$ BEGIN
  ALTER TABLE movimientos_inventario
    ADD CONSTRAINT fk_movimientos_inventario_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- Migración: 0006_pagos_notificaciones.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Pagos y notificaciones

CREATE TABLE IF NOT EXISTS pagos (
  id_pago     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido   UUID NOT NULL REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  medio       medio_pago NOT NULL,
  estado      estado_pago NOT NULL DEFAULT 'pendiente',
  valor       NUMERIC(12,2) NOT NULL,
  referencia  TEXT
);

-- Sin UNIQUE en id_pedido: se permite más de un pago por pedido
-- (pagos parciales o reembolsos a futuro), aunque los datos mock actuales sean 1:1.
CREATE INDEX IF NOT EXISTS idx_pagos_id_pedido ON pagos (id_pedido);

CREATE TABLE IF NOT EXISTS notificaciones (
  id_notificacion  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido        UUID REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  destinatario     destinatario_notificacion NOT NULL,
  tipo             tipo_notificacion NOT NULL,
  mensaje          TEXT NOT NULL,
  estado           estado_notificacion NOT NULL DEFAULT 'no_leida',
  fecha_envio      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones (destinatario);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones (estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_id_pedido ON notificaciones (id_pedido);

-- ════════════════════════════════════════════════════════════
-- Migración: 0008_pedidos_mesa.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Número de mesa explícito en Pedido
--
-- RF-17 pide poder registrar el número de mesa para consumo en el local.
-- Hasta ahora esto solo vivía como convención de texto libre dentro de
-- `observaciones` (p. ej. "Mesa 4"). Se agrega una columna dedicada,
-- nullable porque solo aplica cuando tipo_entrega = 'mesa'.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS numero_mesa TEXT;

-- ════════════════════════════════════════════════════════════
-- Migración: 0009_disponibilidad_por_inventario.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Disponibilidad de producto atada al inventario
--
-- Un producto con receta (producto_ingredientes) se marca disponible=false
-- automáticamente en cuanto le falta alguno de sus ingredientes:
--   * ingredientes de tipo_control='cantidad'       -> cantidad_actual < cantidad_requerida
--   * ingredientes de tipo_control='disponibilidad' -> disponible = false
-- Un producto SIN receta no se toca (sigue siendo manual, vía
-- PATCH /productos/:id/disponible).
--
-- Semántica del toggle manual (PATCH /productos/:id/disponible): para un
-- producto CON receta, el valor manual se sobrescribe en cuanto vuelva a
-- cambiar el stock de alguno de sus ingredientes (el inventario manda).
-- Es intencional: evita que un producto quede "disponible" a mano mientras
-- de verdad no hay insumos para prepararlo.

CREATE OR REPLACE FUNCTION fn_producto_disponible_por_inventario(p_id_producto UUID)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM producto_ingredientes pi
    JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
    WHERE pi.id_producto = p_id_producto
      AND (
        (i.tipo_control = 'cantidad' AND i.cantidad_actual < pi.cantidad_requerida)
        OR (i.tipo_control = 'disponibilidad' AND i.disponible = false)
      )
  );
$$ LANGUAGE sql STABLE;

-- Se dispara cuando cambia el stock/disponibilidad de un ingrediente
-- (incluye los cambios que ya hace trg_aplicar_movimiento_inventario al
-- insertar en movimientos_inventario, porque ese trigger actualiza
-- ingredientes.cantidad_actual y eso dispara este).
CREATE OR REPLACE FUNCTION fn_recalcular_disponibilidad_por_ingrediente()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET disponible = fn_producto_disponible_por_inventario(productos.id_producto)
  WHERE id_producto IN (
    SELECT id_producto FROM producto_ingredientes WHERE id_ingrediente = NEW.id_ingrediente
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_disponibilidad_por_ingrediente ON ingredientes;
CREATE TRIGGER trg_recalcular_disponibilidad_por_ingrediente
  AFTER UPDATE OF cantidad_actual, disponible ON ingredientes
  FOR EACH ROW
  WHEN (
    OLD.cantidad_actual IS DISTINCT FROM NEW.cantidad_actual
    OR OLD.disponible IS DISTINCT FROM NEW.disponible
  )
  EXECUTE FUNCTION fn_recalcular_disponibilidad_por_ingrediente();

-- Se dispara cuando se arma/edita/borra la receta de un producto
-- (producto_ingredientes), para que recalcule apenas se le asocian
-- ingredientes o se le quitan.
CREATE OR REPLACE FUNCTION fn_recalcular_disponibilidad_por_receta()
RETURNS TRIGGER AS $$
DECLARE
  v_id_producto UUID := COALESCE(NEW.id_producto, OLD.id_producto);
BEGIN
  UPDATE productos
  SET disponible = fn_producto_disponible_por_inventario(v_id_producto)
  WHERE id_producto = v_id_producto;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalcular_disponibilidad_por_receta ON producto_ingredientes;
CREATE TRIGGER trg_recalcular_disponibilidad_por_receta
  AFTER INSERT OR UPDATE OR DELETE ON producto_ingredientes
  FOR EACH ROW
  EXECUTE FUNCTION fn_recalcular_disponibilidad_por_receta();

-- Backfill: aplica la regla ya mismo a los productos que tengan receta.
UPDATE productos
SET disponible = fn_producto_disponible_por_inventario(id_producto)
WHERE id_producto IN (SELECT DISTINCT id_producto FROM producto_ingredientes);

-- ════════════════════════════════════════════════════════════
-- Migración: 0010_ingredientes_imagen.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Foto por ingrediente
--
-- Mismo criterio que productos.imagen_url: una ruta relativa servida por el
-- propio backend (ver server/public/images/, montado en /images por Express).

ALTER TABLE ingredientes
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- ════════════════════════════════════════════════════════════
-- Migración: 0011_notificacion_solicitud_asesor.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Chatbot: tipo de notificación para "hablar con alguien"
--
-- Cuando el cliente pide hablar con una persona desde el chatbot (/chat),
-- se crea una notificación para caja con este tipo.
-- (No se usa el valor nuevo dentro de esta misma migración, así que es
-- seguro correrla dentro de la transacción de migrate.ts.)

ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'solicitud_asesor';

-- ════════════════════════════════════════════════════════════
-- Migración: 0012_enable_rls.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Row Level Security en todas las tablas
--
-- Supabase expone el esquema "public" por una API REST pública (PostgREST)
-- que se autentica con la clave "anon", que NO es secreta. Sin RLS, esa API
-- dejaría leer/modificar cualquier tabla (incluidos los hashes de usuarios).
--
-- Con RLS activado y SIN políticas, la API REST no puede tocar nada. La API
-- propia (Express) no se afecta: conecta como el dueño de las tablas
-- ("postgres"), que se salta RLS.
--
-- Esta migración cubre las tablas que existen al aplicarla. Si más adelante
-- se crea una tabla nueva, hay que activarle RLS a mano:
--   ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- Defensa en profundidad (solo si existen los roles de Supabase): quitar
-- también los permisos directos de la API REST sobre las tablas.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- Migración: 0013_imagenes.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Fotos subidas desde el panel
--
-- Las fotos que el personal sube (botón "Cambiar foto" al editar un producto)
-- se guardan en la propia base, no en el disco del servidor: el disco de Render
-- es efímero y se borra en cada despliegue. El frontend las reduce antes de
-- subirlas (~1000 px, JPEG), así que pesan del orden de 100–300 KB.
--
-- Se sirven en GET /api/imagenes/:id y productos.imagen_url guarda esa ruta
-- ("/api/imagenes/<uuid>"). Una fila nunca se modifica: cambiar la foto crea
-- una fila nueva, por eso la API la puede cachear como inmutable.

CREATE TABLE IF NOT EXISTS imagenes (
  id_imagen    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mime         TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  datos        BYTEA NOT NULL,
  bytes        INTEGER NOT NULL,
  id_usuario   UUID REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
  fecha_subida TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Igual que el resto (ver 0012): sin políticas, la API REST pública de
-- Supabase no puede leer ni escribir; la API propia conecta como dueño.
ALTER TABLE imagenes ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- Migración: 0014_categorias_orden.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Orden de las categorías en el menú
--
-- Antes se ordenaban por nombre (alfabético). Con `orden` el menú (landing,
-- /chat, /toma-orden y panel) las muestra en el orden que defina el negocio;
-- a igual orden, por nombre. Las categorías existentes quedan en 100 (al final)
-- hasta que se les asigne uno.

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 100;

-- Registra las migraciones como aplicadas para que `npm run migrate` no las repita.
INSERT INTO schema_migrations (filename) VALUES
  ('0001_extensions_and_enums.sql'),
  ('0002_usuarios_clientes.sql'),
  ('0003_catalogo.sql'),
  ('0004_inventario.sql'),
  ('0005_pedidos.sql'),
  ('0006_pagos_notificaciones.sql'),
  ('0008_pedidos_mesa.sql'),
  ('0009_disponibilidad_por_inventario.sql'),
  ('0010_ingredientes_imagen.sql'),
  ('0011_notificacion_solicitud_asesor.sql'),
  ('0012_enable_rls.sql'),
  ('0013_imagenes.sql'),
  ('0014_categorias_orden.sql')
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- Datos demo: 0007_seed_data.sql
-- ════════════════════════════════════════════════════════════
-- Danny Tacos — Datos semilla
-- Catálogo real de ingredientes, recetas y platos tomado de
-- TacosDany_Sistema_Costeo_1 (version 1).xlsx (hojas Ingredientes, Recetas, Costeo).
-- Usa UUIDs deterministas (uuid5) derivados de los códigos del Excel (ING01, nombre del
-- plato, etc.) para poder referenciarlos entre INSERTs y regenerarlos de forma reproducible.
--
-- Supuestos hechos por no venir en el Excel (ajustar si no aplican):
--   * unidad_medida de cada ingrediente = su 'Unidad de Porción' de costeo (p.ej. '30 gr'),
--     no la unidad de compra original.
--   * cantidad_actual inicial = 'Porciones por Compra' (como si acabaran de comprar un lote).
--   * cantidad_minima = 20% de esa cantidad inicial (el Excel no define un mínimo).
--   * tiempo_preparacion_min = valor por categoría (Tacos 8, Antojitos 12, Platos Fuertes 15,
--     Bebidas 5, Postres 8) — el Excel no incluye tiempos de preparación.
--   * precio de productos = 'Precio Sugerido (Redond.)' de la hoja Costeo.
--   * descripcion queda vacía — no viene en el Excel.
--
-- imagen_url (ingredientes y productos) apunta a archivos reales en
-- server/public/images/{ingredientes,platos}/, servidos por Express en
-- /images/... (ver server/src/app.ts). Vienen de DanyTacos.zip: los 46
-- ingredientes tienen foto, pero de los 27 platos solo 21 — Arroz de la
-- Casa, Birriamen, Chorimex, Guacajito, Quesotella y Taco de Birria quedan
-- con imagen_url = '' por ahora, sin foto en ese zip.
--
-- NOTA: 'Taco Birria' y 'Taco de Birria' existen como dos filas casi idénticas en el Excel
-- (mismo costeo, solo cambia la unidad de la tortilla). Se cargan ambas tal cual el Excel;
-- probablemente sea un duplicado a limpiar en el Excel/menú real.

-- ── Usuarios (uno por rol) ─────────────────────────────────────────────
-- password_hash son hashes bcrypt reales de la contraseña de prueba
-- "danny2026" (para los 3 usuarios). Úsala para probar POST /api/auth/login
-- en local; cámbiala antes de usar estos datos en un entorno real.
-- El 4to usuario ("Autopedido") es una cuenta de sistema, sin login real
-- (su hash es aleatorio e inutilizable) — se usa como id_usuario de los
-- pedidos creados desde /toma-orden, la ruta pública sin sesión donde el
-- cliente pide directo desde la mesa.
INSERT INTO usuarios (id_usuario, nombre, correo, password_hash, rol) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Daniel Rodríguez', 'admin@dannytacos.com', '$2b$10$YzzXNjG.nfleDF0L7GrYmeRfbZLPXQVGs9Rcp4ii1IlyW275jhQey', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'Laura Gómez',      'cocina@dannytacos.com', '$2b$10$QR2duvZrkB/26QF1b9LMsObSwRI0oCwjdN2HeL.O27nxGGjBz1nom', 'cocina'),
  ('a0000000-0000-0000-0000-000000000003', 'Carlos Pérez',     'caja@dannytacos.com',   '$2b$10$7Ik/jT6ibiHxJbBr.1CL9OMEgJTzSnaMY9Y8XKpgHSk./Hsq84V4q', 'caja'),
  ('a0000000-0000-0000-0000-000000000004', 'Autopedido (Mesa)', 'autopedido@dannytacos.com', '$2b$10$dcL8oilCW3B0fY5UBeW25edufXzDrIgHSRblR.yOVvyleRDBU/0P2', 'caja')
ON CONFLICT DO NOTHING;

-- ── Clientes y direcciones ─────────────────────────────────────────────
INSERT INTO clientes (id_cliente, nombre, correo, telefono) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Ana Martínez',     'ana@example.com',       '3001234567'),
  ('c0000000-0000-0000-0000-000000000002', 'Jorge Salazar',    'jorge@example.com',     '3009876543'),
  ('c0000000-0000-0000-0000-000000000003', 'Valentina Ruiz',   'valentina@example.com', '3005551212')
ON CONFLICT DO NOTHING;

INSERT INTO direcciones (id_direccion, id_cliente, direccion, referencia) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Calle 10 #5-23, Chapinero', 'Portón azul'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Carrera 15 #80-12, Usaquén', 'Apto 302')
ON CONFLICT DO NOTHING;
-- Jorge Salazar (c...002) queda sin dirección a propósito: solo pide para recoger/mesa.

-- ── Categorías (inferidas del tipo de plato en el Excel) ────────────────
INSERT INTO categorias (id_categoria, nombre, descripcion, activa) VALUES
  ('e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Tacos', 'Tacos tradicionales y de autor', true),
  ('6280f3ec-852b-58db-adc2-688cbfab895c', 'Antojitos para Compartir', 'Porciones para compartir en la mesa', true),
  ('f8ef7307-7ed5-574c-8951-fb49e596d056', 'Platos Fuertes', 'Platos principales de mayor tamaño', true),
  ('5b391907-4b26-598e-b478-43859363d0a9', 'Bebidas', 'Bebidas frías y calientes', true),
  ('cd762a21-6117-550d-ab6b-305ad012853b', 'Postres', 'Postres y dulces', true)
ON CONFLICT DO NOTHING;

-- ── Ingredientes (catálogo real, 46 insumos) ────────────────────────────
-- cantidad_actual es el stock inicial; los INSERTs en movimientos_inventario
-- más abajo la decrementan automáticamente vía trg_aplicar_movimiento_inventario.
INSERT INTO ingredientes (id_ingrediente, nombre, unidad_medida, tipo_control, cantidad_actual, cantidad_minima, disponible, activo, imagen_url) VALUES
  ('8734b273-7646-5e83-a20d-dd48c3d80141', 'Carne de Res', '30 gr', 'cantidad', 32, 6, true, true, '/images/ingredientes/carne-de-res.png'),  -- ING01
  ('fd7f613e-a726-51ff-ac20-995d3eaed436', 'Queso Doble Crema', '30 gr', 'cantidad', 50, 10, true, true, '/images/ingredientes/queso-doble-crema.png'),  -- ING02
  ('f8f488d2-4aa9-5abb-b4a9-6334795adbb5', 'Queso Cheddar', 'unidad', 'cantidad', 45, 9, true, true, '/images/ingredientes/queso-cheddar.png'),  -- ING03
  ('c81b4551-002f-56aa-844c-33e535d20992', 'Chorizo', 'unidad', 'cantidad', 10, 2, true, true, '/images/ingredientes/chorizo.png'),  -- ING04
  ('beedf3e5-ec34-5b98-a99a-3faf127c565e', 'Carne de Cerdo', '30 gr', 'cantidad', 32, 6, true, true, '/images/ingredientes/carne-de-cerdo.png'),  -- ING05
  ('00956175-921e-51ee-8647-26130c9593e5', 'Carne de Pollo', '30 gr', 'cantidad', 32, 6, true, true, '/images/ingredientes/carne-de-pollo.png'),  -- ING06
  ('3e06fcf9-89eb-5c04-8189-4d6fbf250437', 'Chicharrón', '240 gr', 'cantidad', 27, 5, true, true, '/images/ingredientes/chicharron.png'),  -- ING07
  ('acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 'Tortilla de Maíz', 'unidad', 'cantidad', 32, 6, true, true, '/images/ingredientes/tortilla-de-maiz.png'),  -- ING08
  ('c75b0db3-0e82-5db5-85ef-0b92789a863f', 'Tortilla de Harina', 'unidad', 'cantidad', 10, 2, true, true, '/images/ingredientes/tortilla-de-harina.png'),  -- ING09
  ('9626d440-01d8-5646-a2ce-1ceb93e882eb', 'Mazorca', 'unidad', 'cantidad', 5, 1, true, true, '/images/ingredientes/mazorca.png'),  -- ING10
  ('4b851de7-2fc5-597e-8390-690a19ba980b', 'Pan Perro', 'paquete', 'cantidad', 5, 1, true, true, '/images/ingredientes/pan-perro.png'),  -- ING11
  ('cda5f767-b17c-5f4f-a94e-01f6157584bf', 'Papas Francesas', 'paquete', 'cantidad', 10, 2, true, true, '/images/ingredientes/papas-francesas.png'),  -- ING12
  ('67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 'Aguacate', 'unidad', 'cantidad', 35, 7, true, true, '/images/ingredientes/aguacate.png'),  -- ING13
  ('ce860f3d-1f05-588e-9183-d2b12bc57855', 'Mayonesa', '4 kilos', 'cantidad', 130, 26, true, true, '/images/ingredientes/mayonesa.png'),  -- ING14
  ('33f95efb-f631-517d-a8d5-7d27b1cb485c', 'Cebolla', 'libra', 'cantidad', 24, 5, true, true, '/images/ingredientes/cebolla.png'),  -- ING15
  ('a1459bc5-05c6-5849-9ce0-c3e2329d4b18', 'Tomate', 'libra', 'cantidad', 5, 1, true, true, '/images/ingredientes/tomate.png'),  -- ING16
  ('247223ec-f117-520a-bbd5-d17d6aa1c70b', 'Piña en Almíbar', '30 gr', 'cantidad', 100, 20, true, true, '/images/ingredientes/pina-en-almibar.png'),  -- ING17
  ('cbec4fe1-1008-5439-8c3a-908f39bb028a', 'Cilantro', 'unidad', 'cantidad', 10, 2, true, true, '/images/ingredientes/cilantro.png'),  -- ING18
  ('13d06e6e-af36-5c4c-968c-bb4ea8167019', 'Tajín', 'porción', 'cantidad', 110, 22, true, true, '/images/ingredientes/tajin.png'),  -- ING19
  ('197c9183-25e1-57f2-85db-c14e38af1f4b', 'Limón', 'unidad', 'cantidad', 25, 5, true, true, '/images/ingredientes/limon.png'),  -- ING20
  ('fcdad793-1b2f-5c31-bfad-56fedf2a4ad3', 'Aceite', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/aceite.png'),  -- ING21
  ('44190d6c-abe9-57ed-899a-d92720959c69', 'Chamoy', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/chamoy.png'),  -- ING22
  ('0660a07c-1a4d-5846-81b1-d19d6eedfde8', 'Especias', 'porción', 'cantidad', 70, 14, true, true, '/images/ingredientes/especias.png'),  -- ING23
  ('cc0c585e-4897-55fc-a640-9fe8c3fd728a', 'Mango', 'unidad', 'cantidad', 8, 2, true, true, '/images/ingredientes/mango.png'),  -- ING24
  ('1b1e61ce-a7a2-52ee-8aa6-225cad285bd1', 'Nutella', 'porción', 'cantidad', 25, 5, true, true, '/images/ingredientes/nutella.png'),  -- ING25
  ('f0a52f32-4708-5cf0-8ef7-cb62644391b4', 'Arroz', 'porción', 'cantidad', 18, 4, true, true, '/images/ingredientes/arroz.png'),  -- ING26
  ('95aa96d4-8308-5c03-9ceb-cab129196e55', 'Frijol Negro', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/frijol-negro.png'),  -- ING27
  ('95914e7b-2e64-530f-95ce-3665f3c488d2', 'Masa Empanada', 'unidad', 'cantidad', 15, 3, true, true, '/images/ingredientes/masa-empanada.png'),  -- ING28
  ('659aaf3d-f2f9-5d9f-b767-0b50c11713f2', 'Camarón', 'porción', 'cantidad', 20, 4, true, true, '/images/ingredientes/camaron.png'),  -- ING29
  ('9708e25e-b3b8-5f3c-8c54-ea2db7a1159e', 'Panceta', 'porción', 'cantidad', 27, 5, true, true, '/images/ingredientes/panceta.png'),  -- ING30
  ('b56f69c9-3ee4-5d4a-af9a-11a483ce54eb', 'Pasta Ramen', 'porción', 'cantidad', 2, 1, true, true, '/images/ingredientes/pasta-ramen.png'),  -- ING31
  ('1369aaed-98f2-56ab-bf3b-95a699afc9df', 'Nachos', 'porción', 'cantidad', 15, 3, true, true, '/images/ingredientes/nachos.png'),  -- ING32
  ('1626df0d-6672-548e-8dc1-00b5b7fc59b6', 'Salsa Cheddar', 'porción', 'cantidad', 45, 9, true, true, '/images/ingredientes/salsa-cheddar.png'),  -- ING33
  ('18295bda-ab79-591d-a144-f422def8aba1', 'Pan Artesanal', 'unidad', 'cantidad', 5, 1, true, true, '/images/ingredientes/pan-artesanal.png'),  -- ING34
  ('b51bf1a8-1ba7-5a14-98ee-7d4e9910af09', 'Salchicha', 'unidad', 'cantidad', 12, 2, true, true, '/images/ingredientes/salchicha.png'),  -- ING35
  ('937295b5-ca49-5410-9925-9d3654c370e5', 'Doritos', 'porción', 'cantidad', 1, 1, true, true, '/images/ingredientes/doritos.png'),  -- ING36
  ('8fd61988-840e-5bf6-9d92-4518d53dc490', 'Churros', 'unidad', 'cantidad', 9, 2, true, true, '/images/ingredientes/churros.png'),  -- ING37
  ('7a55cec5-2b91-563f-a016-26bfb025dac2', 'Helado', 'porción', 'cantidad', 14, 3, true, true, '/images/ingredientes/helado.png'),  -- ING38
  ('49c60657-abdf-5990-b5c6-50fa1a54bf7b', 'Arequipe', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/arequipe.png'),  -- ING39
  ('cc046fbb-c8b8-592c-a47f-310db3cc9cea', 'Alitas de Pollo', 'porción', 'cantidad', 12, 2, true, true, '/images/ingredientes/alitas-de-pollo.png'),  -- ING40
  ('8d817c4c-3e45-5689-b241-bf93ef93aea3', 'Pechuga', 'porción', 'cantidad', 4, 1, true, true, '/images/ingredientes/pechuga.png'),  -- ING41
  ('615e6080-0f18-529e-a89c-0673ade72c3b', 'Jamaica', 'porción', 'cantidad', 3, 1, true, true, '/images/ingredientes/jamaica.png'),  -- ING42
  ('1593e8fe-348f-57fd-ad26-ccf0c00af9ab', 'Azúcar', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/azucar.png'),  -- ING43
  ('e42d2680-e389-5780-a557-10ad442021c2', 'Ajonjolí', 'porción', 'cantidad', 30, 6, true, true, '/images/ingredientes/ajonjoli.png'),  -- ING44
  ('2b6abef5-55b4-54a0-bcd5-cdc2886f06e0', 'Pimentón', 'unidad', 'cantidad', 15, 3, true, true, '/images/ingredientes/pimenton.png'),  -- ING45
  ('290a36b0-94af-5377-8254-be1df37a0aa7', 'carne asada', 'unidad', 'cantidad', 4, 1, true, true, '/images/ingredientes/carne-asada.png')  -- ING46
ON CONFLICT DO NOTHING;

-- ── Productos (27 platos, precio = Precio Sugerido de la hoja Costeo) ──
INSERT INTO productos (id_producto, id_categoria, nombre, descripcion, precio, disponible, tiempo_preparacion_min, activo, imagen_url) VALUES
  ('6a1d664b-c701-5907-956e-f1b5204c4c89', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Alitas', '', 22500, true, 12, true, '/images/platos/alitas.png'),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Arroz de la Casa', '', 17500, true, 15, true, ''),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Birriamen', '', 18500, true, 15, true, ''),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Burrito', '', 30500, true, 15, true, '/images/platos/burrito.png'),
  ('735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Carne Asada', '', 30000, true, 15, true, '/images/platos/carne-asada.png'),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Chicharronada', '', 29500, true, 12, true, '/images/platos/chicharronada.png'),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Chorimex', '', 25500, true, 12, true, ''),
  ('aa3e8b7a-3374-5769-8e7d-519ce573ef32', 'cd762a21-6117-550d-ab6b-305ad012853b', 'Churro Loco', '', 9000, true, 8, true, '/images/platos/churro-loco.png'),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Dorilocos', '', 16500, true, 12, true, '/images/platos/dorilocos.png'),
  ('bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Empanada', '', 3500, true, 12, true, '/images/platos/empanada.png'),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Guacajito', '', 10500, true, 12, true, ''),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Guacamole', '', 4500, true, 12, true, '/images/platos/guacamole.png'),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Hamburguesa', '', 22500, true, 15, true, '/images/platos/hamburguesa.png'),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Mazorcada', '', 20000, true, 12, true, '/images/platos/mazorcada.png'),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '6280f3ec-852b-58db-adc2-688cbfab895c', 'Mega Nachos', '', 17500, true, 12, true, '/images/platos/mega-nachos.png'),
  ('fe16067d-70c0-5aa9-aee0-5cefe5e20b53', '5b391907-4b26-598e-b478-43859363d0a9', 'Michelada de Mango', '', 8000, true, 5, true, '/images/platos/michelada-de-mango.png'),
  ('99483d64-4f38-56c4-8120-08cdc280f94f', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Pechuga Asada', '', 25000, true, 15, true, '/images/platos/pechuga-asada.png'),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', 'f8ef7307-7ed5-574c-8951-fb49e596d056', 'Perro Caliente', '', 19500, true, 15, true, '/images/platos/perro-caliente.png'),
  ('f786999c-5d5b-55df-81fc-c17249fa72d6', 'cd762a21-6117-550d-ab6b-305ad012853b', 'Quesotella', '', 9500, true, 8, true, ''),
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Birria', '', 9000, true, 8, true, '/images/platos/taco-birria.png'),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Camarón', '', 12500, true, 8, true, '/images/platos/taco-camaron.png'),
  ('6639d352-a747-5919-8881-181c7e3527ee', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Chicharrón', '', 9500, true, 8, true, '/images/platos/taco-chicharron.png'),
  ('cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Chorizo', '', 7500, true, 8, true, '/images/platos/taco-chorizo.png'),
  ('531f0fd3-e153-5250-92bf-5daa9e2383f3', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Cochinita', '', 5500, true, 8, true, '/images/platos/taco-cochinita.png'),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Pastor', '', 5500, true, 8, true, '/images/platos/taco-pastor.png'),
  ('b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco Pollo', '', 5500, true, 8, true, '/images/platos/taco-pollo.png'),
  ('926b822a-5f20-5bef-a19d-54a577117ca1', 'e9ea600b-197a-5df3-91d9-2f3c03963c4e', 'Taco de Birria', '', 8500, true, 8, true, '')
ON CONFLICT DO NOTHING;

-- ── Receta / BOM (146 líneas producto-ingrediente) ──────────────────────
INSERT INTO producto_ingredientes (id_producto, id_ingrediente, cantidad_requerida) VALUES
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', '247223ec-f117-520a-bbd5-d17d6aa1c70b', 1),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('531f0fd3-e153-5250-92bf-5daa9e2383f3', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('531f0fd3-e153-5250-92bf-5daa9e2383f3', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('531f0fd3-e153-5250-92bf-5daa9e2383f3', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('531f0fd3-e153-5250-92bf-5daa9e2383f3', '197c9183-25e1-57f2-85db-c14e38af1f4b', 0.5),
  ('cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'c81b4551-002f-56aa-844c-33e535d20992', 1),
  ('cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('cd3035c4-ef90-508b-8171-f7b0325f9ba8', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', '00956175-921e-51ee-8647-26130c9593e5', 1),
  ('b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 2),
  ('b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('6639d352-a747-5919-8881-181c7e3527ee', '3e06fcf9-89eb-5c04-8189-4d6fbf250437', 1),
  ('6639d352-a747-5919-8881-181c7e3527ee', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('6639d352-a747-5919-8881-181c7e3527ee', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 0.5),
  ('6639d352-a747-5919-8881-181c7e3527ee', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('6639d352-a747-5919-8881-181c7e3527ee', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', '659aaf3d-f2f9-5d9f-b767-0b50c11713f2', 1),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 1),
  ('a896d95e-8c2d-5355-a095-3f756c19c931', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('926b822a-5f20-5bef-a19d-54a577117ca1', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('926b822a-5f20-5bef-a19d-54a577117ca1', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 1),
  ('926b822a-5f20-5bef-a19d-54a577117ca1', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('926b822a-5f20-5bef-a19d-54a577117ca1', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 1),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', '197c9183-25e1-57f2-85db-c14e38af1f4b', 1),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('1bc8ecad-c884-55ea-8abf-797bd571d583', 'ce860f3d-1f05-588e-9183-d2b12bc57855', 0.5),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'cda5f767-b17c-5f4f-a94e-01f6157584bf', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'c81b4551-002f-56aa-844c-33e535d20992', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '197c9183-25e1-57f2-85db-c14e38af1f4b', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('f20dc4db-32ca-5bd2-a0db-2b97f8b00269', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '9708e25e-b3b8-5f3c-8c54-ea2db7a1159e', 6),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 2),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '247223ec-f117-520a-bbd5-d17d6aa1c70b', 1),
  ('4439ef72-a361-5529-a69b-97992f677c9d', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('4439ef72-a361-5529-a69b-97992f677c9d', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', 3),
  ('4439ef72-a361-5529-a69b-97992f677c9d', '2b6abef5-55b4-54a0-bcd5-cdc2886f06e0', 0.5),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '9626d440-01d8-5646-a2ce-1ceb93e882eb', 1),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '8734b273-7646-5e83-a20d-dd48c3d80141', 2),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '1626df0d-6672-548e-8dc1-00b5b7fc59b6', 1),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 1),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', '8734b273-7646-5e83-a20d-dd48c3d80141', 2),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', '18295bda-ab79-591d-a144-f422def8aba1', 1),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', 'ce860f3d-1f05-588e-9183-d2b12bc57855', 1),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 0.5),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', 'c81b4551-002f-56aa-844c-33e535d20992', 1),
  ('50463f4b-78c1-5313-8714-7ed66788c5d8', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'f0a52f32-4708-5cf0-8ef7-cb62644391b4', 1),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', '95aa96d4-8308-5c03-9ceb-cab129196e55', 1),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'c75b0db3-0e82-5db5-85ef-0b92789a863f', 2),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 0.5),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', '00956175-921e-51ee-8647-26130c9593e5', 2),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 2),
  ('32034cf8-c602-56f3-9d58-8976e6f6082b', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '1369aaed-98f2-56ab-bf3b-95a699afc9df', 6),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '1626df0d-6672-548e-8dc1-00b5b7fc59b6', 1),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 0.5),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('122548e4-846f-50a7-8d03-720dbc9abe50', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'b56f69c9-3ee4-5d4a-af9a-11a483ce54eb', 1),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', '8734b273-7646-5e83-a20d-dd48c3d80141', 2),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('6c8cc269-2f43-5da5-9cd7-918a7873ec79', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('fe16067d-70c0-5aa9-aee0-5cefe5e20b53', '44190d6c-abe9-57ed-899a-d92720959c69', 0.5),
  ('fe16067d-70c0-5aa9-aee0-5cefe5e20b53', 'cc0c585e-4897-55fc-a640-9fe8c3fd728a', 0.5),
  ('fe16067d-70c0-5aa9-aee0-5cefe5e20b53', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('fe16067d-70c0-5aa9-aee0-5cefe5e20b53', '1593e8fe-348f-57fd-ad26-ccf0c00af9ab', 1),
  ('bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', '8734b273-7646-5e83-a20d-dd48c3d80141', 0.2),
  ('bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', '95914e7b-2e64-530f-95ce-3665f3c488d2', 1),
  ('bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', 'f0a52f32-4708-5cf0-8ef7-cb62644391b4', 0.5),
  ('bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('aa3e8b7a-3374-5769-8e7d-519ce573ef32', '8fd61988-840e-5bf6-9d92-4518d53dc490', 1),
  ('aa3e8b7a-3374-5769-8e7d-519ce573ef32', '7a55cec5-2b91-563f-a016-26bfb025dac2', 1),
  ('aa3e8b7a-3374-5769-8e7d-519ce573ef32', '49c60657-abdf-5990-b5c6-50fa1a54bf7b', 0.5),
  ('f786999c-5d5b-55df-81fc-c17249fa72d6', 'c75b0db3-0e82-5db5-85ef-0b92789a863f', 0.5),
  ('f786999c-5d5b-55df-81fc-c17249fa72d6', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('f786999c-5d5b-55df-81fc-c17249fa72d6', '1b1e61ce-a7a2-52ee-8aa6-225cad285bd1', 1),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', '4b851de7-2fc5-597e-8390-690a19ba980b', 1),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', 'b51bf1a8-1ba7-5a14-98ee-7d4e9910af09', 1),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 0.5),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', 'fd7f613e-a726-51ff-ac20-995d3eaed436', 1),
  ('6ec15b93-0a19-5e08-ad10-36f8b602840b', 'ce860f3d-1f05-588e-9183-d2b12bc57855', 0.5),
  ('99483d64-4f38-56c4-8120-08cdc280f94f', '8d817c4c-3e45-5689-b241-bf93ef93aea3', 1),
  ('99483d64-4f38-56c4-8120-08cdc280f94f', 'f0a52f32-4708-5cf0-8ef7-cb62644391b4', 1),
  ('99483d64-4f38-56c4-8120-08cdc280f94f', 'cda5f767-b17c-5f4f-a94e-01f6157584bf', 1),
  ('99483d64-4f38-56c4-8120-08cdc280f94f', '197c9183-25e1-57f2-85db-c14e38af1f4b', 1),
  ('735ef0ae-3e51-51e7-8bd2-7665a0718b4a', '290a36b0-94af-5377-8254-be1df37a0aa7', 0.7),
  ('735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'cda5f767-b17c-5f4f-a94e-01f6157584bf', 1),
  ('735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'f0a52f32-4708-5cf0-8ef7-cb62644391b4', 1),
  ('735ef0ae-3e51-51e7-8bd2-7665a0718b4a', '197c9183-25e1-57f2-85db-c14e38af1f4b', 1),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', '937295b5-ca49-5410-9925-9d3654c370e5', 1),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5),
  ('f87f4bb7-f4b4-5f45-871d-d713c0827f3c', '13d06e6e-af36-5c4c-968c-bb4ea8167019', 1),
  ('6a1d664b-c701-5907-956e-f1b5204c4c89', 'cc046fbb-c8b8-592c-a47f-310db3cc9cea', 5),
  ('6a1d664b-c701-5907-956e-f1b5204c4c89', 'cda5f767-b17c-5f4f-a94e-01f6157584bf', 1),
  ('6a1d664b-c701-5907-956e-f1b5204c4c89', '197c9183-25e1-57f2-85db-c14e38af1f4b', 1),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', 'f0a52f32-4708-5cf0-8ef7-cb62644391b4', 2),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', '8734b273-7646-5e83-a20d-dd48c3d80141', 1),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', 'e42d2680-e389-5780-a557-10ad442021c2', 1),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', 1),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', '00956175-921e-51ee-8647-26130c9593e5', 1),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', '2b6abef5-55b4-54a0-bcd5-cdc2886f06e0', 0.5),
  ('e8ee8359-efd4-5c58-9c48-9224e026827b', 'c81b4551-002f-56aa-844c-33e535d20992', 1),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', '67f2ca47-9ca9-54c8-b7c5-7fcff84f1b8c', 1),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', '3e06fcf9-89eb-5c04-8189-4d6fbf250437', 2),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', '1369aaed-98f2-56ab-bf3b-95a699afc9df', 2),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', '33f95efb-f631-517d-a8d5-7d27b1cb485c', 0.5),
  ('b9a6b78a-fc39-56af-9a17-7de2857a72c3', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', 0.5)
ON CONFLICT DO NOTHING;

-- ── Adicionales (toppings) para Tacos, Antojitos y Platos Fuertes ───────
-- No vienen del Excel de costeo (que no modela personalización); son un
-- set universal razonable para poder probar el flujo de 'agregar algo más'
-- al personalizar un pedido. Bebidas y Postres quedan sin adicionales.
INSERT INTO opciones_producto (id_opcion, id_producto, tipo, nombre, precio_adicional, obligatoria, disponible) VALUES
  ('b6b8d413-c1c4-5ed4-8832-24adcb7a3244', 'ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'adicional', 'Extra Queso', 1500, false, true),
  ('de9b0ac5-97f7-5ce4-bc2d-0be18e37440f', 'ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'adicional', 'Aguacate', 1500, false, true),
  ('44d9a954-46fc-5ee8-a496-1293767938ce', 'ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'adicional', 'Extra Proteína', 3000, false, true),
  ('d5a66f26-827e-5226-a291-69afe2bd4688', 'b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'adicional', 'Extra Queso', 1500, false, true),
  ('9aece7bd-155a-52ed-9c5a-9a942b219746', 'b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'adicional', 'Aguacate', 1500, false, true),
  ('809e8ccb-b622-53bd-8da5-895df878e552', 'b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'adicional', 'Extra Proteína', 3000, false, true),
  ('581d7469-e787-50ac-81fa-9a856ca2183b', '531f0fd3-e153-5250-92bf-5daa9e2383f3', 'adicional', 'Extra Queso', 1500, false, true),
  ('d5b52215-0151-5a45-85e6-1f7c1bfa2e53', '531f0fd3-e153-5250-92bf-5daa9e2383f3', 'adicional', 'Aguacate', 1500, false, true),
  ('323352b6-80b8-5895-9bcd-ee22cec68479', '531f0fd3-e153-5250-92bf-5daa9e2383f3', 'adicional', 'Extra Proteína', 3000, false, true),
  ('348b1500-f0de-58dc-b99c-2f28543cdfe1', 'cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'adicional', 'Extra Queso', 1500, false, true),
  ('c94f5d3b-7785-5d6b-8ecb-540ee5e9a741', 'cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'adicional', 'Aguacate', 1500, false, true),
  ('81e6e05a-d3d8-5003-9b54-9e35f6f3b9bd', 'cd3035c4-ef90-508b-8171-f7b0325f9ba8', 'adicional', 'Extra Proteína', 3000, false, true),
  ('7c9c3beb-e7df-5cc3-8312-f48bb504d1c6', 'b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', 'adicional', 'Extra Queso', 1500, false, true),
  ('0276b1a1-f7ba-5d5b-8604-741112abc48d', 'b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', 'adicional', 'Aguacate', 1500, false, true),
  ('6e029c2e-ce8e-5022-9f83-7c3646186be1', 'b98b8ac7-6933-54c1-8ab7-9d1173f7f8d8', 'adicional', 'Extra Proteína', 3000, false, true),
  ('4c3ba46d-9231-5c81-9071-944251942a84', '6639d352-a747-5919-8881-181c7e3527ee', 'adicional', 'Extra Queso', 1500, false, true),
  ('d017d472-d61d-55cd-9e9a-9d28b033a8fa', '6639d352-a747-5919-8881-181c7e3527ee', 'adicional', 'Aguacate', 1500, false, true),
  ('1cc0269a-d1c9-5a89-a78b-e3def0fde1b8', '6639d352-a747-5919-8881-181c7e3527ee', 'adicional', 'Extra Proteína', 3000, false, true),
  ('e8734856-1ff5-52a2-82dc-214a8d60b23e', 'a896d95e-8c2d-5355-a095-3f756c19c931', 'adicional', 'Extra Queso', 1500, false, true),
  ('a32071e3-7e7a-55fd-90d4-dcae5652a9a6', 'a896d95e-8c2d-5355-a095-3f756c19c931', 'adicional', 'Aguacate', 1500, false, true),
  ('40f6f1c8-b87c-50aa-b634-1b2dfbd7798f', 'a896d95e-8c2d-5355-a095-3f756c19c931', 'adicional', 'Extra Proteína', 3000, false, true),
  ('bccb7690-3739-5d77-baa8-4355916ff19d', '926b822a-5f20-5bef-a19d-54a577117ca1', 'adicional', 'Extra Queso', 1500, false, true),
  ('e5348ca2-95af-5340-a610-37b4c3044149', '926b822a-5f20-5bef-a19d-54a577117ca1', 'adicional', 'Aguacate', 1500, false, true),
  ('2687a9f2-db6f-5ee9-aef8-1bb3cb4dc9ec', '926b822a-5f20-5bef-a19d-54a577117ca1', 'adicional', 'Extra Proteína', 3000, false, true),
  ('f836497a-1b25-533c-8c94-52370ee61165', '1bc8ecad-c884-55ea-8abf-797bd571d583', 'adicional', 'Extra Queso', 1500, false, true),
  ('68c15a67-ff0f-5e00-91d6-8401ad179742', '1bc8ecad-c884-55ea-8abf-797bd571d583', 'adicional', 'Aguacate', 1500, false, true),
  ('cfe35017-19e8-50f5-ace8-2d6a44e39bd4', '1bc8ecad-c884-55ea-8abf-797bd571d583', 'adicional', 'Extra Proteína', 3000, false, true),
  ('e641af96-b4a9-5684-9646-cf8fd302cccc', 'f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'adicional', 'Extra Queso', 1500, false, true),
  ('f53bc38a-37e8-5339-9985-b6ed3dd99d3e', 'f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'adicional', 'Aguacate', 1500, false, true),
  ('8218173f-575e-58cc-8273-18cefdfd88b6', 'f20dc4db-32ca-5bd2-a0db-2b97f8b00269', 'adicional', 'Extra Proteína', 3000, false, true),
  ('e18e2f46-dd2c-5100-8568-1bc11cf9bebd', '4439ef72-a361-5529-a69b-97992f677c9d', 'adicional', 'Extra Queso', 1500, false, true),
  ('69be7a32-1037-5b4e-b21e-80035e49b3c2', '4439ef72-a361-5529-a69b-97992f677c9d', 'adicional', 'Aguacate', 1500, false, true),
  ('90f6836b-8260-56c3-ad5d-0827d0a573f5', '4439ef72-a361-5529-a69b-97992f677c9d', 'adicional', 'Extra Proteína', 3000, false, true),
  ('960e71a5-5c2c-5c08-b5bb-882d47e4cea0', 'c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', 'adicional', 'Extra Queso', 1500, false, true),
  ('aaa30191-f0a9-5f04-90dc-4cb92dd70abe', 'c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', 'adicional', 'Aguacate', 1500, false, true),
  ('b3864451-b637-5241-b5c3-177d4813b67b', 'c6f2ee94-7ba2-5db2-b424-8e93b62d69a0', 'adicional', 'Extra Proteína', 3000, false, true),
  ('c9ae4059-712d-506a-9430-afbfd49836da', '122548e4-846f-50a7-8d03-720dbc9abe50', 'adicional', 'Extra Queso', 1500, false, true),
  ('9a4e21b5-7bbe-5466-83e8-19fa945cdbb1', '122548e4-846f-50a7-8d03-720dbc9abe50', 'adicional', 'Aguacate', 1500, false, true),
  ('1493b19f-86a9-5e36-92fc-ca43e6ff9715', '122548e4-846f-50a7-8d03-720dbc9abe50', 'adicional', 'Extra Proteína', 3000, false, true),
  ('7e5f31fa-4bd7-5b74-8c3d-c84c57582a4f', 'f87f4bb7-f4b4-5f45-871d-d713c0827f3c', 'adicional', 'Extra Queso', 1500, false, true),
  ('6453b7db-7063-5bb6-9dce-55d76511836a', 'f87f4bb7-f4b4-5f45-871d-d713c0827f3c', 'adicional', 'Aguacate', 1500, false, true),
  ('538b3841-9ec7-5c6f-ae54-4a67ebdb3ff3', 'f87f4bb7-f4b4-5f45-871d-d713c0827f3c', 'adicional', 'Extra Proteína', 3000, false, true),
  ('7ffa9ec6-9f66-52c5-adfe-0eaf3e592095', 'b9a6b78a-fc39-56af-9a17-7de2857a72c3', 'adicional', 'Extra Queso', 1500, false, true),
  ('76c8b666-992c-51bd-83aa-842d20789751', 'b9a6b78a-fc39-56af-9a17-7de2857a72c3', 'adicional', 'Aguacate', 1500, false, true),
  ('f6374390-77db-57b7-99f4-0acc9c523e2b', 'b9a6b78a-fc39-56af-9a17-7de2857a72c3', 'adicional', 'Extra Proteína', 3000, false, true),
  ('01534b25-cdce-5dfe-a9f9-1ca4ae943335', '6a1d664b-c701-5907-956e-f1b5204c4c89', 'adicional', 'Extra Queso', 1500, false, true),
  ('856db072-bb55-5dba-9998-dddaf38b991a', '6a1d664b-c701-5907-956e-f1b5204c4c89', 'adicional', 'Aguacate', 1500, false, true),
  ('651c29e5-13cc-5efc-83bb-84ebd200f0e9', '6a1d664b-c701-5907-956e-f1b5204c4c89', 'adicional', 'Extra Proteína', 3000, false, true),
  ('8966e0e6-8a7e-55b6-8587-05fd1bd4c759', 'bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', 'adicional', 'Extra Queso', 1500, false, true),
  ('20a800a9-0b85-5815-a674-bfd466b56eb9', 'bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', 'adicional', 'Aguacate', 1500, false, true),
  ('afecc5b5-f034-592b-b7b1-cbf6b95b6510', 'bdaf9d17-e7e6-5ec8-9f21-7874d68f2f3b', 'adicional', 'Extra Proteína', 3000, false, true),
  ('e8b9af8e-2bf4-52be-ad93-a2cd67f0e412', '50463f4b-78c1-5313-8714-7ed66788c5d8', 'adicional', 'Extra Queso', 1500, false, true),
  ('62ac72b3-9edb-565c-8f03-e7d25f81eb04', '50463f4b-78c1-5313-8714-7ed66788c5d8', 'adicional', 'Aguacate', 1500, false, true),
  ('4ba97ab6-64c6-5c60-adcf-06b769868635', '50463f4b-78c1-5313-8714-7ed66788c5d8', 'adicional', 'Extra Proteína', 3000, false, true),
  ('2cca0c7b-5f73-5755-9d37-cc6f107b891d', '32034cf8-c602-56f3-9d58-8976e6f6082b', 'adicional', 'Extra Queso', 1500, false, true),
  ('023d26c6-ad07-5d1e-8ca5-e73f1cf8f9cd', '32034cf8-c602-56f3-9d58-8976e6f6082b', 'adicional', 'Aguacate', 1500, false, true),
  ('1d568948-367f-5be8-b80b-4b770c5e9bc6', '32034cf8-c602-56f3-9d58-8976e6f6082b', 'adicional', 'Extra Proteína', 3000, false, true),
  ('274c70c7-9159-54f9-a8aa-eacb17bf2e43', '6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'adicional', 'Extra Queso', 1500, false, true),
  ('44ff7863-d2e1-562c-abf3-77a0e13f471f', '6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'adicional', 'Aguacate', 1500, false, true),
  ('6a674b52-bd0a-54cc-b3ff-d8b08a254f4b', '6c8cc269-2f43-5da5-9cd7-918a7873ec79', 'adicional', 'Extra Proteína', 3000, false, true),
  ('82ecffa1-87e9-5c41-b9a9-b0179638223f', '6ec15b93-0a19-5e08-ad10-36f8b602840b', 'adicional', 'Extra Queso', 1500, false, true),
  ('df5bc81f-89fe-5806-9663-abbc16af7f0b', '6ec15b93-0a19-5e08-ad10-36f8b602840b', 'adicional', 'Aguacate', 1500, false, true),
  ('d212e6ae-17a2-512d-95ad-db38e90c7f28', '6ec15b93-0a19-5e08-ad10-36f8b602840b', 'adicional', 'Extra Proteína', 3000, false, true),
  ('2dfdeda5-df5f-547b-8c89-9eec9fb7a5a8', '99483d64-4f38-56c4-8120-08cdc280f94f', 'adicional', 'Extra Queso', 1500, false, true),
  ('be74e587-e54d-5be2-a442-2f3e6e57b02b', '99483d64-4f38-56c4-8120-08cdc280f94f', 'adicional', 'Aguacate', 1500, false, true),
  ('24c6f55e-8c50-5df9-8905-303e98da6182', '99483d64-4f38-56c4-8120-08cdc280f94f', 'adicional', 'Extra Proteína', 3000, false, true),
  ('b1ce5b6b-304a-5a38-80c0-de32809f12c1', '735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'adicional', 'Extra Queso', 1500, false, true),
  ('db0eea07-42ea-56c2-9333-e90bcf5796c9', '735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'adicional', 'Aguacate', 1500, false, true),
  ('94c11f9e-95f5-58db-9e8c-77f889ea1047', '735ef0ae-3e51-51e7-8bd2-7665a0718b4a', 'adicional', 'Extra Proteína', 3000, false, true),
  ('84862e59-78ba-5528-ab3d-0a82dca375e8', 'e8ee8359-efd4-5c58-9c48-9224e026827b', 'adicional', 'Extra Queso', 1500, false, true),
  ('0b7b1b39-5315-5cc3-b343-25821f18c560', 'e8ee8359-efd4-5c58-9c48-9224e026827b', 'adicional', 'Aguacate', 1500, false, true),
  ('35a9f53a-ded6-5ace-8d1d-a2a225ca2e99', 'e8ee8359-efd4-5c58-9c48-9224e026827b', 'adicional', 'Extra Proteína', 3000, false, true)
ON CONFLICT DO NOTHING;

-- ── Pedido 1: mesa, ya entregado (recorre todo el flujo) ───────────────
INSERT INTO pedidos (id_pedido, id_cliente, id_direccion, id_usuario, codigo, tipo_entrega, estado, subtotal, costo_domicilio, total, tiempo_estimado_min, observaciones, fecha_pedido) VALUES
  ('30000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, 'a0000000-0000-0000-0000-000000000003',
   'DT-1001', 'mesa', 'entregado', 31500, 0, 31500, 15, 'Mesa 4', now() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO detalle_pedidos (id_detalle, id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, subtotal, observaciones) VALUES
  ('ee4145ce-11de-531d-9898-d4b93f409201', '30000000-0000-0000-0000-000000000001', 'ffc2b534-b230-5c76-8c4a-6ce2100d34df', 'Taco Birria', 3, 9000, 27000, ''),
  ('2fc3db18-0394-59b2-96c9-2ff9120d473c', '30000000-0000-0000-0000-000000000001', '1bc8ecad-c884-55ea-8abf-797bd571d583', 'Guacamole', 1, 4500, 4500, '')
ON CONFLICT DO NOTHING;

INSERT INTO historial_estados (id_historial, id_pedido, id_usuario, estado_anterior, estado_nuevo, observacion, hora_cambio) VALUES
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', NULL,             'recibido',       'Pedido recibido en caja', now() - INTERVAL '2 hours'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'recibido',       'confirmado',     '',                        now() - INTERVAL '110 minutes'),
  ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'confirmado',     'en_preparacion', '',                        now() - INTERVAL '100 minutes'),
  ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'en_preparacion', 'listo',          '',                        now() - INTERVAL '80 minutes'),
  ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'listo',          'entregado',      'Entregado en mesa',       now() - INTERVAL '75 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO pagos (id_pago, id_pedido, medio, estado, valor, referencia) VALUES
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'efectivo', 'confirmado', 31500, '')
ON CONFLICT DO NOTHING;

-- ── Pedido 2: domicilio, en preparación (demuestra el ledger de inventario) ─
INSERT INTO pedidos (id_pedido, id_cliente, id_direccion, id_usuario, codigo, tipo_entrega, estado, subtotal, costo_domicilio, total, tiempo_estimado_min, observaciones, fecha_pedido) VALUES
  ('30000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'DT-1002', 'domicilio', 'en_preparacion', 38000, 4000, 42000, 30, 'Sin cebolla en el taco pastor', now() - INTERVAL '20 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO detalle_pedidos (id_detalle, id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, subtotal, observaciones) VALUES
  ('8996ab78-5450-5f19-975b-f73f8de2b2f3', '30000000-0000-0000-0000-000000000002', 'b65aff3c-e7e2-5aa1-b3d3-0a8aec48b6c1', 'Taco Pastor', 4, 5500, 22000, ''),
  ('63c06f2a-f090-5cbf-b107-1021ec88c91e', '30000000-0000-0000-0000-000000000002', 'fe16067d-70c0-5aa9-aee0-5cefe5e20b53', 'Michelada de Mango', 2, 8000, 16000, '')
ON CONFLICT DO NOTHING;

INSERT INTO historial_estados (id_historial, id_pedido, id_usuario, estado_anterior, estado_nuevo, observacion, hora_cambio) VALUES
  ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', NULL,         'recibido',       '', now() - INTERVAL '20 minutes'),
  ('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'recibido',   'confirmado',     '', now() - INTERVAL '18 minutes'),
  ('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'confirmado', 'en_preparacion', '', now() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO pagos (id_pago, id_pedido, medio, estado, valor, referencia) VALUES
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'nequi', 'reportado', 42000, 'NEQ-58213')
ON CONFLICT DO NOTHING;

-- Consumo de inventario por la preparación del pedido DT-1002 (receta completa de
-- Taco Pastor y Michelada de Mango, multiplicada por la cantidad pedida). Cada INSERT
-- dispara trg_aplicar_movimiento_inventario, que decrementa ingredientes.cantidad_actual.
INSERT INTO movimientos_inventario (id_movimiento, id_ingrediente, id_pedido, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo, fecha_movimiento) VALUES
  ('0b845c49-b1e6-55cb-8536-3bc5e20c8e1a', 'beedf3e5-ec34-5b98-a99a-3faf127c565e', '30000000-0000-0000-0000-000000000002', 'consumo', 4, 32, 28, 'Preparación pedido DT-1002 (Taco Pastor)', now() - INTERVAL '15 minutes'),
  ('34cad120-3b59-57aa-9ebb-9d789597001f', 'acdcdcaa-be06-5b55-8fb0-c67acbe7d7a3', '30000000-0000-0000-0000-000000000002', 'consumo', 4, 32, 28, 'Preparación pedido DT-1002 (Taco Pastor)', now() - INTERVAL '15 minutes'),
  ('dc97172a-b99e-5424-833f-24e88ce50cdf', '247223ec-f117-520a-bbd5-d17d6aa1c70b', '30000000-0000-0000-0000-000000000002', 'consumo', 4, 100, 96, 'Preparación pedido DT-1002 (Taco Pastor)', now() - INTERVAL '15 minutes'),
  ('ae6c5465-1779-5245-ac47-f74cbaf48fbd', '33f95efb-f631-517d-a8d5-7d27b1cb485c', '30000000-0000-0000-0000-000000000002', 'consumo', 2, 24, 22, 'Preparación pedido DT-1002 (Taco Pastor)', now() - INTERVAL '15 minutes'),
  ('13a78a3f-5ef3-5d90-96da-fed098a518fc', 'cbec4fe1-1008-5439-8c3a-908f39bb028a', '30000000-0000-0000-0000-000000000002', 'consumo', 2, 10, 8, 'Preparación pedido DT-1002 (Taco Pastor)', now() - INTERVAL '15 minutes'),
  ('27775493-c108-5496-9c15-7ef83d0cac2b', '44190d6c-abe9-57ed-899a-d92720959c69', '30000000-0000-0000-0000-000000000002', 'consumo', 1, 30, 29, 'Preparación pedido DT-1002 (Michelada de Mango)', now() - INTERVAL '15 minutes'),
  ('8294dd33-ae86-5e15-a99a-506cc6148366', 'cc0c585e-4897-55fc-a640-9fe8c3fd728a', '30000000-0000-0000-0000-000000000002', 'consumo', 1, 8, 7, 'Preparación pedido DT-1002 (Michelada de Mango)', now() - INTERVAL '15 minutes'),
  ('9e9cb89a-c389-5fb5-9050-814d3f21c295', '13d06e6e-af36-5c4c-968c-bb4ea8167019', '30000000-0000-0000-0000-000000000002', 'consumo', 2, 110, 108, 'Preparación pedido DT-1002 (Michelada de Mango)', now() - INTERVAL '15 minutes'),
  ('b387a3e8-a14a-5bea-941d-bc357b1f04d2', '1593e8fe-348f-57fd-ad26-ccf0c00af9ab', '30000000-0000-0000-0000-000000000002', 'consumo', 2, 30, 28, 'Preparación pedido DT-1002 (Michelada de Mango)', now() - INTERVAL '15 minutes')
ON CONFLICT DO NOTHING;

-- Movimiento independiente (compra de insumos, sin pedido asociado).
INSERT INTO movimientos_inventario (id_movimiento, id_ingrediente, id_pedido, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo, fecha_movimiento) VALUES
  ('80000000-0000-0000-0000-000000000099', '8734b273-7646-5e83-a20d-dd48c3d80141', NULL, 'entrada', 10, 32, 42, 'Compra de insumos a proveedor', now() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ── Notificaciones ───────────────────────────────────────────────────
INSERT INTO notificaciones (id_notificacion, id_pedido, destinatario, tipo, mensaje, estado, fecha_envio) VALUES
  ('90000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'caja',   'nuevo_pedido',    'Nuevo pedido DT-1001 recibido',      'leida',    now() - INTERVAL '2 hours'),
  ('90000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'cocina', 'pedido_listo',    'Pedido DT-1001 listo para entregar', 'leida',    now() - INTERVAL '80 minutes'),
  ('90000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'cocina', 'nuevo_pedido',    'Nuevo pedido DT-1002 recibido',      'no_leida', now() - INTERVAL '20 minutes'),
  ('90000000-0000-0000-0000-000000000004', NULL,                                    'caja',   'inventario_bajo', 'Cilantro por debajo del mínimo',     'no_leida', now() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

-- ── Categorías del menú (nov 2026) ────────────────────────────────────────
-- Reorganiza el menú en las categorías que usa el local. Idempotente (ids fijos,
-- ON CONFLICT / UPDATE): se puede correr de nuevo sin duplicar nada.
--   * "Antojitos para Compartir" -> "Platos mexicanos" (conserva sus productos)
--   * "Platos Fuertes"           -> "Plato fuerte"
--   * Bebidas se conserva, al final.
--   * Alitas, enchiladas, perros y hamburguesas pasan a su propia categoría.
UPDATE categorias SET nombre = 'Platos mexicanos', descripcion = 'Antojitos y platos mexicanos para compartir', orden = 1
  WHERE id_categoria = '6280f3ec-852b-58db-adc2-688cbfab895c';
UPDATE categorias SET nombre = 'Plato fuerte', descripcion = 'Platos principales de mayor tamaño', orden = 4
  WHERE id_categoria = 'f8ef7307-7ed5-574c-8951-fb49e596d056';
UPDATE categorias SET orden = 5  WHERE id_categoria = 'cd762a21-6117-550d-ab6b-305ad012853b'; -- Postres
UPDATE categorias SET orden = 7  WHERE id_categoria = 'e9ea600b-197a-5df3-91d9-2f3c03963c4e'; -- Tacos
UPDATE categorias SET orden = 14 WHERE id_categoria = '5b391907-4b26-598e-b478-43859363d0a9'; -- Bebidas

INSERT INTO categorias (id_categoria, nombre, descripcion, activa, orden) VALUES
  ('c0000000-0000-4000-8000-000000000002', 'Enchiladas',            'Enchiladas',                    true, 2),
  ('c0000000-0000-4000-8000-000000000003', 'Alitas',                'Alitas de pollo',               true, 3),
  ('c0000000-0000-4000-8000-000000000006', 'Perros mexicanos',      'Perros calientes estilo Danny', true, 6),
  ('c0000000-0000-4000-8000-000000000008', 'Quesadillas',           'Quesadillas',                   true, 8),
  ('c0000000-0000-4000-8000-000000000009', 'Combos',                'Combos',                        true, 9),
  ('c0000000-0000-4000-8000-000000000010', 'Especiales de la casa', 'Especiales de la casa',         true, 10),
  ('c0000000-0000-4000-8000-000000000011', 'Burritos',              'Burritos',                      true, 11),
  ('c0000000-0000-4000-8000-000000000012', 'Hamburguesas',          'Hamburguesas',                  true, 12),
  ('c0000000-0000-4000-8000-000000000013', 'Adiciones',             'Adiciones para tu pedido',      true, 13)
ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden;

UPDATE productos SET id_categoria = 'c0000000-0000-4000-8000-000000000002' WHERE nombre = 'Enchiladas Verdes';
UPDATE productos SET id_categoria = 'c0000000-0000-4000-8000-000000000003' WHERE nombre IN ('Alitas Danny x8', 'Alitas Danny x16');
UPDATE productos SET id_categoria = 'c0000000-0000-4000-8000-000000000006' WHERE nombre = 'Perro Caliente';
UPDATE productos SET id_categoria = 'c0000000-0000-4000-8000-000000000012' WHERE nombre = 'Hamburguesa';
