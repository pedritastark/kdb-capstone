// Datos públicos del negocio que muestra la landing. Se configuran por
// variables de entorno (se incrustan al compilar, ver .env.example) para
// poder actualizarlos sin tocar código. Lo que quede vacío NO se muestra.
const env = import.meta.env;
const leer = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export const NEGOCIO = {
  nombre: "Danny Tacos",
  /** Dirección exacta del local; también alimenta el mapa. */
  direccion: leer(env.VITE_LOCAL_DIRECCION),
  /** Teléfono para llamadas (se muestra tal cual y se usa en el enlace tel:). */
  telefono: leer(env.VITE_TELEFONO),
  /** Texto libre, ej. "Lun a Dom · 12:00 pm – 11:00 pm". */
  horario: leer(env.VITE_HORARIO),
  /** Enlace completo de WhatsApp (ej. https://wa.me/573001234567?text=Hola).
   *  Si está vacío, los botones llevan al chatbot web (/chat). */
  whatsappUrl: leer(env.VITE_WHATSAPP_URL),
};

export const soloDigitos = (s: string) => s.replace(/[^\d+]/g, "");

export const urlMapaEmbed = (direccion: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;

export const urlComoLlegar = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
