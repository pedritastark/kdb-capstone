import type { Pool, PoolClient } from "pg";

type Queryable = Pool | PoolClient;

export type Destinatario = "cocina" | "caja" | "cliente";
export type TipoNotificacion =
  | "nuevo_pedido"
  | "pago_reportado"
  | "inventario_bajo"
  | "pedido_listo"
  | "cancelacion";

export async function crearNotificacion(
  db: Queryable,
  input: {
    id_pedido?: string | null;
    destinatario: Destinatario;
    tipo: TipoNotificacion;
    mensaje: string;
  },
) {
  await db.query(
    `INSERT INTO notificaciones (id_pedido, destinatario, tipo, mensaje)
     VALUES ($1, $2, $3, $4)`,
    [input.id_pedido ?? null, input.destinatario, input.tipo, input.mensaje],
  );
}
