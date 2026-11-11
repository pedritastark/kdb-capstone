import { Link as RouterLink } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import logoDannyTacos from "../assets/images/logo-danny-tacos.jpg";

// Por ahora el botón lleva al chatbot web (/chat) para poder probarlo.
// Cuando el bot esté en WhatsApp, basta con definir VITE_WHATSAPP_URL
// (ej. https://wa.me/573001234567?text=Hola) y el botón abre WhatsApp.
const WHATSAPP_URL = (import.meta.env.VITE_WHATSAPP_URL as string | undefined)?.trim();

const BOTON_PROPS = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  w: "full",
  h: "64px",
  borderRadius: "full",
  bg: "#25D366",
  color: "white",
  fontWeight: "700",
  fontSize: "lg",
  boxShadow: "0 10px 30px rgba(37, 211, 102, 0.35)",
  transition: "transform 0.15s, box-shadow 0.15s",
  _hover: { transform: "translateY(-2px)", boxShadow: "0 14px 34px rgba(37, 211, 102, 0.45)" },
  _active: { transform: "scale(0.98)" },
} as const;

function BotonWhatsApp() {
  const contenido = (
    <>
      <FaWhatsapp size={32} />
      Pide por WhatsApp
    </>
  );

  if (WHATSAPP_URL) {
    return (
      <Box asChild {...BOTON_PROPS}>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          {contenido}
        </a>
      </Box>
    );
  }
  return (
    <Box asChild {...BOTON_PROPS}>
      <RouterLink to="/chat">{contenido}</RouterLink>
    </Box>
  );
}

export function LandingPage() {
  return (
    <Flex minH="100dvh" bg="bg.canvas" align="center" justify="center" px={6} py={10}>
      <Flex direction="column" align="center" textAlign="center" maxW="380px" w="full">
        <img
          src={logoDannyTacos}
          alt="Danny Tacos"
          style={{ height: "160px", width: "160px", borderRadius: "9999px", objectFit: "cover" }}
        />

        <Text fontFamily="heading" letterSpacing="wide" fontSize="3xl" color="white" mt={5}>
          DANNY TACOS
        </Text>
        <Text color="text.secondary" fontSize="md" mt={2} mb={10}>
          Haz tu pedido en un minuto, a domicilio o para recoger. 🌮
        </Text>

        <BotonWhatsApp />

        <Flex direction="column" gap={1} mt={6} color="text.secondary" fontSize="sm">
          <Text>🛵 Domicilio sin costo</Text>
          <Text>🏪 O pasa a recogerlo</Text>
          <Text>🕐 Atendemos 24/7</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
