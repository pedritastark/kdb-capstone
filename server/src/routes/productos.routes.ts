import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const productosRouter = Router();

// Pública: la necesita /toma-orden (menú y precios sin login) además del panel admin.
productosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows: productos } = await pool.query(`SELECT * FROM productos ORDER BY nombre`);
    const { rows: opciones } = await pool.query(`SELECT * FROM opciones_producto ORDER BY tipo, nombre`);
    const porProducto = new Map<string, unknown[]>();
    for (const o of opciones) {
      const lista = porProducto.get(o.id_producto) ?? [];
      lista.push(o);
      porProducto.set(o.id_producto, lista);
    }
    res.json(productos.map((p) => ({ ...p, opciones: porProducto.get(p.id_producto) ?? [] })));
  }),
);

const productoSchema = z.object({
  id_categoria: z.string().uuid(),
  nombre: z.string().min(1),
  descripcion: z.string().optional().default(""),
  precio: z.number().nonnegative(),
  disponible: z.boolean().optional().default(true),
  tiempo_preparacion_min: z.number().int().nonnegative().optional().default(10),
  activo: z.boolean().optional().default(true),
  imagen_url: z.string().optional().default(""),
});

productosRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const d = productoSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO productos (id_categoria, nombre, descripcion, precio, disponible, tiempo_preparacion_min, activo, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [d.id_categoria, d.nombre, d.descripcion, d.precio, d.disponible, d.tiempo_preparacion_min, d.activo, d.imagen_url],
    );
    res.status(201).json(rows[0]);
  }),
);

productosRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const d = productoSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE productos SET id_categoria=$1, nombre=$2, descripcion=$3, precio=$4, disponible=$5,
         tiempo_preparacion_min=$6, activo=$7, imagen_url=$8
       WHERE id_producto=$9 RETURNING *`,
      [d.id_categoria, d.nombre, d.descripcion, d.precio, d.disponible, d.tiempo_preparacion_min, d.activo, d.imagen_url, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Producto no encontrado");
    res.json(rows[0]);
  }),
);

productosRouter.patch(
  "/:id/disponible",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { disponible } = z.object({ disponible: z.boolean() }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE productos SET disponible=$1 WHERE id_producto=$2 RETURNING *`,
      [disponible, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Producto no encontrado");
    res.json(rows[0]);
  }),
);

productosRouter.patch(
  "/:id/activo",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { activo } = z.object({ activo: z.boolean() }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE productos SET activo=$1 WHERE id_producto=$2 RETURNING *`,
      [activo, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Producto no encontrado");
    res.json(rows[0]);
  }),
);

productosRouter.get(
  "/:id/ingredientes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT i.*, pi.cantidad_requerida
       FROM producto_ingredientes pi
       JOIN ingredientes i USING (id_ingrediente)
       WHERE pi.id_producto = $1
       ORDER BY i.nombre`,
      [req.params.id],
    );
    res.json(rows);
  }),
);

productosRouter.get(
  "/:id/opciones",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT * FROM opciones_producto WHERE id_producto=$1 ORDER BY tipo, nombre`,
      [req.params.id],
    );
    res.json(rows);
  }),
);

const opcionSchema = z.object({
  tipo: z.enum(["proteina", "salsa", "picante", "adicional"]),
  nombre: z.string().min(1),
  precio_adicional: z.number().nonnegative().optional().default(0),
  obligatoria: z.boolean().optional().default(false),
  disponible: z.boolean().optional().default(true),
});

productosRouter.post(
  "/:id/opciones",
  requireAuth,
  asyncHandler(async (req, res) => {
    const d = opcionSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO opciones_producto (id_producto, tipo, nombre, precio_adicional, obligatoria, disponible)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, d.tipo, d.nombre, d.precio_adicional, d.obligatoria, d.disponible],
    );
    res.status(201).json(rows[0]);
  }),
);

export const opcionesRouter = Router();

opcionesRouter.patch(
  "/:id/disponible",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { disponible } = z.object({ disponible: z.boolean() }).parse(req.body);
    const { rows } = await pool.query(
      `UPDATE opciones_producto SET disponible=$1 WHERE id_opcion=$2 RETURNING *`,
      [disponible, req.params.id],
    );
    if (!rows[0]) throw new ApiError(404, "Opción no encontrada");
    res.json(rows[0]);
  }),
);
