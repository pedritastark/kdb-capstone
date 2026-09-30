import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../lib/apiClient";
import type { Categoria, OpcionProducto, Producto } from "../types";

type ProductoConOpciones = Producto & { opciones: OpcionProducto[] };

interface ProductosContextValue {
  productos: Producto[];
  categorias: Categoria[];
  opciones: OpcionProducto[];
  opcionesDe: (idProducto: string) => OpcionProducto[];
  toggleDisponible: (idProducto: string) => Promise<void>;
  toggleActivo: (idProducto: string) => Promise<void>;
  guardarProducto: (producto: Producto) => Promise<void>;
  crearProducto: (producto: Omit<Producto, "id_producto" | "fecha_creacion">) => Promise<void>;
  toggleOpcionDisponible: (idOpcion: string) => Promise<void>;
  agregarOpcion: (opcion: Omit<OpcionProducto, "id_opcion">) => Promise<void>;
}

const ProductosContext = createContext<ProductosContextValue | undefined>(undefined);

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [opciones, setOpciones] = useState<OpcionProducto[]>([]);

  // GET /productos y /categorias son públicos: los usan tanto el panel
  // admin (autenticado) como /toma-orden (sin sesión).
  const recargarProductos = useCallback(async () => {
    const data = await apiClient.get<ProductoConOpciones[]>("/productos");
    setProductos(data.map(({ opciones: _opciones, ...p }) => p));
    setOpciones(data.flatMap((p) => p.opciones));
  }, []);

  useEffect(() => {
    recargarProductos().catch(() => {});
    apiClient
      .get<Categoria[]>("/categorias")
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [recargarProductos]);

  const opcionesDe = (idProducto: string) => opciones.filter((o) => o.id_producto === idProducto);

  const toggleDisponible = useCallback(async (idProducto: string) => {
    const actual = productos.find((p) => p.id_producto === idProducto);
    if (!actual) return;
    const actualizado = await apiClient.patch<Producto>(`/productos/${idProducto}/disponible`, {
      disponible: !actual.disponible,
    });
    setProductos((prev) => prev.map((p) => (p.id_producto === idProducto ? actualizado : p)));
  }, [productos]);

  const toggleActivo = useCallback(async (idProducto: string) => {
    const actual = productos.find((p) => p.id_producto === idProducto);
    if (!actual) return;
    const actualizado = await apiClient.patch<Producto>(`/productos/${idProducto}/activo`, {
      activo: !actual.activo,
    });
    setProductos((prev) => prev.map((p) => (p.id_producto === idProducto ? actualizado : p)));
  }, [productos]);

  const guardarProducto = useCallback(async (producto: Producto) => {
    const actualizado = await apiClient.put<Producto>(`/productos/${producto.id_producto}`, producto);
    setProductos((prev) => prev.map((p) => (p.id_producto === actualizado.id_producto ? actualizado : p)));
  }, []);

  const crearProducto = useCallback(async (producto: Omit<Producto, "id_producto" | "fecha_creacion">) => {
    const nuevo = await apiClient.post<Producto>("/productos", producto);
    setProductos((prev) => [...prev, nuevo]);
  }, []);

  const toggleOpcionDisponible = useCallback(async (idOpcion: string) => {
    const actual = opciones.find((o) => o.id_opcion === idOpcion);
    if (!actual) return;
    const actualizada = await apiClient.patch<OpcionProducto>(`/opciones/${idOpcion}/disponible`, {
      disponible: !actual.disponible,
    });
    setOpciones((prev) => prev.map((o) => (o.id_opcion === idOpcion ? actualizada : o)));
  }, [opciones]);

  const agregarOpcion = useCallback(async (opcion: Omit<OpcionProducto, "id_opcion">) => {
    const nueva = await apiClient.post<OpcionProducto>(`/productos/${opcion.id_producto}/opciones`, opcion);
    setOpciones((prev) => [...prev, nueva]);
  }, []);

  return (
    <ProductosContext.Provider
      value={{
        productos,
        categorias,
        opciones,
        opcionesDe,
        toggleDisponible,
        toggleActivo,
        guardarProducto,
        crearProducto,
        toggleOpcionDisponible,
        agregarOpcion,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos(): ProductosContextValue {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error("useProductos debe usarse dentro de ProductosProvider");
  return ctx;
}
