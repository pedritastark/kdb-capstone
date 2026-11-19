import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Grid, Text } from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { useProductos } from "../../hooks/useProductos";
import { PersonalizarModal, type Personalizacion } from "../TomaOrden/PersonalizarModal";
import { resolveImageUrl } from "../../lib/images";
import { formatoMoneda } from "../../utils/format";
import type { Producto } from "../../types";

interface MenuSeccionProps {
  onAgregar: (producto: Producto, personalizacion: Personalizacion, cantidad: number) => void;
}

const TODO = "todo";

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
  // "todo" = sin filtrar; es la opción por defecto.
  const categoriaActiva =
    categoriaElegida && categoriasConProductos.some((c) => c.id_categoria === categoriaElegida)
      ? categoriaElegida
      : TODO;
  const visibles =
    categoriaActiva === TODO
      ? categoriasConProductos.flatMap((c) => disponibles.filter((p) => p.id_categoria === c.id_categoria))
      : disponibles.filter((p) => p.id_categoria === categoriaActiva);

  // Flechas del carrusel de categorías: en computador no se puede arrastrar.
  const tabsRef = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);
  const medirTabs = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 4);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    medirTabs();
    window.addEventListener("resize", medirTabs);
    return () => window.removeEventListener("resize", medirTabs);
  }, [medirTabs, categoriasConProductos.length]);
  const desplazar = (dir: -1 | 1) =>
    tabsRef.current?.scrollBy({ left: dir * Math.max(200, tabsRef.current.clientWidth * 0.7), behavior: "smooth" });

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
          <Button onClick={recargar} bg="accent.500" color="white" _hover={{ bg: "accent.600" }}>
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
          <Box position="relative" mb={4}>
            {puedeIzq && (
              <Button
                aria-label="Ver categorías anteriores"
                position="absolute" left="-6px" top="0" zIndex={2} h="42px" w="42px" minW="42px" p={0}
                borderRadius="full" bg="bg.surface" color="text.primary" border="1px solid" borderColor="border.subtle"
                boxShadow="0 2px 8px rgba(0,0,0,0.15)" _hover={{ bg: "bg.inset" }}
                onClick={() => desplazar(-1)}
              >
                <FiChevronLeft />
              </Button>
            )}
            {puedeDer && (
              <Button
                aria-label="Ver más categorías"
                position="absolute" right="-6px" top="0" zIndex={2} h="42px" w="42px" minW="42px" p={0}
                borderRadius="full" bg="bg.surface" color="text.primary" border="1px solid" borderColor="border.subtle"
                boxShadow="0 2px 8px rgba(0,0,0,0.15)" _hover={{ bg: "bg.inset" }}
                onClick={() => desplazar(1)}
              >
                <FiChevronRight />
              </Button>
            )}
            <Flex
              ref={tabsRef}
              onScroll={medirTabs}
              gap={2}
              overflowX="auto"
              pb={3}
              role="tablist"
              aria-label="Categorías del menú"
              css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
            >
              {[{ id_categoria: TODO, nombre: "Todo" }, ...categoriasConProductos].map((c) => {
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
                    color={activa ? "white" : "text.primary"}
                    border="1px solid"
                    borderColor={activa ? "accent.500" : "border.subtle"}
                    _hover={{ bg: activa ? "accent.600" : "bg.inset" }}
                    onClick={() => setCategoriaElegida(c.id_categoria)}
                  >
                    {c.nombre}
                  </Button>
                );
              })}
            </Flex>
          </Box>

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
                    <Text color="text.primary" fontWeight="800" fontSize="lg" lineHeight="1.2">
                      {p.nombre}
                    </Text>
                    {p.descripcion && (
                      <Text color="text.secondary" fontSize="sm" lineClamp={2}>
                        {p.descripcion}
                      </Text>
                    )}
                    <Flex mt="auto" pt={3} align="center" justify="space-between" gap={3}>
                      <Text color="accent.500" fontWeight="800" fontSize="lg">
                        {formatoMoneda(p.precio)}
                      </Text>
                      <Button
                        size="sm"
                        h="40px"
                        px={4}
                        borderRadius="full"
                        bg="accent.500"
                        color="white"
                        fontWeight="700"
                        _hover={{ bg: "accent.600" }}
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
