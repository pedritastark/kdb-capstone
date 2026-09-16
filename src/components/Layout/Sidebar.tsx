import { Flex, IconButton, Text, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import {
  FiClipboard,
  FiBook,
  FiUsers,
  FiCreditCard,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useState } from "react";

interface ItemNav {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const items: ItemNav[] = [
  { to: "/pedidos", label: "Pedidos", icon: FiClipboard },
  { to: "/menu", label: "Menú", icon: FiBook },
  { to: "/clientes", label: "Clientes", icon: FiUsers },
  { to: "/pagos", label: "Pagos", icon: FiCreditCard },
  { to: "/notificaciones", label: "Notificaciones", icon: FiBell },
];

export function Sidebar() {
  const [colapsado, setColapsado] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

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
      py={4}
    >
      <Flex align="center" justify={colapsado ? "center" : "space-between"} px={colapsado ? 0 : 4} mb={6}>
        {!colapsado && (
          <Text fontWeight="800" fontSize="lg" color="accent.500">
            🌮 Danny Tacos
          </Text>
        )}
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

      <VStack align="stretch" gap={1} px={2}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} style={{ textDecoration: "none" }}>
            {({ isActive }) => (
              <Flex
                align="center"
                gap={3}
                px={colapsado ? 0 : 3}
                py={2.5}
                justify={colapsado ? "center" : "flex-start"}
                borderRadius="8px"
                color={isActive ? "accent.500" : "text.secondary"}
                bg={isActive ? "bg.inset" : "transparent"}
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
      </VStack>
    </Flex>
  );
}
