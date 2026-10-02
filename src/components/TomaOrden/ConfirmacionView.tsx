import { Box, Button, Flex, Text } from "@chakra-ui/react";
import type { TipoEntrega } from "../../types";

interface ConfirmacionViewProps {
  tipoEntrega: TipoEntrega;
  mesa: string | null;
  codigo: string | null;
  onNuevoPedido: () => void;
}

export function ConfirmacionView({ tipoEntrega, mesa, codigo, onNuevoPedido }: ConfirmacionViewProps) {
  const esDomicilio = tipoEntrega === "domicilio";

  return (
    <Flex minH="100vh" align="center" justify="center" px={6} textAlign="center">
      <Box>
        <Flex
          w="88px"
          h="88px"
          borderRadius="full"
          bgImage="linear-gradient(135deg, #34d399, #059669)"
          align="center"
          justify="center"
          fontSize="44px"
          mx="auto"
          mb={5}
        >
          ✓
        </Flex>

        <Text fontSize="sm" color="text.secondary" mb={1}>
          ¡Pedido enviado! {esDomicilio ? "🛵" : "🎉"}
        </Text>
        <Text fontFamily="heading" letterSpacing="wide" fontSize="2xl" color="accent.500" mb={1}>
          {esDomicilio ? "PEDIDO A DOMICILIO" : `PEDIDO A LA MESA #${mesa}`}
        </Text>
        {codigo && (
          <Text fontSize="sm" color="text.tertiary" mb={4}>
            Código {codigo}
          </Text>
        )}
        <Text color="text.secondary" fontSize="sm" maxW="280px" mx="auto" mb={8}>
          {esDomicilio
            ? "Ya estamos preparando tu pedido. En cuanto esté listo, sale camino a tu dirección."
            : "Tu pedido ya está en cocina. En un momento un mesero lo llevará a tu mesa."}
        </Text>

        <Button variant="outline" borderColor="border.subtle" color="text.primary" h="52px" px={8} onClick={onNuevoPedido}>
          Hacer otro pedido
        </Button>
      </Box>
    </Flex>
  );
}
