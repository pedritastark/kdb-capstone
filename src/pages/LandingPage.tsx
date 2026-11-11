import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { FiClock, FiMapPin, FiNavigation, FiPhone } from "react-icons/fi";
import { NEGOCIO, soloDigitos, urlComoLlegar, urlMapaEmbed } from "../config/negocio";
import logoDannyTacos from "../assets/images/logo-danny-tacos.jpg";

const VERDE_WHATSAPP = "#25D366";

// Fotos servidas desde /public/landing (optimizadas, no dependen de la API).
const DESTACADOS: { img: string; nombre: string; pos?: string }[] = [
  { img: "/landing/taco-birria.jpg", nombre: "Tacos de birria", pos: "12% center" },
  { img: "/landing/taco-pastor.jpg", nombre: "Tacos al pastor" },
  { img: "/landing/taco-camaron.jpg", nombre: "Tacos de camarón" },
  { img: "/landing/mega-nachos.jpg", nombre: "Mega nachos", pos: "12% center" },
  { img: "/landing/alitas.jpg", nombre: "Alitas" },
  { img: "/landing/burrito.jpg", nombre: "Burritos" },
  { img: "/landing/churro-loco.jpg", nombre: "Churro loco" },
  { img: "/landing/michelada-de-mango.jpg", nombre: "Michelada de mango" },
];

const PASOS = [
  { n: "1", titulo: "Escríbenos", texto: "Abre el chat y dinos tu número. Si ya pediste antes, te reconocemos." },
  { n: "2", titulo: "Arma tu pedido", texto: "Elige tus tacos y antojitos, quita ingredientes o agrega extras." },
  { n: "3", titulo: "Recíbelo o recógelo", texto: "A tu puerta sin costo, o pasa por él al local. Pagas al recibir." },
];

/** Botón de WhatsApp: abre WhatsApp si hay enlace configurado; si no, el chatbot web. */
function BotonWhatsApp({ grande = false, etiqueta = "Pedir por WhatsApp" }: { grande?: boolean; etiqueta?: string }) {
  const props = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    h: grande ? "64px" : "52px",
    px: grande ? 9 : 7,
    borderRadius: "full",
    bg: VERDE_WHATSAPP,
    color: "white",
    fontWeight: "700",
    fontSize: grande ? "lg" : "md",
    boxShadow: "0 10px 30px rgba(37, 211, 102, 0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
    _hover: { transform: "translateY(-2px)", boxShadow: "0 14px 34px rgba(37, 211, 102, 0.5)" },
    _active: { transform: "scale(0.98)" },
  } as const;
  const contenido = (
    <>
      <FaWhatsapp size={grande ? 30 : 24} />
      {etiqueta}
    </>
  );
  return NEGOCIO.whatsappUrl ? (
    <Box asChild {...props}>
      <a href={NEGOCIO.whatsappUrl} target="_blank" rel="noopener noreferrer">
        {contenido}
      </a>
    </Box>
  ) : (
    <Box asChild {...props}>
      <RouterLink to="/chat">{contenido}</RouterLink>
    </Box>
  );
}

function Seccion({ id, titulo, subtitulo, children }: { id?: string; titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <Box as="section" id={id} px={{ base: 5, md: 8 }} py={{ base: 12, md: 20 }} maxW="1100px" mx="auto" w="full">
      <Text fontFamily="heading" letterSpacing="wide" color="white" fontSize={{ base: "3xl", md: "4xl" }} textAlign="center">
        {titulo}
      </Text>
      {subtitulo && (
        <Text color="text.secondary" textAlign="center" mt={2} mb={{ base: 8, md: 12 }} maxW="560px" mx="auto">
          {subtitulo}
        </Text>
      )}
      {children}
    </Box>
  );
}

