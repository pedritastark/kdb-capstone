import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { notificaciones as notificacionesMock } from "../mocks/notificaciones";
import type { Notificacion } from "../types";

interface NotificacionesContextValue {
  notificaciones: Notificacion[];
  noLeidas: number;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
}

const NotificacionesContext = createContext<NotificacionesContextValue | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesMock);

  const marcarLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id_notificacion === id ? { ...n, estado: "leida" } : n)),
    );
  };

  const marcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, estado: "leida" })));
  };

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
