-- Danny Tacos — Fotos subidas desde el panel
--
-- Las fotos que el personal sube (botón "Cambiar foto" al editar un producto)
-- se guardan en la propia base, no en el disco del servidor: el disco de Render
-- es efímero y se borra en cada despliegue. El frontend las reduce antes de
-- subirlas (~1000 px, JPEG), así que pesan del orden de 100–300 KB.
--
-- Se sirven en GET /api/imagenes/:id y productos.imagen_url guarda esa ruta
-- ("/api/imagenes/<uuid>"). Una fila nunca se modifica: cambiar la foto crea
-- una fila nueva, por eso la API la puede cachear como inmutable.

CREATE TABLE IF NOT EXISTS imagenes (
  id_imagen    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mime         TEXT NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  datos        BYTEA NOT NULL,
  bytes        INTEGER NOT NULL,
  id_usuario   UUID REFERENCES usuarios (id_usuario) ON DELETE SET NULL,
  fecha_subida TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Igual que el resto (ver 0012): sin políticas, la API REST pública de
-- Supabase no puede leer ni escribir; la API propia conecta como dueño.
ALTER TABLE imagenes ENABLE ROW LEVEL SECURITY;
