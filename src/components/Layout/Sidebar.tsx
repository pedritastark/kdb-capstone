import { Box, Flex, IconButton, Text, VStack } from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiClipboard,
  FiBook,
  FiPackage,
  FiUsers,
  FiCreditCard,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
} from "react-icons/fi";
import { useState } from "react";
import { BRAND_GRADIENT } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";

interface ItemNav {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
}

const items: ItemNav[] = [
  { to: "/pedidos", label: "Pedidos", icon: FiClipboard, color: "accent.500" },
  { to: "/menu", label: "Menú", icon: FiBook, color: "pink.500" },
  { to: "/inventario", label: "Inventario", icon: FiPackage, color: "sky.500" },
  { to: "/clientes", label: "Clientes", icon: FiUsers, color: "accent.500" },
  { to: "/pagos", label: "Pagos", icon: FiCreditCard, color: "pink.500" },
  { to: "/notificaciones", label: "Notificaciones", icon: FiBell, color: "sky.500" },
];

export function Sidebar() {
  const [colapsado, setColapsado] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    cerrarSesion();
    navigate("/login");
  };

  return (
    <Flex
      as="nav"
      direction="column"
      bg="bg.surface"
      borderRight="1px solid"
      borderColor="border.subtle"
      w={colapsado ? "72px" : "220px"}
      flexShrink={0}
      transition="width 0.2s ease"
      h="100vh"
      position="sticky"
      top={0}
    >
      <Box h="3px" bgImage={BRAND_GRADIENT} flexShrink={0} />

      <Flex justify={colapsado ? "center" : "flex-end"} px={2} pt={2}>
        <IconButton
          aria-label="Colapsar menú"
          size="sm"
          variant="ghost"
          color="text.secondary"
          onClick={() => setColapsado((v) => !v)}
        >
          {colapsado ? <FiChevronRight /> : <FiChevronLeft />}
        </IconButton>
      </Flex>

      <Flex direction="column" align="center" px={colapsado ? 0 : 4} pb={5} gap={2}>
        <Flex
          align="center"
          justify="center"
          w="52px"
          h="52px"
          borderRadius="full"
          bgImage="linear-gradient(135deg, var(--chakra-colors-pink-500), var(--chakra-colors-accent-500))"
          color="black"
          fontSize="26px"
          flexShrink={0}
        >
          🌮
        </Flex>
        {!colapsado && (
          <Box textAlign="center">
            <Text
              fontFamily="heading"
              letterSpacing="wide"
              fontSize="lg"
              lineHeight="1"
              style={{
                backgroundImage: "linear-gradient(90deg, #e6157d, #f97316, #38bdf8)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              DANNY TACOS
            </Text>
            <Text fontSize="10px" color="accent.500" fontWeight="700" letterSpacing="wider" mt={1}>
              PANEL DE COCINA
            </Text>
          </Box>
        )}
      </Flex>

      <VStack align="stretch" gap={1} px={2} pb={4}>
        {items.map(({ to, label, icon: Icon, color }) => (
          <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
            {({ isActive }) => (
              <Flex
                align="center"
                gap={3}
                px={colapsado ? 0 : 3}
                py={2.5}
                justify={colapsado ? "center" : "flex-start"}
                borderRadius="8px"
                borderLeft="3px solid"
                borderColor={isActive ? color : "transparent"}
                color={isActive ? color : "text.secondary"}
                bg={isActive ? `${color}/12` : "transparent"}
                fontWeight={isActive ? "700" : "500"}
                _hover={{ bg: "bg.inset", color: "text.primary" }}
                transition="all 0.15s ease"
              >
                <Icon size={18} />
                {!colapsado && <Text fontSize="sm">{label}</Text>}
              </Flex>
            )}
          </NavLink>
        ))}

        <Box borderTop="1px solid" borderColor="border.subtle" mt={2} pt={2}>
          <Flex
            align="center"
            gap={3}
            px={colapsado ? 0 : 3}
            py={2.5}
            justify={colapsado ? "center" : "flex-start"}
            borderRadius="8px"
            color="text.secondary"
            cursor="pointer"
            fontWeight="500"
            _hover={{ bg: "bg.inset", color: "danger.500" }}
            transition="all 0.15s ease"
            onClick={salir}
          >
            <FiLogOut size={18} />
            {!colapsado && <Text fontSize="sm">Cerrar sesión</Text>}
          </Flex>
        </Box>
      </VStack>
    </Flex>
  );
}
