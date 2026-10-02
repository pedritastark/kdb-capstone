import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import { useProductos } from "../hooks/useProductos";
import { usePedidos } from "../hooks/usePedidos";
import { ApiError } from "../lib/apiClient";
import { EntregaGate } from "../components/TomaOrden/EntregaGate";
import { MesaGate } from "../components/TomaOrden/MesaGate";
import { DireccionGate, type DatosDireccion } from "../components/TomaOrden/DireccionGate";
import { CategoriasView } from "../components/TomaOrden/CategoriasView";
import { ProductosView } from "../components/TomaOrden/ProductosView";
import { CarritoView } from "../components/TomaOrden/CarritoView";
import { ConfirmacionView } from "../components/TomaOrden/ConfirmacionView";
import { CartBar } from "../components/TomaOrden/CartBar";
import { PersonalizarModal, type Personalizacion } from "../components/TomaOrden/PersonalizarModal";
import logoDannyTacos from "../assets/images/logo-danny-tacos.jpg";
import type { MedioPago, OpcionProducto, Producto, TipoEntrega } from "../types";

export interface ItemCarrito {
  claveLinea: string;
  producto: Producto;
  cantidad: number;
  excluidos: string[];
  adicionales: OpcionProducto[];
}

type Vista = "categorias" | "productos" | "carrito" | "confirmacion";

const SIN_PERSONALIZAR: Personalizacion = { excluidos: [], adicionales: [] };

function claveDeLinea(idProducto: string, p: Personalizacion): string {
  const exc = [...p.excluidos].sort().join("|");
  const ads = p.adicionales.map((a) => a.id_opcion).sort().join("|");
  return `${idProducto}::${exc}::${ads}`;
}

function precioLinea(item: ItemCarrito): number {
  return item.producto.precio + item.adicionales.reduce((s, a) => s + a.precio_adicional, 0);
}

