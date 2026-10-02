import { Box, Button, Flex, IconButton, Input, NativeSelect, Text } from "@chakra-ui/react";
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import type { ItemCarrito } from "../../pages/TomaOrdenPage";
import type { Categoria, MedioPago } from "../../types";
import { resolveImageUrl } from "../../lib/images";
import { MEDIO_PAGO_LABEL } from "../../utils/constants";
import { formatoMoneda } from "../../utils/format";
import { estiloCategoria } from "./shared";

interface CarritoViewProps {
  carrito: ItemCarrito[];
  categorias: Categoria[];
  total: number;
  resumenEntrega: string;
  telefono: string;
  onTelefonoChange: (valor: string) => void;
  medioPago: MedioPago;
  onMedioPagoChange: (valor: MedioPago) => void;
  enviando: boolean;
  error: string;
  onVolver: () => void;
  onAgregar: (claveLinea: string) => void;
  onQuitar: (claveLinea: string) => void;
  onConfirmar: () => void;
}

const MEDIOS_PAGO: MedioPago[] = ["efectivo", "nequi", "daviplata", "llave"];

export function CarritoView({
  carrito,
  categorias,
  total,
  resumenEntrega,
  telefono,
  onTelefonoChange,
  medioPago,
  onMedioPagoChange,
  enviando,
  error,
  onVolver,
  onAgregar,
  onQuitar,
  onConfirmar,
}: CarritoViewProps) {
  return (
    <Box>
      <Flex align="center" gap={3} px={5} pt={5} pb={4}>
        <IconButton aria-label="Seguir pidiendo" variant="ghost" color="text.secondary" size="sm" onClick={onVolver}>
          <FiArrowLeft />
        </IconButton>
        <Text fontSize="lg" fontWeight="800" color="white">
          Tu pedido
        </Text>
      </Flex>

      {resumenEntrega && (
        <Box px={5} pb={4}>
          <Box bg="bg.inset" borderRadius="full" px={4} py={2} display="inline-block">
            <Text fontSize="xs" color="accent.400" fontWeight="700">
              {resumenEntrega}
            </Text>
          </Box>
        </Box>
      )}

      <Box px={5} pb={32}>
        {carrito.length === 0 && (
          <Text color="text.tertiary" fontSize="sm" textAlign="center" mt={12}>
            Aún no has agregado nada.
          </Text>
        )}

        <Flex direction="column" gap={3}>
          {carrito.map((item) => {
            const { producto, cantidad, claveLinea, excluidos, adicionales } = item;
            const imagen = resolveImageUrl(producto.imagen_url);
            const nombreCategoria = categorias.find((c) => c.id_categoria === producto.id_categoria)?.nombre;
            const estilo = estiloCategoria(nombreCategoria, 0);
            const precioUnitario = producto.precio + adicionales.reduce((s, a) => s + a.precio_adicional, 0);
            return (
            <Flex
              key={claveLinea}
              bg="bg.surface"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="14px"
              p={3}
              gap={3}
              align="center"
            >
              <Flex
                w="48px"
                h="48px"
                borderRadius="10px"
                bgImage={imagen ? undefined : estilo.gradiente}
                bg={imagen ? "bg.inset" : undefined}
                align="center"
                justify="center"
                fontSize="24px"
                flexShrink={0}
                overflow="hidden"
              >
                {imagen ? (
                  <img src={imagen} alt={producto.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  estilo.emoji
                )}
              </Flex>

              <Box flex={1} minW={0}>
                <Text fontWeight="700" color="white" fontSize="sm" lineClamp={1}>
                  {producto.nombre}
                </Text>
                <Text fontSize="xs" color="text.tertiary">
                  {formatoMoneda(precioUnitario)} c/u
                </Text>
                {excluidos.length > 0 && (
                  <Text fontSize="xs" color="danger.400" lineClamp={1}>
                    Sin: {excluidos.join(", ")}
                  </Text>
                )}
                {adicionales.length > 0 && (
                  <Text fontSize="xs" color="success.400" lineClamp={1}>
                    + {adicionales.map((a) => a.nombre).join(", ")}
                  </Text>
                )}
              </Box>

              <Flex align="center" gap={2} flexShrink={0}>
                <IconButton
                  aria-label={`Quitar ${producto.nombre}`}
                  size="sm"
                  variant="outline"
                  borderColor="border.subtle"
                  color="text.primary"
                  borderRadius="full"
                  onClick={() => onQuitar(claveLinea)}
                >
                  {cantidad === 1 ? <FiTrash2 /> : <FiMinus />}
                </IconButton>
                <Text fontWeight="800" color="white" minW="18px" textAlign="center">
                  {cantidad}
                </Text>
                <IconButton
                  aria-label={`Agregar ${producto.nombre}`}
                  size="sm"
                  bg="accent.500"
                  color="white"
                  borderRadius="full"
                  _hover={{ bg: "accent.600" }}
                  onClick={() => onAgregar(claveLinea)}
                >
                  <FiPlus />
                </IconButton>
              </Flex>
            </Flex>
            );
          })}
        </Flex>

        {carrito.length > 0 && (
          <Box mt={5}>
            <Text fontSize="xs" fontWeight="700" color="text.tertiary" mb={2} letterSpacing="wide">
              TUS DATOS
            </Text>
            <Text color="text.secondary" fontSize="xs" mb={1}>
              Teléfono de contacto
            </Text>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="Ej. 3001234567"
              value={telefono}
              onChange={(e) => onTelefonoChange(e.target.value)}
              bg="bg.surface"
              borderColor="border.subtle"
              mb={3}
            />
            <Text color="text.secondary" fontSize="xs" mb={1}>
              Medio de pago
            </Text>
            <NativeSelect.Root bg="bg.surface">
              <NativeSelect.Field
                value={medioPago}
                onChange={(e) => onMedioPagoChange(e.target.value as MedioPago)}
              >
                {MEDIOS_PAGO.map((medio) => (
                  <option key={medio} value={medio}>
                    {MEDIO_PAGO_LABEL[medio]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>
        )}
      </Box>

      {carrito.length > 0 && (
        <Box
          position="fixed"
          bottom={0}
          left="50%"
          transform="translateX(-50%)"
          w="100%"
          maxW="480px"
          bg="bg.surface"
          borderTop="1px solid"
          borderColor="border.subtle"
          px={4}
          pt={4}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        >
          {error && (
            <Text color="danger.500" fontSize="xs" mb={2} textAlign="center">
              {error}
            </Text>
          )}
          <Flex justify="space-between" align="center" mb={3}>
            <Text color="text.secondary" fontSize="sm">Total</Text>
            <Text fontWeight="800" fontSize="xl" color="accent.500">
              {formatoMoneda(total)}
            </Text>
          </Flex>
          <Button
            w="full"
            h="56px"
            fontSize="md"
            bg="accent.500"
            color="white"
            _hover={{ bg: "accent.600" }}
            onClick={onConfirmar}
            loading={enviando}
            disabled={!telefono.trim()}
          >
            Confirmar pedido
          </Button>
        </Box>
      )}
    </Box>
  );
}
