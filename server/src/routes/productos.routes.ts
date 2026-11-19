import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const productosRouter = Router();

// Pública: la necesita /toma-orden (menú y precios sin login) además del panel admin.
productosRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const { rows: productos } = await pool.query(
      `SELECT p.*,
              (SELECT count(*) FROM producto_ingredientes pi WHERE pi.id_producto = p.id_producto)::int AS n_ingredientes
       FROM productos p
       ORDER BY p.nombre`,
    );
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
  desechable: z.enum(["pequeno", "grande"]).nullable().optional().default(null),
});

productosRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const d = productoSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO productos (id_categoria, nombre, descripcion, precio, disponible, tiempo_preparacion_min, activo, imagen_url, desechable)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [d.id_categoria, d.nombre, d.descripcion, d.precio, d.disponible, d.tiempo_preparacion_min, d.activo, d.imagen_url, d.desechable],
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
         tiempo_preparacion_min=$6, activo=$7, imagen_url=$8, desechable=$9
       WHERE id_producto=$10 RETURNING *`,
      [d.id_categoria, d.nombre, d.descripcion, d.precio, d.disponible, d.tiempo_preparacion_min, d.activo, d.imagen_url, d.desechable, req.params.id],
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

// Pública: /toma-orden la usa para mostrar "qué trae" cada plato y dejar
// quitar ingredientes al personalizar el pedido.
productosRouter.get(
  "/:id/ingredientes",
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

const recetaSchema = z.object({
  ingredientes: z
    .array(
      z.object({
        id_ingrediente: z.string().uuid(),
        cantidad_requerida: z.number().positive().max(100000),
      }),
    )
    .max(80),
});

const RECETA_SQL = `SELECT i.*, pi.cantidad_requerida
  FROM producto_ingredientes pi
  JOIN ingredientes i USING (id_ingrediente)
  WHERE pi.id_producto = $1
  ORDER BY i.nombre`;

// Reemplaza la receta COMPLETA de un plato (qué ingredientes lleva y cuánto consume
// cada unidad vendida). Todo en una transacción: o queda la receta nueva entera o
// la anterior. Los triggers de la base (0009) recalculan solos si el plato queda
// disponible según el stock. Lista vacía = plato sin receta (no descuenta inventario).
productosRouter.put(
  "/:id/ingredientes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const idProducto = z.string().uuid().safeParse(req.params.id);
    if (!idProducto.success) throw new ApiError(404, "Producto no encontrado");
    const { ingredientes } = recetaSchema.parse(req.body);

    // NUMERIC(10,3): se redondea a 3 decimales, y no puede quedar en 0
    const lineas = ingredientes.map((i) => ({
      id: i.id_ingrediente,
      cantidad: Math.round(i.cantidad_requerida * 1000) / 1000,
    }));
    if (lineas.some((l) => l.cantidad <= 0)) {
      throw new ApiError(400, "La cantidad de cada ingrediente debe ser mayor a 0");
    }
    if (new Set(lineas.map((l) => l.id)).size !== lineas.length) {
      throw new ApiError(400, "Un ingrediente no puede repetirse en la receta");
    }

    const receta = await withTransaction(async (client) => {
      const { rows: producto } = await client.query(
        `SELECT 1 FROM productos WHERE id_producto = $1 FOR UPDATE`,
        [idProducto.data],
      );
      if (!producto[0]) throw new ApiError(404, "Producto no encontrado");

      if (lineas.length) {
        const { rows: existentes } = await client.query(
          `SELECT id_ingrediente FROM ingredientes WHERE id_ingrediente = ANY($1::uuid[])`,
          [lineas.map((l) => l.id)],
        );
        if (existentes.length !== lineas.length) throw new ApiError(400, "Alguno de los ingredientes no existe");
      }

      await client.query(`DELETE FROM producto_ingredientes WHERE id_producto = $1`, [idProducto.data]);
      for (const l of lineas) {
        await client.query(
          `INSERT INTO producto_ingredientes (id_producto, id_ingrediente, cantidad_requerida) VALUES ($1, $2, $3)`,
          [idProducto.data, l.id, l.cantidad],
        );
      }
      const { rows } = await client.query(RECETA_SQL, [idProducto.data]);
      return rows;
    });

    res.json(receta);
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
