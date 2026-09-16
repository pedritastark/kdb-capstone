import type { OpcionProducto } from "../types";

const productosConPersonalizacion = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"];

function buildOpcionesParaProducto(idProducto: string): OpcionProducto[] {
  const cerdoDisponible = idProducto !== "p4";
  return [
    { id_opcion: `op-${idProducto}-proteina-res`, id_producto: idProducto, tipo: "proteina", nombre: "Res", precio_adicional: 0, obligatoria: true, disponible: true },
    { id_opcion: `op-${idProducto}-proteina-pollo`, id_producto: idProducto, tipo: "proteina", nombre: "Pollo", precio_adicional: 0, obligatoria: true, disponible: true },
    { id_opcion: `op-${idProducto}-proteina-cerdo`, id_producto: idProducto, tipo: "proteina", nombre: "Cerdo", precio_adicional: 0, obligatoria: true, disponible: cerdoDisponible },
    { id_opcion: `op-${idProducto}-proteina-mixta`, id_producto: idProducto, tipo: "proteina", nombre: "Mixta", precio_adicional: 2000, obligatoria: true, disponible: true },

    { id_opcion: `op-${idProducto}-salsa-verde`, id_producto: idProducto, tipo: "salsa", nombre: "Verde", precio_adicional: 0, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-salsa-roja`, id_producto: idProducto, tipo: "salsa", nombre: "Roja", precio_adicional: 0, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-salsa-chipotle`, id_producto: idProducto, tipo: "salsa", nombre: "Chipotle", precio_adicional: 0, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-salsa-bbq`, id_producto: idProducto, tipo: "salsa", nombre: "BBQ", precio_adicional: 0, obligatoria: false, disponible: true },

    { id_opcion: `op-${idProducto}-picante-nada`, id_producto: idProducto, tipo: "picante", nombre: "Nada", precio_adicional: 0, obligatoria: true, disponible: true },
    { id_opcion: `op-${idProducto}-picante-suave`, id_producto: idProducto, tipo: "picante", nombre: "Suave", precio_adicional: 0, obligatoria: true, disponible: true },
    { id_opcion: `op-${idProducto}-picante-medio`, id_producto: idProducto, tipo: "picante", nombre: "Medio", precio_adicional: 0, obligatoria: true, disponible: true },
    { id_opcion: `op-${idProducto}-picante-alto`, id_producto: idProducto, tipo: "picante", nombre: "Alto", precio_adicional: 0, obligatoria: true, disponible: true },

    { id_opcion: `op-${idProducto}-adicional-guacamole`, id_producto: idProducto, tipo: "adicional", nombre: "Guacamole extra", precio_adicional: 3000, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-adicional-queso`, id_producto: idProducto, tipo: "adicional", nombre: "Queso extra", precio_adicional: 2000, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-adicional-crema`, id_producto: idProducto, tipo: "adicional", nombre: "Crema", precio_adicional: 1500, obligatoria: false, disponible: true },
    { id_opcion: `op-${idProducto}-adicional-pico`, id_producto: idProducto, tipo: "adicional", nombre: "Pico de gallo", precio_adicional: 1500, obligatoria: false, disponible: true },
  ];
}

export const opciones: OpcionProducto[] = productosConPersonalizacion.flatMap(buildOpcionesParaProducto);

export function opcionesPorProducto(idProducto: string): OpcionProducto[] {
  return opciones.filter((o) => o.id_producto === idProducto);
}
