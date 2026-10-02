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

const ESTILOS_POR_NOMBRE: Record<string, EstiloCategoria> = {
  Tacos: {
    emoji: "🌮",
    imagen: "/images/platos/taco-birria.png",
    color: "accent.500",
    gradiente: "linear-gradient(135deg, #fb923c, #ea580c)",
  },
  "Antojitos para Compartir": {
    emoji: "🧀",
    ocultarInsignia: true,
    imagen: "/images/platos/guacamole.png",
    color: "pink.500",
    gradiente: "linear-gradient(135deg, #f472b6, #be185d)",
  },
  "Platos Fuertes": {
    emoji: "🍖",
    imagen: "/images/platos/hamburguesa.png",
    color: "info.500",
    gradiente: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
  },
  Bebidas: {
    emoji: "🥤",
    ocultarInsignia: true,
    imagen: "/images/platos/michelada-de-mango.png",
    color: "sky.500",
    gradiente: "linear-gradient(135deg, #7dd3fc, #0ea5e9)",
  },
  Postres: {
    emoji: "🍮",
    imagen: "/images/platos/churro-loco.png",
    color: "warning.500",
    gradiente: "linear-gradient(135deg, #fbbf24, #d97706)",
  },
};

const PALETA_RESERVA = Object.values(ESTILOS_POR_NOMBRE);

export function estiloCategoria(nombre: string | undefined, indice = 0): EstiloCategoria {
  if (nombre && ESTILOS_POR_NOMBRE[nombre]) return ESTILOS_POR_NOMBRE[nombre];
  return PALETA_RESERVA[indice % PALETA_RESERVA.length];
}
