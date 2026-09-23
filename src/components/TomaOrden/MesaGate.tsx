import { useState } from "react";
import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";

interface MesaGateProps {
  onConfirmar: (mesa: string) => void;
}

export function MesaGate({ onConfirmar }: MesaGateProps) {
  const [valor, setValor] = useState("");

  const continuar = () => {
    if (!valor.trim()) return;
    onConfirmar(valor.trim());
  };

  return (
    <Flex minH="100vh" bg="bg.canvas" align="center" justify="center" px={6}>
      <Box textAlign="center" maxW="360px" w="full">
        <Text fontSize="56px" mb={2}>🌮</Text>
        <Text fontFamily="heading" letterSpacing="wide" fontSize="2xl" color="white" mb={1}>
          DANNY TACOS
        </Text>
        <Text color="text.secondary" fontSize="sm" mb={8}>
          Autopedido a la mesa
        </Text>

        <Text color="text.secondary" fontSize="sm" mb={2} textAlign="left">
          Número de mesa
        </Text>
        <Input
          size="lg"
          type="number"
          inputMode="numeric"
          placeholder="Ej. 5"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && continuar()}
          bg="bg.surface"
          borderColor="border.subtle"
          textAlign="center"
          fontSize="xl"
          fontWeight="700"
          mb={4}
          h="60px"
        />

        <Button
          w="full"
          h="56px"
          fontSize="md"
          bg="accent.500"
          color="white"
          _hover={{ bg: "accent.600" }}
          onClick={continuar}
          disabled={!valor.trim()}
        >
          Empezar a pedir
        </Button>
      </Box>
    </Flex>
  );
}
