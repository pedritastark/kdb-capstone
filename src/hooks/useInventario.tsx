import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import type { Ingrediente, MovimientoInventario, TipoMovimientoInventario } from "../types";

interface RegistrarMovimientoInput {
  id_ingrediente: string;
  tipo_movimiento: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  id_pedido?: string | null;
}

type IngredienteConCantidad = Ingrediente & { cantidad_requerida: number };

interface InventarioContextValue {
  ingredientes: Ingrediente[];
  movimientos: MovimientoInventario[];
  movimientosDe: (idIngrediente: string) => MovimientoInventario[];
  ingredientesDeProducto: (idProducto: string) => IngredienteConCantidad[];
  toggleDisponible: (idIngrediente: string) => Promise<void>;
  registrarMovimiento: (input: RegistrarMovimientoInput) => Promise<void>;
}

const InventarioContext = createContext<InventarioContextValue | undefined>(undefined);

export function InventarioProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [movimientosPorIngrediente, setMovimientosPorIngrediente] = useState<
    Record<string, MovimientoInventario[]>
  >({});
  const [ingredientesPorProducto, setIngredientesPorProducto] = useState<
    Record<string, IngredienteConCantidad[]>
  >({});

  useEffect(() => {
    if (!estaAutenticado) return;
    apiClient
      .get<Ingrediente[]>("/ingredientes")
      .then(setIngredientes)
      .catch(() => setIngredientes([]));
  }, [estaAutenticado]);

  const movimientosDe = (idIngrediente: string): MovimientoInventario[] => {
    const cache = movimientosPorIngrediente[idIngrediente];
    if (!cache) {
      apiClient
        .get<MovimientoInventario[]>(`/ingredientes/${idIngrediente}/movimientos`)
        .then((data) => setMovimientosPorIngrediente((prev) => ({ ...prev, [idIngrediente]: data })))
        .catch(() => {});
      return [];
    }
    return cache;
  };

  const ingredientesDeProducto = (idProducto: string): IngredienteConCantidad[] => {
    const cache = ingredientesPorProducto[idProducto];
    if (!cache) {
      if (idProducto) {
        apiClient
          .get<IngredienteConCantidad[]>(`/productos/${idProducto}/ingredientes`)
          .then((data) => setIngredientesPorProducto((prev) => ({ ...prev, [idProducto]: data })))
          .catch(() => {});
      }
      return [];
    }
    return cache;
  };

  const toggleDisponible = useCallback(async (idIngrediente: string) => {
    const actual = ingredientes.find((i) => i.id_ingrediente === idIngrediente);
    if (!actual) return;
    const actualizado = await apiClient.patch<Ingrediente>(`/ingredientes/${idIngrediente}/disponible`, {
      disponible: !actual.disponible,
    });
    setIngredientes((prev) => prev.map((i) => (i.id_ingrediente === idIngrediente ? actualizado : i)));
  }, [ingredientes]);

  const registrarMovimiento = useCallback(async (input: RegistrarMovimientoInput) => {
    const movimiento = await apiClient.post<MovimientoInventario>(
      `/ingredientes/${input.id_ingrediente}/movimientos`,
      input,
    );
    setMovimientosPorIngrediente((prev) => ({
      ...prev,
      [input.id_ingrediente]: [movimiento, ...(prev[input.id_ingrediente] ?? [])],
    }));
    // El backend recalculó cantidad_actual (vía el trigger de la BD); se relee el ingrediente.
    const actualizado = await apiClient.get<Ingrediente[]>("/ingredientes");
    setIngredientes(actualizado);
  }, []);

  const movimientos = Object.values(movimientosPorIngrediente).flat();

  return (
    <InventarioContext.Provider
      value={{
        ingredientes,
        movimientos,
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
