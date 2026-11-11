import { z } from "zod";
import { pool, withTransaction } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { crearNotificacion } from "./notificaciones.service";
import { crearPedido, type MedioPago } from "./pedidos.service";

/**
 * Chatbot de toma de pedidos (domicilio y recogida).
 *
 * Es una máquina de estados SIN estado en el servidor: cada respuesta incluye
 * el `estado` completo de la conversación y el cliente lo reenvía en el
 * siguiente mensaje. Así no depende de memoria del proceso (Render free se
 * duerme/reinicia). Precios y totales se recalculan igual en crearPedido(),
 * nunca se confía en lo que diga el estado.
 */

// ── Tipos ─────────────────────────────────────────────────────────────────

const PASOS = [
  "telefono",
  "nombre",
  "menu",
  "entrega",
  "dir_confirmar",
  "direccion",
  "referencia",
  "categoria",
  "producto",
  "cantidad",
  "personalizar",
  "excluir",
  "adicionales",
  "mas",
  "modificar_menu",
  "modificar_lista",
  "editar_linea",
  "editar_cantidad",
  "pago",
  "resumen",
  "fin",
] as const;
type Paso = (typeof PASOS)[number];

const adicionalSchema = z.object({
  id_opcion: z.string().uuid(),
  nombre: z.string(),
  precio_adicional: z.number(),
});
type Adicional = z.infer<typeof adicionalSchema>;

const lineaSchema = z.object({
  id_producto: z.string().uuid(),
  nombre: z.string(),
  precio: z.number(),
  cantidad: z.number().int().min(1).max(50),
  excluidos: z.array(z.string()),
  adicionales: z.array(adicionalSchema),
});
type Linea = z.infer<typeof lineaSchema>;

const MEDIOS = ["efectivo", "nequi", "daviplata", "llave"] as const;

export const estadoSchema = z.object({
  paso: z.enum(PASOS),
  telefono: z.string().optional(),
  nombre: z.string().optional(),
  idCliente: z.string().uuid().optional(),
  tipo: z.enum(["recogida", "domicilio"]).optional(),
  direccion: z.string().optional(),
  referencia: z.string().optional(),
  idDireccion: z.string().uuid().optional(),
  medio: z.enum(MEDIOS).optional(),
  carrito: z.array(lineaSchema).default([]),
  tmp: z
    .object({
      /** ids (o nombres) mostrados en la última lista numerada, en orden */
      lista: z.array(z.string()).optional(),
      listaAd: z.array(adicionalSchema).optional(),
      categoriaId: z.string().uuid().optional(),
      producto: z.object({ id: z.string().uuid(), nombre: z.string(), precio: z.number() }).optional(),
      cantidad: z.number().int().optional(),
      excl: z.array(z.string()).optional(),
      adic: z.array(adicionalSchema).optional(),
      editIdx: z.number().int().optional(),
      dirGuardada: z
        .object({ id: z.string().uuid(), direccion: z.string(), referencia: z.string().nullable() })
        .optional(),
    })
    .default({}),
});
export type Estado = z.infer<typeof estadoSchema>;

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface Respuesta {
  estado: Estado;
  mensajes: string[];
  opciones: Opcion[];
  /** true = el cliente puede marcar varias opciones y enviarlas juntas ("1,3") */
  multi?: boolean;
  /** pista para el input libre del frontend */
  entrada: "opciones" | "texto" | "telefono" | "numero";
  finalizado?: boolean;
  pedido?: { codigo: string; total: number };
}

// ── Utilidades ────────────────────────────────────────────────────────────

const LOCAL_DIRECCION = () => process.env.LOCAL_DIRECCION?.trim() || "nuestro local de Danny Tacos";

const moneda = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const MEDIO_LABEL: Record<MedioPago, string> = {
  efectivo: "Efectivo 💵",
  nequi: "Nequi 📱",
  daviplata: "Daviplata 📱",
  llave: "Llave 🔑",
};

function emojiCategoria(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("taco")) return "🌮";
  if (n.includes("burrito")) return "🌯";
  if (n.includes("quesadilla")) return "🧀";
  if (n.includes("bebida")) return "🥤";
  if (n.includes("postre")) return "🍰";
  if (n.includes("adicional")) return "🍟";
  if (n.includes("antojito")) return "🥟";
  if (n.includes("plato")) return "🍽️";
  return "🍴";
}

