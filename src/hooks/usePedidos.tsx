import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import type { DetallePedido, EstadoPedido, HistorialEstado, Pedido, TipoEntrega } from "../types";

export function siguienteEstado(pedido: Pedido): EstadoPedido | null {
  switch (pedido.estado) {
    case "recibido":
    case "confirmado":
      return "en_preparacion";
    case "en_preparacion":
      return "listo";
    case "listo":
      return pedido.tipo_entrega === "domicilio" ? "en_camino" : "entregado";
    case "en_camino":
      return "entregado";
    default:
      return null;
  }
}

interface DetalleCompleto {
  detalles: DetallePedido[];
  historial: HistorialEstado[];
}

export interface CrearPedidoInput {
  telefono_cliente: string;
  nombre_cliente?: string;
  tipo_entrega: TipoEntrega;
  numero_mesa?: string | null;
  id_direccion?: string | null;
  medio_pago: "efectivo" | "nequi" | "daviplata" | "llave";
  items: { id_producto: string; cantidad: number; observaciones?: string }[];
  observaciones?: string;
}

interface PedidosContextValue {
  pedidos: Pedido[];
  detallePedidos: DetallePedido[];
  historialEstados: HistorialEstado[];
  detallesDe: (idPedido: string) => DetallePedido[];
  historialDe: (idPedido: string) => HistorialEstado[];
  avanzarEstado: (idPedido: string) => Promise<void>;
  cancelarPedido: (idPedido: string, motivo: string) => Promise<void>;
  crearPedido: (input: CrearPedidoInput) => Promise<Pedido>;
}

const PedidosContext = createContext<PedidosContextValue | undefined>(undefined);

const INTERVALO_REFRESCO_MS = 15000;

export function PedidosProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallePorPedido, setDetallePorPedido] = useState<Record<string, DetalleCompleto>>({});

  const recargarPedidos = useCallback(() => {
    apiClient
      .get<Pedido[]>("/pedidos")
      .then(setPedidos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    // GET /pedidos es de uso interno (Kanban de cocina/caja): requiere sesión.
    if (!estaAutenticado) return;
    recargarPedidos();
    const id = setInterval(recargarPedidos, INTERVALO_REFRESCO_MS);
    return () => clearInterval(id);
  }, [estaAutenticado, recargarPedidos]);

  const cargarDetalleCompleto = (idPedido: string) => {
    apiClient
      .get<{ detalles: DetallePedido[]; historial: HistorialEstado[] }>(`/pedidos/${idPedido}`)
      .then(({ detalles, historial }) => {
        setDetallePorPedido((prev) => ({ ...prev, [idPedido]: { detalles, historial } }));
      })
      .catch(() => {});
  };

  const detallesDe = (idPedido: string): DetallePedido[] => {
    const cache = detallePorPedido[idPedido];
    if (!cache) {
      cargarDetalleCompleto(idPedido);
      return [];
    }
    return cache.detalles;
  };

  const historialDe = (idPedido: string): HistorialEstado[] => {
    const cache = detallePorPedido[idPedido];
    if (!cache) {
      cargarDetalleCompleto(idPedido);
      return [];
    }
    return cache.historial;
  };

  const avanzarEstado = useCallback(async (idPedido: string) => {
    const actualizado = await apiClient.patch<Pedido>(`/pedidos/${idPedido}/avanzar`);
    setPedidos((prev) => prev.map((p) => (p.id_pedido === idPedido ? actualizado : p)));
    setDetallePorPedido((prev) => {
      const { [idPedido]: _obsoleto, ...resto } = prev;
      return resto;
    });
  }, []);

  const cancelarPedido = useCallback(async (idPedido: string, motivo: string) => {
    const actualizado = await apiClient.post<Pedido>(`/pedidos/${idPedido}/cancelar`, { motivo });
    setPedidos((prev) => prev.map((p) => (p.id_pedido === idPedido ? actualizado : p)));
    setDetallePorPedido((prev) => {
      const { [idPedido]: _obsoleto, ...resto } = prev;
      return resto;
    });
  }, []);

  const crearPedido = useCallback(async (input: CrearPedidoInput) => {
    const pedido = await apiClient.post<Pedido>("/pedidos", input);
    setPedidos((prev) => [...prev, pedido]);
    return pedido;
  }, []);

  const detallePedidos = Object.values(detallePorPedido).flatMap((d) => d.detalles);
  const historialEstados = Object.values(detallePorPedido).flatMap((d) => d.historial);

  return (
    <PedidosContext.Provider
      value={{
        pedidos,
        detallePedidos,
        historialEstados,
        detallesDe,
        historialDe,
        avanzarEstado,
        cancelarPedido,
        crearPedido,
      }}
    >
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error("usePedidos debe usarse dentro de PedidosProvider");
  return ctx;
}
