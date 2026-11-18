# Deploy: Render (API + frontend) y Supabase (base de datos)

- **Base de datos** — Postgres en **Supabase**. No vive en Render.
- `dannytacos-api` — el backend (`/server`), Web Service en Render.
- `dannytacos-frontend` — el frontend (Vite), Static Site en Render.

`render.yaml` describe los dos servicios de Render (no declara ninguna base).

## 1. Base de datos en Supabase (una sola vez)

1. Crea el proyecto en Supabase y guarda la contraseña de la base.
2. Crea el esquema y carga el catálogo. Opciones:
   - **SQL Editor** de Supabase: pega `supabase/setup.sql` y ejecútalo (base vacía).
     Se regenera con `cd server && npm run bundle-sql`.
   - o desde tu máquina: `DATABASE_URL=<cadena> npm run migrate` y luego `npm run seed`
     (en `server/`).
3. El esquema activa **RLS en todas las tablas** (`migrations/0012_enable_rls.sql`).
   Es necesario: Supabase expone `public` por una API REST pública (clave `anon`),
   y sin RLS cualquiera podría leer `usuarios` (hashes de contraseña) o modificar
   pedidos. La API propia conecta como dueño de las tablas y se salta RLS.
   Si creas una tabla nueva, actívale RLS a mano.
4. **Cambia las contraseñas del seed** (`danny2026` para admin/cocina/caja) antes de
   usarlo en serio: están en el repo.

### Cadena de conexión (`DATABASE_URL`)

Usa la del **Session pooler** (Supabase → **Connect → Session pooler**), con usuario
`postgres.<ref-del-proyecto>`. **No uses la conexión directa**: en el plan gratuito es
solo IPv6 y Render es IPv4, así que la API no conectaría.

## 2. Crear los servicios en Render

1. Render: **New → Blueprint** (o la herramienta MCP `create_blueprint`) y elige este repo.
2. Render generará solo `JWT_SECRET` (`generateValue: true`). Las variables `sync: false`
   se piden/rellenan a mano:

| Servicio | Variable | Valor |
| --- | --- | --- |
| API | `DATABASE_URL` | cadena del Session pooler de Supabase |
| API | `FRONTEND_ORIGIN` | URL del frontend, sin `/` final |
| API | `LOCAL_DIRECCION` | dirección del local que dice el chatbot a quien recoge |
| Frontend | `VITE_API_URL` | URL de la API, sin `/` final |
| Frontend | `VITE_LOCAL_DIRECCION`, `VITE_TELEFONO`, `VITE_HORARIO` | datos de la landing (opcionales; lo vacío no se muestra) |
| Frontend | `VITE_WHATSAPP_URL` | ej. `https://wa.me/57300…`; vacío = el botón lleva al chat web |

`FRONTEND_ORIGIN` y `VITE_API_URL` dependen de la URL del otro servicio, que Render solo
asigna al crearlos: se completan después y ambos servicios se redespliegan solos.

## 3. Verificar

1. `GET <url-api>/api/health` → `{"ok":true}`.
2. El build de la API corre `npm run migrate` (el plan free no soporta
   `preDeployCommand`). Es idempotente: con la base ya creada solo imprime
   "ya aplicada" por cada migración.
3. Abre el frontend: la landing carga el menú; `/chat` y `/login` funcionan al recargar
   (el Static Site reescribe `/*` a `/index.html`).

## 4. CORS

El backend solo acepta peticiones desde `FRONTEND_ORIGIN`. Si el frontend se sirve desde
otro dominio, actualiza esa variable también.

## Plan gratuito de Render

El Web Service se duerme tras 15 min sin tráfico: la primera petición tarda unos segundos
(la landing lo avisa con "Cargando el menú…"). Las horas gratuitas son por workspace.
