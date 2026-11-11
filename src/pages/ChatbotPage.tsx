import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import { ApiError, apiClient } from "../lib/apiClient";
import logoDannyTacos from "../assets/images/logo-danny-tacos.jpg";

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface RespuestaBot {
  /** Estado opaco de la conversación: se reenvía tal cual en el siguiente mensaje. */
  estado: unknown;
  mensajes: string[];
  opciones: Opcion[];
  multi?: boolean;
  entrada: "opciones" | "texto" | "telefono" | "numero";
  finalizado?: boolean;
}

interface Burbuja {
  id: number;
  de: "bot" | "yo";
  texto: string;
}

const PLACEHOLDER: Record<RespuestaBot["entrada"], string> = {
  opciones: "Elige una opción o escribe aquí…",
  texto: "Escribe tu respuesta…",
  telefono: "Tu número de celular",
  numero: "Escribe una cantidad",
};

export function ChatbotPage() {
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [respuesta, setRespuesta] = useState<RespuestaBot | null>(null);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const siguienteId = useRef(0);
  const fondoRef = useRef<HTMLDivElement>(null);
  const iniciado = useRef(false);

  const agregar = useCallback((de: Burbuja["de"], textos: string[]) => {
    setBurbujas((prev) => [...prev, ...textos.map((t) => ({ id: siguienteId.current++, de, texto: t }))]);
  }, []);

  const enviar = useCallback(
    async (valor: string | undefined, visible?: string) => {
      setCargando(true);
      if (valor !== undefined) agregar("yo", [visible ?? valor]);
      try {
        const r = await apiClient.post<RespuestaBot>("/chatbot/mensaje", {
          estado: respuesta?.estado,
          texto: valor,
        });
        agregar("bot", r.mensajes);
        setRespuesta(r);
        setMarcadas(new Set());
      } catch (err) {
        agregar("bot", [
          err instanceof ApiError && err.status < 500
            ? err.message
            : "Ups, tuve un problema de conexión 😕 Intenta de nuevo en un momento.",
        ]);
      } finally {
        setCargando(false);
      }
    },
    [agregar, respuesta],
  );

  // Saludo inicial (sin estado = conversación nueva). El ref evita el doble
  // disparo de StrictMode en desarrollo.
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void enviar(undefined);
  }, [enviar]);

  useEffect(() => {
    fondoRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [burbujas, cargando, respuesta]);

  const enviarTexto = () => {
    const t = texto.trim();
    if (!t || cargando) return;
    setTexto("");
    void enviar(t);
  };

  const alternar = (valor: string) =>
    setMarcadas((prev) => {
      const next = new Set(prev);
      if (next.has(valor)) next.delete(valor);
      else next.add(valor);
      return next;
    });

  const enviarMarcadas = () => {
    const ordenadas = [...marcadas].sort((a, b) => Number(a) - Number(b));
    const etiquetas = (respuesta?.opciones ?? []).filter((o) => marcadas.has(o.valor)).map((o) => o.etiqueta);
    void enviar(ordenadas.length ? ordenadas.join(",") : "0", etiquetas.length ? etiquetas.join(", ") : "Ninguno");
  };

  const opciones = respuesta?.opciones ?? [];
  const multi = respuesta?.multi === true;

  return (
    <Flex direction="column" h="100dvh" bg="bg.canvas">
      <Flex direction="column" maxW="480px" w="full" mx="auto" h="full" position="relative">
        <Flex align="center" gap={3} px={4} py={2} borderBottom="1px solid" borderColor="border.subtle">
          <img
            src={logoDannyTacos}
            alt="Danny Tacos"
            style={{ height: "44px", width: "44px", borderRadius: "9999px", objectFit: "cover" }}
          />
          <Box>
            <Text fontFamily="heading" letterSpacing="wide" color="white" lineHeight="1.1">
              DANNY TACOS
            </Text>
            <Text fontSize="xs" color="text.secondary">
              Asistente de pedidos · 24/7
            </Text>
          </Box>
        </Flex>

        <Flex direction="column" flex="1" overflowY="auto" px={4} py={4} gap={2}>
          {burbujas.map((b) => (
            <Flex key={b.id} justify={b.de === "yo" ? "flex-end" : "flex-start"}>
              <Box
                maxW="85%"
                px={3}
                py={2}
                borderRadius="16px"
                borderBottomRightRadius={b.de === "yo" ? "4px" : "16px"}
                borderBottomLeftRadius={b.de === "bot" ? "4px" : "16px"}
                bg={b.de === "yo" ? "accent.500" : "bg.surface"}
                color={b.de === "yo" ? "black" : "white"}
                border={b.de === "bot" ? "1px solid" : undefined}
                borderColor="border.subtle"
                fontSize="sm"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
              >
                {b.texto}
              </Box>
            </Flex>
          ))}
          {cargando && (
            <Text fontSize="xs" color="text.secondary" px={1}>
              Escribiendo…
            </Text>
          )}
          <div ref={fondoRef} />
        </Flex>

        <Box borderTop="1px solid" borderColor="border.subtle" bg="bg.canvas" px={4} pt={3} pb={3}>
          {opciones.length > 0 && !cargando && (
            <Flex direction="column" gap={2} mb={3} maxH="40dvh" overflowY="auto">
              {multi && (
                <Text fontSize="xs" color="text.secondary">
                  Toca para marcar varias y luego pulsa «Listo».
                </Text>
              )}
              {opciones
                .filter((o) => !(multi && o.valor === "0"))
                .map((o) => {
                  const activa = multi && marcadas.has(o.valor);
                  return (
                    <Button
                      key={o.valor}
                      size="sm"
                      justifyContent="flex-start"
                      textAlign="left"
                      whiteSpace="normal"
                      h="auto"
                      py={2}
                      variant="outline"
                      borderColor={activa ? "accent.500" : "border.subtle"}
                      bg={activa ? "accent.500" : "bg.surface"}
                      color={activa ? "black" : "white"}
                      onClick={() => (multi ? alternar(o.valor) : void enviar(o.valor, o.etiqueta))}
                    >
                      {activa ? "✓ " : ""}
                      {o.etiqueta}
                    </Button>
                  );
                })}
              {multi && (
                <Button size="sm" bg="sky.500" color="black" _hover={{ bg: "sky.400" }} onClick={enviarMarcadas}>
                  {marcadas.size ? `Listo (${marcadas.size})` : "Listo / ninguno"}
                </Button>
              )}
            </Flex>
          )}

          <Flex gap={2}>
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarTexto()}
              placeholder={PLACEHOLDER[respuesta?.entrada ?? "texto"]}
              inputMode={respuesta?.entrada === "telefono" ? "tel" : respuesta?.entrada === "numero" ? "numeric" : "text"}
              bg="bg.surface"
              borderColor="border.subtle"
              disabled={cargando}
              maxLength={300}
            />
            <Button aria-label="Enviar" bg="accent.500" color="black" onClick={enviarTexto} disabled={cargando || !texto.trim()}>
              <FiSend />
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
}
