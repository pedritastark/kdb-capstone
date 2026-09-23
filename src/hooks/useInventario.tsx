import { createContext, useContext, useState, type ReactNode } from "react";
import { ingredientes as ingredientesMock, movimientos as movimientosMock } from "../mocks/ingredientes";
import { productoIngredientes } from "../mocks/productos";
import type { Ingrediente, MovimientoInventario, TipoMovimientoInventario } from "../types";

interface RegistrarMovimientoInput {
  id_ingrediente: string;
  tipo_movimiento: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  id_pedido?: string | null;
}

interface InventarioContextValue {
  ingredientes: Ingrediente[];
  movimientos: MovimientoInventario[];
  productoIngredientes: typeof productoIngredientes;
  movimientosDe: (idIngrediente: string) => MovimientoInventario[];
  ingredientesDeProducto: (idProducto: string) => (Ingrediente & { cantidad_requerida: number })[];
  toggleDisponible: (idIngrediente: string) => void;
  registrarMovimiento: (input: RegistrarMovimientoInput) => void;
}

const InventarioContext = createContext<InventarioContextValue | undefined>(undefined);

export function InventarioProvider({ children }: { children: ReactNode }) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(ingredientesMock);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>(movimientosMock);

  const movimientosDe = (idIngrediente: string) =>
    movimientos
      .filter((m) => m.id_ingrediente === idIngrediente)
      .sort((a, b) => new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime());

  const ingredientesDeProducto = (idProducto: string) =>
    productoIngredientes
      .filter((pi) => pi.id_producto === idProducto)
      .map((pi) => {
        const ing = ingredientes.find((i) => i.id_ingrediente === pi.id_ingrediente)!;
        return { ...ing, cantidad_requerida: pi.cantidad_requerida };
      })
      .filter((i) => i.id_ingrediente !== undefined);

  const toggleDisponible = (idIngrediente: string) => {
    setIngredientes((prev) =>
      prev.map((i) => (i.id_ingrediente === idIngrediente ? { ...i, disponible: !i.disponible } : i)),
    );
  };

  const registrarMovimiento = (input: RegistrarMovimientoInput) => {
    const ingrediente = ingredientes.find((i) => i.id_ingrediente === input.id_ingrediente);
    if (!ingrediente) return;

    const esEntrada = input.tipo_movimiento === "entrada" || input.tipo_movimiento === "devolucion";
    const delta = esEntrada ? input.cantidad : -input.cantidad;
    const cantidadAnterior = ingrediente.cantidad_actual;
    const cantidadNueva = Math.max(0, cantidadAnterior + delta);

    const movimiento: MovimientoInventario = {
      id_movimiento: `m-${Date.now()}`,
      id_ingrediente: input.id_ingrediente,
      id_pedido: input.id_pedido ?? null,
      tipo_movimiento: input.tipo_movimiento,
      cantidad: input.cantidad,
      cantidad_anterior: cantidadAnterior,
      cantidad_nueva: cantidadNueva,
      motivo: input.motivo,
      fecha_movimiento: new Date().toISOString(),
    };

    setMovimientos((prev) => [movimiento, ...prev]);
    setIngredientes((prev) =>
      prev.map((i) => (i.id_ingrediente === input.id_ingrediente ? { ...i, cantidad_actual: cantidadNueva } : i)),
    );
  };

  return (
    <InventarioContext.Provider
      value={{
        ingredientes,
        movimientos,
        productoIngredientes,
        movimientosDe,
        ingredientesDeProducto,
        toggleDisponible,
        registrarMovimiento,
      }}
    >
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario(): InventarioContextValue {
  const ctx = useContext(InventarioContext);
  if (!ctx) throw new Error("useInventario debe usarse dentro de InventarioProvider");
  return ctx;
}
