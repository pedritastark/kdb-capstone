import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

export const notificacionesRouter = Router();
notificacionesRouter.use(requireAuth); // todo este router es de uso interno (staff)

notificacionesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const destinatario = typeof req.query.destinatario === "string" ? req.query.destinatario : undefined;
    const { rows } = destinatario
      ? await pool.query(
          `SELECT * FROM notificaciones WHERE destinatario=$1 ORDER BY fecha_envio DESC`,
          [destinatario],
        )
      : await pool.query(`SELECT * FROM notificaciones ORDER BY fecha_envio DESC`);
    res.json(rows);
  }),
);

notificacionesRouter.patch(
  "/marcar-todas-leidas",
  asyncHandler(async (_req, res) => {
    await pool.query(`UPDATE notificaciones SET estado='leida' WHERE estado='no_leida'`);
    res.status(204).send();
  }),
);

notificacionesRouter.patch(
  "/:id/leida",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE notificaciones SET estado='leida' WHERE id_notificacion=$1 RETURNING *`,
      [req.params.id],
    );
    res.json(rows[0]);
  }),
);
