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