export function TomaOrdenPage() {
  const [searchParams] = useSearchParams();
  // Si la URL ya trae ?mesa= (QR de la mesa), el tipo de entrega "mesa" se
  // asume de una vez y el paso de EntregaGate se salta.
  const [tipoEntrega, setTipoEntrega] = useState<Extract<TipoEntrega, "mesa" | "domicilio"> | null>(() =>
    searchParams.get("mesa") ? "mesa" : null,
  );
  const [mesa, setMesa] = useState<string | null>(searchParams.get("mesa"));
  const [direccion, setDireccion] = useState<DatosDireccion | null>(null);

  const { productos, categorias } = useProductos();
  const { crearPedido } = usePedidos();
  const [vista, setVista] = useState<Vista>("categorias");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [productoAPersonalizar, setProductoAPersonalizar] = useState<Producto | null>(null);
  const [telefono, setTelefono] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [enviando, setEnviando] = useState(false);
  const [errorPedido, setErrorPedido] = useState("");
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null);

  // 1) ¿Para comer en la mesa o a domicilio?
  if (!tipoEntrega) {
    return <EntregaGate onSeleccionar={setTipoEntrega} />;
  }

  // 2) Según lo elegido: número de mesa, o dirección de domicilio.
  if (tipoEntrega === "mesa" && !mesa) {
    return <MesaGate onConfirmar={setMesa} onVolver={() => setTipoEntrega(null)} />;
  }
  if (tipoEntrega === "domicilio" && !direccion) {
    return <DireccionGate onConfirmar={setDireccion} onVolver={() => setTipoEntrega(null)} />;
  }

  const categoriasActivas = categorias.filter((c) => c.activa);
  const productosDisponibles = productos.filter((p) => p.activo && p.disponible);

  // El stepper +/- rápido de ProductosView siempre opera sobre la línea SIN
  // personalizar de ese producto; una línea personalizada (con exclusiones o
  // adicionales) se agrega aparte vía el modal y se maneja desde el carrito.
  const cantidadEnCarrito = (idProducto: string) =>
    carrito.find((i) => i.claveLinea === claveDeLinea(idProducto, SIN_PERSONALIZAR))?.cantidad ?? 0;

  const agregarConPersonalizacion = (producto: Producto, personalizacion: Personalizacion, cantidad: number) => {
    const clave = claveDeLinea(producto.id_producto, personalizacion);
    setCarrito((prev) => {
      const existente = prev.find((i) => i.claveLinea === clave);
      if (existente) {
        return prev.map((i) => (i.claveLinea === clave ? { ...i, cantidad: i.cantidad + cantidad } : i));
      }
      return [
        ...prev,
        { claveLinea: clave, producto, cantidad, excluidos: personalizacion.excluidos, adicionales: personalizacion.adicionales },
      ];
    });
  };

  const agregarRapido = (producto: Producto) => agregarConPersonalizacion(producto, SIN_PERSONALIZAR, 1);

  const quitarRapido = (idProducto: string) => {
    const clave = claveDeLinea(idProducto, SIN_PERSONALIZAR);
    setCarrito((prev) =>
      prev.map((i) => (i.claveLinea === clave ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0),
    );
  };

  const agregarLinea = (clave: string) => {
    setCarrito((prev) => prev.map((i) => (i.claveLinea === clave ? { ...i, cantidad: i.cantidad + 1 } : i)));
  };

  const quitarLinea = (clave: string) => {
    setCarrito((prev) =>
      prev.map((i) => (i.claveLinea === clave ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0),
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
        tipo_entrega: tipoEntrega!,
        numero_mesa: tipoEntrega === "mesa" ? mesa : null,
        medio_pago: medioPago,
        items: carrito.map((i) => ({
          id_producto: i.producto.id_producto,
          cantidad: i.cantidad,
          observaciones: i.excluidos.length ? `Sin: ${i.excluidos.join(", ")}` : undefined,
          opciones: i.adicionales.map((a) => a.id_opcion),
        })),
        observaciones:
          tipoEntrega === "domicilio" && direccion
            ? `Domicilio: ${direccion.direccion}${direccion.referencia ? " — " + direccion.referencia : ""}`
            : undefined,
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
    // Mantiene tipoEntrega/mesa/dirección — sigue siendo la misma mesa o el
    // mismo domicilio, solo se reinicia el carrito para pedir de nuevo.
    setCategoriaId(null);
    setTelefono("");
    setCodigoPedido(null);
    setVista("categorias");
  };

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  const total = carrito.reduce((s, i) => s + i.cantidad * precioLinea(i), 0);

  const resumenEntrega =
    tipoEntrega === "mesa" ? `🍽️ Mesa #${mesa}` : direccion ? `🛵 ${direccion.direccion}` : "";

  return (
    <Box minH="100vh" bg="bg.canvas">
      <Box maxW="480px" mx="auto" minH="100vh" bg="bg.canvas" position="relative">
        {vista !== "confirmacion" && (
          <Box
            display="grid"
            gridTemplateColumns="1fr auto 1fr"
            alignItems="center"
            px={5}
            py={2}
            bg="bg.canvas"
            position="sticky"
            top={0}
            zIndex={10}
          >
            <Box />
            <img
              src={logoDannyTacos}
              alt="Danny Tacos"
              style={{ height: "100px", width: "100px", borderRadius: "9999px", objectFit: "cover" }}
            />
            <Flex justify="flex-end">
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
                {tipoEntrega === "mesa" ? `Mesa #${mesa}` : "🛵 Domicilio"}
              </Flex>
            </Flex>
          </Box>
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
            onAgregar={agregarRapido}
            onQuitar={quitarRapido}
            onPersonalizar={setProductoAPersonalizar}
          />
        )}

        {vista === "carrito" && (
          <CarritoView
            carrito={carrito}
            categorias={categoriasActivas}
            total={total}
            resumenEntrega={resumenEntrega}
            telefono={telefono}
            onTelefonoChange={setTelefono}
            medioPago={medioPago}
            onMedioPagoChange={setMedioPago}
            enviando={enviando}
            error={errorPedido}
            onVolver={() => setVista(categoriaId ? "productos" : "categorias")}
            onAgregar={agregarLinea}
            onQuitar={quitarLinea}
            onConfirmar={confirmarPedido}
          />
        )}

        {vista === "confirmacion" && (
          <ConfirmacionView
            tipoEntrega={tipoEntrega!}
            mesa={mesa}
            codigo={codigoPedido}
            onNuevoPedido={nuevoPedido}
          />
        )}

        {(vista === "categorias" || vista === "productos") && (
          <CartBar totalItems={totalItems} total={total} onVerPedido={() => setVista("carrito")} />
        )}

        <PersonalizarModal
          producto={productoAPersonalizar}
          onCerrar={() => setProductoAPersonalizar(null)}
          onConfirmar={(personalizacion, cantidad) => {
            if (productoAPersonalizar) agregarConPersonalizacion(productoAPersonalizar, personalizacion, cantidad);
            setProductoAPersonalizar(null);
          }}
        />
      </Box>
    </Box>
  );
}
