-- Danny Tacos — Foto por ingrediente
--
-- Mismo criterio que productos.imagen_url: una ruta relativa servida por el
-- propio backend (ver server/public/images/, montado en /images por Express).

ALTER TABLE ingredientes
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;
