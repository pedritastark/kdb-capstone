import { Box, Flex, Text } from "@chakra-ui/react";
import type { Pedido } from "../../types";
import { usePedidos } from "../../hooks/usePedidos";
import { useClientes } from "../../hooks/useClientes";
import { TIPO_ENTREGA_LABEL, NUEVO_PEDIDO_MINUTOS } from "../../utils/constants";
import { formatoHora, formatoMoneda, minutosDesde } from "../../utils/format";

interface OrderCardProps {
  pedido: Pedido;
  onClick: () => void;
}

export function OrderCard({ pedido, onClick }: OrderCardProps) {
  const { detallesDe } = usePedidos();
  const { clientes } = useClientes();
  const cliente = clientes.find((c) => c.id_cliente === pedido.id_cliente);
  const detalles = detallesDe(pedido.id_pedido);
  const esNuevo = minutosDesde(pedido.fecha_pedido) < NUEVO_PEDIDO_MINUTOS;

  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      overflow="hidden"
      border="1px solid"
      borderColor={esNuevo ? "danger.500" : "border.subtle"}
      boxShadow={esNuevo ? "0 0 0 1px #ef4444" : "none"}
      cursor="pointer"
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}
      onClick={onClick}
    >
      <Flex bg="accent.500" color="white" px={3} py={2} align="center" justify="space-between">
        <Text fontWeight="800" fontSize="sm">
          #{pedido.codigo}
        </Text>
        <Flex align="center" gap={1}>
          {esNuevo && (
            <Box w="7px" h="7px" borderRadius="full" bg="white" animation="pulse 1.5s infinite" />
          )}
          <Text fontSize="xs" fontWeight="600">
            {formatoHora(pedido.fecha_pedido)}
          </Text>
        </Flex>
      </Flex>

      <Box px={3} py={3}>
        <Text fontWeight="800" fontSize="xs" color="text.primary" letterSpacing="wide">
          {TIPO_ENTREGA_LABEL[pedido.tipo_entrega].toUpperCase()}
        </Text>
        <Text fontSize="sm" color="text.secondary" mb={2}>
          {cliente?.nombre ?? "Cliente"}
        </Text>

        <Box mb={2}>
          {detalles.map((d) => (
            <Box key={d.id_detalle} mb={1}>
              <Text fontSize="sm" color="text.primary">
                {d.cantidad}× {d.nombre_producto}
              </Text>
              {(d.opciones?.length || d.observaciones) && (
                <Text fontSize="xs" color="text.tertiary" pl={2}>
                  {[...(d.opciones?.map((o) => o.nombre_opcion) ?? []), d.observaciones]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              )}
            </Box>
          ))}
        </Box>

        <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="border.muted">
          <Text fontSize="xs" color="text.tertiary">
            ETA {pedido.tiempo_estimado_min} min
          </Text>
          <Text fontWeight="800" color="success.500">
            {formatoMoneda(pedido.total)}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
