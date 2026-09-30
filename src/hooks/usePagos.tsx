import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import type { EstadoPago, Pago } from "../types";

interface PagosContextValue {
  pagos: Pago[];
  cambiarEstado: (idPago: string, estado: EstadoPago) => Promise<void>;
}

const PagosContext = createContext<PagosContextValue | undefined>(undefined);

export function PagosProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);

  useEffect(() => {
    if (!estaAutenticado) return;
    apiClient
      .get<Pago[]>("/pagos")
      .then(setPagos)
      .catch(() => setPagos([]));
  }, [estaAutenticado]);

  const cambiarEstado = useCallback(async (idPago: string, estado: EstadoPago) => {
    const actualizado = await apiClient.patch<Pago>(`/pagos/${idPago}/estado`, { estado });
    setPagos((prev) => prev.map((p) => (p.id_pago === idPago ? actualizado : p)));
  }, []);

  return <PagosContext.Provider value={{ pagos, cambiarEstado }}>{children}</PagosContext.Provider>;
}

export function usePagos(): PagosContextValue {
  const ctx = useContext(PagosContext);
  if (!ctx) throw new Error("usePagos debe usarse dentro de PagosProvider");
  return ctx;
}
