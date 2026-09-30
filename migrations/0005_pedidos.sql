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
