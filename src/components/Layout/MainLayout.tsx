import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <Flex minH="100vh" bg="bg.canvas">
      <Sidebar />
      <Flex direction="column" flex={1} minW={0}>
        <Header />
        <Box as="main" flex={1} p={6} overflowX="hidden">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
