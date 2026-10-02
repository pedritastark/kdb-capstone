import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { FiArrowLeft, FiMinus, FiPlus } from "react-icons/fi";
import type { Categoria, Producto } from "../../types";
import { resolveImageUrl } from "../../lib/images";
import { formatoMoneda } from "../../utils/format";
import { estiloCategoria } from "./shared";

interface ProductosViewProps {
  categorias: Categoria[];
  categoriaId: string;
  productos: Producto[];
  cantidadEnCarrito: (idProducto: string) => number;
  onSeleccionarCategoria: (idCategoria: string) => void;
  onVolver: () => void;
  onAgregar: (producto: Producto) => void;
  onQuitar: (idProducto: string) => void;
  onPersonalizar: (producto: Producto) => void;
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
  onPersonalizar,
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
          const estilo = estiloCategoria(c.nombre, i);
          const imagen = resolveImageUrl(estilo.imagen);
          return (
            <Flex
              key={c.id_categoria}
              as="button"
              onClick={() => onSeleccionarCategoria(c.id_categoria)}
              align="center"
              gap={2}
              flexShrink={0}
              pl={imagen ? 1.5 : 4}
              pr={4}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              bgImage={activa ? estilo.gradiente : undefined}
              bg={activa ? undefined : "bg.inset"}
              color={activa ? "white" : "text.secondary"}
              border="1px solid"
              borderColor={activa ? "transparent" : "border.subtle"}
              cursor="pointer"
              transition="all 0.15s ease"
            >
              {imagen && (
                <img
                  src={imagen}
                  alt=""
                  style={{ width: "26px", height: "26px", borderRadius: "9999px", objectFit: "cover" }}
                />
              )}
              {c.nombre}
            </Flex>
          );
        })}
      </Flex>

      <Box px={5} pb={32}>
        <Flex direction="column" gap={3}>
          {productosCategoria.map((p) => {
            const cantidad = cantidadEnCarrito(p.id_producto);
            const imagen = resolveImageUrl(p.imagen_url);
            const estiloProducto = estiloCategoria(categoriaActual?.nombre, 0);
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
                  as="button"
                  onClick={() => onPersonalizar(p)}
                  w="56px"
                  h="56px"
                  borderRadius="12px"
                  bgImage={imagen ? undefined : estiloProducto.gradiente}
                  bg={imagen ? "bg.inset" : undefined}
                  align="center"
                  justify="center"
                  fontSize="28px"
                  flexShrink={0}
                  overflow="hidden"
                  cursor="pointer"
                >
                  {imagen ? (
                    <img src={imagen} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    estiloProducto.emoji
                  )}
                </Flex>

                <Box as="button" onClick={() => onPersonalizar(p)} flex={1} minW={0} textAlign="left" cursor="pointer">
                  <Text fontWeight="700" color="white" fontSize="sm" lineClamp={1}>
                    {p.nombre}
                  </Text>
                  <Text fontSize="xs" color="text.tertiary" lineClamp={2} mb={1}>
                    {p.descripcion}
                  </Text>
                  <Flex align="center" gap={2}>
                    <Text fontWeight="800" color="accent.500" fontSize="sm">
                      {formatoMoneda(p.precio)}
                    </Text>
                    <Text fontSize="10px" color="text.tertiary">
                      · toca para personalizar
                    </Text>
                  </Flex>
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
