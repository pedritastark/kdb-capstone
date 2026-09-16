import { useEffect, useState } from "react";
import { Button, Dialog, Field, Input, Portal, VStack } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import type { Cliente } from "../../types";
import { useClientes } from "../../hooks/useClientes";

interface ClienteFormModalProps {
  cliente: Cliente | null;
  abierto: boolean;
  onClose: () => void;
}

const vacio = { nombre: "", correo: "", telefono: "" };

export function ClienteFormModal({ cliente, abierto, onClose }: ClienteFormModalProps) {
  const { guardarCliente, crearCliente } = useClientes();
  const [form, setForm] = useState(vacio);

  useEffect(() => {
    setForm(cliente ? { nombre: cliente.nombre, correo: cliente.correo, telefono: cliente.telefono } : vacio);
  }, [cliente, abierto]);

  const handleGuardar = () => {
    if (!form.nombre.trim() || !form.telefono.trim()) return;
    if (cliente) {
      guardarCliente({ ...cliente, ...form });
    } else {
      crearCliente({ ...form });
    }
    onClose();
  };

  return (
    <Dialog.Root open={abierto} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="card">
            <Dialog.Header borderBottom="1px solid" borderColor="border.subtle">
              <Dialog.Title>{cliente ? "Editar cliente" : "Nuevo cliente"}</Dialog.Title>
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
                  <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} bg="bg.inset" borderColor="border.subtle" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Correo</Field.Label>
                  <Input type="email" value={form.correo} onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))} bg="bg.inset" borderColor="border.subtle" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm" color="text.secondary">Teléfono</Field.Label>
                  <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} bg="bg.inset" borderColor="border.subtle" />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer borderTop="1px solid" borderColor="border.subtle">
              <Button variant="ghost" color="text.secondary" onClick={onClose}>Cancelar</Button>
              <Button bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={handleGuardar}>Guardar</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
