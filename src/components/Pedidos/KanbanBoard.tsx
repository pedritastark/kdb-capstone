import { useEffect, useState } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import type { EstadoPedido, Pedido } from "../../types";
import { usePedidos } from "../../hooks/usePedidos";
import { OrderCard } from "./OrderCard";
import { OrderDetailModal } from "./OrderDetailModal";

interface Columna {
  titulo: string;
  color: string;
  estados: EstadoPedido[];
}

const columnas: Columna[] = [
  { titulo: "Recibido", color: "#2563eb", estados: ["recibido", "confirmado"] },
  { titulo: "En Preparación", color: "#f59e0b", estados: ["en_preparacion"] },
  { titulo: "En Camino / Listo", color: "#10b981", estados: ["listo", "en_camino"] },
];

export function KanbanBoard() {
  const { pedidos } = usePedidos();
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const idSeleccionado = pedidoSeleccionado?.id_pedido;
  const pedidoActualizado = idSeleccionado
    ? pedidos.find((p) => p.id_pedido === idSeleccionado) ?? null
    : null;

  return (
    <Box>
      <Flex
        gap={4}
        overflowX="auto"
        pb={2}
        align="start"
      >
        {columnas.map((columna) => {
          const pedidosColumna = pedidos
            .filter((p) => columna.estados.includes(p.estado))
            .sort((a, b) => new Date(a.fecha_pedido).getTime() - new Date(b.fecha_pedido).getTime());

          return (
            <Box
              key={columna.titulo}
              flex="1 1 320px"
              minW="300px"
              maxW="420px"
              bg="bg.canvas"
              borderLeft="4px solid"
              borderColor={columna.color}
              borderRadius="8px"
              p={3}
            >
              <Flex align="center" justify="space-between" mb={3} px={1}>
                <Text fontWeight="800" fontSize="sm" letterSpacing="wide" color="text.primary">
                  {columna.titulo.toUpperCase()}
                </Text>
                <Flex
                  align="center"
                  justify="center"
                  minW="24px"
                  h="24px"
                  px={2}
                  borderRadius="full"
                  bg="bg.inset"
                  color={columna.color}
                  fontWeight="800"
                  fontSize="xs"
                >
                  {pedidosColumna.length}
                </Flex>
              </Flex>

              <VStack align="stretch" gap={3} minH="120px">
                {pedidosColumna.length === 0 && (
                  <Flex
                    align="center"
                    justify="center"
                    h="100px"
                    border="1px dashed"
                    borderColor="border.muted"
                    borderRadius="8px"
                    color="text.tertiary"
                    fontSize="sm"
                  >
                    Sin pedidos
                  </Flex>
                )}
                {pedidosColumna.map((pedido) => (
                  <OrderCard key={pedido.id_pedido} pedido={pedido} onClick={() => setPedidoSeleccionado(pedido)} />
                ))}
              </VStack>
            </Box>
          );
        })}
      </Flex>

      <OrderDetailModal pedido={pedidoActualizado} onClose={() => setPedidoSeleccionado(null)} />
    </Box>
  );
}
