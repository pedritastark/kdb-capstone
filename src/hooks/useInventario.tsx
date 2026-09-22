import { createContext, useContext, useState, type ReactNode } from "react";
import { ingredientes as ingredientesMock } from "../mocks/ingredientes";
import type { Ingrediente } from "../types";

interface InventarioContextValue {
  ingredientes: Ingrediente[];
  toggleDisponible: (idIngrediente: string) => void;
}

const InventarioContext = createContext<InventarioContextValue | undefined>(undefined);

export function InventarioProvider({ children }: { children: ReactNode }) {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(ingredientesMock);

  const toggleDisponible = (idIngrediente: string) => {
    setIngredientes((prev) =>
      prev.map((i) => (i.id_ingrediente === idIngrediente ? { ...i, disponible: !i.disponible } : i)),
    );
  };

  return (
    <InventarioContext.Provider value={{ ingredientes, toggleDisponible }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario(): InventarioContextValue {
  const ctx = useContext(InventarioContext);
  if (!ctx) throw new Error("useInventario debe usarse dentro de InventarioProvider");
  return ctx;
}
