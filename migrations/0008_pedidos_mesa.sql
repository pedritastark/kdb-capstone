-- Danny Tacos — Número de mesa explícito en Pedido
--
-- RF-17 pide poder registrar el número de mesa para consumo en el local.
-- Hasta ahora esto solo vivía como convención de texto libre dentro de
-- `observaciones` (p. ej. "Mesa 4"). Se agrega una columna dedicada,
-- nullable porque solo aplica cuando tipo_entrega = 'mesa'.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS numero_mesa TEXT;
