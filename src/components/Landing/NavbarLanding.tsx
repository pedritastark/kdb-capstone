import { Link as RouterLink } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { FiShoppingCart, FiUser } from "react-icons/fi";
import logoDannyTacos from "../../assets/images/logo-danny-tacos.jpg";

interface NavbarLandingProps {
  cantidadCarrito: number;
  onAbrirCarrito: () => void;
}

const LINK_PROPS = {
  color: "whiteAlpha.900",
  fontWeight: "600",
  fontSize: "sm",
  px: 3,
  py: 2,
  borderRadius: "full",
  _hover: { bg: "whiteAlpha.200" },
} as const;

export function NavbarLanding({ cantidadCarrito, onAbrirCarrito }: NavbarLandingProps) {
  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={30}
      bg="rgba(10,10,10,0.82)"
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Flex align="center" justify="space-between" maxW="1100px" mx="auto" h="64px" px={{ base: 4, md: 8 }} gap={3}>
        <Box asChild>
          <a href="#inicio" aria-label="Danny Tacos, inicio">
            <Flex align="center" gap={3}>
              <img
                src={logoDannyTacos}
                alt=""
                style={{ height: "40px", width: "40px", borderRadius: "9999px", objectFit: "cover" }}
              />
              <Text fontFamily="heading" letterSpacing="wide" color="white" fontSize="lg" display={{ base: "none", sm: "block" }}>
                DANNY TACOS
              </Text>
            </Flex>
          </a>
        </Box>

        <Flex display={{ base: "none", md: "flex" }} gap={1}>
          <Box asChild {...LINK_PROPS}>
            <a href="#menu">Menú</a>
          </Box>
          <Box asChild {...LINK_PROPS}>
            <a href="#contacto">Visítanos</a>
          </Box>
        </Flex>

        <Flex align="center" gap={2}>
          <Box
            asChild
            display="inline-flex"
            alignItems="center"
            gap={2}
            h="40px"
            px={4}
            borderRadius="full"
            border="1px solid"
            borderColor="whiteAlpha.400"
            color="white"
            fontWeight="600"
            fontSize="sm"
            _hover={{ bg: "whiteAlpha.200" }}
          >
            <RouterLink to="/login">
              <FiUser />
              Ingresar
            </RouterLink>
          </Box>

          <Box
            as="button"
            aria-label={`Ver mi pedido, ${cantidadCarrito} productos`}
            onClick={onAbrirCarrito}
            position="relative"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="44px"
            h="40px"
            borderRadius="full"
            bg="accent.500"
            color="black"
            fontSize="lg"
            _hover={{ bg: "accent.400" }}
          >
            <FiShoppingCart />
            {cantidadCarrito > 0 && (
              <Flex
                position="absolute"
                top="-6px"
                right="-6px"
                minW="20px"
                h="20px"
                px={1}
                align="center"
                justify="center"
                borderRadius="full"
                bg="white"
                color="black"
                fontSize="11px"
                fontWeight="800"
              >
                {cantidadCarrito}
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
