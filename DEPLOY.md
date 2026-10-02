# Deploy en Render

Este repo trae `render.yaml` con los 3 recursos que necesita el sistema:
- `dannytacos-db` — Postgres administrado.
- `dannytacos-api` — el backend (`/server`), como Web Service.
- `dannytacos-frontend` — el frontend (Vite), como Static Site.

No tengo acceso a la cuenta de Render del equipo, así que estos pasos hay que
correrlos a mano desde el dashboard (una sola vez):

## 1. Crear los servicios desde el Blueprint

1. Sube este repo a GitHub (si no está ya).
2. En Render: **New → Blueprint**.
3. Selecciona el repo `kdb-capstone`. Render va a leer `render.yaml` y proponer
   crear los 3 recursos de arriba. Confirma.
4. Render generará solo `JWT_SECRET` automáticamente (`generateValue: true`) y
   conectará `DATABASE_URL` sola (`fromDatabase`). Los otros dos valores
   (`FRONTEND_ORIGIN` en la API y `VITE_API_URL` en el frontend) quedan en
   blanco a propósito — necesitan la URL del otro servicio, que Render solo
   asigna después de crearlos.

## 2. Completar las URLs cruzadas

Una vez que ambos servicios existan y tengan su URL `https://dannytacos-api-xxxx.onrender.com`
y `https://dannytacos-frontend-xxxx.onrender.com`:

1. En **dannytacos-api → Environment**, setea `FRONTEND_ORIGIN` con la URL del
   frontend (sin `/` al final).
2. En **dannytacos-frontend → Environment**, setea `VITE_API_URL` con la URL
   del backend (sin `/` al final).
3. Ambos servicios se re-despliegan solos al guardar el cambio de variable.

## 3. Verificar

1. `GET https://dannytacos-api-xxxx.onrender.com/api/health` → `{"ok":true}`.
2. El build (`npm run migrate`, al final de `buildCommand` — el plan free no
   soporta `preDeployCommand`) ya corrió el esquema completo
   (`migrations/0001..0010`, sin el seed) contra `dannytacos-db` — confírmalo
   viendo el log del deploy.
3. Abre el frontend, intenta iniciar sesión — sin usuarios todavía va a
   fallar porque la base está vacía (ver paso 4).

## 4. Cargar datos de ejemplo (opcional, solo una vez)

El seed (`migrations/0007_seed_data.sql`, con el catálogo real de 27 platos y
usuarios de prueba) **no se aplica automáticamente** en cada deploy — es una
decisión deliberada para no reinsertar clientes/pedidos de demo en una base
de producción real cada vez que se despliega. Para cargarlo la primera vez:

1. En **dannytacos-api → Shell** (consola integrada de Render).
2. Corre: `npm run seed`
3. Ya puedes iniciar sesión con `admin@dannytacos.com` / `danny2026` (ver el
   comentario en `migrations/0007_seed_data.sql` para los otros usuarios de
   prueba — cambia esa contraseña antes de usar esto en un entorno real).

## 5. CORS

El backend solo acepta peticiones desde `FRONTEND_ORIGIN` (configurado en el
paso 2). Si el frontend se sirve desde otro dominio (ej. un dominio propio
conectado después), hay que actualizar esa variable también.
