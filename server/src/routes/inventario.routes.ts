import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { registrarMovimiento } from "../services/inventario.service";

export const inventarioRouter = Router();
inventarioRouter.use(requireAuth); // todo este router es de uso interno (staff)

inventarioRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM ingredientes ORDER BY nombre`);
    res.json(rows);
  }),
);

const ingredienteSchema = z.object({
  nombre: z.string().min(1),
  unidad_medida: z.string().min(1),
  tipo_control: z.enum(["cantidad", "disponibilidad"]),
  cantidad_actual: z.number().nonnegative().optional().default(0),
  cantidad_minima: z.number().nonnegative().optional().default(0),
  disponible: z.boolean().optional().default(true),
  activo: z.boolean().optional().default(true),
});

inventarioRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const d = ingredienteSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO ingredientes (nombre, unidad_medida, tipo_control, cantidad_actual, cantidad_minima, disponible, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [d.nombre, d.unidad_medida, d.tipo_control, d.cantidad_actual, d.cantidad_minima, d.disponible, d.activo],
    );
    res.status(201).json(rows[0]);
  }),
);

inventarioRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const d = ingredienteSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE ingredientes SET nombre=$1, unidad_medida=$2, tipo_control=$3, cantidad_minima=$4,
         disponible=$5, activo=$6
       WHERE id_ingrediente=$7 RETURNING *`,
      [d.nombre, d.unidad_medida, d.tipo_control, d.cantidad_minima, d.disponible, d.activo, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Ingrediente no encontrado");
    res.json(rows[0]);
  }),
);

inventarioRouter.patch(
  "/:id/disponible",
  asyncHandler(async (req, res) => {
    const { disponible } = z.object({ disponible: z.boolean() }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE ingredientes SET disponible=$1 WHERE id_ingrediente=$2 RETURNING *`,
      [disponible, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Ingrediente no encontrado");
    res.json(rows[0]);
  }),
);

inventarioRouter.get(
  "/:id/movimientos",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM movimientos_inventario WHERE id_ingrediente=$1 ORDER BY fecha_movimiento DESC`,
      [req.params.id],
    );
    res.json(rows);
  }),
);

const movimientoSchema = z.object({
  tipo_movimiento: z.enum(["entrada", "consumo", "perdida", "ajuste", "devolucion"]),
  cantidad: z.number().positive(),
  motivo: z.string().min(1),
  id_pedido: z.string().uuid().optional().nullable(),
});

inventarioRouter.post(
  "/:id/movimientos",
  asyncHandler(async (req, res) => {
    const d = movimientoSchema.parse(req.body);
    const movimiento = await withTransaction((client) =>
      registrarMovimiento(client, {
        id_ingrediente: req.params.id,
        id_pedido: d.id_pedido ?? null,
        tipo_movimiento: d.tipo_movimiento,
        cantidad: d.cantidad,
        motivo: d.motivo,
      }),
    );
    res.status(201).json(movimiento);
  }),
);
