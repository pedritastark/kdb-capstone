import { useEffect, useState } from "react";
import { Badge, Box, Flex, IconButton, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import { FiBell, FiClock, FiTrendingUp } from "react-icons/fi";
import { usePedidos } from "../../hooks/usePedidos";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { TIPO_NOTIFICACION_LABEL } from "../../utils/constants";
import { tiempoRelativo } from "../../utils/format";

export function Header() {
  const { pedidos } = usePedidos();
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ordenesActivas = pedidos.filter(
    (p) => p.estado !== "entregado" && p.estado !== "cancelado",
  ).length;

  const entregasUltimaHora = pedidos.filter((p) => {
    if (p.estado !== "entregado") return false;
    return Date.now() - new Date(p.fecha_pedido).getTime() <= 60 * 60 * 1000;
  }).length;

  return (
    <Box position="sticky" top={0} zIndex={10}>
      <Flex as="header" align="center" px={6} py={3} bg="bg.surface" borderBottom="1px solid" borderColor="border.subtle">
        <Flex flex={1} gap={5} display={{ base: "none", lg: "flex" }}>
          <StatItem label="Órdenes activas" valor={ordenesActivas} color="#f97316" />
          <StatItem label="Entregas / hora" valor={entregasUltimaHora} color="#10b981" />
        </Flex>

        <Text fontFamily="heading" letterSpacing="wide" fontSize="lg" color="white" whiteSpace="nowrap">
          DANNY TACOS
        </Text>

        <Flex flex={1} justify="flex-end" align="center" gap={5}>
          <Flex align="center" gap={2} color="text.secondary" fontSize="sm">
            <FiClock />
            <Text fontVariantNumeric="tabular-nums">
              {ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Text>
          </Flex>

          <Popover.Root positioning={{ placement: "bottom-end" }}>
            <Popover.Trigger asChild>
              <Box position="relative">
                <IconButton aria-label="Notificaciones" variant="ghost" color="text.secondary" size="sm">
                  <FiBell />
                </IconButton>
                {noLeidas > 0 && (
                  <Badge
                    position="absolute"
                    top="-2px"
                    right="-2px"
                    bg="accent.500"
                    color="black"
                    borderRadius="full"
                    fontSize="10px"
                    fontWeight="800"
                    minW="16px"
                    h="16px"
                    px="4px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {noLeidas}
                  </Badge>
                )}
              </Box>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content bg="bg.surface" borderColor="border.subtle" w="360px" maxH="420px" overflowY="auto">
                  <Popover.Body p={0}>
                    <Flex align="center" justify="space-between" px={4} py={3} borderBottom="1px solid" borderColor="border.subtle" bg="bg.inset">
                      <Text fontFamily="heading" letterSpacing="wide" color="accent.500" fontSize="md">NOTIFICACIONES</Text>
                      <Text
                        fontSize="xs"
                        color="accent.500"
                        cursor="pointer"
                        onClick={marcarTodasLeidas}
                        _hover={{ textDecoration: "underline" }}
                      >
                        Marcar todas leídas
                      </Text>
                    </Flex>
                    <VStack align="stretch" gap={0}>
                      {notificaciones.length === 0 && (
                        <Text p={4} color="text.tertiary" fontSize="sm">
                          No hay notificaciones.
                        </Text>
                      )}
                      {[...notificaciones]
                        .sort((a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime())
                        .map((n) => (
                          <Box
                            key={n.id_notificacion}
                            px={4}
                            py={3}
                            borderBottom="1px solid"
                            borderColor="border.muted"
                            bg={n.estado === "no_leida" ? "bg.inset" : "transparent"}
                            cursor="pointer"
                            onClick={() => marcarLeida(n.id_notificacion)}
                            _hover={{ bg: "bg.inset" }}
                          >
                            <Flex justify="space-between" align="start" gap={2}>
                              <Text fontSize="xs" fontWeight="700" color="accent.500">
                                {TIPO_NOTIFICACION_LABEL[n.tipo]}
                              </Text>
                              {n.estado === "no_leida" && <Box w="8px" h="8px" borderRadius="full" bg="accent.500" flexShrink={0} mt="2px" />}
                            </Flex>
                            <Text fontSize="sm" mt={1}>
                              {n.mensaje}
                            </Text>
                            <Text fontSize="xs" color="text.tertiary" mt={1}>
                              {tiempoRelativo(n.fecha_envio)}
                            </Text>
                          </Box>
                        ))}
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Flex>
      </Flex>
    </Box>
  );
}

function StatItem({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <Flex align="center" gap={2}>
      <Flex align="center" justify="center" w="32px" h="32px" borderRadius="8px" bg="bg.inset" color={color}>
        <FiTrendingUp size={16} />
      </Flex>
      <Box>
        <Text fontSize="lg" fontWeight="800" lineHeight="1" color={color}>
          {valor}
        </Text>
        <Text fontSize="xs" color="text.tertiary">
          {label}
        </Text>
      </Box>
    </Flex>
  );
}
