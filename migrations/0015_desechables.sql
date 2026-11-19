-- Danny Tacos — Desechables por plato
--
-- Cada plato lleva un recipiente: 'pequeno', 'grande' o NULL (sin recipiente,
-- p. ej. bebidas). En los pedidos a DOMICILIO se cobra un desechable por cada
-- unidad pedida; el precio vive en la API (DESECHABLE_PEQUENO / DESECHABLE_GRANDE,
-- por defecto 500 y 1000). pedidos.costo_desechables guarda lo cobrado.

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS desechable TEXT
  CHECK (desechable IN ('pequeno', 'grande'));

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS costo_desechables NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Asignación inicial por categoría (editable después desde el panel).
-- Sin recipiente: bebidas y adiciones. Pequeño: porciones individuales.
-- Grande: todo lo demás.
UPDATE productos p SET desechable = CASE
    WHEN c.nombre ~* '^(bebidas?|adiciones?)' THEN NULL
    WHEN c.nombre ~* '^(tacos?|antojitos?|postres?|quesadillas?|perros?)' THEN 'pequeno'
    ELSE 'grande'
  END
FROM categorias c
WHERE c.id_categoria = p.id_categoria AND p.desechable IS NULL;
