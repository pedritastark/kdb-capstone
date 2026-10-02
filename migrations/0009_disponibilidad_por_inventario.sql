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
