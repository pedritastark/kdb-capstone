import { useState, type FormEvent } from "react";
import { Box, Button, Field, Flex, Input, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena.trim()) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setError("");
    iniciarSesion(correo);
    navigate("/pedidos");
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="bg.canvas" px={4}>
      <Box
        w="380px"
        maxW="100%"
        bg="bg.surface"
        border="1px solid"
        borderColor="accent.500"
        borderRadius="card"
        p={8}
        boxShadow="0 0 40px rgba(249, 115, 22, 0.08)"
      >
        <VStack gap={1} mb={6}>
          <Text fontSize="3xl">🌮</Text>
          <Text fontSize="xl" fontWeight="800" color="text.primary">
            Danny Tacos
          </Text>
          <Text fontSize="sm" color="text.secondary">
            Panel de cocina — inicia sesión
          </Text>
        </VStack>

        <form onSubmit={handleSubmit}>
          <VStack gap={4} align="stretch">
            <Field.Root>
              <Field.Label fontSize="sm" color="text.secondary">
                Correo electrónico
              </Field.Label>
              <Input
                type="email"
                placeholder="danny@dannytacos.co"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                bg="bg.inset"
                borderColor="border.subtle"
                _focus={{ borderColor: "accent.500" }}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label fontSize="sm" color="text.secondary">
                Contraseña
              </Field.Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                bg="bg.inset"
                borderColor="border.subtle"
                _focus={{ borderColor: "accent.500" }}
              />
            </Field.Root>

            {error && (
              <Text fontSize="sm" color="danger.500">
                {error}
              </Text>
            )}

            <Button type="submit" bg="accent.500" color="white" _hover={{ bg: "accent.600" }} w="full" mt={2}>
              Ingresar
            </Button>
          </VStack>
        </form>

        <Text fontSize="xs" color="text.tertiary" mt={6} textAlign="center">
          Cualquier credencial funciona en este entorno de demostración.
        </Text>
      </Box>
    </Flex>
  );
}
