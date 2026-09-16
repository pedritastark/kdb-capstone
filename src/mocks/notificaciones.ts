import type { Notificacion } from "../types";

function haceMin(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

export const notificaciones: Notificacion[] = [
  { id_notificacion: "n1", id_pedido: "ped1", destinatario: "cocina", tipo: "nuevo_pedido", mensaje: "Nuevo pedido #DT-1042 recibido", estado: "no_leida", fecha_envio: haceMin(1) },
  { id_notificacion: "n2", id_pedido: "ped2", destinatario: "cocina", tipo: "nuevo_pedido", mensaje: "Nuevo pedido #DT-1043 recibido", estado: "no_leida", fecha_envio: haceMin(4) },
  { id_notificacion: "n3", id_pedido: "ped5", destinatario: "caja", tipo: "pago_reportado", mensaje: "Pago reportado para pedido #DT-1046 vía Llave", estado: "no_leida", fecha_envio: haceMin(14) },
  { id_notificacion: "n4", id_pedido: null, destinatario: "cocina", tipo: "inventario_bajo", mensaje: "Cerdo al pastor por debajo del mínimo (3 kg / 5 kg)", estado: "no_leida", fecha_envio: haceMin(30) },
  { id_notificacion: "n5", id_pedido: null, destinatario: "cocina", tipo: "inventario_bajo", mensaje: "Guacamole por debajo del mínimo (2 kg / 3 kg)", estado: "no_leida", fecha_envio: haceMin(28) },
  { id_notificacion: "n6", id_pedido: "ped6", destinatario: "cliente", tipo: "pedido_listo", mensaje: "Tu pedido #DT-1047 está listo para entrega", estado: "leida", fecha_envio: haceMin(24) },
  { id_notificacion: "n7", id_pedido: "ped10", destinatario: "cocina", tipo: "cancelacion", mensaje: "Pedido #DT-1051 fue cancelado: error en la dirección", estado: "leida", fecha_envio: haceMin(39) },
  { id_notificacion: "n8", id_pedido: "ped9", destinatario: "cocina", tipo: "pago_reportado", mensaje: "Pago reportado para pedido #DT-1050 vía Nequi", estado: "no_leida", fecha_envio: haceMin(19) },
  { id_notificacion: "n9", id_pedido: "ped3", destinatario: "cocina", tipo: "nuevo_pedido", mensaje: "Nuevo pedido #DT-1044 recibido", estado: "leida", fecha_envio: haceMin(10) },
  { id_notificacion: "n10", id_pedido: null, destinatario: "cocina", tipo: "inventario_bajo", mensaje: "Salsa chipotle al límite del mínimo (1 L / 1 L)", estado: "no_leida", fecha_envio: haceMin(5) },
];
