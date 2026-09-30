import type { PoolClient } from "pg";
import { ApiError } from "../middleware/errorHandler";
import { crearNotificacion } from "./notificaciones.service";

export type TipoMovimientoInventario =
  | "entrada"
  | "consumo"
  | "perdida"
  | "ajuste"
  | "devolucion";

const MOVIMIENTOS_QUE_SUMAN: TipoMovimientoInventario[] = ["entrada", "devolucion"];

interface Ingrediente {
  id_ingrediente: string;
  nombre: string;
  cantidad_actual: string;
  cantidad_minima: string;
}

/**
 * Replica la lógica de useInventario.registrarMovimiento del frontend:
 * entrada/devolucion suman, el resto resta, clamp en 0. El trigger
 * trg_aplicar_movimiento_inventario de la BD mantiene cantidad_actual en el
 * mismo valor de forma independiente — aquí solo se necesita cantidad_anterior
 * / cantidad_nueva para el registro de auditoría del propio movimiento.
 * Debe llamarse dentro de una transacción (usa SELECT ... FOR UPDATE).
 */
export async function registrarMovimiento(
  client: PoolClient,
  input: {
    id_ingrediente: string;
    id_pedido?: string | null;
    tipo_movimiento: TipoMovimientoInventario;
    cantidad: number;
    motivo: string;
  },
) {
  const { rows } = await client.query<Ingrediente>(
    `SELECT id_ingrediente, nombre, cantidad_actual, cantidad_minima
     FROM ingredientes WHERE id_ingrediente = $1 FOR UPDATE`,
    [input.id_ingrediente],
  );
  const ingrediente = rows[0];
  if (!ingrediente) throw new ApiError(404, "Ingrediente no encontrado");

  const suma = MOVIMIENTOS_QUE_SUMAN.includes(input.tipo_movimiento);
  const delta = suma ? input.cantidad : -input.cantidad;
  const anterior = Number(ingrediente.cantidad_actual);
  const nueva = Math.max(0, anterior + delta);

  const { rows: movRows } = await client.query(
    `INSERT INTO movimientos_inventario
       (id_ingrediente, id_pedido, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.id_ingrediente,
      input.id_pedido ?? null,
      input.tipo_movimiento,
      input.cantidad,
      anterior,
      nueva,
      input.motivo,
    ],
  );

  if (nueva <= Number(ingrediente.cantidad_minima)) {
    await crearNotificacion(client, {
      destinatario: "caja",
      tipo: "inventario_bajo",
      mensaje: `${ingrediente.nombre} por debajo del mínimo (quedan ${nueva}).`,
    });
  }

  return movRows[0];
}