const precioUnitarioLinea = (l: Linea) => l.precio + l.adicionales.reduce((s, a) => s + a.precio_adicional, 0);
const totalLinea = (l: Linea) => precioUnitarioLinea(l) * l.cantidad;
const totalCarrito = (e: Estado) => e.carrito.reduce((s, l) => s + totalLinea(l), 0);

function descripcionLinea(l: Linea): string {
  const extras = [
    ...(l.excluidos.length ? [`sin ${l.excluidos.join(", ")}`] : []),
    ...l.adicionales.map((a) => `+ ${a.nombre}`),
  ];
  return `${l.cantidad}x ${l.nombre}${extras.length ? ` (${extras.join("; ")})` : ""}`;
}

/** "2" → 2 (índice 1-based) si cae en 1..max; si no, null. */
function indice(texto: string, max: number): number | null {
  if (!/^\d+$/.test(texto)) return null;
  const n = Number(texto);
  return n >= 1 && n <= max ? n : null;
}

/** "1, 3 y 4" → [1,3,4] únicos y válidos; null si algo no es válido. */
function indicesMultiples(texto: string, max: number): number[] | null {
  const partes = texto.split(/[\s,;y]+/i).filter(Boolean);
  if (!partes.length) return null;
  const out = new Set<number>();
  for (const p of partes) {
    const n = indice(p, max);
    if (n === null) return null;
    out.add(n);
  }
  return [...out];
}

function resp(
  estado: Estado,
  mensajes: string[],
  opciones: Opcion[] = [],
  extra: Partial<Respuesta> = {},
): Respuesta {
  return { estado, mensajes, opciones, entrada: opciones.length ? "opciones" : "texto", ...extra };
}

const nuevoEstado = (base?: Partial<Estado>): Estado => ({ paso: "telefono", carrito: [], tmp: {}, ...base });

/** Vuelve al menú principal conservando los datos del cliente. */
function reiniciar(e: Estado): Estado {
  return {
    paso: "menu",
    telefono: e.telefono,
    nombre: e.nombre,
    idCliente: e.idCliente,
    carrito: [],
    tmp: {},
  };
}

// ── Preguntas (lo que el bot dice al ENTRAR a cada paso) ─────────────────

