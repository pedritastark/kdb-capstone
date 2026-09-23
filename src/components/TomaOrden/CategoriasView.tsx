import { Box, Grid, Text } from "@chakra-ui/react";
import type { Categoria } from "../../types";
import { EMOJI_CATEGORIA, colorPorIndice } from "./shared";

interface CategoriasViewProps {
  categorias: Categoria[];
  onSeleccionar: (idCategoria: string) => void;
}

export function CategoriasView({ categorias, onSeleccionar }: CategoriasViewProps) {
  return (
    <Box px={5} pt={6} pb={28}>
      <Text fontSize="xl" fontWeight="800" color="white" mb={1}>
        ¿Qué se te antoja hoy?
      </Text>
      <Text fontSize="sm" color="text.secondary" mb={6}>
        Elige una categoría para empezar
      </Text>

      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        {categorias.map((c, i) => {
          const color = colorPorIndice(i);
          return (
            <Box
              key={c.id_categoria}
              as="button"
              onClick={() => onSeleccionar(c.id_categoria)}
              bg="bg.surface"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="16px"
              p={5}
              textAlign="center"
              cursor="pointer"
              transition="transform 0.15s ease"
              _active={{ transform: "scale(0.97)" }}
              minH="140px"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={2}
            >
              <Box
                w="60px"
                h="60px"
                borderRadius="full"
                bg={`${color}/15`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="32px"
              >
                {EMOJI_CATEGORIA[c.id_categoria] ?? "🍽️"}
              </Box>
              <Text fontWeight="700" color="white" fontSize="md">
                {c.nombre}
              </Text>
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}
