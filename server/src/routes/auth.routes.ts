import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { requireAuth, signToken } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { correo, password } = loginSchema.parse(req.body);

    const { rows } = await pool.query(
      `SELECT id_usuario, nombre, correo, rol, password_hash FROM usuarios WHERE correo = $1`,
      [correo],
    );
    const usuario = rows[0];
    if (!usuario) throw new ApiError(401, "Credenciales inválidas");

    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) throw new ApiError(401, "Credenciales inválidas");

    const token = signToken({ id_usuario: usuario.id_usuario, rol: usuario.rol });
    res.json({
      token,
      usuario: { id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id_usuario, nombre, correo, rol FROM usuarios WHERE id_usuario = $1`,
      [req.usuario!.id_usuario],
    );
    const usuario = rows[0];
    if (!usuario) throw new ApiError(404, "Usuario no encontrado");
    res.json(usuario);
  }),
);
