# Danny Tacos

Sistema de gestión para la taquería Danny Tacos: panel de cocina/caja, autopedido
en mesa (`/toma-orden`), chatbot de pedidos a domicilio y para recoger (`/chat`)
y landing con acceso por WhatsApp (`/`).

## Correr todo en local con Docker

Requiere Docker con Compose. Levanta Postgres, la API y el frontend:

```bash
docker compose up --build
```

| Qué | URL |
| --- | --- |
| Landing | http://localhost:5173 |
| Chatbot | http://localhost:5173/chat |
| Panel del personal | http://localhost:5173/login |
| API | http://localhost:3001/api/health |

Al arrancar, la API aplica las migraciones y carga los datos demo (menú y
usuarios; se desactiva con `SEED: "false"` en `docker-compose.yml`).

- Parar: `docker compose down` (conserva la base). Borrarla: `docker compose down -v`.
- Dirección del local para quien recoge: `LOCAL_DIRECCION="..." docker compose up`.
- Si cambias el código, vuelve a correr con `--build`.
- `VITE_API_URL` se incrusta al compilar el frontend; si expones la API en otra
  URL, cámbiala en `docker-compose.yml` (`web.build.args`) y reconstruye.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
