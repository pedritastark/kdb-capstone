import { useState } from "react";
import { Box, Button, Flex, Input, Table, Text } from "@chakra-ui/react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useClientes } from "../hooks/useClientes";
import { usePedidos } from "../hooks/usePedidos";
import { ClienteDetailModal } from "../components/Clientes/ClienteDetailModal";
import { ClienteFormModal } from "../components/Clientes/ClienteFormModal";
import type { Cliente } from "../types";

export function ClientesPage() {
  const { clientes } = useClientes();
  const { pedidos } = usePedidos();
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return c.nombre.toLowerCase().includes(q) || c.telefono.includes(q);
  });

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditarDesdeDetalle = () => {
    if (seleccionado) {
      setEditando(seleccionado);
      setSeleccionado(null);
      setModalAbierto(true);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
        <Text fontSize="xl" fontWeight="800">
          Clientes
        </Text>
        <Button bg="accent.500" color="white" _hover={{ bg: "accent.600" }} onClick={abrirNuevo}>
          <FiPlus /> Nuevo cliente
        </Button>
      </Flex>

      <Flex align="center" gap={2} mb={4} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="8px" px={3} maxW="360px">
        <FiSearch color="#888" />
        <Input
          placeholder="Buscar por nombre o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          border="none"
          _focus={{ boxShadow: "none" }}
        />
      </Flex>

      <Box bg="bg.surface" borderRadius="card" border="1px solid" borderColor="border.subtle" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="bg.inset">
              <Table.ColumnHeader color="text.tertiary">Nombre</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Teléfono</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Correo</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Pedidos</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtrados.map((c) => (
              <Table.Row key={c.id_cliente} cursor="pointer" _hover={{ bg: "bg.inset" }} onClick={() => setSeleccionado(c)}>
                <Table.Cell fontWeight="600">{c.nombre}</Table.Cell>
                <Table.Cell color="text.secondary">{c.telefono}</Table.Cell>
                <Table.Cell color="text.secondary">{c.correo}</Table.Cell>
                <Table.Cell color="text.secondary">
                  {pedidos.filter((p) => p.id_cliente === c.id_cliente).length}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {filtrados.length === 0 && (
        <Text color="text.tertiary" mt={6} textAlign="center">
          No se encontraron clientes.
        </Text>
      )}

      <ClienteDetailModal cliente={seleccionado} onClose={() => setSeleccionado(null)} onEditar={abrirEditarDesdeDetalle} />
      <ClienteFormModal cliente={editando} abierto={modalAbierto} onClose={() => setModalAbierto(false)} />
    </Box>
  );
}
