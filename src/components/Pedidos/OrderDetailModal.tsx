import { useState } from "react";
import { Badge, Box, Button, Dialog, Flex, Portal, Text, Textarea, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Pedido } from "../../types";
import { usePedidos, siguienteEstado } from "../../hooks/usePedidos";
import { useClientes } from "../../hooks/useClientes";
import {
  ESTADO_PEDIDO_COLOR,
  ESTADO_PEDIDO_LABEL,
  TIPO_ENTREGA_LABEL,
} from "../../utils/constants";
import { formatoFechaHora, formatoMoneda } from "../../utils/format";

interface OrderDetailModalProps {
  pedido: Pedido | null;
  onClose: () => void;
}

export function OrderDetailModal({ pedido, onClose }: OrderDetailModalProps) {
  const { detallesDe, historialDe, avanzarEstado, cancelarPedido } = usePedidos();
  const { clientes, direcciones } = useClientes();
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!pedido) return null;

  const cliente = clientes.find((c) => c.id_cliente === pedido.id_cliente);
  const direccion = direcciones.find((d) => d.id_direccion === pedido.id_direccion);
  const detalles = detallesDe(pedido.id_pedido);
  const historial = historialDe(pedido.id_pedido);
  const proximoEstado = siguienteEstado(pedido);
  const esFinal = pedido.estado === "entregado" || pedido.estado === "cancelado";

  const cerrarYLimpiar = () => {
    setMostrarCancelar(false);
    setMotivo("");
    onClose();
  };

  const confirmarCancelacion = () => {
    if (!motivo.trim()) return;
    cancelarPedido(pedido.id_pedido, motivo.trim());
    cerrarYLimpiar();
  };

  return (
    <Dialog.Root open={pedido !== null} onOpenChange={(e) => !e.open && cerrarYLimpiar()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Flex justify="space-between" align="center" w="full">
                <Box>
                  <Dialog.Title>
                    <Text fontSize="xl" fontWeight="800">
                      #{pedido.codigo}
                    </Text>
                  </Dialog.Title>
                  <Text fontSize="xs" color="text.tertiary">
                    {formatoFechaHora(pedido.fecha_pedido)}
                  </Text>
                </Box>
                <Badge bg={ESTADO_PEDIDO_COLOR[pedido.estado]} color="white" px={3} py={1} borderRadius="full">
                  {ESTADO_PEDIDO_LABEL[pedido.estado]}
                </Badge>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3} color="text.secondary">
                  <FiX />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={5} py={2}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={1} letterSpacing="wide">
                    {TIPO_ENTREGA_LABEL[pedido.tipo_entrega].toUpperCase()}
                  </Text>
                  <Text fontWeight="700">{cliente?.nombre}</Text>
                  <Text fontSize="sm" color="text.secondary">
                    {cliente?.telefono}
                  </Text>
                  {pedido.tipo_entrega === "domicilio" && direccion && (
                    <Box mt={2} bg="bg.inset" borderRadius="8px" p={3}>
                      <Text fontSize="sm">{direccion.direccion}</Text>
                      {direccion.referencia && (
                        <Text fontSize="xs" color="text.tertiary">
                          {direccion.referencia}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                    PRODUCTOS
                  </Text>
                  <VStack align="stretch" gap={3}>
                    {detalles.map((d) => (
                      <Flex key={d.id_detalle} justify="space-between" borderBottom="1px solid" borderColor="border.muted" pb={2}>
                        <Box>
                          <Text fontSize="sm" fontWeight="600">
                            {d.cantidad}× {d.nombre_producto}
                          </Text>
                          {d.opciones && d.opciones.length > 0 && (
                            <Text fontSize="xs" color="text.tertiary">
                              {d.opciones.map((o) => o.nombre_opcion).join(" · ")}
                            </Text>
                          )}
                          {d.observaciones && (
                            <Text fontSize="xs" color="warning.500">
                              Nota: {d.observaciones}
                            </Text>
                          )}
                        </Box>
                        <Text fontSize="sm" color="text.secondary">
                          {formatoMoneda(d.subtotal)}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>

                {pedido.observaciones && (
                  <Box bg="bg.inset" borderRadius="8px" p={3}>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={1}>
                      OBSERVACIONES DEL PEDIDO
                    </Text>
                    <Text fontSize="sm">{pedido.observaciones}</Text>
                  </Box>
                )}

                <Box>
                  <Flex justify="space-between" fontSize="sm" color="text.secondary" mb={1}>
                    <Text>Subtotal</Text>
                    <Text>{formatoMoneda(pedido.subtotal)}</Text>
                  </Flex>
                  {pedido.costo_domicilio > 0 && (
                    <Flex justify="space-between" fontSize="sm" color="text.secondary" mb={1}>
                      <Text>Domicilio</Text>
                      <Text>{formatoMoneda(pedido.costo_domicilio)}</Text>
                    </Flex>
                  )}
                  <Flex justify="space-between" fontWeight="800" fontSize="lg" pt={1}>
                    <Text>Total</Text>
                    <Text color="success.500">{formatoMoneda(pedido.total)}</Text>
                  </Flex>
                </Box>

                {historial.length > 0 && (
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                      HISTORIAL
                    </Text>
                    <VStack align="stretch" gap={1}>
                      {historial.map((h) => (
                        <Flex key={h.id_historial} justify="space-between" fontSize="xs" color="text.tertiary">
                          <Text>
                            {h.estado_anterior ? `${ESTADO_PEDIDO_LABEL[h.estado_anterior]} → ` : ""}
                            {ESTADO_PEDIDO_LABEL[h.estado_nuevo]}
                            {h.observacion ? ` — ${h.observacion}` : ""}
                          </Text>
                          <Text>{formatoFechaHora(h.hora_cambio)}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}

                {mostrarCancelar && (
                  <Box bg="bg.inset" borderRadius="8px" p={3} border="1px solid" borderColor="danger.500">
                    <Text fontSize="sm" fontWeight="700" mb={2} color="danger.500">
                      Motivo de cancelación
                    </Text>
                    <Textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej. El cliente ya no desea el pedido..."
                      bg="bg.canvas"
                      borderColor="border.subtle"
                      size="sm"
                    />
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid" borderColor="border.subtle" gap={3}>
              {!esFinal && !mostrarCancelar && (
                <>
                  <Button variant="outline" borderColor="danger.500" color="danger.500" _hover={{ bg: "bg.inset" }} onClick={() => setMostrarCancelar(true)}>
                    Cancelar pedido
                  </Button>
                  {proximoEstado && (
                    <Button
                      bg="accent.500"
                      color="white"
                      _hover={{ bg: "accent.600" }}
                      onClick={() => avanzarEstado(pedido.id_pedido)}
                    >
                      Avanzar a {ESTADO_PEDIDO_LABEL[proximoEstado]}
                    </Button>
                  )}
                </>
              )}
              {mostrarCancelar && (
                <>
                  <Button variant="ghost" color="text.secondary" onClick={() => setMostrarCancelar(false)}>
                    Volver
                  </Button>
                  <Button bg="danger.500" color="white" _hover={{ bg: "danger.600" }} disabled={!motivo.trim()} onClick={confirmarCancelacion}>
                    Confirmar cancelación
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
