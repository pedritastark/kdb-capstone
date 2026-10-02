import { Box, Flex, Text } from "@chakra-ui/react";
import type { TipoEntrega } from "../../types";

interface EntregaGateProps {
  onSeleccionar: (tipo: Extract<TipoEntrega, "mesa" | "domicilio">) => void;
}

const OPCIONES: {
  tipo: Extract<TipoEntrega, "mesa" | "domicilio">;
  emoji: string;
  titulo: string;
  descripcion: string;
  gradiente: string;
}[] = [
  {
    tipo: "mesa",
    emoji: "🍽️",
    titulo: "Aquí, en la mesa",
    descripcion: "Pide desde donde estás sentado",
    gradiente: "linear-gradient(135deg, #fb923c, #ea580c)",
  },
  {
    tipo: "domicilio",
    emoji: "🛵",
    titulo: "A domicilio",
    descripcion: "Te lo llevamos a tu dirección",
    gradiente: "linear-gradient(135deg, #7dd3fc, #0ea5e9)",
  },
];

export function EntregaGate({ onSeleccionar }: EntregaGateProps) {
  return (
    <Flex minH="100vh" bg="bg.canvas" align="center" justify="center" px={6}>
      <Box textAlign="center" maxW="380px" w="full">
        <Text fontSize="56px" mb={2}>
          🌮
        </Text>
        <Text fontFamily="heading" letterSpacing="wide" fontSize="2xl" color="white" mb={1}>
          DANNY TACOS
        </Text>
        <Text color="text.secondary" fontSize="sm" mb={10}>
          ¿Cómo quieres tu pedido hoy?
        </Text>

        <Flex direction="column" gap={4}>
          {OPCIONES.map((op) => (
            <Box
              key={op.tipo}
              as="button"
              onClick={() => onSeleccionar(op.tipo)}
              position="relative"
              overflow="hidden"
              bg="bg.surface"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="20px"
              p={5}
              display="flex"
              alignItems="center"
              gap={4}
              cursor="pointer"
              transition="transform 0.15s ease, box-shadow 0.15s ease"
              _active={{ transform: "scale(0.97)" }}
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(0,0,0,0.4)" }}
            >
              <Flex
                w="64px"
                h="64px"
                borderRadius="full"
                bgImage={op.gradiente}
                align="center"
                justify="center"
                fontSize="32px"
                flexShrink={0}
              >
                {op.emoji}
              </Flex>
              <Box textAlign="left">
                <Text fontWeight="800" color="white" fontSize="md">
                  {op.titulo}
                </Text>
                <Text fontSize="xs" color="text.tertiary">
                  {op.descripcion}
                </Text>
              </Box>
            </Box>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
}
