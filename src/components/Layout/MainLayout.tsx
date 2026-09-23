import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <Flex minH="100vh" bg="bg.canvas" position="relative">
      <Box
        position="fixed"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        bgImage="radial-gradient(560px circle at 0% 0%, rgba(230,21,125,0.14), transparent 60%),
                 radial-gradient(560px circle at 100% 100%, rgba(56,189,248,0.12), transparent 60%),
                 radial-gradient(480px circle at 100% 0%, rgba(249,115,22,0.10), transparent 55%)"
      />
      <Sidebar />
      <Flex direction="column" flex={1} minW={0} position="relative" zIndex={1}>
        <Header />
        <Box as="main" flex={1} p={6} overflowX="hidden">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
