import type { Ingrediente, MovimientoInventario } from "../types";

export const ingredientes: Ingrediente[] = [
  { id_ingrediente: "i1", nombre: "Tortilla de maíz", unidad_medida: "unidad", tipo_control: "cantidad", cantidad_actual: 400, cantidad_minima: 100, disponible: true, activo: true },
  { id_ingrediente: "i2", nombre: "Tortilla de harina", unidad_medida: "unidad", tipo_control: "cantidad", cantidad_actual: 250, cantidad_minima: 80, disponible: true, activo: true },
  { id_ingrediente: "i3", nombre: "Carne de res", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 12, cantidad_minima: 5, disponible: true, activo: true },
  { id_ingrediente: "i4", nombre: "Pollo", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 15, cantidad_minima: 5, disponible: true, activo: true },
  { id_ingrediente: "i5", nombre: "Cerdo al pastor", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 3, cantidad_minima: 5, disponible: true, activo: true },
  { id_ingrediente: "i6", nombre: "Queso mozzarella", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 8, cantidad_minima: 3, disponible: true, activo: true },
  { id_ingrediente: "i7", nombre: "Queso campesino", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 6, cantidad_minima: 3, disponible: true, activo: true },
  { id_ingrediente: "i8", nombre: "Crema agria", unidad_medida: "lt", tipo_control: "cantidad", cantidad_actual: 4, cantidad_minima: 2, disponible: true, activo: true },
  { id_ingrediente: "i9", nombre: "Guacamole", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 2, cantidad_minima: 3, disponible: true, activo: true },
  { id_ingrediente: "i10", nombre: "Pico de gallo", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 5, cantidad_minima: 2, disponible: true, activo: true },
  { id_ingrediente: "i11", nombre: "Salsa verde", unidad_medida: "lt", tipo_control: "cantidad", cantidad_actual: 3, cantidad_minima: 1, disponible: true, activo: true },
  { id_ingrediente: "i12", nombre: "Salsa roja", unidad_medida: "lt", tipo_control: "cantidad", cantidad_actual: 3, cantidad_minima: 1, disponible: true, activo: true },
  { id_ingrediente: "i13", nombre: "Salsa chipotle", unidad_medida: "lt", tipo_control: "cantidad", cantidad_actual: 1, cantidad_minima: 1, disponible: true, activo: true },
  { id_ingrediente: "i14", nombre: "Salsa BBQ", unidad_medida: "lt", tipo_control: "cantidad", cantidad_actual: 2, cantidad_minima: 1, disponible: true, activo: true },
  { id_ingrediente: "i15", nombre: "Cilantro", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 1.5, cantidad_minima: 1, disponible: true, activo: true },
  { id_ingrediente: "i16", nombre: "Cebolla morada", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 4, cantidad_minima: 1.5, disponible: true, activo: true },
  { id_ingrediente: "i17", nombre: "Limón", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 6, cantidad_minima: 2, disponible: true, activo: true },
  { id_ingrediente: "i18", nombre: "Papas", unidad_medida: "kg", tipo_control: "cantidad", cantidad_actual: 10, cantidad_minima: 4, disponible: true, activo: true },
  { id_ingrediente: "i19", nombre: "Arroz (para horchata)", unidad_medida: "kg", tipo_control: "disponibilidad", cantidad_actual: 0, cantidad_minima: 0, disponible: true, activo: true },
  { id_ingrediente: "i20", nombre: "Hielo", unidad_medida: "kg", tipo_control: "disponibilidad", cantidad_actual: 0, cantidad_minima: 0, disponible: true, activo: true },
];

