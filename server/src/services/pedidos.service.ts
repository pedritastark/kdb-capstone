import type { PoolClient } from "pg";
import { ApiError } from "../middleware/errorHandler";
import { registrarMovimiento } from "./inventario.service";
import { crearNotificacion } from "./notificaciones.service";

export type TipoEntrega = "mesa" | "recogida" | "domicilio";
export type EstadoPedido =
  | "recibido"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "en_camino"
  | "entregado"
  | "cancelado";
export type MedioPago = "efectivo" | "nequi" | "daviplata" | "llave";

const COSTO_DOMICILIO_FIJO = 4000;

/**
 * Misma máquina de estados que siguienteEstado() en src/hooks/usePedidos.tsx
 * del frontend (incluida la rama que solo agrega "en_camino" para domicilio).
 * null = estado terminal, no hay siguiente paso.
 */
export function siguienteEstado(estado: EstadoPedido, tipoEntrega: TipoEntrega): EstadoPedido | null {
  switch (estado) {
    case "recibido":
    case "confirmado":
      return "en_preparacion";
    case "en_preparacion":
      return "listo";
    case "listo":
      return tipoEntrega === "domicilio" ? "en_camino" : "entregado";
    case "en_camino":
      return "entregado";
    default:
      return null;
  }
}

interface ItemInput {
  id_producto: string;
  cantidad: number;
  observaciones?: string;
}

export interface CrearPedidoInput {
  telefono_cliente: string;
  nombre_cliente?: string;
  tipo_entrega: TipoEntrega;
  numero_mesa?: string | null;
  id_direccion?: string | null;
  medio_pago: MedioPago;
  items: ItemInput[];
  observaciones?: string;
}

function generarCodigo(): string {
  return `DT-${Date.now().toString(36).toUpperCase()}`;
}

async function buscarOCrearCliente(
  client: PoolClient,
  telefono: string,
  nombre?: string,
): Promise<string> {
  const existente = await client.query<{ id_cliente: string }>(
    `SELECT id_cliente FROM clientes WHERE telefono = $1 LIMIT 1`,
    [telefono],
  );
  if (existente.rows[0]) return existente.rows[0].id_cliente;

  const creado = await client.query<{ id_cliente: string }>(
    `INSERT INTO clientes (nombre, telefono) VALUES ($1, $2) RETURNING id_cliente`,
    [nombre?.trim() || "Cliente mostrador", telefono],
  );
  return creado.rows[0].id_cliente;
}

const CORREO_AUTOPEDIDO = "autopedido@dannytacos.com";

async function resolverIdUsuario(client: PoolClient, id_usuario: string | null): Promise<string> {
  if (id_usuario) return id_usuario;
  // Pedido creado desde /toma-orden (ruta pública, sin sesión de staff):
  // se atribuye a la cuenta de sistema "Autopedido" sembrada en 0007_seed_data.sql.
  const { rows } = await client.query<{ id_usuario: string }>(
    `SELECT id_usuario FROM usuarios WHERE correo = $1`,
    [CORREO_AUTOPEDIDO],
  );
  if (!rows[0]) {
    throw new ApiError(
      500,
      `No existe el usuario de sistema "${CORREO_AUTOPEDIDO}" — aplica el seed (npm run seed) o crea un usuario con ese correo`,
    );
  }
  return rows[0].id_usuario;
}

export async function crearPedido(
  client: PoolClient,
  id_usuario_autenticado: string | null,
  input: CrearPedidoInput,
) {
  const id_usuario = await resolverIdUsuario(client, id_usuario_autenticado);
  if (!input.telefono_cliente?.trim()) {
    throw new ApiError(400, "El teléfono del cliente es obligatorio");
  }
  if (!input.items?.length) {
    throw new ApiError(400, "El pedido debe tener al menos un producto");
  }
  for (const item of input.items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
      throw new ApiError(400, `Cantidad inválida para el producto ${item.id_producto}`);
    }
  }

  const id_cliente = await buscarOCrearCliente(client, input.telefono_cliente, input.nombre_cliente);

  // Recalcula todo server-side — nunca confía en precio/total del cliente.
  const detalles: {
    id_producto: string;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    observaciones: string;
  }[] = [];

  for (const item of input.items) {
    const { rows } = await client.query<{
      nombre: string;
      precio: string;
      activo: boolean;
      disponible: boolean;
    }>(
      `SELECT nombre, precio, activo, disponible FROM productos WHERE id_producto = $1`,
      [item.id_producto],
    );
    const producto = rows[0];
    if (!producto) throw new ApiError(404, `Producto ${item.id_producto} no encontrado`);
    if (!producto.activo || !producto.disponible) {
      throw new ApiError(400, `"${producto.nombre}" no está disponible en este momento`);
    }
    const precio_unitario = Number(producto.precio);
    detalles.push({
      id_producto: item.id_producto,
      nombre_producto: producto.nombre,
      cantidad: item.cantidad,
      precio_unitario,
      subtotal: precio_unitario * item.cantidad,
      observaciones: item.observaciones ?? "",
    });
  }

  const subtotal = detalles.reduce((s, d) => s + d.subtotal, 0);
  const costo_domicilio = input.tipo_entrega === "domicilio" ? COSTO_DOMICILIO_FIJO : 0;
  const total = subtotal + costo_domicilio;
  const codigo = generarCodigo();

  const { rows: pedidoRows } = await client.query(
    `INSERT INTO pedidos
       (id_cliente, id_direccion, id_usuario, codigo, tipo_entrega, numero_mesa, estado,
        subtotal, costo_domicilio, total, tiempo_estimado_min, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6, 'recibido', $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      id_cliente,
      input.id_direccion ?? null,
      id_usuario,
      codigo,
      input.tipo_entrega,
      input.numero_mesa ?? null,
      subtotal,
      costo_domicilio,
      total,
      20,
      input.observaciones ?? "",
    ],
  );
  const pedido = pedidoRows[0];

  for (const d of detalles) {
    await client.query(
      `INSERT INTO detalle_pedidos
         (id_pedido, id_producto, nombre_producto, cantidad, precio_unitario, subtotal, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [pedido.id_pedido, d.id_producto, d.nombre_producto, d.cantidad, d.precio_unitario, d.subtotal, d.observaciones],
    );
  }

  await client.query(
    `INSERT INTO historial_estados (id_pedido, id_usuario, estado_anterior, estado_nuevo, observacion)
     VALUES ($1, $2, NULL, 'recibido', 'Pedido creado')`,
    [pedido.id_pedido, id_usuario],
  );

  await client.query(
    `INSERT INTO pagos (id_pedido, medio, estado, valor) VALUES ($1, $2, 'pendiente', $3)`,
    [pedido.id_pedido, input.medio_pago, total],
  );

  await crearNotificacion(client, {
    id_pedido: pedido.id_pedido,
    destinatario: "caja",
    tipo: "nuevo_pedido",
    mensaje: `Nuevo pedido ${codigo} recibido`,
  });

  return { ...pedido, detalles };
}

