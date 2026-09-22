import { Badge, Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { TIPO_NOTIFICACION_COLOR, TIPO_NOTIFICACION_LABEL } from "../utils/constants";
import { formatoFechaHora } from "../utils/format";

export function NotificacionesPage() {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  const ordenadas = [...notificaciones].sort(
    (a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime(),
  );

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
        <Flex align="center" gap={3}>
          <Text fontFamily="heading" letterSpacing="wide" fontSize="2xl" color="accent.500">
            NOTIFICACIONES
          </Text>
          {noLeidas > 0 && (
            <Badge bg="accent.500" color="black" fontWeight="800" borderRadius="full" px={2}>
              {noLeidas} sin leer
            </Badge>
          )}
        </Flex>
        <Button variant="outline" borderColor="border.subtle" color="text.secondary" size="sm" onClick={marcarTodasLeidas}>
          Marcar todas como leídas
        </Button>
      </Flex>

      <VStack align="stretch" gap={2} maxW="640px">
        {ordenadas.length === 0 && (
          <Text color="text.tertiary" fontSize="sm">
            No hay notificaciones.
          </Text>
        )}
        {ordenadas.map((n) => (
          <Flex
            key={n.id_notificacion}
            bg={n.estado === "no_leida" ? "bg.inset" : "bg.surface"}
            border="1px solid"
            borderColor={n.estado === "no_leida" ? "border.subtle" : "border.muted"}
            borderRadius="8px"
            px={4}
            py={3}
            cursor="pointer"
            onClick={() => marcarLeida(n.id_notificacion)}
            _hover={{ borderColor: "accent.500" }}
            gap={3}
            align="start"
          >
            <Box w="8px" h="8px" borderRadius="full" mt="6px" flexShrink={0} bg={n.estado === "no_leida" ? "accent.500" : "transparent"} />
            <Box flex={1}>
              <Flex justify="space-between" align="center" mb={1}>
                <Badge bg={TIPO_NOTIFICACION_COLOR[n.tipo]} color="white" fontSize="10px">
                  {TIPO_NOTIFICACION_LABEL[n.tipo]}
                </Badge>
                <Text fontSize="xs" color="text.tertiary">
                  {formatoFechaHora(n.fecha_envio)}
                </Text>
              </Flex>
              <Text fontSize="sm" fontWeight={n.estado === "no_leida" ? "600" : "400"}>
                {n.mensaje}
              </Text>
              <Text fontSize="xs" color="text.tertiary" mt={1}>
                Para: {n.destinatario}
              </Text>
            </Box>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