async function preguntar(e: Estado, prefijo: string[] = []): Promise<Respuesta> {
  const con = (r: Respuesta): Respuesta => ({ ...r, mensajes: [...prefijo, ...r.mensajes] });

  switch (e.paso) {
    case "telefono":
      return con(
        resp(
          e,
          [
            "¡Hola! 👋 Bienvenido a Danny Tacos 🌮",
            "Soy el asistente virtual y te ayudo a hacer tu pedido por aquí mismo. Para empezar, ¿me das tu número de celular?",
          ],
          [],
          { entrada: "telefono" },
        ),
      );

    case "nombre":
      return con(resp(e, ["Aún no te tengo registrado. ¿Cómo te llamas?"]));

    case "menu":
      return con(
        resp(e, ["¿Qué quieres hacer?"], [
          { valor: "1", etiqueta: "Hacer un pedido 🌮" },
          { valor: "2", etiqueta: "Hablar con alguien del restaurante 🙋" },
        ]),
      );

    case "entrega":
      return con(
        resp(e, ["¿Cómo quieres recibir tu pedido?"], [
          { valor: "1", etiqueta: "A domicilio 🛵 (sin costo)" },
          { valor: "2", etiqueta: "Pasar a recogerlo 🏪" },
        ]),
      );

    case "dir_confirmar": {
      const d = e.tmp.dirGuardada!;
      return con(
        resp(e, [`¿Te lo enviamos a esta dirección?\n📍 ${d.direccion}${d.referencia ? ` — ${d.referencia}` : ""}`], [
          { valor: "1", etiqueta: "Sí, a esa dirección ✅" },
          { valor: "2", etiqueta: "Usar otra dirección" },
        ]),
      );
    }

    case "direccion":
      return con(resp(e, ["Escríbeme tu dirección completa de entrega (calle, número y barrio) 📍"]));

    case "referencia":
      return con(
        resp(e, ["¿Alguna referencia para encontrarte más fácil? (ej: casa blanca, portería, apto 302)"], [
          { valor: "no", etiqueta: "Sin referencia" },
        ]),
      );

    case "categoria": {
      const { rows } = await pool.query<{ id_categoria: string; nombre: string }>(
        `SELECT c.id_categoria, c.nombre
         FROM categorias c
         WHERE c.activa AND EXISTS (
           SELECT 1 FROM productos p
           WHERE p.id_categoria = c.id_categoria AND p.activo AND p.disponible)
         ORDER BY c.created_at, c.nombre`,
      );
      const estado: Estado = { ...e, tmp: { ...e.tmp, lista: rows.map((r) => r.id_categoria) } };
      const opciones: Opcion[] = rows.map((r, i) => ({
        valor: String(i + 1),
        etiqueta: `${r.nombre} ${emojiCategoria(r.nombre)}`,
      }));
      if (e.carrito.length) opciones.push({ valor: "0", etiqueta: "Ya terminé, ver mi pedido ✅" });
      return con(
        resp(estado, [e.carrito.length ? "Elige otra categoría 👇" : "Esto es lo que tenemos hoy 👇"], opciones),
      );
    }

    case "producto": {
      const { rows: cat } = await pool.query<{ nombre: string }>(`SELECT nombre FROM categorias WHERE id_categoria=$1`, [
        e.tmp.categoriaId,
      ]);
      const { rows } = await pool.query<{ id_producto: string; nombre: string; precio: number }>(
        `SELECT id_producto, nombre, precio FROM productos
         WHERE id_categoria=$1 AND activo AND disponible ORDER BY nombre`,
        [e.tmp.categoriaId],
      );
      const estado: Estado = { ...e, tmp: { ...e.tmp, lista: rows.map((r) => r.id_producto) } };
      const nombreCat = cat[0]?.nombre ?? "Productos";
      return con(
        resp(
          estado,
          [`${emojiCategoria(nombreCat)} ${nombreCat}\nElige el producto que quieres agregar.`],
          [
            ...rows.map((r, i) => ({ valor: String(i + 1), etiqueta: `${r.nombre} — ${moneda(r.precio)}` })),
            { valor: "0", etiqueta: "⬅️ Volver a las categorías" },
          ],
        ),
      );
    }

    case "cantidad":
      return con(
        resp(
          e,
          [`¿Cuántas unidades de ${e.tmp.producto!.nombre} quieres? (toca un número o escríbelo)`],
          [
            ...["1", "2", "3", "4", "5"].map((v) => ({ valor: v, etiqueta: v })),
            { valor: "0", etiqueta: "⬅️ Volver" },
          ],
          { entrada: "numero" },
        ),
      );

    case "personalizar": {
      const { ingredientes, adicionales } = await datosPersonalizacion(e.tmp.producto!.id);
      const opciones: Opcion[] = [{ valor: "1", etiqueta: "Así está bien ✅" }];
      if (ingredientes.length) opciones.push({ valor: "2", etiqueta: "Quitar ingredientes ✂️" });
      if (adicionales.length) opciones.push({ valor: "3", etiqueta: "Agregar adicionales ➕" });
      const cambios = [
        ...(e.tmp.excl?.length ? [`Sin: ${e.tmp.excl.join(", ")}`] : []),
        ...(e.tmp.adic?.length ? [`Adicionales: ${e.tmp.adic.map((a) => a.nombre).join(", ")}`] : []),
      ];
      return con(
        resp(e, [
          `¿Quieres personalizar tu ${e.tmp.producto!.nombre}?${cambios.length ? `\n${cambios.join("\n")}` : ""}`,
        ], opciones),
      );
    }

    case "excluir": {
      const { ingredientes } = await datosPersonalizacion(e.tmp.producto!.id);
      const estado: Estado = { ...e, tmp: { ...e.tmp, lista: ingredientes } };
      return con(
        resp(
          estado,
          ["Marca los ingredientes que NO quieres y pulsa Listo (o escribe los números separados por coma)."],
          [
            ...ingredientes.map((n, i) => ({ valor: String(i + 1), etiqueta: n })),
            { valor: "0", etiqueta: "Listo / ninguno" },
          ],
          { multi: true },
        ),
      );
    }

    case "adicionales": {
      const { adicionales } = await datosPersonalizacion(e.tmp.producto!.id);
      const estado: Estado = { ...e, tmp: { ...e.tmp, listaAd: adicionales } };
      return con(
        resp(
          estado,
          ["Marca los adicionales que quieras y pulsa Listo (o escribe los números separados por coma)."],
          [
            ...adicionales.map((a, i) => ({
              valor: String(i + 1),
              etiqueta: `${a.nombre} (+${moneda(a.precio_adicional)})`,
            })),
            { valor: "0", etiqueta: "Listo / ninguno" },
          ],
          { multi: true },
        ),
      );
    }

    case "mas":
      return con(
        resp(e, ["¿Quieres agregar algo más?"], [
          { valor: "1", etiqueta: "Sí, seguir viendo el menú 🌮" },
          { valor: "2", etiqueta: "No, ya terminé ✅" },
          { valor: "3", etiqueta: "Modificar mi pedido ✏️" },
        ]),
      );

    case "modificar_menu":
      return con(
        resp(e, ["¿Qué quieres modificar?"], [
          { valor: "1", etiqueta: "Agregar más productos ➕" },
          { valor: "2", etiqueta: "Quitar o cambiar cantidades ✏️" },
          { valor: "3", etiqueta: "Cambiar el medio de pago 💳" },
          { valor: "4", etiqueta: "Cancelar todo el pedido ❌" },
          { valor: "0", etiqueta: "⬅️ Volver" },
        ]),
      );

    case "modificar_lista":
      return con(
        resp(e, ["Elige el producto que quieres cambiar o quitar:"], [
          ...e.carrito.map((l, i) => ({ valor: String(i + 1), etiqueta: `${descripcionLinea(l)} — ${moneda(totalLinea(l))}` })),
          { valor: "0", etiqueta: "⬅️ Volver" },
        ]),
      );

    case "editar_linea": {
      const l = e.carrito[e.tmp.editIdx ?? -1];
      return con(
        resp(e, [`¿Qué hacemos con ${l ? descripcionLinea(l) : "este producto"}?`], [
          { valor: "1", etiqueta: "Cambiar la cantidad 🔢" },
          { valor: "2", etiqueta: "Quitarlo del pedido 🗑️" },
          { valor: "0", etiqueta: "⬅️ Volver" },
        ]),
      );
    }

    case "editar_cantidad":
      return con(
        resp(
          e,
          ["¿Cuántas unidades quieres ahora? (toca un número o escríbelo)"],
          [
            ...["1", "2", "3", "4", "5"].map((v) => ({ valor: v, etiqueta: v })),
            { valor: "0", etiqueta: "⬅️ Volver" },
          ],
          { entrada: "numero" },
        ),
      );

    case "pago":
      return con(
        resp(
          e,
          [`¿Cómo vas a pagar? Pagas ${e.tipo === "domicilio" ? "cuando te llegue el pedido" : "cuando pases a recogerlo"} 💳`],
          [
            ...MEDIOS.map((m, i) => ({ valor: String(i + 1), etiqueta: MEDIO_LABEL[m] })),
            { valor: "0", etiqueta: "⬅️ Volver" },
          ],
        ),
      );

    case "resumen":
      return con(resp(e, [resumenTexto(e), "¿Confirmas tu pedido?"], [
        { valor: "1", etiqueta: "Sí, confirmar ✅" },
        { valor: "2", etiqueta: "No, quiero modificarlo ✏️" },
      ]));

    case "fin":
      return con(resp(e, [], [{ valor: "1", etiqueta: "Hacer otro pedido 🌮" }]));
  }
}

