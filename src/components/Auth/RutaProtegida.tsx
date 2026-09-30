import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function RutaProtegida({ children }: { children: ReactNode }) {
  const { estaAutenticado, cargando } = useAuth();
  // Mientras se verifica el token guardado (GET /auth/me), no redirigir todavía.
  if (cargando) return null;
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
