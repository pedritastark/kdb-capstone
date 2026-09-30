import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useProductos } from "../hooks/useProductos";
import { usePedidos } from "../hooks/usePedidos";
import { ApiError } from "../lib/apiClient";
import { MesaGate } from "../components/TomaOrden/MesaGate";
import { CategoriasView } from "../components/TomaOrden/CategoriasView";
import { ProductosView } from "../components/TomaOrden/ProductosView";
import { CarritoView } from "../components/TomaOrden/CarritoView";
import { ConfirmacionView } from "../components/TomaOrden/ConfirmacionView";
import { CartBar } from "../components/TomaOrden/CartBar";
import type { MedioPago, Producto } from "../types";

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

type Vista = "categorias" | "productos" | "carrito" | "confirmacion";

export function TomaOrdenPage() {
  const [searchParams] = useSearchParams();
  const [mesa, setMesa] = useState<string | null>(searchParams.get("mesa"));

  const { productos, categorias } = useProductos();
  const { crearPedido } = usePedidos();
  const [vista, setVista] = useState<Vista>("categorias");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [telefono, setTelefono] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [enviando, setEnviando] = useState(false);
  const [errorPedido, setErrorPedido] = useState("");
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null);

  if (!mesa) {
    return <MesaGate onConfirmar={setMesa} />;
  }

  const categoriasActivas = categorias.filter((c) => c.activa);
  const productosDisponibles = productos.filter((p) => p.activo && p.disponible);

  const cantidadEnCarrito = (idProducto: string) =>
    carrito.find((i) => i.producto.id_producto === idProducto)?.cantidad ?? 0;

  const agregar = (producto: Producto) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id_producto === producto.id_producto);
      if (existente) {
        return prev.map((i) =>
          i.producto.id_producto === producto.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const quitar = (idProducto: string) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.producto.id_producto === idProducto ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0),
    );
  };

  const irACategoria = (idCategoria: string) => {
    setCategoriaId(idCategoria);
    setVista("productos");
  };

  const confirmarPedido = async () => {
    if (!telefono.trim()) {
      setErrorPedido("Ingresa un teléfono de contacto.");
      return;
    }
    setEnviando(true);
    setErrorPedido("");
    try {
      const pedido = await crearPedido({
        telefono_cliente: telefono.trim(),
        tipo_entrega: "mesa",
        numero_mesa: mesa,
        medio_pago: medioPago,
        items: carrito.map((i) => ({ id_producto: i.producto.id_producto, cantidad: i.cantidad })),
      });
      setCodigoPedido(pedido.codigo);
      setCarrito([]);
      setVista("confirmacion");
    } catch (err) {
      setErrorPedido(err instanceof ApiError ? err.message : "No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const nuevoPedido = () => {
    setCategoriaId(null);
    setTelefono("");
    setCodigoPedido(null);
    setVista("categorias");
  };

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total = carrito.reduce((s, i) => s + i.cantidad * i.producto.precio, 0);

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Box maxW="480px" mx="auto" minH="100vh" bg="bg.canvas" position="relative">
        {vista !== "confirmacion" && (
          <Flex
            align="center"
            justify="space-between"
            px={5}
            py={3}
            bg="bg.surface"
            borderBottom="1px solid"
            borderColor="border.subtle"
            position="sticky"
            top={0}
            zIndex={10}
          >
            <Flex align="center" gap={2}>
              <Text fontSize="lg">🌮</Text>
              <Text fontFamily="heading" letterSpacing="wide" fontSize="md" color="white">
                DANNY TACOS
              </Text>
            </Flex>
            <Flex
              align="center"
              gap={1}
              bg="bg.inset"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              color="accent.500"
            >
              Mesa #{mesa}
            </Flex>
          </Flex>
        )}

        {vista === "categorias" && (
          <CategoriasView categorias={categoriasActivas} onSeleccionar={irACategoria} />
        )}

        {vista === "productos" && categoriaId && (
          <ProductosView
            categorias={categoriasActivas}
            categoriaId={categoriaId}
            productos={productosDisponibles}
            cantidadEnCarrito={cantidadEnCarrito}
            onSeleccionarCategoria={setCategoriaId}
            onVolver={() => setVista("categorias")}
            onAgregar={agregar}
            onQuitar={quitar}
          />
        )}

        {vista === "carrito" && (
          <CarritoView
            carrito={carrito}
            total={total}
            telefono={telefono}
            onTelefonoChange={setTelefono}
            medioPago={medioPago}
            onMedioPagoChange={setMedioPago}
            enviando={enviando}
            error={errorPedido}
            onVolver={() => setVista(categoriaId ? "productos" : "categorias")}
            onAgregar={(idProducto) => {
              const item = carrito.find((i) => i.producto.id_producto === idProducto);
              if (item) agregar(item.producto);
            }}
            onQuitar={quitar}
            onConfirmar={confirmarPedido}
          />
        )}

        {vista === "confirmacion" && (
          <ConfirmacionView mesa={mesa} codigo={codigoPedido} onNuevoPedido={nuevoPedido} />
        )}

        {(vista === "categorias" || vista === "productos") && (
          <CartBar totalItems={totalItems} total={total} onVerPedido={() => setVista("carrito")} />
        )}
      </Box>
    </Box>
  );
}