function haceHoras(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

export const movimientos: MovimientoInventario[] = [
  { id_movimiento: "m1", id_ingrediente: "i3", id_pedido: null, tipo_movimiento: "entrada", cantidad: 10, cantidad_anterior: 2, cantidad_nueva: 12, motivo: "Compra proveedor semanal", fecha_movimiento: haceHoras(48) },
  { id_movimiento: "m2", id_ingrediente: "i5", id_pedido: null, tipo_movimiento: "entrada", cantidad: 8, cantidad_anterior: 2, cantidad_nueva: 10, motivo: "Compra proveedor", fecha_movimiento: haceHoras(72) },
  { id_movimiento: "m3", id_ingrediente: "i5", id_pedido: null, tipo_movimiento: "consumo", cantidad: 7, cantidad_anterior: 10, cantidad_nueva: 3, motivo: "Consumo acumulado del día", fecha_movimiento: haceHoras(24) },
  { id_movimiento: "m4", id_ingrediente: "i9", id_pedido: null, tipo_movimiento: "perdida", cantidad: 1, cantidad_anterior: 3, cantidad_nueva: 2, motivo: "Guacamole oxidado, se descartó", fecha_movimiento: haceHoras(5) },
  { id_movimiento: "m5", id_ingrediente: "i1", id_pedido: null, tipo_movimiento: "consumo", cantidad: 40, cantidad_anterior: 440, cantidad_nueva: 400, motivo: "Consumo del turno", fecha_movimiento: haceHoras(3) },
  { id_movimiento: "m6", id_ingrediente: "i13", id_pedido: null, tipo_movimiento: "ajuste", cantidad: 0.5, cantidad_anterior: 1.5, cantidad_nueva: 1, motivo: "Ajuste por conteo físico", fecha_movimiento: haceHoras(6) },
  { id_movimiento: "m7", id_ingrediente: "i18", id_pedido: null, tipo_movimiento: "entrada", cantidad: 5, cantidad_anterior: 5, cantidad_nueva: 10, motivo: "Compra proveedor", fecha_movimiento: haceHoras(30) },
  { id_movimiento: "m8", id_ingrediente: "i6", id_pedido: "ped4", tipo_movimiento: "consumo", cantidad: 2, cantidad_anterior: 10, cantidad_nueva: 8, motivo: "Consumo pedido DT-1045", fecha_movimiento: haceHoras(0.2) },
  { id_movimiento: "m9", id_ingrediente: "i3", id_pedido: "ped4", tipo_movimiento: "consumo", cantidad: 0.3, cantidad_anterior: 12.3, cantidad_nueva: 12, motivo: "Consumo pedido DT-1045", fecha_movimiento: haceHoras(0.2) },
  { id_movimiento: "m10", id_ingrediente: "i4", id_pedido: "ped10", tipo_movimiento: "devolucion", cantidad: 0.2, cantidad_anterior: 14.8, cantidad_nueva: 15, motivo: "Pedido cancelado, insumo devuelto", fecha_movimiento: haceHoras(0.6) },
  { id_movimiento: "m11", id_ingrediente: "i16", id_pedido: null, tipo_movimiento: "ajuste", cantidad: 0.5, cantidad_anterior: 3.5, cantidad_nueva: 4, motivo: "Ajuste por conteo", fecha_movimiento: haceHoras(50) },
  { id_movimiento: "m12", id_ingrediente: "i8", id_pedido: null, tipo_movimiento: "perdida", cantidad: 0.5, cantidad_anterior: 4.5, cantidad_nueva: 4, motivo: "Vencimiento próximo, se desechó sobrante", fecha_movimiento: haceHoras(20) },
  { id_movimiento: "m13", id_ingrediente: "i20", id_pedido: null, tipo_movimiento: "entrada", cantidad: 20, cantidad_anterior: 0, cantidad_nueva: 20, motivo: "Compra de hielo", fecha_movimiento: haceHoras(26) },
  { id_movimiento: "m14", id_ingrediente: "i9", id_pedido: null, tipo_movimiento: "entrada", cantidad: 3, cantidad_anterior: 0, cantidad_nueva: 3, motivo: "Preparación de guacamole fresco", fecha_movimiento: haceHoras(28) },
];
