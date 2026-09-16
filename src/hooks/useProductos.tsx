import { createContext, useContext, useState, type ReactNode } from "react";
import { productos as productosMock } from "../mocks/productos";
import { categorias as categoriasMock } from "../mocks/categorias";
import { opciones as opcionesMock } from "../mocks/opciones";
import type { Categoria, OpcionProducto, Producto } from "../types";

interface ProductosContextValue {
  productos: Producto[];
  categorias: Categoria[];
  opciones: OpcionProducto[];
  opcionesDe: (idProducto: string) => OpcionProducto[];
  toggleDisponible: (idProducto: string) => void;
  toggleActivo: (idProducto: string) => void;
  guardarProducto: (producto: Producto) => void;
  crearProducto: (producto: Omit<Producto, "id_producto" | "fecha_creacion">) => void;
  toggleOpcionDisponible: (idOpcion: string) => void;
  agregarOpcion: (opcion: Omit<OpcionProducto, "id_opcion">) => void;
}

const ProductosContext = createContext<ProductosContextValue | undefined>(undefined);

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(productosMock);
  const [categorias] = useState<Categoria[]>(categoriasMock);
  const [opciones, setOpciones] = useState<OpcionProducto[]>(opcionesMock);

  const opcionesDe = (idProducto: string) => opciones.filter((o) => o.id_producto === idProducto);

  const toggleDisponible = (idProducto: string) => {
    setProductos((prev) =>
      prev.map((p) => (p.id_producto === idProducto ? { ...p, disponible: !p.disponible } : p)),
    );
  };

  const toggleActivo = (idProducto: string) => {
    setProductos((prev) =>
      prev.map((p) => (p.id_producto === idProducto ? { ...p, activo: !p.activo } : p)),
    );
  };

  const guardarProducto = (producto: Producto) => {
    setProductos((prev) => prev.map((p) => (p.id_producto === producto.id_producto ? producto : p)));
  };

  const crearProducto = (producto: Omit<Producto, "id_producto" | "fecha_creacion">) => {
    const nuevo: Producto = {
      ...producto,
      id_producto: `p-${Date.now()}`,
      fecha_creacion: new Date().toISOString(),
    };
    setProductos((prev) => [...prev, nuevo]);
  };

  const toggleOpcionDisponible = (idOpcion: string) => {
    setOpciones((prev) =>
      prev.map((o) => (o.id_opcion === idOpcion ? { ...o, disponible: !o.disponible } : o)),
    );
  };

  const agregarOpcion = (opcion: Omit<OpcionProducto, "id_opcion">) => {
    const nueva: OpcionProducto = { ...opcion, id_opcion: `op-custom-${Date.now()}` };
    setOpciones((prev) => [...prev, nueva]);
  };

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
