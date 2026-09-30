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
