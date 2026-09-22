import { Box, Grid, Text } from "@chakra-ui/react";
import { useInventario } from "../hooks/useInventario";
import { IngredienteCard } from "../components/Inventario/IngredienteCard";

export function InventarioPage() {
  const { ingredientes } = useInventario();

  return (
    <Box>
      <Text fontSize="xl" fontWeight="800" mb={5}>
        Gestión de Inventario
      </Text>

      <Grid templateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap={4}>
        {ingredientes.map((ing) => (
          <IngredienteCard key={ing.id_ingrediente} ingrediente={ing} />
        ))}
      </Grid>

      {ingredientes.length === 0 && (
        <Text color="text.tertiary" mt={8} textAlign="center">
          No hay ingredientes registrados.
        </Text>
      )}
    </Box>
  );
}
