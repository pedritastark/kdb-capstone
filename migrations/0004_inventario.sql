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
