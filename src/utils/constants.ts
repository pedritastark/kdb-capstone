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
  recibido: "#1d4ed8",
  confirmado: "#1d4ed8",
  en_preparacion: "#a3470a",
  listo: "#047857",
  en_camino: "#047857",
  entregado: "#57534e",
  cancelado: "#b91c1c",
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
  efectivo: "#047857",
  nequi: "#c2410c",
  daviplata: "#b91c1c",
  llave: "#1d4ed8",
};

export const ESTADO_PAGO_LABEL: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  reportado: "Reportado",
  confirmado: "Confirmado",
  rechazado: "Rechazado",
};

export const ESTADO_PAGO_COLOR: Record<EstadoPago, string> = {
  pendiente: "#57534e",
  reportado: "#a3470a",
  confirmado: "#047857",
  rechazado: "#b91c1c",
};

export const TIPO_MOVIMIENTO_LABEL: Record<TipoMovimientoInventario, string> = {
  entrada: "Entrada",
  consumo: "Consumo",
  perdida: "Pérdida",
  ajuste: "Ajuste",
  devolucion: "Devolución",
};

export const TIPO_MOVIMIENTO_COLOR: Record<TipoMovimientoInventario, string> = {
  entrada: "#047857",
  consumo: "#1d4ed8",
  perdida: "#b91c1c",
  ajuste: "#a3470a",
  devolucion: "#6b645e",
};

export const TIPO_NOTIFICACION_LABEL: Record<TipoNotificacion, string> = {
  nuevo_pedido: "Nuevo pedido",
  pago_reportado: "Pago reportado",
  inventario_bajo: "Inventario bajo",
  pedido_listo: "Pedido listo",
  cancelacion: "Cancelación",
  solicitud_asesor: "Cliente pide ayuda",
};

export const TIPO_NOTIFICACION_COLOR: Record<TipoNotificacion, string> = {
  nuevo_pedido: "#1d4ed8",
  pago_reportado: "#a3470a",
  inventario_bajo: "#b91c1c",
  pedido_listo: "#047857",
  cancelacion: "#b91c1c",
  solicitud_asesor: "#7e22ce",
};

export const NUEVO_PEDIDO_MINUTOS = 2;

export const BRAND_GRADIENT =
  "linear-gradient(90deg, var(--chakra-colors-pink-500), var(--chakra-colors-accent-500), var(--chakra-colors-sky-500))";
