import { useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { FiImage, FiUpload } from "react-icons/fi";
import { resolveImageUrl, subirImagen } from "../../lib/images";

interface FotoPickerProps {
  /** imagen_url actual ("" si no tiene foto). */
  valor: string;
  /** Recibe la nueva ruta una vez subida la foto. */
  onCambio: (url: string) => void;
  /** Avisa al formulario mientras sube, para que no deje guardar a medias. */
  onSubiendo?: (subiendo: boolean) => void;
  alt: string;
}

/** Vista previa + botón "Subir/Cambiar foto". La foto se reduce y se sube al
 * elegirla; el formulario la guarda en imagen_url al darle Guardar. */
export function FotoPicker({ valor, onCambio, onSubiendo, alt }: FotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const foto = resolveImageUrl(valor);

  const handleArchivo = async (archivo: File) => {
    setError(null);
    setSubiendo(true);
    onSubiendo?.(true);
    try {
      onCambio(await subirImagen(archivo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
      onSubiendo?.(false);
    }
  };

  return (
    <Flex gap={4} align="center">
      <Box
        w="112px"
        h="112px"
        flexShrink={0}
        borderRadius="10px"
        overflow="hidden"
        bg="bg.inset"
        border="1px solid"
        borderColor="border.subtle"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="text.tertiary"
      >
        {foto ? (
          <img src={foto} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <FiImage size={32} />
        )}
      </Box>
      <Box>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = ""; // permite volver a elegir el mismo archivo
            if (archivo) void handleArchivo(archivo);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          borderColor="border.subtle"
          onClick={() => inputRef.current?.click()}
          loading={subiendo}
          loadingText="Subiendo…"
        >
          <FiUpload /> {foto ? "Cambiar foto" : "Subir foto"}
        </Button>
        <Text fontSize="xs" color="text.tertiary" mt={2}>
          JPG, PNG o WebP. Queda guardada al darle Guardar.
        </Text>
        {error && (
          <Text fontSize="xs" color="danger.500" mt={1}>
            {error}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
