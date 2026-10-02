import { useState } from "react";
import { Box, Button, Flex, IconButton, Input, Text, Textarea } from "@chakra-ui/react";
import { FiArrowLeft } from "react-icons/fi";

export interface DatosDireccion {
  direccion: string;
  referencia: string;
}

interface DireccionGateProps {
  onConfirmar: (datos: DatosDireccion) => void;
  onVolver: () => void;
}

export function DireccionGate({ onConfirmar, onVolver }: DireccionGateProps) {
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");

  const continuar = () => {
    if (!direccion.trim()) return;
    onConfirmar({ direccion: direccion.trim(), referencia: referencia.trim() });
  };

  return (
    <Flex minH="100vh" bg="bg.canvas" align="center" justify="center" px={6}>
      <Box maxW="380px" w="full">
        <Flex align="center" gap={3} mb={6}>
          <IconButton aria-label="Volver" variant="ghost" color="text.secondary" size="sm" onClick={onVolver}>
            <FiArrowLeft />
          </IconButton>
          <Text fontSize="40px">🛵</Text>
        </Flex>

        <Text fontFamily="heading" letterSpacing="wide" fontSize="xl" color="white" mb={1}>
          ¿A dónde lo llevamos?
        </Text>
        <Text color="text.secondary" fontSize="sm" mb={6}>
          Cuéntanos tu dirección para el domicilio
        </Text>

        <Text color="text.secondary" fontSize="sm" mb={2} textAlign="left">
          Dirección
        </Text>
        <Input
          size="lg"
          placeholder="Ej. Calle 10 # 5-23, Apto 301"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          bg="bg.surface"
          borderColor="border.subtle"
          mb={4}
        />

        <Text color="text.secondary" fontSize="sm" mb={2} textAlign="left">
          Referencia (opcional)
        </Text>
        <Textarea
          placeholder="Ej. Portón azul, al lado de la farmacia..."
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          bg="bg.surface"
          borderColor="border.subtle"
          mb={6}
          rows={2}
        />

        <Button
          w="full"
          h="56px"
          fontSize="md"
          bg="sky.500"
          color="black"
          _hover={{ bg: "sky.400" }}
          onClick={continuar}
          disabled={!direccion.trim()}
        >
          Continuar
        </Button>
      </Box>
    </Flex>
  );
}
