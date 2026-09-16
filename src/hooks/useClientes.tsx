import { createContext, useContext, useState, type ReactNode } from "react";
import { clientes as clientesMock, direcciones as direccionesMock } from "../mocks/clientes";
import type { Cliente, Direccion } from "../types";

interface ClientesContextValue {
  clientes: Cliente[];
  direcciones: Direccion[];
  direccionesDe: (idCliente: string) => Direccion[];
  guardarCliente: (cliente: Cliente) => void;
  crearCliente: (cliente: Omit<Cliente, "id_cliente">) => void;
}

const ClientesContext = createContext<ClientesContextValue | undefined>(undefined);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesMock);
  const [direcciones] = useState<Direccion[]>(direccionesMock);

  const direccionesDe = (idCliente: string) => direcciones.filter((d) => d.id_cliente === idCliente);

  const guardarCliente = (cliente: Cliente) => {
    setClientes((prev) => prev.map((c) => (c.id_cliente === cliente.id_cliente ? cliente : c)));
  };

  const crearCliente = (cliente: Omit<Cliente, "id_cliente">) => {
    const nuevo: Cliente = { ...cliente, id_cliente: `c-${Date.now()}` };
    setClientes((prev) => [...prev, nuevo]);
  };

  return (
    <ClientesContext.Provider value={{ clientes, direcciones, direccionesDe, guardarCliente, crearCliente }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes(): ClientesContextValue {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error("useClientes debe usarse dentro de ClientesProvider");
  return ctx;
}
