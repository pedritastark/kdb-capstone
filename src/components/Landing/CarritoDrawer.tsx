import { Box, Button, Drawer, Flex, Portal, Text } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { FiMinus, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { detalleLinea, totalLinea, type LineaCarrito } from "../../lib/carrito";
import { formatoMoneda } from "../../utils/format";

interface CarritoDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  lineas: LineaCarrito[];
  total: number;
  /** true si "Hacer orden" abre WhatsApp; false si continúa en el chat web. */
  porWhatsApp: boolean;
  onCambiarCantidad: (clave: string, delta: number) => void;
  onQuitar: (clave: string) => void;
  onVaciar: () => void;
  onHacerOrden: () => void;
  onVerMenu: () => void;
}

export function CarritoDrawer({
  abierto,
  onCerrar,
  lineas,
  total,
  porWhatsApp,
  onCambiarCantidad,
  onQuitar,
  onVaciar,
  onHacerOrden,
  onVerMenu,
}: CarritoDrawerProps) {
  return (
    <Drawer.Root open={abierto} onOpenChange={(e) => !e.open && onCerrar()} placement="end" size="sm">
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.700" />
        <Drawer.Positioner>
          <Drawer.Content bg="bg.surface" borderLeft="1px solid" borderColor="border.subtle" maxW="min(420px, 100vw)">
            <Drawer.Header borderBottom="1px solid" borderColor="border.subtle">
              <Drawer.Title>
                <Text fontFamily="heading" letterSpacing="wide" color="white" fontSize="2xl">
                  MI PEDIDO
                </Text>
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button aria-label="Cerrar" variant="ghost" color="text.secondary" size="sm" position="absolute" top={4} right={4}>
                  <FiX />
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body py={4}>
              {lineas.length === 0 ? (
                <Flex direction="column" align="center" justify="center" gap={4} h="full" textAlign="center" py={10}>
                  <Text fontSize="5xl">🛒</Text>
                  <Text color="text.secondary">Tu pedido está vacío. Agrega algo del menú.</Text>
                  <Button onClick={onVerMenu} bg="accent.500" color="black" _hover={{ bg: "accent.400" }}>
                    Ver el menú
                  </Button>
                </Flex>
              ) : (
                <Flex direction="column" gap={3}>
                  {lineas.map((l) => {
                    const detalle = detalleLinea(l);
                    return (
                      <Box key={l.clave} bg="bg.inset" borderRadius="14px" p={3}>
                        <Flex justify="space-between" gap={3} align="flex-start">
                          <Box minW={0}>
                            <Text color="white" fontWeight="700" fontSize="sm">
                              {l.nombre}
                            </Text>
                            {detalle && (
                              <Text color="text.secondary" fontSize="xs" mt={0.5}>
                                {detalle}
                              </Text>
                            )}
                          </Box>
                          <Text color="white" fontWeight="700" fontSize="sm" flexShrink={0}>
                            {formatoMoneda(totalLinea(l))}
                          </Text>
                        </Flex>
                        <Flex align="center" justify="space-between" mt={2}>
                          <Flex align="center" gap={2}>
                            <Button
                              aria-label={`Quitar una unidad de ${l.nombre}`}
                              size="xs"
                              variant="outline"
                              borderColor="border.subtle"
                              borderRadius="full"
                              minW="30px"
                              h="30px"
                              p={0}
                              onClick={() => onCambiarCantidad(l.clave, -1)}
                            >
                              <FiMinus />
                            </Button>
                            <Text color="white" fontWeight="800" minW="22px" textAlign="center">
                              {l.cantidad}
                            </Text>
                            <Button
                              aria-label={`Agregar una unidad de ${l.nombre}`}
                              size="xs"
                              bg="accent.500"
                              color="black"
                              borderRadius="full"
                              minW="30px"
                              h="30px"
                              p={0}
                              _hover={{ bg: "accent.400" }}
                              onClick={() => onCambiarCantidad(l.clave, 1)}
                            >
                              <FiPlus />
                            </Button>
                          </Flex>
                          <Button
                            aria-label={`Eliminar ${l.nombre} del pedido`}
                            size="xs"
                            variant="ghost"
                            color="text.tertiary"
                            _hover={{ color: "danger.400" }}
                            onClick={() => onQuitar(l.clave)}
                          >
                            <FiTrash2 />
                          </Button>
                        </Flex>
                      </Box>
                    );
                  })}
                  <Button variant="ghost" size="xs" color="text.tertiary" alignSelf="flex-start" onClick={onVaciar}>
                    Vaciar pedido
                  </Button>
                </Flex>
              )}
            </Drawer.Body>

            {lineas.length > 0 && (
              <Drawer.Footer flexDirection="column" alignItems="stretch" gap={3} borderTop="1px solid" borderColor="border.subtle" pt={4}>
                <Flex justify="space-between" align="baseline" w="full">
                  <Text color="text.secondary" fontSize="sm">
                    Total · domicilio sin costo
                  </Text>
                  <Text color="white" fontWeight="800" fontSize="2xl">
                    {formatoMoneda(total)}
                  </Text>
                </Flex>
                <Button
                  w="full"
                  h="56px"
                  borderRadius="full"
                  bg="#25D366"
                  color="white"
                  fontWeight="700"
                  fontSize="md"
                  _hover={{ bg: "#1ebe5b" }}
                  onClick={onHacerOrden}
                >
                  <FaWhatsapp size={24} /> Hacer orden
                </Button>
                <Text color="text.tertiary" fontSize="xs" textAlign="center">
                  {porWhatsApp
                    ? "Se abrirá WhatsApp con tu pedido ya escrito. Solo te pediremos tu nombre, dirección y forma de pago."
                    : "Seguirás en nuestro chat con tu pedido ya cargado. Solo te pediremos tu teléfono, nombre, dirección y forma de pago."}
                </Text>
              </Drawer.Footer>
            )}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