function resumenTexto(e: Estado): string {
  const lineas = e.carrito.map((l) => `${descripcionLinea(l)} — ${moneda(totalLinea(l))}`);
  const entrega =
    e.tipo === "domicilio"
      ? `🛵 Domicilio a: ${e.direccion}${e.referencia ? ` (${e.referencia})` : ""}\nCosto de domicilio: Gratis`
      : `🏪 Recoges en: ${LOCAL_DIRECCION()}`;
  return [
    "🧾 Resumen de tu pedido",
    "",
    ...lineas,
    "",
    entrega,
    `💳 Pago: ${MEDIO_LABEL[e.medio!]}`,
    `Total: ${moneda(totalCarrito(e))}`,
  ].join("\n");
}

async function datosPersonalizacion(idProducto: string) {
  const { rows: ing } = await pool.query<{ nombre: string }>(
    `SELECT i.nombre FROM producto_ingredientes pi
     JOIN ingredientes i ON i.id_ingrediente = pi.id_ingrediente
     WHERE pi.id_producto = $1 ORDER BY i.nombre`,
    [idProducto],
  );
  const { rows: ad } = await pool.query<Adicional>(
    `SELECT id_opcion, nombre, precio_adicional FROM opciones_producto
     WHERE id_producto = $1 AND tipo = 'adicional' AND disponible ORDER BY nombre`,
    [idProducto],
  );
  return { ingredientes: ing.map((r) => r.nombre), adicionales: ad };
}

