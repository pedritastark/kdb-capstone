import { useState } from "react";
import { Badge, Box, Button, Flex, Table, Text } from "@chakra-ui/react";
import { usePagos } from "../hooks/usePagos";
import { usePedidos } from "../hooks/usePedidos";
import { useClientes } from "../hooks/useClientes";
import { ESTADO_PAGO_COLOR, ESTADO_PAGO_LABEL, MEDIO_PAGO_COLOR, MEDIO_PAGO_LABEL } from "../utils/constants";
import { formatoMoneda } from "../utils/format";
import type { EstadoPago } from "../types";

type Filtro = "todos" | EstadoPago;

export function PagosPage() {
  const { pagos, cambiarEstado } = usePagos();
  const { pedidos } = usePedidos();
  const { clientes } = useClientes();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtrados = filtro === "todos" ? pagos : pagos.filter((p) => p.estado === filtro);

  return (
    <Box>
      <Text fontSize="xl" fontWeight="800" mb={5}>
        Pagos
      </Text>

      <Flex gap={2} wrap="wrap" mb={5}>
        {(["todos", "pendiente", "reportado", "confirmado", "rechazado"] as Filtro[]).map((f) => (
          <Box
            key={f}
            as="button"
            onClick={() => setFiltro(f)}
            px={3}
            py={1.5}
            borderRadius="full"
            fontSize="xs"
            fontWeight="600"
            bg={filtro === f ? "accent.500" : "bg.inset"}
            color={filtro === f ? "white" : "text.secondary"}
            border="1px solid"
            borderColor={filtro === f ? "accent.500" : "border.subtle"}
            cursor="pointer"
          >
            {f === "todos" ? "Todos" : ESTADO_PAGO_LABEL[f]}
          </Box>
        ))}
      </Flex>

      <Box bg="bg.surface" borderRadius="card" border="1px solid" borderColor="border.subtle" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row bg="bg.inset">
              <Table.ColumnHeader color="text.tertiary">Pedido</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Cliente</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Medio</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Valor</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Referencia</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Estado</Table.ColumnHeader>
              <Table.ColumnHeader color="text.tertiary">Acciones</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filtrados.map((pago) => {
              const pedido = pedidos.find((p) => p.id_pedido === pago.id_pedido);
              const cliente = pedido ? clientes.find((c) => c.id_cliente === pedido.id_cliente) : undefined;
              const accionable = pago.estado === "pendiente" || pago.estado === "reportado";
              return (
                <Table.Row key={pago.id_pago} _hover={{ bg: "bg.inset" }}>
                  <Table.Cell fontWeight="600">#{pedido?.codigo ?? "—"}</Table.Cell>
                  <Table.Cell color="text.secondary">{cliente?.nombre ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge bg={MEDIO_PAGO_COLOR[pago.medio]} color="white" fontSize="10px">
                      {MEDIO_PAGO_LABEL[pago.medio]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell fontWeight="700" color="success.500">{formatoMoneda(pago.valor)}</Table.Cell>
                  <Table.Cell color="text.tertiary" fontSize="xs">{pago.referencia || "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge bg={ESTADO_PAGO_COLOR[pago.estado]} color="white" fontSize="10px">
                      {ESTADO_PAGO_LABEL[pago.estado]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {accionable ? (
                      <Flex gap={2}>
                        <Button size="xs" bg="success.500" color="white" _hover={{ bg: "success.600" }} onClick={() => cambiarEstado(pago.id_pago, "confirmado")}>
                          Confirmar
                        </Button>
                        <Button size="xs" variant="outline" borderColor="danger.500" color="danger.500" onClick={() => cambiarEstado(pago.id_pago, "rechazado")}>
                          Rechazar
                        </Button>
                      </Flex>
                    ) : (
                      <Text fontSize="xs" color="text.tertiary">—</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {filtrados.length === 0 && (
        <Text color="text.tertiary" mt={6} textAlign="center">
          No hay pagos en este estado.
        </Text>
      )}
    </Box>
  );
}
