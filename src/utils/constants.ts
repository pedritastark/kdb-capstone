import type { EstadoPago, EstadoPedido, MedioPago, TipoEntrega, TipoMovimientoInventario, TipoNotificacion } from "../types";

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  recibido: "Recibido",
  confirmado: "Confirmado",
  en_preparacion: "En Preparación",
  listo: "Listo",
  en_camino: "En Camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ESTADO_PEDIDO_COLOR: Record<EstadoPedido, string> = {
  recibido: "#2563eb",
  confirmado: "#2563eb",
  en_preparacion: "#f59e0b",
  listo: "#10b981",
  en_camino: "#10b981",
  entregado: "#888888",
  cancelado: "#ef4444",
};

export const TIPO_ENTREGA_LABEL: Record<TipoEntrega, string> = {
  mesa: "Para Acá",
  recogida: "Para Llevar",
  domicilio: "Domicilio",
};

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  daviplata: "Daviplata",
  llave: "Llave",
};

export const MEDIO_PAGO_COLOR: Record<MedioPago, string> = {
  efectivo: "#10b981",
  nequi: "#ea580c",
  daviplata: "#dc2626",
  llave: "#2563eb",
};

export const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  reportado: "Reportado",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

export const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
  pendiente: "#888888",
  reportado: "#f59e0b",
  confirmado: "#10b981",
  rechazado: "#ef4444",
};

export const TIPO_MOVIMIENTO_LABEL: Record<TipoMovimientoInventario, string> = {
  entrada: "Entrada",
  consumo: "Consumo",
  perdida: "Pérdida",
  ajuste: "Ajuste",
  devolucion: "Devolución",
};

export const TIPO_MOVIMIENTO_COLOR: Record<TipoMovimientoInventario, string> = {
  entrada: "#10b981",
  consumo: "#2563eb",
  perdida: "#ef4444",
  ajuste: "#f59e0b",
  devolucion: "#a0a0a0",
};

export const TIPO_NOTIFICACION_LABEL: Record<TipoNotificacion, string> = {
  nuevo_pedido: "Nuevo pedido",
  pago_reportado: "Pago reportado",
  inventario_bajo: "Inventario bajo",
  pedido_listo: "Pedido listo",
  cancelacion: "Cancelación",
};

export const TIPO_NOTIFICACION_COLOR: Record<TipoNotificacion, string> = {
  nuevo_pedido: "#2563eb",
  pago_reportado: "#f59e0b",
  inventario_bajo: "#ef4444",
  pedido_listo: "#10b981",
  cancelacion: "#ef4444",
};

export const NUEVO_PEDIDO_MINUTOS = 2;

export const BRAND_GRADIENT =
  "linear-gradient(90deg, var(--chakra-colors-pink-500), var(--chakra-colors-accent-500), var(--chakra-colors-sky-500))";
