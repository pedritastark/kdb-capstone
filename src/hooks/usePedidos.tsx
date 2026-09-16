import { createContext, useContext, useState, type ReactNode } from "react";
import { pedidos as pedidosMock, detallePedidos as detalleMock, historialEstados as historialMock } from "../mocks/pedidos";
import { usuarioActual } from "../mocks/usuarios";
import type { DetallePedido, EstadoPedido, HistorialEstado, Pedido } from "../types";

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

interface PedidosContextValue {
  pedidos: Pedido[];
  detallePedidos: DetallePedido[];
  historialEstados: HistorialEstado[];
  detallesDe: (idPedido: string) => DetallePedido[];
  historialDe: (idPedido: string) => HistorialEstado[];
  avanzarEstado: (idPedido: string) => void;
  cancelarPedido: (idPedido: string, motivo: string) => void;
}

const PedidosContext = createContext<PedidosContextValue | undefined>(undefined);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosMock);
  const [historialEstados, setHistorialEstados] = useState<HistorialEstado[]>(historialMock);
  const [detallePedidos] = useState<DetallePedido[]>(detalleMock);

  const registrarHistorial = (
    idPedido: string,
    estadoAnterior: EstadoPedido,
    estadoNuevo: EstadoPedido,
    observacion: string,
  ) => {
    const entrada: HistorialEstado = {
      id_historial: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      id_pedido: idPedido,
      id_usuario: usuarioActual.id_usuario,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      observacion,
      hora_cambio: new Date().toISOString(),
    };
    setHistorialEstados((prev) => [...prev, entrada]);
  };

  const avanzarEstado = (idPedido: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id_pedido !== idPedido) return p;
        const nuevo = siguienteEstado(p);
        if (!nuevo) return p;
        registrarHistorial(idPedido, p.estado, nuevo, "");
        return { ...p, estado: nuevo };
      }),
    );
  };

  const cancelarPedido = (idPedido: string, motivo: string) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id_pedido !== idPedido) return p;
        registrarHistorial(idPedido, p.estado, "cancelado", motivo);
        return { ...p, estado: "cancelado", observaciones: motivo || p.observaciones };
      }),
    );
  };

  const detallesDe = (idPedido: string) => detallePedidos.filter((d) => d.id_pedido === idPedido);
  const historialDe = (idPedido: string) =>
    historialEstados
      .filter((h) => h.id_pedido === idPedido)
      .sort((a, b) => new Date(a.hora_cambio).getTime() - new Date(b.hora_cambio).getTime());

  return (
    <PedidosContext.Provider
      value={{ pedidos, detallePedidos, historialEstados, detallesDe, historialDe, avanzarEstado, cancelarPedido }}
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
