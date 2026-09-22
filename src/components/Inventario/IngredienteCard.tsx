import { Box, Flex, Switch, Text } from "@chakra-ui/react";
import type { Ingrediente } from "../../types";
import { useInventario } from "../../hooks/useInventario";

interface IngredienteCardProps {
  ingrediente: Ingrediente;
}

export function IngredienteCard({ ingrediente }: IngredienteCardProps) {
  const { toggleDisponible } = useInventario();

  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      border="1px solid"
      borderColor="border.subtle"
      overflow="hidden"
      opacity={ingrediente.disponible ? 1 : 0.5}
      transition="transform 0.15s ease"
      _hover={{ transform: "translateY(-2px)" }}
    >
      <Flex h="120px" align="center" justify="center" bg="bg.inset" fontSize="48px">
        🧂
      </Flex>

      <Box p={4}>
        <Text fontWeight="700" fontSize="sm" mb={3}>
          {ingrediente.nombre}
        </Text>

        <Switch.Root
          checked={ingrediente.disponible}
          onCheckedChange={() => toggleDisponible(ingrediente.id_ingrediente)}
          colorPalette="orange"
          size="sm"
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label fontSize="xs" color="text.secondary">
            {ingrediente.disponible ? "Disponible" : "No disponible"}
          </Switch.Label>
        </Switch.Root>
      </Box>
    </Box>
  );
}
