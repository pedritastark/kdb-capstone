import { useState, type ReactNode } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { FiClock, FiMapPin, FiMessageCircle, FiNavigation, FiPhone } from "react-icons/fi";
import { NEGOCIO, soloDigitos, urlComoLlegar, urlMapaEmbed } from "../config/negocio";
import { useCarritoLanding } from "../hooks/useCarritoLanding";
import { itemsParaApi, mensajeWhatsApp, urlWhatsAppConPedido } from "../lib/carrito";
import { formatoMoneda } from "../utils/format";
import { NavbarLanding } from "../components/Landing/NavbarLanding";
import { MenuSeccion } from "../components/Landing/MenuSeccion";
import { CarritoDrawer } from "../components/Landing/CarritoDrawer";
import logoDannyTacos from "../assets/images/logo-danny-tacos.jpg";

// Verde de WhatsApp algo más oscuro que el oficial (#25D366): con texto blanco el oficial
// da solo 2.0:1 de contraste; este da 5.0:1.
const VERDE_WHATSAPP = "#15803d";

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
  { n: "1", titulo: "Arma tu pedido", texto: "Elige del menú, quita ingredientes o agrega extras y cambia cantidades." },
  { n: "2", titulo: "Haz la orden", texto: "Te llevamos a WhatsApp con tu pedido ya escrito: solo faltan tus datos." },
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
    boxShadow: "0 10px 30px rgba(21, 128, 61, 0.30)",
    transition: "transform 0.15s, box-shadow 0.15s",
    _hover: { transform: "translateY(-2px)", boxShadow: "0 14px 34px rgba(21, 128, 61, 0.42)" },
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
    <Box as="section" id={id} scrollMarginTop="64px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 20 }} maxW="1100px" mx="auto" w="full">
      <Text fontFamily="heading" letterSpacing="wide" color="text.primary" fontSize={{ base: "3xl", md: "4xl" }} textAlign="center">
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
        <Text fontWeight="700" color="text.primary" fontSize="sm" mb={0.5}>
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
  const navigate = useNavigate();
  const carrito = useCarritoLanding();
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const verMenu = () => {
    setCarritoAbierto(false);
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  // "Hacer orden": con WhatsApp configurado se abre con el pedido ya escrito;
  // si no, se sigue en el chat web con el carrito precargado (el bot solo pide
  // lo que falta: teléfono, nombre, entrega, dirección y pago).
  const hacerOrden = () => {
    if (!carrito.lineas.length) return;
    if (NEGOCIO.whatsappUrl) {
      window.open(urlWhatsAppConPedido(NEGOCIO.whatsappUrl, mensajeWhatsApp(carrito.lineas)), "_blank", "noopener,noreferrer");
      return;
    }
    navigate("/chat", { state: { pedido: itemsParaApi(carrito.lineas) } });
  };

  return (
    <Box bg="bg.canvas" minH="100dvh">
      <NavbarLanding cantidadCarrito={carrito.cantidad} onAbrirCarrito={() => setCarritoAbierto(true)} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <Box as="header" id="inicio" position="relative" minH={{ base: "84dvh", md: "88dvh" }} overflow="hidden">
        <img
          src="/landing/taco-birria.jpg"
          alt="Tacos de birria con queso gratinado y consomé"
          fetchPriority="high"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, rgba(251,247,241,0.80) 0%, rgba(251,247,241,0.88) 55%, #fbf7f1 100%)"
        />
        <Flex
          position="relative"
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          minH={{ base: "84dvh", md: "88dvh" }}
          px={6}
          py={12}
          maxW="820px"
          mx="auto"
        >
          <img
            src={logoDannyTacos}
            alt="Logo de Danny Tacos"
            style={{ height: "96px", width: "96px", borderRadius: "9999px", objectFit: "cover", border: "3px solid #ffffff", boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}
          />
          <Text
            as="h1"
            fontFamily="heading"
            letterSpacing="wide"
            color="text.primary"
            fontSize={{ base: "5xl", md: "7xl" }}
            lineHeight="1.02"
            mt={6}
          >
            TACOS DE BIRRIA, PASTOR Y MUCHO ANTOJO
          </Text>
          <Text color="text.secondary" fontSize={{ base: "md", md: "xl" }} mt={5} maxW="620px">
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
              border="2px solid"
              borderColor="text.primary"
              color="text.primary"
              fontWeight="700"
              fontSize="lg"
              _hover={{ bg: "rgba(28,25,23,0.06)" }}
            >
              <a href="#menu">Ver el menú</a>
            </Box>
          </Flex>
          <Text color="text.secondary" fontSize="sm" mt={5}>
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
          <Box
            asChild
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            h="52px"
            px={8}
            borderRadius="full"
            bg="accent.500"
            color="white"
            fontWeight="700"
            _hover={{ bg: "accent.600" }}
          >
            <a href="#menu">Ver el menú completo y armar mi pedido</a>
          </Box>
        </Flex>
      </Seccion>

      {/* ── Menú + carrito ─────────────────────────────────── */}
      <Box bg="bg.surface" borderY="1px solid" borderColor="border.subtle">
        <Seccion id="menu" titulo="NUESTRO MENÚ" subtitulo="Elige, personaliza y arma tu pedido. Al final lo mandamos directo a WhatsApp.">
          <MenuSeccion onAgregar={carrito.agregar} />
        </Seccion>
      </Box>

      {/* ── Cómo pedir ─────────────────────────────────────── */}
      <Box>
        <Seccion titulo="PEDIR ES FÁCIL" subtitulo="Sin apps ni llamadas: tu pedido sale de aquí listo.">
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
                  color="white"
                  fontFamily="heading"
                  fontSize="2xl"
                >
                  {p.n}
                </Flex>
                <Text color="text.primary" fontWeight="700" fontSize="lg">
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

      {/* ── Botón flotante del chatbot, encima del de WhatsApp / "Ver mi pedido" ── */}
      <Box
        asChild
        position="fixed"
        right={{ base: 4, md: 6 }}
        bottom={{ base: "88px", md: "96px" }}
        zIndex={20}
        w="60px"
        h="60px"
        borderRadius="full"
        bg="accent.500"
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 8px 24px rgba(0,0,0,0.28)"
        _hover={{ transform: "scale(1.06)", bg: "accent.600" }}
        transition="transform 0.15s, background 0.15s"
      >
        <RouterLink to="/chat" aria-label="Pedir por el chat" title="Pedir por el chat">
          <FiMessageCircle size={30} />
        </RouterLink>
      </Box>

      {/* ── Botón flotante: "Ver mi pedido" si hay productos, WhatsApp si no ── */}
      {carrito.cantidad > 0 ? (
        <Box
          as="button"
          onClick={() => setCarritoAbierto(true)}
          position="fixed"
          right={{ base: 4, md: 6 }}
          bottom={{ base: 4, md: 6 }}
          zIndex={20}
          h="60px"
          px={6}
          borderRadius="full"
          bg={VERDE_WHATSAPP}
          color="white"
          display="flex"
          alignItems="center"
          gap={3}
          fontWeight="700"
          boxShadow="0 8px 24px rgba(0,0,0,0.28)"
          _hover={{ transform: "scale(1.03)" }}
          transition="transform 0.15s"
        >
          🛒 Ver mi pedido ({carrito.cantidad}) · {formatoMoneda(carrito.total)}
        </Box>
      ) : (
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
          boxShadow="0 8px 24px rgba(0,0,0,0.28)"
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
      )}

      <CarritoDrawer
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        lineas={carrito.lineas}
        total={carrito.total}
        porWhatsApp={!!NEGOCIO.whatsappUrl}
        onCambiarCantidad={carrito.cambiarCantidad}
        onQuitar={carrito.quitar}
        onVaciar={carrito.vaciar}
        onHacerOrden={hacerOrden}
        onVerMenu={verMenu}
      />
    </Box>
  );
}
