const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** Convierte una imagen_url relativa (ej. "/images/platos/taco-birria.png",
 * servida por el backend) en una URL absoluta usable en <img src>. */
export function resolveImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BASE_URL}${path}`;
}
