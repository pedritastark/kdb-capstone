import { useState } from "react";
import { Badge, Box, Button, Flex, IconButton, Input, NativeSelect, Text, VStack } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";
import { useInventario } from "../../hooks/useInventario";
import { useProductos } from "../../hooks/useProductos";
import { ApiError } from "../../lib/apiClient";

/** Una línea de la receta mientras se edita. La cantidad es texto para poder escribir "0." sin que el campo salte. */
interface Fila {
  id_ingrediente: string;
  cantidad: string;
}

const firma = (filas: Fila[]) =>
  filas
    .map((f) => `${f.id_ingrediente}:${Number(f.cantidad)}`)
    .sort()
    .join("|");

/**
 * Receta por plato: qué ingredientes lleva cada plato y cuánto consume UNA unidad.
 * De ahí salen tres cosas: el descuento automático de inventario al pasar un pedido
 * a "En preparación", si el plato aparece disponible o agotado según el stock, y
 * los ingredientes que el cliente puede quitar al personalizar su pedido.
 */
export function RecetasTab() {
  const { ingredientes, ingredientesDeProducto, recetaCargada, guardarReceta } = useInventario();
  const { productos } = useProductos();
  const [productoId, setProductoId] = useState("");
  const [borrador, setBorrador] = useState<Fila[] | null>(null); // null = sin cambios pendientes
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const idActual = productoId || productos[0]?.id_producto || "";
  const producto = productos.find((p) => p.id_producto === idActual);
  const cargada = recetaCargada(idActual);

  const guardadas: Fila[] = ingredientesDeProducto(idActual).map((i) => ({
    id_ingrediente: i.id_ingrediente,
    cantidad: String(i.cantidad_requerida),
  }));
  const filas = borrador ?? guardadas;
  const hayCambios = borrador !== null && firma(borrador) !== firma(guardadas);

  const porId = new Map(ingredientes.map((i) => [i.id_ingrediente, i]));
  const porAgregar = ingredientes
    .filter((i) => i.activo && !filas.some((f) => f.id_ingrediente === i.id_ingrediente))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const sinReceta = productos.filter((p) => p.n_ingredientes === 0).length;

  const cambiarProducto = (id: string) => {
    if (hayCambios && !window.confirm("Tienes cambios sin guardar en esta receta. ¿Descartarlos?")) return;
    setProductoId(id);
    setBorrador(null);
    setError("");
    setGuardado(false);
  };

  const editar = (nuevas: Fila[]) => {
    setBorrador(nuevas);
    setGuardado(false);
    setError("");
  };

  const guardar = async () => {
    if (filas.some((f) => !(Number(f.cantidad) > 0))) {
      setError("La cantidad de cada ingrediente debe ser mayor a 0.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await guardarReceta(
        idActual,
        filas.map((f) => ({ id_ingrediente: f.id_ingrediente, cantidad_requerida: Number(f.cantidad) })),
      );
      setBorrador(null);
      setGuardado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la receta. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box maxW="820px">
      <Text fontSize="sm" color="text.secondary" mb={4}>
        La receta define qué ingredientes lleva cada plato y cuánto consume <b>una unidad</b>. Con ella se descuenta el
        inventario al pasar un pedido a «En preparación», el plato se marca como agotado si falta stock y el cliente ve
        qué ingredientes puede quitar al personalizar.
      </Text>

      <Flex align="center" gap={3} wrap="wrap" mb={4}>
        <Box w="full" maxW="340px">
          <NativeSelect.Root bg="bg.surface">
            <NativeSelect.Field
              aria-label="Plato"
              value={idActual}
              onChange={(e) => cambiarProducto(e.target.value)}
            >
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre}
                  {p.n_ingredientes === 0 ? " — sin receta" : ""}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
        {sinReceta > 0 && (
          <Badge bg="warning.500" color="white" px={3} py={1} borderRadius="full">
            {sinReceta} plato{sinReceta > 1 ? "s" : ""} sin receta
          </Badge>
        )}
      </Flex>

      {!cargada && <Text color="text.tertiary" fontSize="sm">Cargando receta…</Text>}

      {cargada && (
        <>
          {filas.length === 0 && (
            <Text color="text.secondary" fontSize="sm" mb={3}>
              Este plato no tiene receta: no descuenta inventario y el cliente no verá ingredientes para quitar.
              Agrega ingredientes abajo.
            </Text>
          )}
          {producto && !producto.disponible && guardadas.length > 0 && (
            <Text color="danger.500" fontSize="sm" fontWeight="600" mb={3}>
              Ahora aparece como agotado: falta stock de algún ingrediente de la receta.
            </Text>
          )}

          <VStack align="stretch" gap={2}>
            {filas.map((f) => {
              const ing = porId.get(f.id_ingrediente);
              const nombre = ing?.nombre ?? "Ingrediente";
              const bajoMinimo = !!ing && ing.tipo_control === "cantidad" && ing.cantidad_actual <= ing.cantidad_minima;
              const cantidadInvalida = !(Number(f.cantidad) > 0);
              return (
                <Flex
                  key={f.id_ingrediente}
                  align="center"
                  justify="space-between"
                  gap={3}
                  wrap="wrap"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor={bajoMinimo ? "danger.500" : "border.subtle"}
                  borderRadius="8px"
                  px={4}
                  py={3}
                >
                  <Flex align="center" gap={3} minW="200px" flex="1">
                    <Text fontSize="sm" fontWeight="600">{nombre}</Text>
                    {ing &&
                      (ing.tipo_control === "cantidad" ? (
                        <Badge bg={bajoMinimo ? "danger.500" : "success.500"} color="white" fontSize="10px">
                          Stock: {ing.cantidad_actual} {ing.unidad_medida}
                        </Badge>
                      ) : (
                        <Badge bg={ing.disponible ? "success.500" : "danger.500"} color="white" fontSize="10px">
                          {ing.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      ))}
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text fontSize="xs" color="text.tertiary">Requiere</Text>
                    <Input
                      aria-label={`Cantidad de ${nombre} por unidad`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      size="sm"
                      w="90px"
                      bg="bg.surface"
                      borderColor={cantidadInvalida ? "danger.500" : "border.subtle"}
                      value={f.cantidad}
                      onChange={(e) =>
                        editar(filas.map((x) => (x.id_ingrediente === f.id_ingrediente ? { ...x, cantidad: e.target.value } : x)))
                      }
                    />
                    <Text fontSize="xs" color="text.tertiary" minW="90px">
                      {ing?.unidad_medida ?? ""} por plato
                    </Text>
                    <IconButton
                      aria-label={`Quitar ${nombre} de la receta`}
                      size="xs"
                      variant="ghost"
                      color="text.tertiary"
                      _hover={{ color: "danger.500" }}
                      onClick={() => editar(filas.filter((x) => x.id_ingrediente !== f.id_ingrediente))}
                    >
                      <FiTrash2 />
                    </IconButton>
                  </Flex>
                </Flex>
              );
            })}
          </VStack>

          <Box maxW="340px" mt={3}>
            <NativeSelect.Root bg="bg.surface" disabled={porAgregar.length === 0}>
              <NativeSelect.Field
                aria-label="Agregar ingrediente a la receta"
                value=""
                onChange={(e) => e.target.value && editar([...filas, { id_ingrediente: e.target.value, cantidad: "1" }])}
              >
                <option value="">
                  {porAgregar.length === 0 ? "No quedan ingredientes por agregar" : "+ Agregar ingrediente…"}
                </option>
                {porAgregar.map((i) => (
                  <option key={i.id_ingrediente} value={i.id_ingrediente}>
                    {i.nombre} ({i.unidad_medida})
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>

          {error && (
            <Text color="danger.500" fontSize="sm" mt={3} role="alert">
              {error}
            </Text>
          )}

          <Flex align="center" gap={3} mt={4} wrap="wrap">
            <Button
              bg="accent.500"
              color="white"
              _hover={{ bg: "accent.600" }}
              onClick={guardar}
              disabled={!hayCambios || guardando}
              loading={guardando}
            >
              Guardar receta
            </Button>
            {hayCambios && (
              <Button variant="outline" borderColor="border.subtle" onClick={() => { setBorrador(null); setError(""); }} disabled={guardando}>
                Descartar cambios
              </Button>
            )}
            {hayCambios && <Text fontSize="xs" color="warning.500" fontWeight="600">Cambios sin guardar</Text>}
            {guardado && !hayCambios && <Text fontSize="sm" color="success.500" fontWeight="600">✓ Receta guardada</Text>}
          </Flex>
        </>
      )}
    </Box>
  );
}
