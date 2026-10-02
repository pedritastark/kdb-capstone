import cors from "cors";
import express from "express";
import path from "node:path";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { categoriasRouter } from "./routes/categorias.routes";
import { clientesRouter } from "./routes/clientes.routes";
import { inventarioRouter } from "./routes/inventario.routes";
import { notificacionesRouter } from "./routes/notificaciones.routes";
import { pagosRouter } from "./routes/pagos.routes";
import { pedidosRouter } from "./routes/pedidos.routes";
import { opcionesRouter, productosRouter } from "./routes/productos.routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    }),
  );
  app.use(express.json());

  // Fotos de platos/ingredientes (server/public/images/...), públicas: las
  // usan tanto el panel admin como /toma-orden. process.cwd() en vez de
  // __dirname porque este archivo se compila a dist/src/app.js y __dirname
  // cambiaría de nivel; npm run dev/start siempre corren con cwd = server/.
  app.use("/images", express.static(path.join(process.cwd(), "public", "images")));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);

  // Cada router declara su propio requireAuth/optionalAuth por ruta:
  // GET de categorías/productos y POST de pedidos son públicos a propósito
  // (los usa /toma-orden, que no tiene sesión de staff); todo lo demás
  // requiere estar autenticado.
  app.use("/api/categorias", categoriasRouter);
  app.use("/api/productos", productosRouter);
  app.use("/api/opciones", opcionesRouter);
  app.use("/api/clientes", clientesRouter);
  app.use("/api/ingredientes", inventarioRouter);
  app.use("/api/pedidos", pedidosRouter);
  app.use("/api/pagos", pagosRouter);
  app.use("/api/notificaciones", notificacionesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
