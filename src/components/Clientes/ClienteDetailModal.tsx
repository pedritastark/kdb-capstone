import { Badge, Box, Button, Dialog, Flex, Portal, Text, VStack } from "@chakra-ui/react";
import { FiEdit2, FiX } from "react-icons/fi";
import type { Cliente } from "../../types";
import { useClientes } from "../../hooks/useClientes";
import { usePedidos } from "../../hooks/usePedidos";
import { ESTADO_PEDIDO_COLOR, ESTADO_PEDIDO_LABEL, TIPO_ENTREGA_LABEL } from "../../utils/constants";
import { formatoFechaHora, formatoMoneda } from "../../utils/format";

interface ClienteDetailModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  onEditar: () => void;
}

export function ClienteDetailModal({ cliente, onClose, onEditar }: ClienteDetailModalProps) {
  const { direccionesDe } = useClientes();
  const { pedidos } = usePedidos();

  if (!cliente) return null;

  const direcciones = direccionesDe(cliente.id_cliente);
  const pedidosCliente = pedidos
    .filter((p) => p.id_cliente === cliente.id_cliente)
    .sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime());

  return (
    <Dialog.Root open={cliente !== null} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Dialog.Title>{cliente.nombre}</Dialog.Title>
              <Flex position="absolute" top={3} right={3} gap={2}>
                <Button variant="ghost" size="sm" color="text.secondary" onClick={onEditar}>
                  <FiEdit2 />
                </Button>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm" color="text.secondary">
                    <FiX />
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={5} py={2}>
                <Flex gap={8}>
                  <Box>
                    <Text fontSize="xs" color="text.tertiary">Correo</Text>
                    <Text fontSize="sm">{cliente.correo || "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="text.tertiary">Teléfono</Text>
                    <Text fontSize="sm">{cliente.telefono}</Text>
                  </Box>
                </Flex>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                    DIRECCIONES GUARDADAS
                  </Text>
                  {direcciones.length === 0 && (
                    <Text fontSize="sm" color="text.tertiary">Sin direcciones registradas.</Text>
                  )}
                  <VStack align="stretch" gap={2}>
                    {direcciones.map((d) => (
                      <Box key={d.id_direccion} bg="bg.inset" borderRadius="8px" p={3}>
                        <Text fontSize="sm">{d.direccion}</Text>
                        {d.referencia && <Text fontSize="xs" color="text.tertiary">{d.referencia}</Text>}
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                    HISTORIAL DE PEDIDOS ({pedidosCliente.length})
                  </Text>
                  {pedidosCliente.length === 0 && (
                    <Text fontSize="sm" color="text.tertiary">Este cliente aún no tiene pedidos.</Text>
                  )}
                  <VStack align="stretch" gap={2}>
                    {pedidosCliente.map((p) => (
                      <Flex key={p.id_pedido} justify="space-between" align="center" bg="bg.inset" borderRadius="8px" px={3} py={2}>
                        <Box>
                          <Flex align="center" gap={2}>
                            <Text fontSize="sm" fontWeight="700">#{p.codigo}</Text>
                            <Badge bg={ESTADO_PEDIDO_COLOR[p.estado]} color="white" fontSize="10px">
                              {ESTADO_PEDIDO_LABEL[p.estado]}
                            </Badge>
                          </Flex>
                          <Text fontSize="xs" color="text.tertiary">
                            {TIPO_ENTREGA_LABEL[p.tipo_entrega]} · {formatoFechaHora(p.fecha_pedido)}
                          </Text>
                        </Box>
                        <Text fontWeight="700" color="success.500">{formatoMoneda(p.total)}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
