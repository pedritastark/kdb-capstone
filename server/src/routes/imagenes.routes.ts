import express, { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, ApiError } from "../middleware/errorHandler";

export const imagenesRouter = Router();

const MAX_BYTES = 3 * 1024 * 1024;

/** Detecta el formato por los primeros bytes; no se confía en el Content-Type del cliente. */
function detectarMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

// Sube una foto (cuerpo binario, Content-Type image/*). Devuelve la ruta para
// guardar en imagen_url. Solo personal autenticado.
imagenesRouter.post(
  "/",
  requireAuth,
  express.raw({ type: "image/*", limit: MAX_BYTES }),
  asyncHandler(async (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      throw new ApiError(400, "No se recibió ninguna imagen");
    }
    const mime = detectarMime(buf);
    if (!mime) throw new ApiError(400, "Formato no soportado: usa JPG, PNG o WebP");

    const { rows } = await pool.query<{ id_imagen: string }>(
      `INSERT INTO imagenes (mime, datos, bytes, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id_imagen`,
      [mime, buf, buf.length, req.usuario?.id_usuario ?? null],
    );
    res.status(201).json({ url: `/api/imagenes/${rows[0].id_imagen}` });
  }),
);

// Pública: la usan la landing, /chat y /toma-orden.
imagenesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new ApiError(404, "Imagen no encontrada");

    const { rows } = await pool.query<{ mime: string; datos: Buffer }>(
      `SELECT mime, datos FROM imagenes WHERE id_imagen = $1`,
      [id.data],
    );
    if (!rows[0]) throw new ApiError(404, "Imagen no encontrada");

    res.set({
      "Content-Type": rows[0].mime,
      // Una fila nunca cambia (cambiar la foto crea otra), así que se cachea "para siempre".
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });
    res.send(rows[0].datos);
  }),
);
