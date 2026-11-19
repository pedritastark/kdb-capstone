import { useState } from "react";
import { Badge, Box, Button, Flex, NativeSelect, Tabs, Text, VStack } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { useInventario } from "../hooks/useInventario";
import { useProductos } from "../hooks/useProductos";
import { TablaIngredientes } from "../components/Inventario/TablaIngredientes";
import { IngredienteDetailModal } from "../components/Inventario/IngredienteDetailModal";
import { IngredienteFormModal } from "../components/Inventario/IngredienteFormModal";
import type { Ingrediente } from "../types";

export function InventarioPage() {
  const { ingredientes, ingredientesDeProducto } = useInventario();
  const { productos } = useProductos();
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
  const [productoId, setProductoId] = useState(productos[0]?.id_producto ?? "");

  const alertas = ingredientes.filter((i) => i.tipo_control === "cantidad" && i.cantidad_actual <= i.cantidad_minima);
  const ingredientesProducto = ingredientesDeProducto(productoId);

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
            Uso por producto
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="ingredientes" pt={4}>
          <TablaIngredientes ingredientes={ingredientes} onSeleccionar={setSeleccionado} />
        </Tabs.Content>

        <Tabs.Content value="uso" pt={4}>
          <Box maxW="320px" mb={4}>
            <NativeSelect.Root bg="bg.surface">
              <NativeSelect.Field value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>{p.nombre}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>

          <VStack align="stretch" gap={2}>
            {ingredientesProducto.length === 0 && (
              <Text color="text.tertiary" fontSize="sm">Este producto no tiene ingredientes asociados.</Text>
            )}
            {ingredientesProducto.map((ing) => {
              const bajoMinimo = ing.tipo_control === "cantidad" && ing.cantidad_actual <= ing.cantidad_minima;
              return (
                <Flex
                  key={ing.id_ingrediente}
                  justify="space-between"
                  align="center"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor={bajoMinimo ? "danger.500" : "border.subtle"}
                  borderRadius="8px"
                  px={4}
                  py={3}
                >
                  <Text fontSize="sm" fontWeight="600">{ing.nombre}</Text>
                  <Flex align="center" gap={4}>
                    <Text fontSize="xs" color="text.tertiary">
                      Requiere {ing.cantidad_requerida} {ing.unidad_medida} / unidad
                    </Text>
                    {ing.tipo_control === "cantidad" ? (
                      <Badge bg={bajoMinimo ? "danger.500" : "success.500"} color="white" fontSize="10px">
                        Stock: {ing.cantidad_actual} {ing.unidad_medida}
                      </Badge>
                    ) : (
                      <Badge bg={ing.disponible ? "success.500" : "danger.500"} color="white" fontSize="10px">
                        {ing.disponible ? "Disponible" : "Agotado"}
                      </Badge>
                    )}
                  </Flex>
                </Flex>
              );
            })}
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      <IngredienteDetailModal ingrediente={seleccionado} onClose={() => setSeleccionado(null)} onEditar={abrirEditar} />
      <IngredienteFormModal ingrediente={editando} abierto={formAbierto} onClose={() => setFormAbierto(false)} />
    </Box>
  );
}
