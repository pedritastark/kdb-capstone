import { Badge, Box, Flex, IconButton, Switch, Text } from "@chakra-ui/react";
import { FiEdit2, FiEyeOff } from "react-icons/fi";
import type { Producto } from "../../types";
import { useProductos } from "../../hooks/useProductos";
import { formatoMoneda } from "../../utils/format";
import { resolveImageUrl } from "../../lib/images";
import { estiloCategoria } from "../TomaOrden/shared";

interface ProductoCardProps {
  producto: Producto;
  onEditar: () => void;
}

export function ProductoCard({ producto, onEditar }: ProductoCardProps) {
  const { categorias, toggleDisponible, toggleActivo } = useProductos();
  const categoria = categorias.find((c) => c.id_categoria === producto.id_categoria);
  const imagen = resolveImageUrl(producto.imagen_url);
  const estilo = estiloCategoria(categoria?.nombre, 0);

  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
      opacity={producto.activo ? 1 : 0.5}
      transition="transform 0.15s ease"
      _hover={{ transform: "translateY(-2px)" }}
    >
      <Flex
        h="120px"
        align="center"
        justify="center"
        bgImage={imagen ? undefined : estilo.gradiente}
        bg={imagen ? "bg.inset" : undefined}
        fontSize="48px"
        overflow="hidden"
      >
        {imagen ? (
          <img src={imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          estilo.emoji
        )}
      </Flex>

      <Box p={4}>
        <Flex justify="space-between" align="start" mb={1}>
          <Text fontWeight="700" fontSize="sm">
            {producto.nombre}
          </Text>
          <IconButton aria-label="Editar producto" size="xs" variant="ghost" color="text.secondary" onClick={onEditar}>
            <FiEdit2 size={14} />
          </IconButton>
        </Flex>
        <Text fontSize="xs" color="text.tertiary" mb={2} lineClamp={2}>
          {producto.descripcion}
        </Text>

        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="800" color="accent.500">
            {formatoMoneda(producto.precio)}
          </Text>
          <Badge bg="bg.inset" color="text.secondary" fontSize="10px">
            {categoria?.nombre}
          </Badge>
        </Flex>

        <Text fontSize="xs" color="text.tertiary" mb={3}>
          ⏱ {producto.tiempo_preparacion_min} min
        </Text>

        <Flex justify="space-between" align="center">
          <Switch.Root
            checked={producto.disponible}
            onCheckedChange={() => toggleDisponible(producto.id_producto)}
            colorPalette="orange"
            size="sm"
          >
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label fontSize="xs" color="text.secondary">
              {producto.disponible ? "Disponible" : "Agotado"}
            </Switch.Label>
          </Switch.Root>

          <IconButton
            aria-label={producto.activo ? "Desactivar producto" : "Activar producto"}
            size="xs"
            variant="ghost"
            color={producto.activo ? "text.secondary" : "success.500"}
            onClick={() => toggleActivo(producto.id_producto)}
            title={producto.activo ? "Desactivar" : "Activar"}
          >
            <FiEyeOff size={14} />
          </IconButton>
        </Flex>
      </Box>
    </Box>
  );
}
