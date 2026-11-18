import { leerToken } from "./authToken";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** Convierte una imagen_url relativa (ej. "/images/platos/taco-birria.png",
 * servida por el backend) en una URL absoluta usable en <img src>. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path}`;
}

const LADO_MAX = 1000;
const CALIDAD_JPEG = 0.85;

/** Reduce la foto a máx. 1000 px por lado y la pasa a JPEG (una foto de celular
 * de 4–8 MB queda en ~150 KB). Así se sube rápido y la base no crece de más. */
async function reducirImagen(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo).catch(() => {
    throw new Error("No se pudo leer la imagen. Prueba con una foto JPG o PNG.");
  });
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen");
  // Fondo blanco: un PNG con transparencia quedaría negro al pasar a JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", CALIDAD_JPEG),
  );
}

/** Reduce y sube una foto; devuelve la ruta para guardar en imagen_url. */
export async function subirImagen(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen");
  const blob = await reducirImagen(archivo);
  const token = leerToken();
  const res = await fetch(`${BASE_URL}/api/imagenes`, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: blob,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "No se pudo subir la foto");
  return body.url as string;
}
