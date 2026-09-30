import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const clientesRouter = Router();
clientesRouter.use(requireAuth); // todo este router es de uso interno (staff)

clientesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`SELECT * FROM clientes ORDER BY nombre`);
    res.json(rows);
  }),
);

const clienteSchema = z.object({
  nombre: z.string().min(1),
  correo: z.string().optional().default(""),
  telefono: z.string().min(1),
});

clientesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const d = clienteSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre, correo, telefono) VALUES ($1, $2, $3) RETURNING *`,
      [d.nombre, d.correo, d.telefono],
    );
    res.status(201).json(rows[0]);
  }),
);

clientesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const d = clienteSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE clientes SET nombre=$1, correo=$2, telefono=$3 WHERE id_cliente=$4 RETURNING *`,
      [d.nombre, d.correo, d.telefono, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Cliente no encontrado");
    res.json(rows[0]);
  }),
);

clientesRouter.get(
  "/:id/direcciones",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`SELECT * FROM direcciones WHERE id_cliente=$1`, [req.params.id]);
    res.json(rows);
  }),
);

const direccionSchema = z.object({
  direccion: z.string().min(1),
  referencia: z.string().optional().default(""),
});

clientesRouter.post(
  "/:id/direcciones",
  asyncHandler(async (req, res) => {
    const d = direccionSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO direcciones (id_cliente, direccion, referencia) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, d.direccion, d.referencia],
    );
    res.status(201).json(rows[0]);
  }),
);

clientesRouter.get(
  "/:id/pedidos",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM pedidos WHERE id_cliente=$1 ORDER BY fecha_pedido DESC`,
      [req.params.id],
    );
    res.json(rows);
  }),
);
