import { Box, Text } from "@chakra-ui/react";
import { KanbanBoard } from "../components/Pedidos/KanbanBoard";

export function PedidosPage() {
  return (
    <Box>
      <Text fontSize="xl" fontWeight="800" mb={4}>
        Tablero de Pedidos
      </Text>
      <KanbanBoard />
    </Box>
  );
}