// ── Transiciones ──────────────────────────────────────────────────────────

const ir = (e: Estado, paso: Paso, prefijo: string[] = []) => preguntar({ ...e, paso }, prefijo);

const NO_ENTENDI = "No te entendí 😅 Elige una de las opciones.";

function agregarLinea(e: Estado, cantidad: number): Estado {
  const p = e.tmp.producto!;
  const excluidos = [...(e.tmp.excl ?? [])].sort();
  const adicionales = e.tmp.adic ?? [];
  const clave = (l: Linea) =>
    `${l.id_producto}|${[...l.excluidos].sort().join(",")}|${l.adicionales.map((a) => a.id_opcion).sort().join(",")}`;
  const nueva: Linea = { id_producto: p.id, nombre: p.nombre, precio: p.precio, cantidad, excluidos, adicionales };
  const carrito = [...e.carrito];
  const existente = carrito.findIndex((l) => clave(l) === clave(nueva));
  if (existente >= 0) {
    carrito[existente] = { ...carrito[existente], cantidad: Math.min(50, carrito[existente].cantidad + cantidad) };
  } else {
    carrito.push(nueva);
  }
  return { ...e, carrito, tmp: {} };
}

async function pedirAsesor(e: Estado): Promise<Respuesta> {
  await crearNotificacion(pool, {
    destinatario: "caja",
    tipo: "solicitud_asesor",
    mensaje: `${e.nombre ?? "Un cliente"} (${e.telefono ?? "sin teléfono"}) pidió hablar con alguien desde el chatbot`,
  });
  return ir(reiniciar(e), "menu", [
    "Listo 🙋 Ya le avisé al equipo de Danny Tacos y alguien te contactará muy pronto.",
  ]);
}

async function confirmarPedido(e: Estado): Promise<Respuesta> {
  try {
    const pedido = await withTransaction(async (client) => {
      const observaciones =
        e.tipo === "domicilio"
          ? `[Chatbot] Domicilio: ${e.direccion}${e.referencia ? ` — ${e.referencia}` : ""}`
          : "[Chatbot] Recoge en el local";
      const creado = await crearPedido(client, null, {
        telefono_cliente: e.telefono!,
        nombre_cliente: e.nombre,
        tipo_entrega: e.tipo!,
        id_direccion: e.tipo === "domicilio" ? (e.idDireccion ?? null) : null,
        medio_pago: e.medio!,
        observaciones,
        items: e.carrito.map((l) => ({
          id_producto: l.id_producto,
          cantidad: l.cantidad,
          observaciones: l.excluidos.length ? `Sin: ${l.excluidos.join(", ")}` : undefined,
          opciones: l.adicionales.map((a) => a.id_opcion),
        })),
      });
      // Domicilio con dirección nueva: se guarda para reconocerla la próxima vez.
      if (e.tipo === "domicilio" && !e.idDireccion) {
        const { rows } = await client.query<{ id_direccion: string }>(
          `INSERT INTO direcciones (id_cliente, direccion, referencia) VALUES ($1, $2, $3) RETURNING id_direccion`,
          [creado.id_cliente, e.direccion, e.referencia ?? ""],
        );
        await client.query(`UPDATE pedidos SET id_direccion=$1 WHERE id_pedido=$2`, [
          rows[0].id_direccion,
          creado.id_pedido,
        ]);
      }
      return creado as { codigo: string; total: number; tiempo_estimado_min: number | null };
    });

    const fin: Estado = { ...reiniciar(e), paso: "fin" };
    const entrega =
      e.tipo === "domicilio"
        ? `Te lo llevamos a ${e.direccion}. El domicilio es gratis 🛵`
        : `Te esperamos en ${LOCAL_DIRECCION()} 🏪`;
    const r = await preguntar(fin, [
      `🎉 ¡Pedido confirmado!\nTu número de pedido es #${pedido.codigo}\nTotal: ${moneda(pedido.total)} — pagas con ${MEDIO_LABEL[e.medio!]}\n${entrega}\nTiempo estimado: ~${pedido.tiempo_estimado_min ?? 20} min.`,
      "¡Gracias por tu pedido en Danny Tacos! 🌮🧡 ¡Buen provecho! 👋",
    ]);
    return { ...r, finalizado: true, pedido: { codigo: pedido.codigo, total: pedido.total } };
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) {
      // p. ej. un producto se agotó mientras el cliente armaba el pedido
      return ir(e, "modificar_menu", [`Ups, no pude confirmar el pedido: ${err.message}. Revisemos tu pedido 👇`]);
    }
    throw err;
  }
}

