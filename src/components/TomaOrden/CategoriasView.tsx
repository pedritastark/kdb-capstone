import { Box, Grid, Text } from "@chakra-ui/react";
import type { Categoria } from "../../types";
import { resolveImageUrl } from "../../lib/images";
import { estiloCategoria } from "./shared";

interface CategoriasViewProps {
  categorias: Categoria[];
  onSeleccionar: (idCategoria: string) => void;
}

export function CategoriasView({ categorias, onSeleccionar }: CategoriasViewProps) {
  return (
    <Box px={5} pt={6} pb={28}>
      <Text fontSize="2xl" fontWeight="800" color="white" mb={1}>
        ¿Qué se te antoja hoy? 😋
      </Text>
      <Text fontSize="sm" color="text.secondary" mb={6}>
        Elige una categoría para empezar
      </Text>

      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        {categorias.map((c, i) => {
          const estilo = estiloCategoria(c.nombre, i);
          const imagen = resolveImageUrl(estilo.imagen);
          return (
            <Box
              key={c.id_categoria}
              as="button"
              onClick={() => onSeleccionar(c.id_categoria)}
              position="relative"
              overflow="hidden"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="20px"
              cursor="pointer"
              transition="transform 0.15s ease, box-shadow 0.15s ease"
              _active={{ transform: "scale(0.96)" }}
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(0,0,0,0.4)" }}
              h="150px"
              bgImage={imagen ? undefined : estilo.gradiente}
              bg={imagen ? "bg.surface" : undefined}
            >
              {imagen && (
                <img
                  src={imagen}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
              {/* degradado oscuro abajo para que el nombre sea legible sobre la foto */}
              <Box
                position="absolute"
                inset={0}
                bgImage={
                  imagen
                    ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 65%)"
                }
              />
              {!estilo.ocultarInsignia && (
                <Box position="absolute" top={3} left={3} fontSize="22px" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
                  {estilo.emoji}
                </Box>
              )}
              <Text
                position="absolute"
                bottom={3}
                left={3}
                right={3}
                fontWeight="800"
                color="white"
                fontSize="md"
                textAlign="left"
                textShadow="0 2px 6px rgba(0,0,0,0.6)"
              >
                {c.nombre}
              </Text>
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}
