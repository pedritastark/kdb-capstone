import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const categoriasRouter = Router();

// Pública: la necesita /toma-orden (menú sin login) además del panel admin.
categoriasRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM categorias ORDER BY nombre`);
    res.json(rows);
  }),
);

const categoriaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().default(""),
  activa: z.boolean().optional().default(true),
});

categoriasRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = categoriaSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO categorias (nombre, descripcion, activa) VALUES ($1, $2, $3) RETURNING *`,
      [data.nombre, data.descripcion, data.activa],
    );
    res.status(201).json(rows[0]);
  }),
);

categoriasRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = categoriaSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE categorias SET nombre = $1, descripcion = $2, activa = $3 WHERE id_categoria = $4 RETURNING *`,
      [data.nombre, data.descripcion, data.activa, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Categoría no encontrada");
    res.json(rows[0]);
  }),
);

categoriasRouter.patch(
  "/:id/activa",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { activa } = z.object({ activa: z.boolean() }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE categorias SET activa = $1 WHERE id_categoria = $2 RETURNING *`,
      [activa, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Categoría no encontrada");
    res.json(rows[0]);
  }),
);
