import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import { useProductos } from "./useProductos";
import type { Ingrediente, MovimientoInventario, TipoMovimientoInventario } from "../types";

interface RegistrarMovimientoInput {
  id_ingrediente: string;
  tipo_movimiento: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  id_pedido?: string | null;
}

export type IngredienteConCantidad = Ingrediente & { cantidad_requerida: number };

/** Una línea de receta: cuánto de un ingrediente consume UNA unidad vendida del plato. */
export interface LineaReceta {
  id_ingrediente: string;
  cantidad_requerida: number;
}

interface InventarioContextValue {
  ingredientes: Ingrediente[];
  movimientos: MovimientoInventario[];
  movimientosDe: (idIngrediente: string) => MovimientoInventario[];
  ingredientesDeProducto: (idProducto: string) => IngredienteConCantidad[];
  /** false mientras la receta del plato aún se está cargando (la lista vacía no significa "sin receta"). */
  recetaCargada: (idProducto: string) => boolean;
  /** Reemplaza la receta completa del plato. */
  guardarReceta: (idProducto: string, lineas: LineaReceta[]) => Promise<void>;
  toggleDisponible: (idIngrediente: string) => Promise<void>;
  registrarMovimiento: (input: RegistrarMovimientoInput) => Promise<void>;
  crearIngrediente: (input: IngredienteInput) => Promise<Ingrediente>;
  guardarIngrediente: (idIngrediente: string, input: IngredienteInput) => Promise<Ingrediente>;
}

/** Campos editables de un ingrediente. cantidad_actual solo cuenta al crear:
 * después el stock cambia únicamente con movimientos (entrada, consumo...). */
export type IngredienteInput = Pick<
  Ingrediente,
  "nombre" | "unidad_medida" | "tipo_control" | "cantidad_actual" | "cantidad_minima" | "disponible" | "activo" | "imagen_url"
>;

const InventarioContext = createContext<InventarioContextValue | undefined>(undefined);

export function InventarioProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const { recargar: recargarProductos } = useProductos();
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

  const recetaCargada = (idProducto: string): boolean => ingredientesPorProducto[idProducto] !== undefined;

  const guardarReceta = useCallback(
    async (idProducto: string, lineas: LineaReceta[]) => {
      const receta = await apiClient.put<IngredienteConCantidad[]>(`/productos/${idProducto}/ingredientes`, {
        ingredientes: lineas,
      });
      setIngredientesPorProducto((prev) => ({ ...prev, [idProducto]: receta }));
      // La base recalcula si el plato queda disponible según el stock, y n_ingredientes cambió:
      // se relee el menú para reflejarlo.
      recargarProductos();
    },
    [recargarProductos],
  );

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

  const crearIngrediente = useCallback(async (input: IngredienteInput) => {
    const nuevo = await apiClient.post<Ingrediente>("/ingredientes", input);
    setIngredientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
    return nuevo;
  }, []);

  const guardarIngrediente = useCallback(async (idIngrediente: string, input: IngredienteInput) => {
    const actualizado = await apiClient.put<Ingrediente>(`/ingredientes/${idIngrediente}`, input);
    setIngredientes((prev) => prev.map((i) => (i.id_ingrediente === idIngrediente ? actualizado : i)));
    return actualizado;
  }, []);

  const movimientos = Object.values(movimientosPorIngrediente).flat();

  return (
    <InventarioContext.Provider
      value={{
        ingredientes,
        movimientos,
        movimientosDe,
        ingredientesDeProducto,
        recetaCargada,
        guardarReceta,
        toggleDisponible,
        registrarMovimiento,
        crearIngrediente,
        guardarIngrediente,
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
