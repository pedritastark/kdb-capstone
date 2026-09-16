import { createContext, useContext, useState, type ReactNode } from "react";
import { pagos as pagosMock } from "../mocks/pagos";
import type { EstadoPago, Pago } from "../types";

interface PagosContextValue {
  pagos: Pago[];
  cambiarEstado: (idPago: string, estado: EstadoPago) => void;
}

const PagosContext = createContext<PagosContextValue | undefined>(undefined);

export function PagosProvider({ children }: { children: ReactNode }) {
  const [pagos, setPagos] = useState<Pago[]>(pagosMock);

  const cambiarEstado = (idPago: string, estado: EstadoPago) => {
    setPagos((prev) => prev.map((p) => (p.id_pago === idPago ? { ...p, estado } : p)));
  };

  return <PagosContext.Provider value={{ pagos, cambiarEstado }}>{children}</PagosContext.Provider>;
}

export function usePagos(): PagosContextValue {
  const ctx = useContext(PagosContext);
  if (!ctx) throw new Error("usePagos debe usarse dentro de PagosProvider");
  return ctx;
}
