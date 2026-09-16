import type { DetallePedido, HistorialEstado, Pedido } from "../types";

function haceMin(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

export const pedidos: Pedido[] = [
  { id_pedido: "ped1", id_cliente: "c1", id_direccion: "d1", id_usuario: "u1", codigo: "DT-1042", tipo_entrega: "domicilio", estado: "recibido", subtotal: 45000, costo_domicilio: 5000, total: 50000, tiempo_estimado_min: 20, observaciones: "Sin cebolla en uno de los tacos", fecha_pedido: haceMin(1) },
  { id_pedido: "ped2", id_cliente: "c2", id_direccion: null, id_usuario: "u1", codigo: "DT-1043", tipo_entrega: "recogida", estado: "recibido", subtotal: 32000, costo_domicilio: 0, total: 32000, tiempo_estimado_min: 15, observaciones: "", fecha_pedido: haceMin(4) },
  { id_pedido: "ped3", id_cliente: "c3", id_direccion: "d2", id_usuario: "u1", codigo: "DT-1044", tipo_entrega: "domicilio", estado: "confirmado", subtotal: 45000, costo_domicilio: 6000, total: 51000, tiempo_estimado_min: 25, observaciones: "", fecha_pedido: haceMin(10) },
  { id_pedido: "ped4", id_cliente: "c4", id_direccion: null, id_usuario: "u1", codigo: "DT-1045", tipo_entrega: "mesa", estado: "en_preparacion", subtotal: 57000, costo_domicilio: 0, total: 57000, tiempo_estimado_min: 18, observaciones: "Mesa 4", fecha_pedido: haceMin(12) },
  { id_pedido: "ped5", id_cliente: "c5", id_direccion: "d3", id_usuario: "u1", codigo: "DT-1046", tipo_entrega: "domicilio", estado: "en_preparacion", subtotal: 51000, costo_domicilio: 5500, total: 56500, tiempo_estimado_min: 30, observaciones: "Tocar el timbre del apto", fecha_pedido: haceMin(15) },
  { id_pedido: "ped6", id_cliente: "c6", id_direccion: "d4", id_usuario: "u1", codigo: "DT-1047", tipo_entrega: "domicilio", estado: "listo", subtotal: 34000, costo_domicilio: 6000, total: 40000, tiempo_estimado_min: 28, observaciones: "", fecha_pedido: haceMin(25) },
  { id_pedido: "ped7", id_cliente: "c7", id_direccion: null, id_usuario: "u1", codigo: "DT-1048", tipo_entrega: "mesa", estado: "listo", subtotal: 48000, costo_domicilio: 0, total: 48000, tiempo_estimado_min: 15, observaciones: "Mesa 2", fecha_pedido: haceMin(30) },
  { id_pedido: "ped8", id_cliente: "c8", id_direccion: null, id_usuario: "u1", codigo: "DT-1049", tipo_entrega: "recogida", estado: "entregado", subtotal: 24000, costo_domicilio: 0, total: 24000, tiempo_estimado_min: 12, observaciones: "", fecha_pedido: haceMin(90) },
  { id_pedido: "ped9", id_cliente: "c9", id_direccion: "d5", id_usuario: "u1", codigo: "DT-1050", tipo_entrega: "domicilio", estado: "en_camino", subtotal: 45000, costo_domicilio: 5000, total: 50000, tiempo_estimado_min: 35, observaciones: "", fecha_pedido: haceMin(20) },
  { id_pedido: "ped10", id_cliente: "c1", id_direccion: "d1", id_usuario: "u1", codigo: "DT-1051", tipo_entrega: "domicilio", estado: "cancelado", subtotal: 13000, costo_domicilio: 5000, total: 18000, tiempo_estimado_min: 20, observaciones: "Cliente canceló por error en la dirección", fecha_pedido: haceMin(40) },
];

export const detallePedidos: DetallePedido[] = [
  // ped1
  { id_detalle: "det1", id_pedido: "ped1", id_producto: "p1", nombre_producto: "Taco de Res", cantidad: 2, precio_unitario: 12000, subtotal: 24000, observaciones: "Sin cebolla",
    opciones: [
      { id_detalle_opcion: "do1", id_detalle: "det1", id_opcion: "op-p1-proteina-res", nombre_opcion: "Res", precio_adicional: 0 },
      { id_detalle_opcion: "do2", id_detalle: "det1", id_opcion: "op-p1-picante-medio", nombre_opcion: "Medio", precio_adicional: 0 },
    ] },
  { id_detalle: "det2", id_pedido: "ped1", id_producto: "p3", nombre_producto: "Taco al Pastor", cantidad: 1, precio_unitario: 13000, subtotal: 13000, observaciones: "" },
  { id_detalle: "det3", id_pedido: "ped1", id_producto: "p12", nombre_producto: "Limonada de Coco", cantidad: 1, precio_unitario: 8000, subtotal: 8000, observaciones: "" },

  // ped2
  { id_detalle: "det4", id_pedido: "ped2", id_producto: "p6", nombre_producto: "Burrito Especial Danny", cantidad: 1, precio_unitario: 24000, subtotal: 24000, observaciones: "",
    opciones: [
      { id_detalle_opcion: "do3", id_detalle: "det4", id_opcion: "op-p6-proteina-mixta", nombre_opcion: "Mixta", precio_adicional: 2000 },
    ] },
  { id_detalle: "det5", id_pedido: "ped2", id_producto: "p13", nombre_producto: "Horchata", cantidad: 1, precio_unitario: 8000, subtotal: 8000, observaciones: "" },

  // ped3
  { id_detalle: "det6", id_pedido: "ped3", id_producto: "p9", nombre_producto: "Quesadilla de Pollo", cantidad: 3, precio_unitario: 15000, subtotal: 45000, observaciones: "Una sin salsa" },

  // ped4
  { id_detalle: "det7", id_pedido: "ped4", id_producto: "p2", nombre_producto: "Taco de Pollo", cantidad: 2, precio_unitario: 11000, subtotal: 22000, observaciones: "",
    opciones: [
      { id_detalle_opcion: "do4", id_detalle: "det7", id_opcion: "op-p2-salsa-chipotle", nombre_opcion: "Chipotle", precio_adicional: 0 },
    ] },
  { id_detalle: "det8", id_pedido: "ped4", id_producto: "p4", nombre_producto: "Taco de Cerdo", cantidad: 2, precio_unitario: 12000, subtotal: 24000, observaciones: "" },
  { id_detalle: "det9", id_pedido: "ped4", id_producto: "p15", nombre_producto: "Papas con Queso", cantidad: 1, precio_unitario: 11000, subtotal: 11000, observaciones: "" },

  // ped5
  { id_detalle: "det10", id_pedido: "ped5", id_producto: "p8", nombre_producto: "Combo Danny para 2", cantidad: 1, precio_unitario: 35000, subtotal: 35000, observaciones: "" },
  { id_detalle: "det11", id_pedido: "ped5", id_producto: "p12", nombre_producto: "Limonada de Coco", cantidad: 2, precio_unitario: 8000, subtotal: 16000, observaciones: "" },

  // ped6
  { id_detalle: "det12", id_pedido: "ped6", id_producto: "p7", nombre_producto: "Burrito Vegetariano", cantidad: 1, precio_unitario: 17000, subtotal: 17000, observaciones: "" },
  { id_detalle: "det13", id_pedido: "ped6", id_producto: "p10", nombre_producto: "Quesadilla Mixta", cantidad: 1, precio_unitario: 17000, subtotal: 17000, observaciones: "" },

  // ped7
  { id_detalle: "det14", id_pedido: "ped7", id_producto: "p1", nombre_producto: "Taco de Res", cantidad: 4, precio_unitario: 12000, subtotal: 48000, observaciones: "Mesa 2, todo picante alto" },

  // ped8
  { id_detalle: "det15", id_pedido: "ped8", id_producto: "p11", nombre_producto: "Quesadilla de Res", cantidad: 1, precio_unitario: 16000, subtotal: 16000, observaciones: "" },
  { id_detalle: "det16", id_pedido: "ped8", id_producto: "p13", nombre_producto: "Horchata", cantidad: 1, precio_unitario: 8000, subtotal: 8000, observaciones: "" },

  // ped9
  { id_detalle: "det17", id_pedido: "ped9", id_producto: "p5", nombre_producto: "Burrito Sencillo", cantidad: 2, precio_unitario: 18000, subtotal: 36000, observaciones: "" },
  { id_detalle: "det18", id_pedido: "ped9", id_producto: "p14", nombre_producto: "Guacamole Porción", cantidad: 1, precio_unitario: 9000, subtotal: 9000, observaciones: "" },

  // ped10
  { id_detalle: "det19", id_pedido: "ped10", id_producto: "p3", nombre_producto: "Taco al Pastor", cantidad: 1, precio_unitario: 13000, subtotal: 13000, observaciones: "" },
];

export const historialEstados: HistorialEstado[] = [
  { id_historial: "h1", id_pedido: "ped4", id_usuario: "u1", estado_anterior: null, estado_nuevo: "recibido", observacion: "Pedido creado en mesa", hora_cambio: haceMin(12) },
  { id_historial: "h2", id_pedido: "ped4", id_usuario: "u1", estado_anterior: "recibido", estado_nuevo: "confirmado", observacion: "", hora_cambio: haceMin(11) },
  { id_historial: "h3", id_pedido: "ped4", id_usuario: "u3", estado_anterior: "confirmado", estado_nuevo: "en_preparacion", observacion: "En parrilla", hora_cambio: haceMin(9) },

  { id_historial: "h4", id_pedido: "ped6", id_usuario: "u1", estado_anterior: null, estado_nuevo: "recibido", observacion: "", hora_cambio: haceMin(25) },
  { id_historial: "h5", id_pedido: "ped6", id_usuario: "u1", estado_anterior: "recibido", estado_nuevo: "confirmado", observacion: "", hora_cambio: haceMin(23) },
  { id_historial: "h6", id_pedido: "ped6", id_usuario: "u3", estado_anterior: "confirmado", estado_nuevo: "en_preparacion", observacion: "", hora_cambio: haceMin(20) },
  { id_historial: "h7", id_pedido: "ped6", id_usuario: "u3", estado_anterior: "en_preparacion", estado_nuevo: "listo", observacion: "Listo para domiciliario", hora_cambio: haceMin(6) },

  { id_historial: "h8", id_pedido: "ped10", id_usuario: "u1", estado_anterior: null, estado_nuevo: "recibido", observacion: "", hora_cambio: haceMin(40) },
  { id_historial: "h9", id_pedido: "ped10", id_usuario: "u2", estado_anterior: "recibido", estado_nuevo: "cancelado", observacion: "Error en la dirección, el cliente prefirió cancelar", hora_cambio: haceMin(38) },
];
