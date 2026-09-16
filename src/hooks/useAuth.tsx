import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usuarioActual } from "../mocks/usuarios";
import type { Usuario } from "../types";

interface SesionGuardada {
  usuario: Usuario;
}

const STORAGE_KEY = "danny-tacos-sesion";

interface AuthContextValue {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  iniciarSesion: (correo: string) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function leerSesion(): Usuario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SesionGuardada;
    return data.usuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerSesion());

  const iniciarSesion = useCallback((_correo: string) => {
    const sesion: SesionGuardada = { usuario: usuarioActual };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    setUsuario(usuarioActual);
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, estaAutenticado: usuario !== null, iniciarSesion, cerrarSesion }),
    [usuario, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
