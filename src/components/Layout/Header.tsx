import { useEffect, useState } from "react";
import { Badge, Box, Flex, IconButton, Menu, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import { FiBell, FiClock, FiLogOut, FiTrendingUp, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePedidos } from "../../hooks/usePedidos";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import { TIPO_NOTIFICACION_LABEL } from "../../utils/constants";
import { tiempoRelativo } from "../../utils/format";

export function Header() {
  const { usuario, cerrarSesion } = useAuth();
  const { pedidos } = usePedidos();
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const navigate = useNavigate();
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

  const salir = () => {
    cerrarSesion();
    navigate("/login");
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={6}
      py={3}
      bg="bg.surface"
      borderBottom="1px solid"
      borderColor="border.subtle"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center" gap={{ base: 3, lg: 8 }} minW={0}>
        <Box flexShrink={0}>
          <Text fontSize="xs" color="text.tertiary" fontWeight="600" letterSpacing="wide" display={{ base: "none", md: "block" }} whiteSpace="nowrap">
            DANNY TACOS · COCINA
          </Text>
          <Text fontSize="lg" fontWeight="800" whiteSpace="nowrap">
            Panel de Cocina
          </Text>
        </Box>

        <Flex gap={6} display={{ base: "none", lg: "flex" }}>
          <StatItem label="Órdenes activas" valor={ordenesActivas} color="#f97316" />
          <StatItem label="Entregas / hora" valor={entregasUltimaHora} color="#10b981" />
        </Flex>
      </Flex>

      <Flex align="center" gap={4}>
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
                  bg="danger.500"
                  color="white"
                  borderRadius="full"
                  fontSize="10px"
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
                  <Flex align="center" justify="space-between" px={4} py={3} borderBottom="1px solid" borderColor="border.subtle">
                    <Text fontWeight="700">Notificaciones</Text>
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
                            {n.estado === "no_leida" && <Box w="8px" h="8px" borderRadius="full" bg="danger.500" flexShrink={0} mt="2px" />}
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

        <Menu.Root>
          <Menu.Trigger asChild>
            <Flex align="center" gap={2} cursor="pointer" px={2} py={1} borderRadius="8px" _hover={{ bg: "bg.inset" }}>
              <Flex align="center" justify="center" w="32px" h="32px" borderRadius="full" bg="accent.500" color="white">
                <FiUser size={16} />
              </Flex>
              <Text fontSize="sm" fontWeight="600" display={{ base: "none", lg: "block" }}>
                {usuario?.nombre ?? "Usuario"}
              </Text>
            </Flex>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content bg="bg.surface" borderColor="border.subtle">
                <Menu.Item value="perfil" cursor="default">
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" fontWeight="700">{usuario?.nombre}</Text>
                    <Text fontSize="xs" color="text.tertiary">{usuario?.correo}</Text>
                  </VStack>
                </Menu.Item>
                <Menu.Separator borderColor="border.subtle" />
                <Menu.Item value="salir" onClick={salir} color="danger.500">
                  <FiLogOut style={{ marginRight: 8 }} /> Cerrar sesión
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>
    </Flex>
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
