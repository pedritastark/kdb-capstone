import { useState } from "react";
import { Box, Button, Flex, Grid, Text } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useProductos } from "../hooks/useProductos";
import { ProductoCard } from "../components/Menu/ProductoCard";
import { ProductoFormModal } from "../components/Menu/ProductoFormModal";
import type { Producto } from "../types";

type FiltroEstado = "todos" | "disponible" | "agotado" | "inactivo";

export function MenuPage() {
  const { productos, categorias } = useProductos();
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  const productosFiltrados = productos.filter((p) => {
    if (categoriaFiltro !== "todas" && p.id_categoria !== categoriaFiltro) return false;
    if (estadoFiltro === "disponible" && !(p.disponible && p.activo)) return false;
    if (estadoFiltro === "agotado" && (!p.activo || p.disponible)) return false;
    if (estadoFiltro === "inactivo" && p.activo) return false;
    return true;
  });

  const abrirNuevo = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
        <Text fontSize="xl" fontWeight="800">
          Gestión de Menú
        </Text>
        <Button bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={abrirNuevo}>
          <FiPlus /> Nuevo producto
        </Button>
      </Flex>

      <Flex gap={2} wrap="wrap" mb={3}>
        <Chip label="Todas" activo={categoriaFiltro === "todas"} onClick={() => setCategoriaFiltro("todas")} />
        {categorias.map((c) => (
          <Chip key={c.id_categoria} label={c.nombre} activo={categoriaFiltro === c.id_categoria} onClick={() => setCategoriaFiltro(c.id_categoria)} />
        ))}
      </Flex>

      <Flex gap={2} wrap="wrap" mb={6}>
        {(["todos", "disponible", "agotado", "inactivo"] as FiltroEstado[]).map((f) => (
          <Chip
            key={f}
            label={{ todos: "Todos", disponible: "Disponibles", agotado: "Agotados", inactivo: "Inactivos" }[f]}
            activo={estadoFiltro === f}
            onClick={() => setEstadoFiltro(f)}
            variante="secundario"
          />
        ))}
      </Flex>

      <Grid templateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap={4}>
        {productosFiltrados.map((p) => (
          <ProductoCard key={p.id_producto} producto={p} onEditar={() => abrirEditar(p)} />
        ))}
      </Grid>

      {productosFiltrados.length === 0 && (
        <Text color="text.tertiary" mt={8} textAlign="center">
          No hay productos que coincidan con los filtros.
        </Text>
      )}

      <ProductoFormModal producto={productoEditando} abierto={modalAbierto} onClose={() => setModalAbierto(false)} />
    </Box>
  );
}

function Chip({
  label,
  activo,
  onClick,
  variante = "primario",
}: {
  label: string;
  activo: boolean;
  onClick: () => void;
  variante?: "primario" | "secundario";
}) {
  const colorActivo = variante === "primario" ? "accent.500" : "info.500";
  return (
    <Box
      as="button"
      onClick={onClick}
      px={3}
      py={1.5}
      borderRadius="full"
      fontSize="xs"
      fontWeight="600"
      bg={activo ? colorActivo : "bg.inset"}
      color={activo ? "white" : "text.secondary"}
      border="1px solid"
      borderColor={activo ? colorActivo : "border.subtle"}
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{ borderColor: colorActivo }}
    >
      {label}
    </Box>
  );
}