function DatoContacto({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <Flex gap={4} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="16px" p={4} align="flex-start">
      <Flex
        align="center"
        justify="center"
        flexShrink={0}
        w="44px"
        h="44px"
        borderRadius="full"
        bg="bg.inset"
        color="accent.500"
        fontSize="xl"
      >
        {icono}
      </Flex>
      <Box minW={0}>
        <Text fontWeight="700" color="white" fontSize="sm" mb={0.5}>
          {titulo}
        </Text>
        <Box color="text.secondary" fontSize="sm">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

export function LandingPage() {
  const { direccion, telefono, horario } = NEGOCIO;

  return (
    <Box bg="bg.canvas" minH="100dvh">
      {/* ── Hero ───────────────────────────────────────────── */}
      <Box as="header" position="relative" minH={{ base: "88dvh", md: "92dvh" }} overflow="hidden">
        <img
          src="/landing/taco-birria.jpg"
          alt="Tacos de birria con queso gratinado y consomé"
          fetchPriority="high"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.7) 55%, #0a0a0a 100%)"
        />
        <Flex
          position="relative"
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          minH={{ base: "88dvh", md: "92dvh" }}
          px={6}
          py={12}
          maxW="820px"
          mx="auto"
        >
          <img
            src={logoDannyTacos}
            alt="Logo de Danny Tacos"
            style={{ height: "96px", width: "96px", borderRadius: "9999px", objectFit: "cover", border: "3px solid rgba(255,255,255,0.15)" }}
          />
          <Text
            as="h1"
            fontFamily="heading"
            letterSpacing="wide"
            color="white"
            fontSize={{ base: "5xl", md: "7xl" }}
            lineHeight="1.02"
            mt={6}
          >
            TACOS DE BIRRIA, PASTOR Y MUCHO ANTOJO
          </Text>
          <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "xl" }} mt={5} maxW="620px">
            Antojitos mexicanos hechos al momento. Pide en un minuto: domicilio sin costo y sin pedido mínimo, o pasa a
            recogerlo.
          </Text>
          <Flex direction={{ base: "column", sm: "row" }} gap={4} mt={9} w={{ base: "full", sm: "auto" }}>
            <BotonWhatsApp grande />
            <Box
              asChild
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              h="64px"
              px={9}
              borderRadius="full"
              border="2px solid rgba(255,255,255,0.5)"
              color="white"
              fontWeight="700"
              fontSize="lg"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              <a href="#destacados">Ver platos</a>
            </Box>
          </Flex>
          <Text color="whiteAlpha.800" fontSize="sm" mt={5}>
            🕐 Nuestro asistente recibe tu pedido a cualquier hora
          </Text>
        </Flex>
      </Box>

      {/* ── Platos estrella ────────────────────────────────── */}
      <Seccion id="destacados" titulo="NUESTROS FAVORITOS" subtitulo="Lo que más se pide en Danny Tacos. Todo se prepara al momento.">
        <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={{ base: 3, md: 5 }}>
          {DESTACADOS.map((d) => (
            <Box key={d.nombre} position="relative" borderRadius="20px" overflow="hidden" aspectRatio="4 / 5" bg="bg.surface">
              <img
                src={d.img}
                alt={d.nombre}
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: d.pos ?? "center" }}
              />
              <Box position="absolute" inset={0} bg="linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.85) 100%)" />
              <Text
                position="absolute"
                left={4}
                right={4}
                bottom={3}
                fontFamily="heading"
                letterSpacing="wide"
                color="white"
                fontSize={{ base: "lg", md: "xl" }}
                lineHeight="1.1"
              >
                {d.nombre.toUpperCase()}
              </Text>
            </Box>
          ))}
        </Grid>
        <Flex justify="center" mt={10}>
          <BotonWhatsApp etiqueta="Pedir ahora" />
        </Flex>
      </Seccion>

      {/* ── Cómo pedir ─────────────────────────────────────── */}
      <Box bg="bg.surface" borderY="1px solid" borderColor="border.subtle">
        <Seccion titulo="PEDIR ES FÁCIL" subtitulo="Sin apps ni llamadas: todo por chat.">
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={5}>
            {PASOS.map((p) => (
              <Flex key={p.n} direction="column" align="center" textAlign="center" gap={2} px={2}>
                <Flex
                  align="center"
                  justify="center"
                  w="52px"
                  h="52px"
                  borderRadius="full"
                  bg="accent.500"
                  color="black"
                  fontFamily="heading"
                  fontSize="2xl"
                >
                  {p.n}
                </Flex>
                <Text color="white" fontWeight="700" fontSize="lg">
                  {p.titulo}
                </Text>
                <Text color="text.secondary" fontSize="sm" maxW="300px">
                  {p.texto}
                </Text>
              </Flex>
            ))}
          </Grid>
        </Seccion>
      </Box>

      {/* ── Info del local ─────────────────────────────────── */}
      <Seccion id="contacto" titulo="VISÍTANOS" subtitulo="Danny Tacos: tacos y antojitos mexicanos, para comer en casa o pasar por ellos.">
        <Grid templateColumns={{ base: "1fr", md: direccion ? "1fr 1.2fr" : "1fr" }} gap={6} maxW={direccion ? undefined : "560px"} mx="auto">
          <Flex direction="column" gap={3}>
            {direccion && (
              <DatoContacto icono={<FiMapPin />} titulo="Dirección">
                <Text>{direccion}</Text>
                <Box asChild color="accent.500" fontWeight="600" display="inline-flex" alignItems="center" gap={1} mt={1}>
                  <a href={urlComoLlegar(direccion)} target="_blank" rel="noopener noreferrer">
                    <FiNavigation size={14} /> Cómo llegar
                  </a>
                </Box>
              </DatoContacto>
            )}
            {horario && (
              <DatoContacto icono={<FiClock />} titulo="Horario">
                <Text whiteSpace="pre-line">{horario}</Text>
              </DatoContacto>
            )}
            <DatoContacto icono={<FaWhatsapp />} titulo="Pedidos y contacto">
              <Text>Escríbenos por WhatsApp a cualquier hora: nuestro asistente toma tu pedido.</Text>
              {telefono && (
                <Box asChild color="accent.500" fontWeight="600" display="inline-flex" alignItems="center" gap={1} mt={1}>
                  <a href={`tel:${soloDigitos(telefono)}`}>
                    <FiPhone size={14} /> Llamar al {telefono}
                  </a>
                </Box>
              )}
            </DatoContacto>
            <DatoContacto icono="🛵" titulo="Domicilio">
              <Text>Sin costo y sin pedido mínimo. También puedes recoger en el local.</Text>
            </DatoContacto>
          </Flex>

          {direccion && (
            <Box borderRadius="20px" overflow="hidden" border="1px solid" borderColor="border.subtle" minH={{ base: "280px", md: "100%" }}>
              <iframe
                title={`Mapa de ${NEGOCIO.nombre}`}
                src={urlMapaEmbed(direccion)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0, width: "100%", height: "100%", minHeight: "280px" }}
                allowFullScreen
              />
            </Box>
          )}
        </Grid>
      </Seccion>

      {/* ── Footer ─────────────────────────────────────────── */}
      <Box as="footer" borderTop="1px solid" borderColor="border.subtle" py={8} textAlign="center">
        <Text color="text.tertiary" fontSize="sm">
          © {new Date().getFullYear()} {NEGOCIO.nombre} · Tacos y antojitos mexicanos
        </Text>
        <Box asChild color="text.tertiary" fontSize="xs" mt={1} display="inline-block" _hover={{ color: "text.secondary" }}>
          <RouterLink to="/login">Acceso del personal</RouterLink>
        </Box>
      </Box>

      {/* ── WhatsApp flotante (siempre visible) ────────────── */}
      <Box
        asChild
        position="fixed"
        right={{ base: 4, md: 6 }}
        bottom={{ base: 4, md: 6 }}
        zIndex={20}
        w="60px"
        h="60px"
        borderRadius="full"
        bg={VERDE_WHATSAPP}
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 8px 24px rgba(0,0,0,0.45)"
        _hover={{ transform: "scale(1.06)" }}
        transition="transform 0.15s"
      >
        {NEGOCIO.whatsappUrl ? (
          <a href={NEGOCIO.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Pedir por WhatsApp">
            <FaWhatsapp size={34} />
          </a>
        ) : (
          <RouterLink to="/chat" aria-label="Pedir por WhatsApp">
            <FaWhatsapp size={34} />
          </RouterLink>
        )}
      </Box>
    </Box>
  );
}
