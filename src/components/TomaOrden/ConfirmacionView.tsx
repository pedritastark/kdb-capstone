import { Box, Button, Flex, Text } from "@chakra-ui/react";

interface ConfirmacionViewProps {
  mesa: string;
  codigo: string | null;
  onNuevoPedido: () => void;
}

export function ConfirmacionView({ mesa, codigo, onNuevoPedido }: ConfirmacionViewProps) {
  return (
    <Flex minH="100vh" align="center" justify="center" px={6} textAlign="center">
      <Box>
        <Flex
          w="88px"
          h="88px"
          borderRadius="full"
          bg="success.500"
          align="center"
          justify="center"
          fontSize="44px"
          mx="auto"
          mb={5}
        >
          ✓
        </Flex>

        <Text fontSize="sm" color="text.secondary" mb={1}>
          ¡Pedido enviado!
        </Text>
        <Text fontFamily="heading" letterSpacing="wide" fontSize="2xl" color="accent.500" mb={1}>
          PEDIDO A LA MESA #{mesa}
        </Text>
        {codigo && (
          <Text fontSize="sm" color="text.tertiary" mb={4}>
            Código {codigo}
          </Text>
        )}
        <Text color="text.secondary" fontSize="sm" maxW="280px" mx="auto" mb={8}>
          Tu pedido ya está en cocina. En un momento un mesero lo llevará a tu mesa.
        </Text>

        <Button variant="outline" borderColor="border.subtle" color="text.primary" h="52px" px={8} onClick={onNuevoPedido}>
          Hacer otro pedido
        </Button>
      </Box>
    </Flex>
  );
}
