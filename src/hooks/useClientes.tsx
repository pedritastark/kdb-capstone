import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import type { Cliente, Direccion } from "../types";

interface ClientesContextValue {
  clientes: Cliente[];
  direcciones: Direccion[];
  direccionesDe: (idCliente: string) => Direccion[];
  guardarCliente: (cliente: Cliente) => Promise<void>;
  crearCliente: (cliente: Omit<Cliente, "id_cliente">) => Promise<void>;
}

const ClientesContext = createContext<ClientesContextValue | undefined>(undefined);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);

  useEffect(() => {
    // /clientes requiere sesión de staff — no tiene sentido pedirla en /login o /toma-orden.
    if (!estaAutenticado) return;
    apiClient
      .get<Cliente[]>("/clientes")
      .then(async (data) => {
        setClientes(data);
        const porCliente = await Promise.all(
          data.map((c) => apiClient.get<Direccion[]>(`/clientes/${c.id_cliente}/direcciones`)),
        );
        setDirecciones(porCliente.flat());
      })
      .catch(() => setClientes([]));
  }, [estaAutenticado]);

  const direccionesDe = (idCliente: string) => direcciones.filter((d) => d.id_cliente === idCliente);

  const guardarCliente = useCallback(async (cliente: Cliente) => {
    const actualizado = await apiClient.put<Cliente>(`/clientes/${cliente.id_cliente}`, cliente);
    setClientes((prev) => prev.map((c) => (c.id_cliente === actualizado.id_cliente ? actualizado : c)));
  }, []);

  const crearCliente = useCallback(async (cliente: Omit<Cliente, "id_cliente">) => {
    const nuevo = await apiClient.post<Cliente>("/clientes", cliente);
    setClientes((prev) => [...prev, nuevo]);
  }, []);

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
