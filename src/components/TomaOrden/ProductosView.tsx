import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import type { Categoria, Producto } from "../../types";
import { formatoMoneda } from "../../utils/format";
import { EMOJI_CATEGORIA, colorPorIndice } from "./shared";

interface ProductosViewProps {
  categorias: Categoria[];
  categoriaId: string;
  productos: Producto[];
  cantidadEnCarrito: (idProducto: string) => number;
  onSeleccionarCategoria: (idCategoria: string) => void;
  onVolver: () => void;
  onAgregar: (producto: Producto) => void;
  onQuitar: (idProducto: string) => void;
}

export function ProductosView({
  categorias,
  categoriaId,
  productos,
  cantidadEnCarrito,
  onSeleccionarCategoria,
  onVolver,
  onAgregar,
  onQuitar,
}: ProductosViewProps) {
  const categoriaActual = categorias.find((c) => c.id_categoria === categoriaId);
  const productosCategoria = productos.filter((p) => p.id_categoria === categoriaId);

  return (
    <Box>
      <Flex align="center" gap={3} px={5} pt={5} pb={3}>
        <IconButton aria-label="Volver a categorías" variant="ghost" color="text.secondary" size="sm" onClick={onVolver}>
          <FiArrowLeft />
        </IconButton>
        <Text fontSize="lg" fontWeight="800" color="white">
          {categoriaActual?.nombre}
        </Text>
      </Flex>

      <Flex gap={2} px={5} pb={4} overflowX="auto">
        {categorias.map((c, i) => {
          const activa = c.id_categoria === categoriaId;
          const color = colorPorIndice(i);
          return (
            <Box
              key={c.id_categoria}
              as="button"
              onClick={() => onSeleccionarCategoria(c.id_categoria)}
              flexShrink={0}
              px={4}
              py={2}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              bg={activa ? color : "bg.inset"}
              color={activa ? "black" : "text.secondary"}
              border="1px solid"
              borderColor={activa ? color : "border.subtle"}
              cursor="pointer"
            >
              {EMOJI_CATEGORIA[c.id_categoria] ?? "🍽️"} {c.nombre}
            </Box>
          );
        })}
      </Flex>

      <Box px={5} pb={32}>
        <Flex direction="column" gap={3}>
          {productosCategoria.map((p) => {
            const cantidad = cantidadEnCarrito(p.id_producto);
            return (
              <Flex
                key={p.id_producto}
                bg="bg.surface"
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="14px"
                p={3}
                gap={3}
                align="center"
              >
                <Flex
                  w="56px"
                  h="56px"
                  borderRadius="12px"
                  bg="bg.inset"
                  align="center"
                  justify="center"
                  fontSize="28px"
                  flexShrink={0}
                >
                  {EMOJI_CATEGORIA[p.id_categoria] ?? "🍽️"}
                </Flex>

                <Box flex={1} minW={0}>
                  <Text fontWeight="700" color="white" fontSize="sm" lineClamp={1}>
                    {p.nombre}
                  </Text>
                  <Text fontSize="xs" color="text.tertiary" lineClamp={2} mb={1}>
                    {p.descripcion}
                  </Text>
                  <Text fontWeight="800" color="accent.500" fontSize="sm">
                    {formatoMoneda(p.precio)}
                  </Text>
                </Box>

                {cantidad === 0 ? (
                  <IconButton
                    aria-label={`Agregar ${p.nombre}`}
                    bg="accent.500"
                    color="white"
                    borderRadius="full"
                    _hover={{ bg: "accent.600" }}
                    onClick={() => onAgregar(p)}
                    flexShrink={0}
                  >
                    <FiPlus />
                  </IconButton>
                ) : (
                  <Flex align="center" gap={2} flexShrink={0}>
                    <IconButton
                      aria-label={`Quitar ${p.nombre}`}
                      size="sm"
                      variant="outline"
                      borderColor="border.subtle"
                      color="text.primary"
                      borderRadius="full"
                      onClick={() => onQuitar(p.id_producto)}
                    >
                      <FiMinus />
                    </IconButton>
                    <Text fontWeight="800" color="white" minW="18px" textAlign="center">
                      {cantidad}
                    </Text>
                    <IconButton
                      aria-label={`Agregar ${p.nombre}`}
                      size="sm"
                      bg="accent.500"
                      color="white"
                      borderRadius="full"
                      _hover={{ bg: "accent.600" }}
                      onClick={() => onAgregar(p)}
                    >
                      <FiPlus />
                    </IconButton>
                  </Flex>
                )}
              </Flex>
            );
          })}

          {productosCategoria.length === 0 && (
            <Text color="text.tertiary" fontSize="sm" textAlign="center" mt={8}>
              No hay productos disponibles en esta categoría.
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