/**
 * RF-29: al confirmar la preparación se descuentan los ingredientes
 * controlados por cantidad, sin duplicar el movimiento. Se protege con un
 * guard: si ya existe un movimiento de tipo 'consumo' para este pedido, no
 * se vuelve a descontar.
 */
async function consumirIngredientesDePreparacion(client: PoolClient, idPedido: string, codigo: string) {
  const yaConsumido = await client.query(
    `SELECT 1 FROM movimientos_inventario WHERE id_pedido = $1 AND tipo_movimiento = 'consumo' LIMIT 1`,
    [idPedido],
  );
  if (yaConsumido.rows[0]) return;

  const { rows: lineas } = await client.query<{ id_producto: string; cantidad: number }>(
    `SELECT id_producto, cantidad FROM detalle_pedidos WHERE id_pedido = $1`,
    [idPedido],
  );

  for (const linea of lineas) {
    const { rows: receta } = await client.query<{
      id_ingrediente: string;
      cantidad_requerida: string;
      tipo_control: "cantidad" | "disponibilidad";
    }>(
      `SELECT pi.id_ingrediente, pi.cantidad_requerida, i.tipo_control
       FROM producto_ingredientes pi
       JOIN ingredientes i USING (id_ingrediente)
       WHERE pi.id_producto = $1`,
      [linea.id_producto],
    );
    for (const r of receta) {
      if (r.tipo_control !== "cantidad") continue; // los de solo-disponibilidad no se descuentan
      await registrarMovimiento(client, {
        id_ingrediente: r.id_ingrediente,
        id_pedido: idPedido,
        tipo_movimiento: "consumo",
        cantidad: Number(r.cantidad_requerida) * linea.cantidad,
        motivo: `Preparación pedido ${codigo}`,
      });
    }
  }
}

export async function avanzarEstado(client: PoolClient, id_usuario: string, idPedido: string) {
  const { rows } = await client.query(`SELECT * FROM pedidos WHERE id_pedido = $1 FOR UPDATE`, [idPedido]);
  const pedido = rows[0];
  if (!pedido) throw new ApiError(404, "Pedido no encontrado");

  const nuevo = siguienteEstado(pedido.estado, pedido.tipo_entrega);
  if (!nuevo) throw new ApiError(409, "El pedido ya está en un estado final");

  await client.query(`UPDATE pedidos SET estado = $1 WHERE id_pedido = $2`, [nuevo, idPedido]);
  await client.query(
    `INSERT INTO historial_estados (id_pedido, id_usuario, estado_anterior, estado_nuevo, observacion)
     VALUES ($1, $2, $3, $4, '')`,
    [idPedido, id_usuario, pedido.estado, nuevo],
  );

  if (nuevo === "en_preparacion") {
    await consumirIngredientesDePreparacion(client, idPedido, pedido.codigo);
  }
  if (nuevo === "listo") {
    await crearNotificacion(client, {
      id_pedido: idPedido,
      destinatario: "cliente",
      tipo: "pedido_listo",
      mensaje: `Tu pedido ${pedido.codigo} está listo`,
    });
  }

  return { ...pedido, estado: nuevo };
}

export async function cancelarPedido(client: PoolClient, id_usuario: string, idPedido: string, motivo: string) {
  if (!motivo?.trim()) throw new ApiError(400, "El motivo de cancelación es obligatorio");

  const { rows } = await client.query(`SELECT * FROM pedidos WHERE id_pedido = $1 FOR UPDATE`, [idPedido]);
  const pedido = rows[0];
  if (!pedido) throw new ApiError(404, "Pedido no encontrado");
  if (pedido.estado === "entregado" || pedido.estado === "cancelado") {
    throw new ApiError(409, "No se puede cancelar un pedido en estado final");
  }

  await client.query(`UPDATE pedidos SET estado = 'cancelado', observaciones = $1 WHERE id_pedido = $2`, [
    motivo.trim(),
    idPedido,
  ]);
  await client.query(
    `INSERT INTO historial_estados (id_pedido, id_usuario, estado_anterior, estado_nuevo, observacion)
     VALUES ($1, $2, $3, 'cancelado', $4)`,
    [idPedido, id_usuario, pedido.estado, motivo.trim()],
  );
  await crearNotificacion(client, {
    id_pedido: idPedido,
    destinatario: "caja",
    tipo: "cancelacion",
    mensaje: `Pedido ${pedido.codigo} cancelado: ${motivo.trim()}`,
  });

  return { ...pedido, estado: "cancelado" };
}
