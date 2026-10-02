import { useEffect, useState } from "react";
import { Badge, Box, Button, Checkbox, Dialog, Flex, Portal, Text, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Ingrediente, OpcionProducto, Producto } from "../../types";
import { useInventario } from "../../hooks/useInventario";
import { useProductos } from "../../hooks/useProductos";
import { resolveImageUrl } from "../../lib/images";
import { formatoMoneda } from "../../utils/format";

export interface Personalizacion {
  excluidos: string[]; // nombres de ingredientes que NO quiere
  adicionales: OpcionProducto[];
}

interface PersonalizarModalProps {
  producto: Producto | null;
  cantidadInicial?: number;
  onCerrar: () => void;
  onConfirmar: (personalizacion: Personalizacion, cantidad: number) => void;
}

export function PersonalizarModal({ producto, cantidadInicial = 1, onCerrar, onConfirmar }: PersonalizarModalProps) {
  const { ingredientesDeProducto } = useInventario();
  const { opcionesDe } = useProductos();
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set());
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [cantidad, setCantidad] = useState(cantidadInicial);

  useEffect(() => {
    setExcluidos(new Set());
    setSeleccionados(new Set());
    setCantidad(cantidadInicial);
  }, [producto?.id_producto, cantidadInicial]);

  if (!producto) return null;

  const ingredientes: Ingrediente[] = ingredientesDeProducto(producto.id_producto);
  const adicionales = opcionesDe(producto.id_producto).filter((o) => o.tipo === "adicional" && o.disponible);
  const imagen = resolveImageUrl(producto.imagen_url);

  const toggleExcluido = (nombre: string) => {
    setExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  };

  const toggleAdicional = (idOpcion: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idOpcion)) next.delete(idOpcion);
      else next.add(idOpcion);
      return next;
    });
  };

  const adicionalesElegidos = adicionales.filter((o) => seleccionados.has(o.id_opcion));
  const precioUnitario = producto.precio + adicionalesElegidos.reduce((s, o) => s + o.precio_adicional, 0);

  const confirmar = () => {
    onConfirmar({ excluidos: Array.from(excluidos), adicionales: adicionalesElegidos }, cantidad);
  };

  return (
    <Dialog.Root open={producto !== null} onOpenChange={(e) => !e.open && onCerrar()} size="md">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="card"
            mx={4}
            maxH="85vh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Box position="relative" flexShrink={0}>
              {imagen && (
                <Box h="140px" overflow="hidden" borderTopRadius="card">
                  <img src={imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </Box>
              )}
              <Dialog.CloseTrigger asChild>
                <Button variant="solid" size="xs" position="absolute" top={3} right={3} bg="blackAlpha.700" color="white" borderRadius="full" minW="32px" h="32px" p={0}>
                  <FiX />
                </Button>
              </Dialog.CloseTrigger>
            </Box>

            <Dialog.Header pb={0} flexShrink={0}>
              <Dialog.Title>
                <Text fontSize="lg" fontWeight="800" color="white">
                  {producto.nombre}
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body overflowY="auto" flex="1" minH={0}>
              <VStack align="stretch" gap={5} py={2}>
                {ingredientes.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                      QUITA LO QUE NO QUIERAS
                    </Text>
                    <VStack align="stretch" gap={1}>
                      {ingredientes.map((ing) => {
                        const quitado = excluidos.has(ing.nombre);
                        return (
                          <Checkbox.Root
                            key={ing.id_ingrediente}
                            checked={!quitado}
                            onCheckedChange={() => toggleExcluido(ing.nombre)}
                            colorPalette="orange"
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Text fontSize="sm" color={quitado ? "text.tertiary" : "text.primary"} textDecoration={quitado ? "line-through" : "none"}>
                                {ing.nombre}
                              </Text>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

                {adicionales.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                      AGRÉGALE ALGO MÁS
                    </Text>
                    <VStack align="stretch" gap={1}>
                      {adicionales.map((op) => (
                        <Checkbox.Root
                          key={op.id_opcion}
                          checked={seleccionados.has(op.id_opcion)}
                          onCheckedChange={() => toggleAdicional(op.id_opcion)}
                          colorPalette="orange"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex justify="space-between" w="full" minW="200px">
                              <Text fontSize="sm">{op.nombre}</Text>
                              <Badge bg="bg.inset" color="accent.400" fontSize="10px">
                                +{formatoMoneda(op.precio_adicional)}
                              </Badge>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </VStack>
                  </Box>
                )}

                <Flex align="center" justify="space-between">
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" letterSpacing="wide">
                    CANTIDAD
                  </Text>
                  <Flex align="center" gap={3}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="border.subtle"
                      borderRadius="full"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    >
                      −
                    </Button>
                    <Text fontWeight="800" color="white" minW="20px" textAlign="center">
                      {cantidad}
                    </Text>
                    <Button
                      size="sm"
                      bg="accent.500"
                      color="white"
                      _hover={{ bg: "accent.600" }}
                      borderRadius="full"
                      onClick={() => setCantidad((c) => c + 1)}
                    >
                      +
                    </Button>
                  </Flex>
                </Flex>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid" borderColor="border.subtle" flexShrink={0}>
              <Button w="full" h="52px" bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={confirmar}>
                Agregar · {formatoMoneda(precioUnitario * cantidad)}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
