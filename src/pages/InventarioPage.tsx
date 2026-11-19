import { useState } from "react";
import { Badge, Box, Button, Flex, Tabs, Text } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useInventario } from "../hooks/useInventario";
import { TablaIngredientes } from "../components/Inventario/TablaIngredientes";
import { IngredienteDetailModal } from "../components/Inventario/IngredienteDetailModal";
import { IngredienteFormModal } from "../components/Inventario/IngredienteFormModal";
import { RecetasTab } from "../components/Inventario/RecetasTab";
import type { Ingrediente } from "../types";

export function InventarioPage() {
  const { ingredientes } = useInventario();
  const [seleccionado, setSeleccionado] = useState<Ingrediente | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Ingrediente | null>(null);

  const abrirNuevo = () => {
    setEditando(null);
    setFormAbierto(true);
  };
  const abrirEditar = (ing: Ingrediente) => {
    setSeleccionado(null);
    setEditando(ing);
    setFormAbierto(true);
  };

  const alertas = ingredientes.filter((i) => i.tipo_control === "cantidad" && i.cantidad_actual <= i.cantidad_minima);

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2} wrap="wrap" gap={3}>
        <Text fontSize="xl" fontWeight="800">
          Gestión de Inventario
        </Text>
        <Flex align="center" gap={3}>
          {alertas.length > 0 && (
            <Badge bg="danger.500" color="white" px={3} py={1} borderRadius="full">
              {alertas.length} insumo{alertas.length > 1 ? "s" : ""} bajo mínimo
            </Badge>
          )}
          <Button bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={abrirNuevo}>
            <FiPlus /> Nuevo ingrediente
          </Button>
        </Flex>
      </Flex>

      <Tabs.Root defaultValue="ingredientes" mt={4}>
        <Tabs.List borderColor="border.subtle">
          <Tabs.Trigger value="ingredientes" color="text.secondary" _selected={{ color: "accent.500" }}>
            Ingredientes
          </Tabs.Trigger>
          <Tabs.Trigger value="uso" color="text.secondary" _selected={{ color: "accent.500" }}>
            Recetas por plato
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="ingredientes" pt={4}>
          <TablaIngredientes ingredientes={ingredientes} onSeleccionar={setSeleccionado} />
        </Tabs.Content>

        <Tabs.Content value="uso" pt={4}>
          <RecetasTab />
        </Tabs.Content>
      </Tabs.Root>

      <IngredienteDetailModal ingrediente={seleccionado} onClose={() => setSeleccionado(null)} onEditar={abrirEditar} />
      <IngredienteFormModal ingrediente={editando} abierto={formAbierto} onClose={() => setFormAbierto(false)} />
    </Box>
  );
}
