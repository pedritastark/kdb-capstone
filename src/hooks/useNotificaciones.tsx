import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import { useAuth } from "./useAuth";
import type { Notificacion } from "../types";

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  noLeidas: number;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextValue | undefined>(undefined);

const INTERVALO_REFRESCO_MS = 15000;

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (!estaAutenticado) return;
    const recargar = () => apiClient.get<Notificacion[]>("/notificaciones").then(setNotificaciones).catch(() => {});
    recargar();
    const id = setInterval(recargar, INTERVALO_REFRESCO_MS);
    return () => clearInterval(id);
  }, [estaAutenticado]);

  const marcarLeida = useCallback(async (id: string) => {
    const actualizada = await apiClient.patch<Notificacion>(`/notificaciones/${id}/leida`);
    setNotificaciones((prev) => prev.map((n) => (n.id_notificacion === id ? actualizada : n)));
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    await apiClient.patch(`/notificaciones/marcar-todas-leidas`);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, estado: "leida" })));
  }, []);

  const noLeidas = useMemo(
    () => notificaciones.filter((n) => n.estado === "no_leida").length,
    [notificaciones],
  );

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, marcarLeida, marcarTodasLeidas }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones(): NotificacionesContextValue {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return ctx;
}
