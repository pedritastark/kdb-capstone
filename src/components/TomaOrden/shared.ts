// Estilo (foto real + emoji de respaldo + color + degradado) por categoría,
// buscado por NOMBRE en vez de id_categoria — los ids son UUIDs reales de la
// base y cambian entre seeds; el nombre es estable. Si aparece una categoría
// nueva sin estilo definido, rota por la paleta en vez de caer siempre en el
// mismo genérico.
//
// La "foto" es simplemente la de un plato representativo de esa categoría
// (ya servida por el backend en /images/platos/...) — no hay una foto por
// categoría como tal en los datos, así que se reusa una existente.

export interface EstiloCategoria {
  emoji: string;
  /** La ficha de categoría (CategoriasView) no pinta la insignia de emoji
   * encima de la foto para esta categoría — igual se usa `emoji` como
   * respaldo en otros lados (chips, productos sin foto propia). */
  ocultarInsignia?: boolean;
  imagen: string | null;
  color: string;
  gradiente: string;
}

// Las que no tienen foto fija usan la de su primer producto con foto (ver
// fotoDeCategoria); si ninguno tiene, el degradado con el emoji.
const ESTILOS_POR_NOMBRE: Record<string, EstiloCategoria> = {
  "Platos mexicanos": {
    emoji: "🥑",
    ocultarInsignia: true,
    imagen: "/images/platos/guacamole.png",
    color: "pink.500",
    gradiente: "linear-gradient(135deg, #be185d, #9d174d)",
  },
  Enchiladas: {
    emoji: "🫔",
    imagen: null,
    color: "warning.500",
    gradiente: "linear-gradient(135deg, #a3470a, #8a3a08)",
  },
  Alitas: {
    emoji: "🍗",
    imagen: "/images/platos/alitas.png",
    color: "accent.500",
    gradiente: "linear-gradient(135deg, #c2410c, #9a3412)",
  },
  "Plato fuerte": {
    emoji: "🍖",
    imagen: "/images/platos/carne-asada.png",
    color: "info.500",
    gradiente: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
  Postres: {
    emoji: "🍮",
    imagen: "/images/platos/churro-loco.png",
    color: "warning.500",
    gradiente: "linear-gradient(135deg, #a3470a, #8a3a08)",
  },
  "Perros mexicanos": {
    emoji: "🌭",
    imagen: "/images/platos/perro-caliente.png",
    color: "pink.500",
    gradiente: "linear-gradient(135deg, #be185d, #9d174d)",
  },
  Tacos: {
    emoji: "🌮",
    imagen: "/images/platos/taco-birria.png",
    color: "accent.500",
    gradiente: "linear-gradient(135deg, #c2410c, #9a3412)",
  },
  Quesadillas: {
    emoji: "🧀",
    imagen: null,
    color: "warning.500",
    gradiente: "linear-gradient(135deg, #a3470a, #8a3a08)",
  },
  Combos: {
    emoji: "🍱",
    imagen: null,
    color: "info.500",
    gradiente: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
  "Especiales de la casa": {
    emoji: "⭐",
    imagen: null,
    color: "accent.500",
    gradiente: "linear-gradient(135deg, #c2410c, #9a3412)",
  },
  Burritos: {
    emoji: "🌯",
    imagen: "/images/platos/burrito.png",
    color: "pink.500",
    gradiente: "linear-gradient(135deg, #be185d, #9d174d)",
  },
  Hamburguesas: {
    emoji: "🍔",
    imagen: "/images/platos/hamburguesa.png",
    color: "info.500",
    gradiente: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
  Adiciones: {
    emoji: "🍟",
    imagen: null,
    color: "sky.500",
    gradiente: "linear-gradient(135deg, #0369a1, #075985)",
  },
  Bebidas: {
    emoji: "🥤",
    ocultarInsignia: true,
    imagen: "/images/platos/michelada-de-mango.png",
    color: "sky.500",
    gradiente: "linear-gradient(135deg, #0369a1, #075985)",
  },
};

const PALETA_RESERVA = Object.values(ESTILOS_POR_NOMBRE);

export function estiloCategoria(nombre: string | undefined, indice = 0): EstiloCategoria {
  if (nombre && ESTILOS_POR_NOMBRE[nombre]) return ESTILOS_POR_NOMBRE[nombre];
  // Categoría sin estilo propio: solo toma color y degradado de la paleta; no la
  // foto de otra categoría (saldría, p. ej., un taco en "Combos").
  return { ...PALETA_RESERVA[indice % PALETA_RESERVA.length], emoji: "🍴", imagen: null, ocultarInsignia: false };
}

/** Foto para la ficha de una categoría: la fija de su estilo o, si no tiene, la
 * del primer producto activo de esa categoría que tenga foto. */
export function fotoDeCategoria(
  estilo: EstiloCategoria,
  idCategoria: string,
  productos: { id_categoria: string; activo: boolean; imagen_url: string | null }[],
): string | null {
  if (estilo.imagen) return estilo.imagen;
  return productos.find((p) => p.id_categoria === idCategoria && p.activo && p.imagen_url)?.imagen_url ?? null;
}
