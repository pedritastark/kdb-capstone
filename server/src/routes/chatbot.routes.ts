import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { procesarMensaje } from "../services/chatbot.service";

export const chatbotRouter = Router();

// Pública a propósito (igual que /toma-orden): el cliente no tiene sesión de
// staff. El estado de la conversación viaja en el body, no se guarda en el
// servidor. Sin `estado` = conversación nueva.
chatbotRouter.post(
  "/mensaje",
  asyncHandler(async (req, res) => {
    const { estado, texto } = (req.body ?? {}) as { estado?: unknown; texto?: unknown };
    res.json(await procesarMensaje(estado, texto));
  }),
);
