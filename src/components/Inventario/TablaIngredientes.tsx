import { Badge, Box, Switch, Table, Text } from "@chakra-ui/react";
import type { Ingrediente } from "../../types";
import { useInventario } from "../../hooks/useInventario";

interface TablaIngredientesProps {
  ingredientes: Ingrediente[];
  onSeleccionar: (ingrediente: Ingrediente) => void;
}

export function TablaIngredientes({ ingredientes, onSeleccionar }: TablaIngredientesProps) {
  const { toggleDisponible } = useInventario();

  return (
    <Box bg="bg.surface" borderRadius="card" border="1px solid" borderColor="border.subtle" overflow="hidden">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row bg="bg.inset">
            <Table.ColumnHeader color="text.tertiary">Ingrediente</Table.ColumnHeader>
            <Table.ColumnHeader color="text.tertiary">Unidad</Table.ColumnHeader>
            <Table.ColumnHeader color="text.tertiary">Control</Table.ColumnHeader>
            <Table.ColumnHeader color="text.tertiary">Actual</Table.ColumnHeader>
            <Table.ColumnHeader color="text.tertiary">Mínimo</Table.ColumnHeader>
            <Table.ColumnHeader color="text.tertiary">Estado</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ingredientes.map((ing) => {
            const bajoMinimo = ing.tipo_control === "cantidad" && ing.cantidad_actual <= ing.cantidad_minima;
            return (
              <Table.Row
                key={ing.id_ingrediente}
                cursor="pointer"
                bg={bajoMinimo ? "rgba(239, 68, 68, 0.08)" : "transparent"}
                _hover={{ bg: "bg.inset" }}
                onClick={() => onSeleccionar(ing)}
              >
                <Table.Cell fontWeight="600">{ing.nombre}</Table.Cell>
                <Table.Cell color="text.secondary">{ing.unidad_medida}</Table.Cell>
                <Table.Cell>
                  <Badge bg="bg.inset" color="text.secondary" fontSize="10px">
                    {ing.tipo_control === "cantidad" ? "Cantidad" : "Disponibilidad"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {ing.tipo_control === "cantidad" ? (
                    <Text color={bajoMinimo ? "danger.500" : "text.primary"} fontWeight={bajoMinimo ? "700" : "400"}>
                      {ing.cantidad_actual}
                    </Text>
                  ) : (
                    <Text color="text.tertiary">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell color="text.secondary">
                  {ing.tipo_control === "cantidad" ? ing.cantidad_minima : "—"}
                </Table.Cell>
                <Table.Cell onClick={(e) => e.stopPropagation()}>
                  {ing.tipo_control === "cantidad" ? (
                    bajoMinimo ? (
                      <Badge bg="danger.500" color="white" fontSize="10px">Bajo mínimo</Badge>
                    ) : (
                      <Badge bg="success.500" color="white" fontSize="10px">OK</Badge>
                    )
                  ) : (
                    <Switch.Root
                      size="sm"
                      checked={ing.disponible}
                      onCheckedChange={() => toggleDisponible(ing.id_ingrediente)}
                      colorPalette="orange"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control />
                    </Switch.Root>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
