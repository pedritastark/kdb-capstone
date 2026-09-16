import type { Producto } from "../types";

const fecha = "2026-01-10T08:00:00.000Z";

export const productos: Producto[] = [
  { id_producto: "p1", id_categoria: "cat1", nombre: "Taco de Res", descripcion: "Tortilla de maíz, carne de res desmechada, cebolla y cilantro", precio: 12000, disponible: true, tiempo_preparacion_min: 8, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p2", id_categoria: "cat1", nombre: "Taco de Pollo", descripcion: "Tortilla de maíz, pollo desmechado, pico de gallo", precio: 11000, disponible: true, tiempo_preparacion_min: 8, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p3", id_categoria: "cat1", nombre: "Taco al Pastor", precio: 13000, descripcion: "Cerdo marinado estilo al pastor, piña y cilantro", disponible: true, tiempo_preparacion_min: 10, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p4", id_categoria: "cat1", nombre: "Taco de Cerdo", descripcion: "Cerdo asado, cebolla morada y salsa roja", precio: 12000, disponible: false, tiempo_preparacion_min: 9, fecha_creacion: fecha, activo: true, imagen_url: "" },

  { id_producto: "p5", id_categoria: "cat2", nombre: "Burrito Sencillo", descripcion: "Tortilla de harina, proteína a elección, arroz y frijoles", precio: 18000, disponible: true, tiempo_preparacion_min: 12, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p6", id_categoria: "cat2", nombre: "Burrito Especial Danny", descripcion: "Doble proteína, queso gratinado y guacamole", precio: 24000, disponible: true, tiempo_preparacion_min: 15, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p7", id_categoria: "cat2", nombre: "Burrito Vegetariano", descripcion: "Frijoles, arroz, queso, guacamole y vegetales salteados", precio: 17000, disponible: true, tiempo_preparacion_min: 12, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p8", id_categoria: "cat2", nombre: "Combo Danny para 2", descripcion: "Dos burritos especiales + dos bebidas, ideal para compartir", precio: 35000, disponible: true, tiempo_preparacion_min: 20, fecha_creacion: fecha, activo: true, imagen_url: "" },

  { id_producto: "p9", id_categoria: "cat3", nombre: "Quesadilla de Pollo", descripcion: "Tortilla de harina, pollo y queso mozzarella derretido", precio: 15000, disponible: true, tiempo_preparacion_min: 10, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p10", id_categoria: "cat3", nombre: "Quesadilla Mixta", descripcion: "Res, pollo y queso mozzarella", precio: 17000, disponible: true, tiempo_preparacion_min: 11, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p11", id_categoria: "cat3", nombre: "Quesadilla de Res", descripcion: "Carne de res desmechada y queso mozzarella", precio: 16000, disponible: true, tiempo_preparacion_min: 10, fecha_creacion: fecha, activo: true, imagen_url: "" },

  { id_producto: "p12", id_categoria: "cat4", nombre: "Limonada de Coco", descripcion: "Limonada natural con crema de coco", precio: 8000, disponible: true, tiempo_preparacion_min: 3, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p13", id_categoria: "cat4", nombre: "Horchata", descripcion: "Bebida fría de arroz y canela", precio: 8000, disponible: true, tiempo_preparacion_min: 3, fecha_creacion: fecha, activo: true, imagen_url: "" },

  { id_producto: "p14", id_categoria: "cat5", nombre: "Guacamole Porción", descripcion: "Porción de guacamole fresco con totopos", precio: 9000, disponible: true, tiempo_preparacion_min: 4, fecha_creacion: fecha, activo: true, imagen_url: "" },
  { id_producto: "p15", id_categoria: "cat5", nombre: "Papas con Queso", descripcion: "Papas a la francesa bañadas en queso mozzarella", precio: 11000, disponible: true, tiempo_preparacion_min: 6, fecha_creacion: fecha, activo: true, imagen_url: "" },
];

