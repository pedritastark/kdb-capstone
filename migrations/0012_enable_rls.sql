-- Danny Tacos — Row Level Security en todas las tablas
--
-- Supabase expone el esquema "public" por una API REST pública (PostgREST)
-- que se autentica con la clave "anon", que NO es secreta. Sin RLS, esa API
-- dejaría leer/modificar cualquier tabla (incluidos los hashes de usuarios).
--
-- Con RLS activado y SIN políticas, la API REST no puede tocar nada. La API
-- propia (Express) no se afecta: conecta como el dueño de las tablas
-- ("postgres"), que se salta RLS.
--
-- Esta migración cubre las tablas que existen al aplicarla. Si más adelante
-- se crea una tabla nueva, hay que activarle RLS a mano:
--   ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- Defensa en profundidad (solo si existen los roles de Supabase): quitar
-- también los permisos directos de la API REST sobre las tablas.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
