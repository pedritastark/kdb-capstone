import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { crearNotificacion } from "../services/notificaciones.service";

export const pagosRouter = Router();

pagosRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM pagos`);
    res.json(rows);
  }),
);

const estadoSchema = z.object({
  estado: z.enum(["pendiente", "reportado", "confirmado", "rechazado"]),
});

pagosRouter.patch(
  "/:id/estado",
  requireAuth,
  requireRole("admin", "caja"),
  asyncHandler(async (req, res) => {
    const { estado } = estadoSchema.parse(req.body);

    const pago = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE pagos SET estado=$1 WHERE id_pago=$2 RETURNING *`,
        [estado, req.params.id],
      );
      const actualizado = rows[0];
      if (!actualizado) throw new ApiError(404, "Pago no encontrado");

      if (estado === "reportado") {
        const { rows: pedidoRows } = await client.query(
          `SELECT codigo FROM pedidos WHERE id_pedido=$1`,
          [actualizado.id_pedido],
        );
        await crearNotificacion(client, {
          id_pedido: actualizado.id_pedido,
          destinatario: "caja",
          tipo: "pago_reportado",
          mensaje: `Pago reportado para el pedido ${pedidoRows[0]?.codigo ?? ""}`,
        });
      }
      return actualizado;
    });

    res.json(pago);
  }),
);
