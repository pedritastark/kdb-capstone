import { useEffect, useState } from "react";
import { Button, Dialog, Field, Flex, Input, NativeSelect, Portal, Switch, Text, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Ingrediente, TipoControlIngrediente } from "../../types";
import { useInventario, type IngredienteInput } from "../../hooks/useInventario";
import { FotoPicker } from "../Shared/FotoPicker";

interface IngredienteFormModalProps {
  /** null = ingrediente nuevo. */
  ingrediente: Ingrediente | null;
  abierto: boolean;
  onClose: () => void;
}

const UNIDADES = ["unidad", "porción", "libra", "paquete", "g", "kg", "ml", "l"];

const vacio: IngredienteInput = {
  nombre: "",
  unidad_medida: "unidad",
  tipo_control: "cantidad",
  cantidad_actual: 0,
  cantidad_minima: 0,
  disponible: true,
  activo: true,
  imagen_url: "",
};

export function IngredienteFormModal({ ingrediente, abierto, onClose }: IngredienteFormModalProps) {
  const { crearIngrediente, guardarIngrediente } = useInventario();
  const [form, setForm] = useState<IngredienteInput>(vacio);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      ingrediente
        ? {
            nombre: ingrediente.nombre,
            unidad_medida: ingrediente.unidad_medida,
            tipo_control: ingrediente.tipo_control,
            cantidad_actual: ingrediente.cantidad_actual,
            cantidad_minima: ingrediente.cantidad_minima,
            disponible: ingrediente.disponible,
            activo: ingrediente.activo,
            imagen_url: ingrediente.imagen_url ?? "",
          }
        : vacio,
    );
  }, [ingrediente, abierto]);

  const esNuevo = ingrediente === null;
  const porCantidad = form.tipo_control === "cantidad";
  // Unidades de la lista + la que ya tenga el ingrediente, si es otra.
  const unidades = UNIDADES.includes(form.unidad_medida) ? UNIDADES : [...UNIDADES, form.unidad_medida];

  const handleGuardar = async () => {
    if (subiendoFoto || guardando) return;
    if (!form.nombre.trim()) return setError("Escribe el nombre del ingrediente.");
    if (form.cantidad_actual < 0 || form.cantidad_minima < 0) return setError("Las cantidades no pueden ser negativas.");
    setError(null);
    setGuardando(true);
    try {
      const datos = { ...form, nombre: form.nombre.trim() };
      if (esNuevo) await crearIngrediente(datos);
      else await guardarIngrediente(ingrediente.id_ingrediente, datos);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? `No se pudo guardar: ${err.message}` : "No se pudo guardar el ingrediente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={(e) => !e.open && onClose()} size="md">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.500" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Dialog.Title>{esNuevo ? "Nuevo ingrediente" : "Editar ingrediente"}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3} color="text.secondary">
                  <FiX />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4} py={2}>
                <FotoPicker
                  valor={form.imagen_url}
                  onCambio={(url) => setForm((f) => ({ ...f, imagen_url: url }))}
                  onSubiendo={setSubiendoFoto}
                  alt={form.nombre || "Foto del ingrediente"}
                />

                {error && (
                  <Text fontSize="sm" color="danger.500" bg="bg.inset" borderRadius="6px" px={3} py={2}>
                    {error}
                  </Text>
                )}

                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Nombre</Field.Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej. Queso costeño"
                    bg="bg.inset"
                    borderColor="border.subtle"
                  />
                </Field.Root>

                <Flex gap={4}>
                  <Field.Root>
                    <Field.Label fontSize="sm" color="text.secondary">¿Cómo se controla?</Field.Label>
                    <NativeSelect.Root bg="bg.inset">
                      <NativeSelect.Field
                        value={form.tipo_control}
                        onChange={(e) => setForm((f) => ({ ...f, tipo_control: e.target.value as TipoControlIngrediente }))}
                      >
                        <option value="cantidad">Por cantidad (stock)</option>
                        <option value="disponibilidad">Solo hay / no hay</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root maxW="150px">
                    <Field.Label fontSize="sm" color="text.secondary">Unidad</Field.Label>
                    <NativeSelect.Root bg="bg.inset">
                      <NativeSelect.Field
                        value={form.unidad_medida}
                        onChange={(e) => setForm((f) => ({ ...f, unidad_medida: e.target.value }))}
                      >
                        {unidades.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                </Flex>

                {porCantidad ? (
                  <Flex gap={4}>
                    <Field.Root>
                      <Field.Label fontSize="sm" color="text.secondary">
                        {esNuevo ? "Cantidad inicial" : "Cantidad actual"}
                      </Field.Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.cantidad_actual}
                        onChange={(e) => setForm((f) => ({ ...f, cantidad_actual: Number(e.target.value) }))}
                        disabled={!esNuevo}
                        bg="bg.inset"
                        borderColor="border.subtle"
                      />
                      {!esNuevo && (
                        <Field.HelperText fontSize="xs" color="text.tertiary">
                          Se cambia registrando un movimiento.
                        </Field.HelperText>
                      )}
                    </Field.Root>
                    <Field.Root>
                      <Field.Label fontSize="sm" color="text.secondary">Mínimo (alerta)</Field.Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.cantidad_minima}
                        onChange={(e) => setForm((f) => ({ ...f, cantidad_minima: Number(e.target.value) }))}
                        bg="bg.inset"
                        borderColor="border.subtle"
                      />
                    </Field.Root>
                  </Flex>
                ) : (
                  <Switch.Root
                    checked={form.disponible}
                    onCheckedChange={(e) => setForm((f) => ({ ...f, disponible: e.checked }))}
                    colorPalette="orange"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label fontSize="sm" color="text.secondary">
                      {form.disponible ? "Disponible" : "Agotado"}
                    </Switch.Label>
                  </Switch.Root>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid" borderColor="border.subtle">
              <Button variant="ghost" color="text.secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                bg="accent.500"
                color="white"
                _hover={{ bg: "accent.600" }}
                onClick={handleGuardar}
                disabled={subiendoFoto}
                loading={guardando}
              >
                Guardar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
