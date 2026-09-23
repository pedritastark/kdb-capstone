import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { formatoMoneda } from "../../utils/format";

interface CartBarProps {
  totalItems: number;
  total: number;
  onVerPedido: () => void;
}

export function CartBar({ totalItems, total, onVerPedido }: CartBarProps) {
  if (totalItems === 0) return null;

  return (
    <Box
      position="fixed"
      bottom={0}
      left="50%"
      transform="translateX(-50%)"
      w="100%"
      maxW="480px"
      px={4}
      pt={4}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <Button
        w="full"
        h="60px"
        bg="accent.500"
        color="white"
        _hover={{ bg: "accent.600" }}
        onClick={onVerPedido}
        boxShadow="0 4px 20px rgba(0,0,0,0.4)"
      >
        <Flex justify="space-between" align="center" w="full" px={2}>
          <Flex align="center" gap={2}>
            <Flex
              w="26px"
              h="26px"
              borderRadius="full"
              bg="blackAlpha.300"
              align="center"
              justify="center"
              fontSize="xs"
              fontWeight="800"
            >
              {totalItems}
            </Flex>
            <Text fontWeight="700" fontSize="sm">Ver pedido</Text>
          </Flex>
          <Text fontWeight="800" fontSize="md">{formatoMoneda(total)}</Text>
        </Flex>
      </Button>
    </Box>
  );
}
