export const EMOJI_CATEGORIA: Record<string, string> = {
  cat1: "🌮",
  cat2: "🌯",
  cat3: "🧀",
  cat4: "🥤",
  cat5: "🍟",
};

export const COLOR_ROTACION = ["accent.500", "pink.500", "sky.500"];

export function colorPorIndice(i: number): string {
  return COLOR_ROTACION[i % COLOR_ROTACION.length];
}
