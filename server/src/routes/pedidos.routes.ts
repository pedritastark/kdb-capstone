import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../db";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { avanzarEstado, cancelarPedido, crearPedido } from "../services/pedidos.service";

export const pedidosRouter = Router();

// GET/avanzar/cancelar son de uso interno (Kanban de cocina/caja) — sí requieren sesión.
pedidosRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const estado = typeof req.query.estado === "string" ? req.query.estado : undefined;
    const { rows } = estado
      ? await pool.query(`SELECT * FROM pedidos WHERE estado=$1 ORDER BY fecha_pedido`, [estado])
      : await pool.query(`SELECT * FROM pedidos ORDER BY fecha_pedido`);
    res.json(rows);
  }),
);

pedidosRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows: pedidoRows } = await pool.query(`SELECT * FROM pedidos WHERE id_pedido=$1`, [req.params.id]);
    const pedido = pedidoRows[0];
    if (!pedido) throw new ApiError(404, "Pedido no encontrado");

    const { rows: detalles } = await pool.query(
      `SELECT * FROM detalle_pedidos WHERE id_pedido=$1`,
      [req.params.id],
    );
    for (const d of detalles) {
      const { rows: opciones } = await pool.query(
        `SELECT * FROM detalle_opciones WHERE id_detalle=$1`,
        [d.id_detalle],
      );
      d.opciones = opciones;
    }
    const { rows: historial } = await pool.query(
      `SELECT * FROM historial_estados WHERE id_pedido=$1 ORDER BY hora_cambio`,
      [req.params.id],
    );
    const { rows: pagos } = await pool.query(`SELECT * FROM pagos WHERE id_pedido=$1`, [req.params.id]);

    res.json({ ...pedido, detalles, historial, pagos });
  }),
);

const itemSchema = z.object({
  id_producto: z.string().uuid(),
  cantidad: z.number().int().positive(),
  observaciones: z.string().optional(),
});

const crearPedidoSchema = z.object({
  telefono_cliente: z.string().min(1),
  nombre_cliente: z.string().optional(),
  tipo_entrega: z.enum(["mesa", "recogida", "domicilio"]),
  numero_mesa: z.string().optional().nullable(),
  id_direccion: z.string().uuid().optional().nullable(),
  medio_pago: z.enum(["efectivo", "nequi", "daviplata", "llave"]),
  items: z.array(itemSchema).min(1),
  observaciones: z.string().optional(),
});

// Pública a propósito: /toma-orden (autopedido del cliente en la mesa) no
// tiene sesión de staff. Si SÍ viene un token válido (pedido tomado por un
// miembro del staff), se usa ese usuario; si no, se atribuye a la cuenta de
// sistema "Autopedido" (ver pedidos.service.ts).
pedidosRouter.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const input = crearPedidoSchema.parse(req.body);
    const pedido = await withTransaction((client) =>
      crearPedido(client, req.usuario?.id_usuario ?? null, input),
    );
    res.status(201).json(pedido);
  }),
);

pedidosRouter.patch(
  "/:id/avanzar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pedido = await withTransaction((client) =>
      avanzarEstado(client, req.usuario!.id_usuario, req.params.id),
    );
    res.json(pedido);
  }),
);

const cancelarSchema = z.object({ motivo: z.string().min(1) });

pedidosRouter.post(
  "/:id/cancelar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { motivo } = cancelarSchema.parse(req.body);
    const pedido = await withTransaction((client) =>
      cancelarPedido(client, req.usuario!.id_usuario, req.params.id, motivo),
    );
    res.json(pedido);
  }),
);
