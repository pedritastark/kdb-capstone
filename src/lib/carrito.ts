import type { OpcionProducto, Producto } from "../types";
import { formatoMoneda } from "../utils/format";

/** Una línea del carrito de la landing: producto + personalización + cantidad. */
export interface LineaCarrito {
  clave: string;
  id_producto: string;
  nombre: string;
  precio: number;
  imagen_url: string;
  cantidad: number;
  /** nombres de ingredientes que el cliente NO quiere */
  excluidos: string[];
  adicionales: Pick<OpcionProducto, "id_opcion" | "nombre" | "precio_adicional">[];
}

export interface Personalizacion {
  excluidos: string[];
  adicionales: OpcionProducto[];
}

const STORAGE_KEY = "danny-tacos-carrito";

/** Mismo producto con la misma personalización = misma línea. */
export function claveLinea(idProducto: string, excluidos: string[], adicionales: { id_opcion: string }[]): string {
  const exc = [...excluidos].sort().join("|");
  const ads = adicionales.map((a) => a.id_opcion).sort().join("|");
  return `${idProducto}::${exc}::${ads}`;
}

export function nuevaLinea(producto: Producto, p: Personalizacion, cantidad: number): LineaCarrito {
  const adicionales = p.adicionales.map(({ id_opcion, nombre, precio_adicional }) => ({ id_opcion, nombre, precio_adicional }));
  return {
    clave: claveLinea(producto.id_producto, p.excluidos, adicionales),
    id_producto: producto.id_producto,
    nombre: producto.nombre,
    precio: producto.precio,
    imagen_url: producto.imagen_url,
    cantidad,
    excluidos: p.excluidos,
    adicionales,
  };
}

export const precioUnitario = (l: LineaCarrito) => l.precio + l.adicionales.reduce((s, a) => s + a.precio_adicional, 0);
export const totalLinea = (l: LineaCarrito) => precioUnitario(l) * l.cantidad;
export const totalCarrito = (c: LineaCarrito[]) => c.reduce((s, l) => s + totalLinea(l), 0);
export const cantidadCarrito = (c: LineaCarrito[]) => c.reduce((s, l) => s + l.cantidad, 0);

/** "Sin cebolla · + Aguacate" (vacío si no hay personalización). */
export function detalleLinea(l: LineaCarrito): string {
  return [
    ...(l.excluidos.length ? [`Sin ${l.excluidos.join(", ")}`] : []),
    ...l.adicionales.map((a) => `+ ${a.nombre}`),
  ].join(" · ");
}

// ── Persistencia (solo comodidad: si el storage falla, el carrito sigue en memoria) ──

export function cargarCarrito(): LineaCarrito[] {
  try {
    const crudo = localStorage.getItem(STORAGE_KEY);
    if (!crudo) return [];
    const data: unknown = JSON.parse(crudo);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (l): l is LineaCarrito =>
        !!l && typeof l.clave === "string" && typeof l.id_producto === "string" && typeof l.precio === "number" && Number.isInteger(l.cantidad) && l.cantidad > 0 && Array.isArray(l.excluidos) && Array.isArray(l.adicionales),
    );
  } catch {
    return [];
  }
}

export function guardarCarrito(c: LineaCarrito[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* sin storage: no pasa nada */
  }
}

export function vaciarCarritoGuardado() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sin storage: no pasa nada */
  }
}

// ── Salidas: chatbot y WhatsApp ──

/** Formato que espera POST /api/chatbot/mensaje (la API relee precios y nombres). */
export function itemsParaApi(c: LineaCarrito[]) {
  return c.map((l) => ({
    id_producto: l.id_producto,
    cantidad: l.cantidad,
    excluidos: l.excluidos,
    adicionales: l.adicionales.map((a) => a.id_opcion),
  }));
}

export function mensajeWhatsApp(c: LineaCarrito[]): string {
  const lineas = c.map((l) => {
    const extra = detalleLinea(l);
    return `• ${l.cantidad}x ${l.nombre}${extra ? ` (${extra})` : ""} — ${formatoMoneda(totalLinea(l))}`;
  });
  return [
    "¡Hola! Quiero hacer este pedido en Danny Tacos 🌮",
    "",
    ...lineas,
    "",
    `Total: ${formatoMoneda(totalCarrito(c))} (domicilio sin costo)`,
    "",
    "Mis datos te los paso a continuación.",
  ].join("\n");
}

/** Pone el pedido como texto prellenado en un enlace de WhatsApp (wa.me/… o api.whatsapp.com/…). */
export function urlWhatsAppConPedido(base: string, mensaje: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set("text", mensaje);
    return url.toString();
  } catch {
    return `${base}${base.includes("?") ? "&" : "?"}text=${encodeURIComponent(mensaje)}`;
  }
}
