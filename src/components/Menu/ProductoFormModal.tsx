import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Input,
  NativeSelect,
  Portal,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Producto, TipoOpcion } from "../../types";
import { useProductos } from "../../hooks/useProductos";
import { formatoMoneda } from "../../utils/format";

interface ProductoFormModalProps {
  producto: Producto | null;
  abierto: boolean;
  onClose: () => void;
}

const TIPOS_OPCION: TipoOpcion[] = ["proteina", "salsa", "picante", "adicional"];
const TIPO_OPCION_LABEL: Record<TipoOpcion, string> = {
  proteina: "Proteína",
  salsa: "Salsa",
  picante: "Picante",
  adicional: "Adicional",
};

const vacio = {
  id_categoria: "cat1",
  nombre: "",
  descripcion: "",
  precio: 0,
  disponible: true,
  tiempo_preparacion_min: 5,
  activo: true,
  imagen_url: "",
};

export function ProductoFormModal({ producto, abierto, onClose }: ProductoFormModalProps) {
  const { categorias, guardarProducto, crearProducto, opcionesDe, toggleOpcionDisponible, agregarOpcion } = useProductos();
  const [form, setForm] = useState(vacio);
  const [nuevaOpcion, setNuevaOpcion] = useState({ tipo: "adicional" as TipoOpcion, nombre: "", precio_adicional: 0, obligatoria: false });

  useEffect(() => {
    if (producto) {
      setForm({
        id_categoria: producto.id_categoria,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        disponible: producto.disponible,
        tiempo_preparacion_min: producto.tiempo_preparacion_min,
        activo: producto.activo,
        imagen_url: producto.imagen_url,
      });
    } else {
      setForm(vacio);
    }
  }, [producto, abierto]);

  const opciones = producto ? opcionesDe(producto.id_producto) : [];

  const handleGuardar = () => {
    if (!form.nombre.trim() || form.precio <= 0) return;
    if (producto) {
      guardarProducto({ ...producto, ...form });
    } else {
      crearProducto({ ...form });
    }
    onClose();
  };

  const handleAgregarOpcion = () => {
    if (!producto || !nuevaOpcion.nombre.trim()) return;
    agregarOpcion({
      id_producto: producto.id_producto,
      tipo: nuevaOpcion.tipo,
      nombre: nuevaOpcion.nombre.trim(),
      precio_adicional: nuevaOpcion.precio_adicional,
      obligatoria: nuevaOpcion.obligatoria,
      disponible: true,
    });
    setNuevaOpcion({ tipo: "adicional", nombre: "", precio_adicional: 0, obligatoria: false });
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Dialog.Title>{producto ? "Editar producto" : "Nuevo producto"}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3} color="text.secondary">
                  <FiX />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={4} py={2}>
                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Nombre</Field.Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    bg="bg.inset"
                    borderColor="border.subtle"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Descripción</Field.Label>
                  <Textarea
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    bg="bg.inset"
                    borderColor="border.subtle"
                    size="sm"
                  />
                </Field.Root>

                <Flex gap={4}>
                  <Field.Root>
                    <Field.Label fontSize="sm" color="text.secondary">Categoría</Field.Label>
                    <NativeSelect.Root bg="bg.inset">
                      <NativeSelect.Field
                        value={form.id_categoria}
                        onChange={(e) => setForm((f) => ({ ...f, id_categoria: e.target.value }))}
                      >
                        {categorias.map((c) => (
                          <option key={c.id_categoria} value={c.id_categoria}>
                            {c.nombre}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label fontSize="sm" color="text.secondary">Precio (COP)</Field.Label>
                    <Input
                      type="number"
                      value={form.precio}
                      onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
                      bg="bg.inset"
                      borderColor="border.subtle"
                    />
                  </Field.Root>
                </Flex>

                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Tiempo de preparación (min)</Field.Label>
                  <Input
                    type="number"
                    value={form.tiempo_preparacion_min}
                    onChange={(e) => setForm((f) => ({ ...f, tiempo_preparacion_min: Number(e.target.value) }))}
                    bg="bg.inset"
                    borderColor="border.subtle"
                    maxW="160px"
                  />
                </Field.Root>

                <Flex gap={6}>
                  <Switch.Root
                    checked={form.disponible}
                    onCheckedChange={(e) => setForm((f) => ({ ...f, disponible: e.checked }))}
                    colorPalette="orange"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label fontSize="sm" color="text.secondary">Disponible</Switch.Label>
                  </Switch.Root>
                  <Switch.Root
                    checked={form.activo}
                    onCheckedChange={(e) => setForm((f) => ({ ...f, activo: e.checked }))}
                    colorPalette="orange"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label fontSize="sm" color="text.secondary">Activo</Switch.Label>
                  </Switch.Root>
                </Flex>

                {producto && (
                  <Box borderTop="1px solid" borderColor="border.subtle" pt={4}>
                    <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={3} letterSpacing="wide">
                      PERSONALIZACIONES
                    </Text>

                    {TIPOS_OPCION.map((tipo) => {
                      const deEsteTipo = opciones.filter((o) => o.tipo === tipo);
                      if (deEsteTipo.length === 0) return null;
                      return (
                        <Box key={tipo} mb={3}>
                          <Text fontSize="xs" color="text.secondary" mb={1} fontWeight="600">
                            {TIPO_OPCION_LABEL[tipo]}
                          </Text>
                          <VStack align="stretch" gap={1}>
                            {deEsteTipo.map((o) => (
                              <Flex key={o.id_opcion} justify="space-between" align="center" bg="bg.inset" borderRadius="6px" px={3} py={2}>
                                <Text fontSize="sm">
                                  {o.nombre}
                                  {o.obligatoria && <Text as="span" color="accent.500"> *</Text>}
                                  {o.precio_adicional > 0 && (
                                    <Text as="span" color="text.tertiary"> (+{formatoMoneda(o.precio_adicional)})</Text>
                                  )}
                                </Text>
                                <Switch.Root
                                  size="sm"
                                  checked={o.disponible}
                                  onCheckedChange={() => toggleOpcionDisponible(o.id_opcion)}
                                  colorPalette="orange"
                                >
                                  <Switch.HiddenInput />
                                  <Switch.Control />
                                </Switch.Root>
                              </Flex>
                            ))}
                          </VStack>
                        </Box>
                      );
                    })}

                    <Flex gap={2} mt={2} align="end" wrap="wrap">
                      <Field.Root maxW="130px">
                        <Field.Label fontSize="xs" color="text.secondary">Tipo</Field.Label>
                        <NativeSelect.Root size="sm" bg="bg.inset">
                          <NativeSelect.Field
                            value={nuevaOpcion.tipo}
                            onChange={(e) => setNuevaOpcion((f) => ({ ...f, tipo: e.target.value as TipoOpcion }))}
                          >
                            {TIPOS_OPCION.map((t) => (
                              <option key={t} value={t}>{TIPO_OPCION_LABEL[t]}</option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                      <Field.Root maxW="160px">
                        <Field.Label fontSize="xs" color="text.secondary">Nombre</Field.Label>
                        <Input
                          size="sm"
                          value={nuevaOpcion.nombre}
                          onChange={(e) => setNuevaOpcion((f) => ({ ...f, nombre: e.target.value }))}
                          bg="bg.inset"
                          borderColor="border.subtle"
                        />
                      </Field.Root>
                      <Field.Root maxW="130px">
                        <Field.Label fontSize="xs" color="text.secondary">Precio adicional</Field.Label>
                        <Input
                          size="sm"
                          type="number"
                          value={nuevaOpcion.precio_adicional}
                          onChange={(e) => setNuevaOpcion((f) => ({ ...f, precio_adicional: Number(e.target.value) }))}
                          bg="bg.inset"
                          borderColor="border.subtle"
                        />
                      </Field.Root>
                      <Button size="sm" bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={handleAgregarOpcion}>
                        Añadir
                      </Button>
                    </Flex>
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid" borderColor="border.subtle">
              <Button variant="ghost" color="text.secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={handleGuardar}>
                Guardar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