async function manejar(e: Estado, texto: string): Promise<Respuesta> {
  switch (e.paso) {
    case "telefono": {
      const digitos = texto.replace(/\D/g, "");
      if (digitos.length < 7 || digitos.length > 15) {
        return resp(e, ["Ese número no parece válido. Escríbelo solo con números, por favor (ej: 3001234567)."], [], {
          entrada: "telefono",
        });
      }
      const { rows } = await pool.query<{ id_cliente: string; nombre: string; telefono: string }>(
        `SELECT id_cliente, nombre, telefono FROM clientes
         WHERE regexp_replace(coalesce(telefono, ''), '\\D', '', 'g') = $1
         ORDER BY created_at LIMIT 1`,
        [digitos],
      );
      const cliente = rows[0];
      if (cliente && cliente.nombre !== "Cliente mostrador") {
        return ir(
          { ...e, telefono: cliente.telefono, nombre: cliente.nombre, idCliente: cliente.id_cliente },
          "menu",
          [`¡Qué gusto verte de nuevo, ${cliente.nombre}! 😊`],
        );
      }
      return ir({ ...e, telefono: cliente?.telefono ?? digitos, idCliente: cliente?.id_cliente }, "nombre");
    }

    case "nombre": {
      const nombre = texto.replace(/\s+/g, " ").trim();
      if (nombre.length < 2 || nombre.length > 60) {
        return preguntar(e, ["Escríbeme tu nombre (entre 2 y 60 letras), por favor."]);
      }
      return ir({ ...e, nombre }, "menu", [`¡Mucho gusto, ${nombre}! 🙌`]);
    }

    case "menu":
      if (texto === "1") return ir(e, "entrega");
      if (texto === "2") return pedirAsesor(e);
      return preguntar(e, [NO_ENTENDI]);

    case "entrega": {
      if (texto === "1") {
        const base: Estado = { ...e, tipo: "domicilio", idDireccion: undefined, direccion: undefined, referencia: undefined };
        if (e.idCliente) {
          const { rows } = await pool.query<{ id_direccion: string; direccion: string; referencia: string | null }>(
            `SELECT id_direccion, direccion, referencia FROM direcciones
             WHERE id_cliente=$1 ORDER BY created_at DESC LIMIT 1`,
            [e.idCliente],
          );
          if (rows[0]) {
            return ir(
              { ...base, tmp: { dirGuardada: { id: rows[0].id_direccion, direccion: rows[0].direccion, referencia: rows[0].referencia } } },
              "dir_confirmar",
            );
          }
        }
        return ir(base, "direccion");
      }
      if (texto === "2") {
        return ir(
          { ...e, tipo: "recogida", idDireccion: undefined, direccion: undefined, referencia: undefined },
          "categoria",
          [`¡Perfecto! Puedes recogerlo en ${LOCAL_DIRECCION()} 🏪`],
        );
      }
      return preguntar(e, [NO_ENTENDI]);
    }

    case "dir_confirmar": {
      const d = e.tmp.dirGuardada;
      if (texto === "1" && d) {
        return ir(
          { ...e, idDireccion: d.id, direccion: d.direccion, referencia: d.referencia ?? undefined, tmp: {} },
          "categoria",
          ["¡Listo! Lo enviamos a esa dirección 🛵"],
        );
      }
      if (texto === "2") return ir({ ...e, tmp: {} }, "direccion");
      return preguntar(e, [NO_ENTENDI]);
    }

    case "direccion": {
      const direccion = texto.replace(/\s+/g, " ").trim();
      if (direccion.length < 5) return preguntar(e, ["Esa dirección parece muy corta. Escríbela completa, por favor."]);
      return ir({ ...e, direccion, idDireccion: undefined }, "referencia");
    }

    case "referencia": {
      const ref = texto.trim();
      const sinRef = /^(no|ninguna|nada|-)$/i.test(ref);
      return ir({ ...e, referencia: sinRef ? undefined : ref.slice(0, 200) }, "categoria", [
        "¡Anotado! Lo enviamos a esa dirección 🛵 (el domicilio es gratis)",
      ]);
    }

    case "categoria": {
      if (texto === "0" && e.carrito.length) return ir(e, "pago");
      const n = indice(texto, e.tmp.lista?.length ?? 0);
      if (!n) return preguntar(e, [NO_ENTENDI]);
      return ir({ ...e, tmp: { categoriaId: e.tmp.lista![n - 1] } }, "producto");
    }

    case "producto": {
      if (texto === "0") return ir({ ...e, tmp: {} }, "categoria");
      const n = indice(texto, e.tmp.lista?.length ?? 0);
      if (!n) return preguntar(e, [NO_ENTENDI]);
      const id = e.tmp.lista![n - 1];
      const { rows } = await pool.query<{ id_producto: string; nombre: string; precio: number }>(
        `SELECT id_producto, nombre, precio FROM productos WHERE id_producto=$1 AND activo AND disponible`,
        [id],
      );
      if (!rows[0]) return ir(e, "producto", ["Ese producto se acaba de agotar 😕 Elige otro."]);
      return ir(
        { ...e, tmp: { categoriaId: e.tmp.categoriaId, producto: { id, nombre: rows[0].nombre, precio: rows[0].precio } } },
        "cantidad",
      );
    }

    case "cantidad": {
      if (texto === "0") return ir({ ...e, tmp: { categoriaId: e.tmp.categoriaId } }, "producto");
      const n = indice(texto, 50);
      if (!n) return preguntar(e, ["Dime una cantidad entre 1 y 50, por favor."]);
      return ir({ ...e, tmp: { ...e.tmp, cantidad: n, excl: [], adic: [] } }, "personalizar");
    }

    case "personalizar": {
      if (texto === "1") {
        const p = e.tmp.producto!;
        const cantidad = e.tmp.cantidad ?? 1;
        const precioUnit = p.precio + (e.tmp.adic ?? []).reduce((s, a) => s + a.precio_adicional, 0);
        return ir(agregarLinea(e, cantidad), "mas", [
          `✅ Agregado: ${cantidad}x ${p.nombre} — ${moneda(precioUnit * cantidad)}`,
        ]);
      }
      const { ingredientes, adicionales } = await datosPersonalizacion(e.tmp.producto!.id);
      if (texto === "2" && ingredientes.length) return ir(e, "excluir");
      if (texto === "3" && adicionales.length) return ir(e, "adicionales");
      return preguntar(e, [NO_ENTENDI]);
    }

    case "excluir": {
      const lista = e.tmp.lista ?? [];
      if (texto === "0") return ir({ ...e, tmp: { ...e.tmp, lista: undefined } }, "personalizar");
      const idx = indicesMultiples(texto.replace(/^0[,\s]*/, ""), lista.length);
      if (!idx) return preguntar(e, ["Escribe los números de los ingredientes separados por coma, o 0 si ninguno."]);
      return ir({ ...e, tmp: { ...e.tmp, lista: undefined, excl: idx.map((i) => lista[i - 1]) } }, "personalizar");
    }

    case "adicionales": {
      const lista = e.tmp.listaAd ?? [];
      if (texto === "0") return ir({ ...e, tmp: { ...e.tmp, listaAd: undefined } }, "personalizar");
      const idx = indicesMultiples(texto.replace(/^0[,\s]*/, ""), lista.length);
      if (!idx) return preguntar(e, ["Escribe los números de los adicionales separados por coma, o 0 si ninguno."]);
      return ir({ ...e, tmp: { ...e.tmp, listaAd: undefined, adic: idx.map((i) => lista[i - 1]) } }, "personalizar");
    }

    case "mas":
      if (texto === "1") return ir(e, "categoria");
      if (texto === "2") return ir(e, "pago");
      if (texto === "3") return ir(e, "modificar_menu");
      return preguntar(e, [NO_ENTENDI]);

    case "modificar_menu":
      if (texto === "1") return ir(e, "categoria");
      if (texto === "2") {
        if (!e.carrito.length) return ir(e, "categoria", ["Tu pedido está vacío. Agreguemos algo 🌮"]);
        return ir(e, "modificar_lista");
      }
      if (texto === "3") return ir(e, "pago");
      if (texto === "4") return ir(reiniciar(e), "menu", ["Pedido cancelado ❌ Cuando quieras empezamos de nuevo."]);
      if (texto === "0") return ir(e, e.medio && e.carrito.length ? "resumen" : "mas");
      return preguntar(e, [NO_ENTENDI]);

    case "modificar_lista": {
      if (texto === "0") return ir(e, "modificar_menu");
      const n = indice(texto, e.carrito.length);
      if (!n) return preguntar(e, [NO_ENTENDI]);
      return ir({ ...e, tmp: { editIdx: n - 1 } }, "editar_linea");
    }

    case "editar_linea": {
      const i = e.tmp.editIdx ?? -1;
      if (texto === "0") return ir({ ...e, tmp: {} }, "modificar_lista");
      if (texto === "1" && e.carrito[i]) return ir(e, "editar_cantidad");
      if (texto === "2" && e.carrito[i]) {
        const quitada = descripcionLinea(e.carrito[i]);
        const carrito = e.carrito.filter((_, k) => k !== i);
        if (!carrito.length) {
          return ir({ ...e, carrito, tmp: {} }, "categoria", [`🗑️ Quitado: ${quitada}`, "Tu pedido quedó vacío. Agreguemos algo 🌮"]);
        }
        return ir({ ...e, carrito, tmp: {} }, "modificar_menu", [`🗑️ Quitado: ${quitada}`]);
      }
      return preguntar(e, [NO_ENTENDI]);
    }

    case "editar_cantidad": {
      const i = e.tmp.editIdx ?? -1;
      if (texto === "0") return ir(e, "editar_linea");
      const n = indice(texto, 50);
      if (!n || !e.carrito[i]) return preguntar(e, ["Dime una cantidad entre 1 y 50, por favor."]);
      const carrito = e.carrito.map((l, k) => (k === i ? { ...l, cantidad: n } : l));
      return ir({ ...e, carrito, tmp: {} }, "modificar_menu", [`✏️ Actualizado: ${descripcionLinea(carrito[i])}`]);
    }

    case "pago": {
      if (texto === "0") return ir(e, e.carrito.length ? "mas" : "categoria");
      const n = indice(texto, MEDIOS.length);
      if (!n) return preguntar(e, [NO_ENTENDI]);
      return ir({ ...e, medio: MEDIOS[n - 1] }, "resumen");
    }

    case "resumen":
      if (texto === "1") return confirmarPedido(e);
      if (texto === "2") return ir(e, "modificar_menu");
      return preguntar(e, [NO_ENTENDI]);

    case "fin":
      if (texto === "1") return ir(reiniciar(e), "entrega", ["¡Con gusto! 🌮"]);
      return preguntar(e);
  }
}

// ── Punto de entrada ──────────────────────────────────────────────────────

export async function procesarMensaje(estadoCrudo: unknown, textoCrudo: unknown): Promise<Respuesta> {
  // Sin estado = conversación nueva: saluda y pide el teléfono.
  if (estadoCrudo === undefined || estadoCrudo === null) return preguntar(nuevoEstado());

  const parsed = estadoSchema.safeParse(estadoCrudo);
  if (!parsed.success) throw new ApiError(400, "Estado de conversación inválido");
  const estado = parsed.data;

  const texto = typeof textoCrudo === "string" ? textoCrudo.trim().slice(0, 300) : "";
  if (!texto) return preguntar(estado);

  // Comandos globales (palabra exacta, para no chocar con nombres/direcciones).
  const comando = texto.toLowerCase();
  if (estado.telefono && estado.paso !== "telefono") {
    if (/^(cancelar|reiniciar|inicio)$/.test(comando)) {
      return ir(reiniciar(estado), "menu", ["Pedido cancelado ❌ Cuando quieras empezamos de nuevo."]);
    }
    if (/^(asesor|humano|persona|ayuda)$/.test(comando)) return pedirAsesor(estado);
  }

  return manejar(estado, texto);
}
