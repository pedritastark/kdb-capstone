-- Danny Tacos — Orden de las categorías en el menú
--
-- Antes se ordenaban por nombre (alfabético). Con `orden` el menú (landing,
-- /chat, /toma-orden y panel) las muestra en el orden que defina el negocio;
-- a igual orden, por nombre. Las categorías existentes quedan en 100 (al final)
-- hasta que se les asigne uno.

ALTER TABLE categorias
  ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 100;
