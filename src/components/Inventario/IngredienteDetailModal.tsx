import { useState } from "react";
import { Badge, Box, Button, Dialog, Field, Flex, Input, NativeSelect, Portal, Switch, Text, Textarea, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Ingrediente, TipoMovimientoInventario } from "../../types";
import { useInventario } from "../../hooks/useInventario";
import { TIPO_MOVIMIENTO_COLOR, TIPO_MOVIMIENTO_LABEL } from "../../utils/constants";
import { formatoFechaHora } from "../../utils/format";

interface IngredienteDetailModalProps {
  ingrediente: Ingrediente | null;
  onClose: () => void;
}

const TIPOS: TipoMovimientoInventario[] = ["entrada", "consumo", "perdida", "ajuste", "devolucion"];

export function IngredienteDetailModal({ ingrediente, onClose }: IngredienteDetailModalProps) {
  const { movimientosDe, registrarMovimiento, toggleDisponible, ingredientes } = useInventario();
  const [tipo, setTipo] = useState<TipoMovimientoInventario>("entrada");
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState("");

  const actual = ingrediente ? ingredientes.find((i) => i.id_ingrediente === ingrediente.id_ingrediente) ?? ingrediente : null;
  if (!actual) return null;

  const bajoMinimo = actual.tipo_control === "cantidad" && actual.cantidad_actual <= actual.cantidad_minima;
  const historial = movimientosDe(actual.id_ingrediente);

  const handleRegistrar = () => {
    if (cantidad <= 0 || !motivo.trim()) return;
    registrarMovimiento({ id_ingrediente: actual.id_ingrediente, tipo_movimiento: tipo, cantidad, motivo: motivo.trim() });
    setCantidad(0);
    setMotivo("");
  };

  return (
    <Dialog.Root open={ingrediente !== null} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Dialog.Title>{actual.nombre}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3} color="text.secondary">
                  <FiX />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={5} py={2}>
                {actual.tipo_control === "cantidad" ? (
                  <Flex gap={6} bg="bg.inset" borderRadius="8px" p={3} align="center">
                    <Box>
                      <Text fontSize="xs" color="text.tertiary">Cantidad actual</Text>
                      <Text fontSize="2xl" fontWeight="800" color={bajoMinimo ? "danger.500" : "text.primary"}>
                        {actual.cantidad_actual} {actual.unidad_medida}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="text.tertiary">Mínimo</Text>
                      <Text fontSize="lg" fontWeight="700" color="text.secondary">
                        {actual.cantidad_minima} {actual.unidad_medida}
                      </Text>
                    </Box>
                    {bajoMinimo && <Badge bg="danger.500" color="white">Bajo mínimo</Badge>}
                  </Flex>
                ) : (
                  <Flex justify="space-between" align="center" bg="bg.inset" borderRadius="8px" p={3}>
                    <Text fontSize="sm">Control por disponibilidad</Text>
                    <Switch.Root checked={actual.disponible} onCheckedChange={() => toggleDisponible(actual.id_ingrediente)} colorPalette="orange">
                      <Switch.HiddenInput />
                      <Switch.Control />
                      <Switch.Label fontSize="sm">{actual.disponible ? "Disponible" : "Agotado"}</Switch.Label>
                    </Switch.Root>
                  </Flex>
                )}

                {actual.tipo_control === "cantidad" && (
                  <Box borderTop="1px solid" borderColor="border.subtle" pt={4}>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={3} letterSpacing="wide">
                      REGISTRAR MOVIMIENTO
                    </Text>
                    <Flex gap={3} wrap="wrap" mb={3}>
                      <Field.Root maxW="160px">
                        <Field.Label fontSize="xs" color="text.secondary">Tipo</Field.Label>
                        <NativeSelect.Root size="sm" bg="bg.inset">
                          <NativeSelect.Field value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimientoInventario)}>
                            {TIPOS.map((t) => (
                              <option key={t} value={t}>{TIPO_MOVIMIENTO_LABEL[t]}</option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                      <Field.Root maxW="140px">
                        <Field.Label fontSize="xs" color="text.secondary">Cantidad ({actual.unidad_medida})</Field.Label>
                        <Input size="sm" type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} bg="bg.inset" borderColor="border.subtle" />
                      </Field.Root>
                    </Flex>
                    <Field.Root mb={3}>
                      <Field.Label fontSize="xs" color="text.secondary">Motivo</Field.Label>
                      <Textarea size="sm" value={motivo} onChange={(e) => setMotivo(e.target.value)} bg="bg.inset" borderColor="border.subtle" />
                    </Field.Root>
                    <Button size="sm" bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={handleRegistrar}>
                      Registrar movimiento
                    </Button>
                  </Box>
                )}

                <Box borderTop="1px solid" borderColor="border.subtle" pt={4}>
                  <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
                    HISTORIAL DE MOVIMIENTOS
                  </Text>
                  {historial.length === 0 && (
                    <Text fontSize="sm" color="text.tertiary">Sin movimientos registrados.</Text>
                  )}
                  <VStack align="stretch" gap={2}>
                    {historial.map((m) => (
                      <Flex key={m.id_movimiento} justify="space-between" align="center" bg="bg.inset" borderRadius="6px" px={3} py={2}>
                        <Box>
                          <Flex align="center" gap={2}>
                            <Badge bg={TIPO_MOVIMIENTO_COLOR[m.tipo_movimiento]} color="white" fontSize="10px">
                              {TIPO_MOVIMIENTO_LABEL[m.tipo_movimiento]}
                            </Badge>
                            <Text fontSize="sm">{m.cantidad} {actual.unidad_medida}</Text>
                          </Flex>
                          <Text fontSize="xs" color="text.tertiary" mt={1}>{m.motivo}</Text>
                        </Box>
                        <Text fontSize="xs" color="text.tertiary">{formatoFechaHora(m.fecha_movimiento)}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
