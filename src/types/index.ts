// ============================================================
// Tipos del dominio — Sistema de visualización de cocina
// Danny Tacos
// ============================================================

export type RolUsuario = "admin" | "cocina" | "caja";

export interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export interface Cliente {
  id_cliente: string;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface Direccion {
  id_direccion: string;
  id_cliente: string;
  direccion: string;
  referencia: string;
}

export interface Categoria {
  id_categoria: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface Producto {
  id_producto: string;
  id_categoria: string;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  tiempo_preparacion_min: number;
  fecha_creacion: string;
  activo: boolean;
  imagen_url: string;
}

export type TipoOpcion = "proteina" | "salsa" | "picante" | "adicional";

export interface OpcionProducto {
  id_opcion: string;
  id_producto: string;
  tipo: TipoOpcion;
  nombre: string;
  precio_adicional: number;
  obligatoria: boolean;
  disponible: boolean;
}

export type TipoEntrega = "mesa" | "recogida" | "domicilio";

export type EstadoPedido =
  | "recibido"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "en_camino"
  | "entregado"
  | "cancelado";

export interface Pedido {
  id_pedido: string;
  id_cliente: string;
  id_direccion: string | null;
  id_usuario: string;
  codigo: string;
  tipo_entrega: TipoEntrega;
  estado: EstadoPedido;
  subtotal: number;
  costo_domicilio: number;
  total: number;
  tiempo_estimado_min: number;
  observaciones: string;
  fecha_pedido: string;
}

export interface DetalleOpcion {
  id_detalle_opcion: string;
  id_detalle: string;
  id_opcion: string;
  nombre_opcion: string;
  precio_adicional: number;
}

export interface DetallePedido {
  id_detalle: string;
  id_pedido: string;
  id_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones: string;
  opciones?: DetalleOpcion[];
}

export type MedioPago = "efectivo" | "nequi" | "daviplata" | "llave";
export type EstadoPago = "pendiente" | "reportado" | "confirmado" | "rechazado";

export interface Pago {
  id_pago: string;
  id_pedido: string;
  medio: MedioPago;
  estado: EstadoPago;
  valor: number;
  referencia: string;
}

export interface HistorialEstado {
  id_historial: string;
  id_pedido: string;
  id_usuario: string;
  estado_anterior: EstadoPedido | null;
  estado_nuevo: EstadoPedido;
  observacion: string;
  hora_cambio: string;
}

export type TipoNotificacion =
  | "nuevo_pedido"
  | "pago_reportado"
  | "inventario_bajo"
  | "pedido_listo"
  | "cancelacion";

export type EstadoNotificacion = "leida" | "no_leida";

export interface Notificacion {
  id_notificacion: string;
  id_pedido: string | null;
  destinatario: string;
  tipo: TipoNotificacion;
  mensaje: string;
  estado: EstadoNotificacion;
  fecha_envio: string;
}

export interface Ingrediente {
  id_ingrediente: string;
  nombre: string;
  disponible: boolean;
  activo: boolean;
}
