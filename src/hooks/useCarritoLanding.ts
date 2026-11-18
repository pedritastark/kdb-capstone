import { useCallback, useEffect, useState } from "react";
import type { Producto } from "../types";
import {
  cantidadCarrito,
  cargarCarrito,
  guardarCarrito,
  nuevaLinea,
  totalCarrito,
  type LineaCarrito,
  type Personalizacion,
} from "../lib/carrito";

/** Carrito de la landing, persistido en localStorage para no perderlo al recargar. */
export function useCarritoLanding() {
  const [lineas, setLineas] = useState<LineaCarrito[]>(cargarCarrito);

  useEffect(() => {
    guardarCarrito(lineas);
  }, [lineas]);

  const agregar = useCallback((producto: Producto, personalizacion: Personalizacion, cantidad: number) => {
    const nueva = nuevaLinea(producto, personalizacion, cantidad);
    setLineas((prev) =>
      prev.some((l) => l.clave === nueva.clave)
        ? prev.map((l) => (l.clave === nueva.clave ? { ...l, cantidad: Math.min(50, l.cantidad + cantidad) } : l))
        : [...prev, nueva],
    );
  }, []);

  const cambiarCantidad = useCallback((clave: string, delta: number) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.clave === clave ? { ...l, cantidad: Math.min(50, l.cantidad + delta) } : l))
        .filter((l) => l.cantidad > 0),
    );
  }, []);

  const quitar = useCallback((clave: string) => setLineas((prev) => prev.filter((l) => l.clave !== clave)), []);
  const vaciar = useCallback(() => setLineas([]), []);

  return {
    lineas,
    cantidad: cantidadCarrito(lineas),
    total: totalCarrito(lineas),
    agregar,
    cambiarCantidad,
    quitar,
    vaciar,
  };
}
