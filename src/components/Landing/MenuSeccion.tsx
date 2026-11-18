import { useMemo, useState } from "react";
import { Box, Button, Flex, Grid, Text } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useProductos } from "../../hooks/useProductos";
import { PersonalizarModal, type Personalizacion } from "../TomaOrden/PersonalizarModal";
import { resolveImageUrl } from "../../lib/images";
import { formatoMoneda } from "../../utils/format";
import type { Producto } from "../../types";

interface MenuSeccionProps {
  onAgregar: (producto: Producto, personalizacion: Personalizacion, cantidad: number) => void;
}

function Esqueleto() {
  return (
    <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} h="300px" borderRadius="20px" bg="bg.surface" border="1px solid" borderColor="border.subtle" opacity={0.6} animation="pulse 1.4s ease-in-out infinite" />
      ))}
    </Grid>
  );
}

export function MenuSeccion({ onAgregar }: MenuSeccionProps) {
  const { productos, categorias, cargando, errorCarga, recargar } = useProductos();
  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(null);
  const [productoAPersonalizar, setProductoAPersonalizar] = useState<Producto | null>(null);

  // Solo lo que se puede pedir hoy (igual que el autopedido de mesa).
  const disponibles = useMemo(() => productos.filter((p) => p.activo && p.disponible), [productos]);
  const categoriasConProductos = useMemo(
    () => categorias.filter((c) => c.activa && disponibles.some((p) => p.id_categoria === c.id_categoria)),
    [categorias, disponibles],
  );
  const categoriaActiva =
    categoriaElegida && categoriasConProductos.some((c) => c.id_categoria === categoriaElegida)
      ? categoriaElegida
      : (categoriasConProductos[0]?.id_categoria ?? null);
  const visibles = disponibles.filter((p) => p.id_categoria === categoriaActiva);

  return (
    <>
      {cargando && (
        <>
          <Text color="text.secondary" textAlign="center" fontSize="sm" mb={5}>
            Cargando el menú… la primera vez puede tardar unos segundos 🌮
          </Text>
          <Esqueleto />
        </>
      )}

      {!cargando && errorCarga && (
        <Flex direction="column" align="center" gap={3} py={10}>
          <Text color="text.secondary">No pudimos cargar el menú en este momento.</Text>
          <Button onClick={recargar} bg="accent.500" color="black" _hover={{ bg: "accent.400" }}>
            Reintentar
          </Button>
        </Flex>
      )}

      {!cargando && !errorCarga && categoriasConProductos.length === 0 && (
        <Text color="text.secondary" textAlign="center" py={10}>
          Por ahora no hay productos disponibles. ¡Vuelve en un rato!
        </Text>
      )}

      {!cargando && !errorCarga && categoriasConProductos.length > 0 && (
        <>
          <Flex gap={2} overflowX="auto" pb={3} mb={4} role="tablist" aria-label="Categorías del menú" css={{ scrollbarWidth: "none" }}>
            {categoriasConProductos.map((c) => {
              const activa = c.id_categoria === categoriaActiva;
              return (
                <Button
                  key={c.id_categoria}
                  role="tab"
                  aria-selected={activa}
                  flexShrink={0}
                  h="42px"
                  px={5}
                  borderRadius="full"
                  fontWeight="700"
                  bg={activa ? "accent.500" : "bg.surface"}
                  color={activa ? "black" : "white"}
                  border="1px solid"
                  borderColor={activa ? "accent.500" : "border.subtle"}
                  _hover={{ bg: activa ? "accent.400" : "bg.inset" }}
                  onClick={() => setCategoriaElegida(c.id_categoria)}
                >
                  {c.nombre}
                </Button>
              );
            })}
          </Flex>

          <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
            {visibles.map((p) => {
              const imagen = resolveImageUrl(p.imagen_url);
              return (
                <Flex
                  key={p.id_producto}
                  direction="column"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="20px"
                  overflow="hidden"
                >
                  <Box position="relative" aspectRatio="16 / 10" bg="bg.inset">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={p.nombre}
                        loading="lazy"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Flex position="absolute" inset={0} align="center" justify="center" fontSize="5xl">
                        🌮
                      </Flex>
                    )}
                  </Box>
                  <Flex direction="column" flex="1" p={4} gap={1}>
                    <Text color="white" fontWeight="800" fontSize="lg" lineHeight="1.2">
                      {p.nombre}
                    </Text>
                    {p.descripcion && (
                      <Text color="text.secondary" fontSize="sm" lineClamp={2}>
                        {p.descripcion}
                      </Text>
                    )}
                    <Flex mt="auto" pt={3} align="center" justify="space-between" gap={3}>
                      <Text color="accent.400" fontWeight="800" fontSize="lg">
                        {formatoMoneda(p.precio)}
                      </Text>
                      <Button
                        size="sm"
                        h="40px"
                        px={4}
                        borderRadius="full"
                        bg="accent.500"
                        color="black"
                        fontWeight="700"
                        _hover={{ bg: "accent.400" }}
                        onClick={() => setProductoAPersonalizar(p)}
                        aria-label={`Agregar ${p.nombre} al pedido`}
                      >
                        <FiPlus /> Agregar
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              );
            })}
          </Grid>
        </>
      )}

      <PersonalizarModal
        producto={productoAPersonalizar}
        onCerrar={() => setProductoAPersonalizar(null)}
        onConfirmar={(personalizacion, cantidad) => {
          if (productoAPersonalizar) onAgregar(productoAPersonalizar, personalizacion, cantidad);
          setProductoAPersonalizar(null);
        }}
      />
    </>
  );
}
