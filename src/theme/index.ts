import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Tema CLARO fijo para Danny Tacos (fondo crema, tarjetas blancas, texto casi negro).
// No hay modo oscuro: todos los semanticTokens resuelven a un único valor.
//
// Los colores de acento (accent/success/danger/...) están elegidos para servir a la
// vez como RELLENO con texto blanco y como TEXTO sobre fondo claro, ambos con
// contraste >= 4.5:1 (WCAG AA). Por eso las pasos 400 y 500 comparten valor.

const config = defineConfig({
  globalCss: {
    "html, body": {
      bg: "#fbf7f1",
      color: "#1c1917",
      colorScheme: "light",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    "#root": {
      minHeight: "100vh",
    },
    // El placeholder por defecto de Chakra es un gris al 80% de opacidad: sobre el fondo
    // crema queda en ~4.2:1. Se fija un gris sólido (5.0:1 sobre bg.inset).
    "input::placeholder, textarea::placeholder": {
      color: "#6b645e",
      opacity: 1,
    },
    "*": {
      borderColor: "#e4dccf",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: '"Anton", "Segoe UI", sans-serif' },
        body: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      },
      colors: {
        bg: {
          canvas: { value: "#fbf7f1" },
          surface: { value: "#ffffff" },
          inset: { value: "#f6f1e9" },
        },
        border: {
          subtle: { value: "#e4dccf" },
          muted: { value: "#eee7dc" },
        },
        text: {
          primary: { value: "#1c1917" },
          secondary: { value: "#57534e" },
          tertiary: { value: "#6b645e" },
        },
        accent: {
          50: { value: "#fff3e8" },
          100: { value: "#ffe0c2" },
          400: { value: "#c2410c" },
          500: { value: "#c2410c" },
          600: { value: "#9a3412" },
          700: { value: "#7c2d12" },
        },
        pink: {
          400: { value: "#be185d" },
          500: { value: "#be185d" },
          600: { value: "#9d174d" },
        },
        sky: {
          400: { value: "#0369a1" },
          500: { value: "#0369a1" },
          600: { value: "#075985" },
        },
        success: {
          400: { value: "#047857" },
          500: { value: "#047857" },
          600: { value: "#065f46" },
        },
        info: {
          400: { value: "#1d4ed8" },
          500: { value: "#1d4ed8" },
          600: { value: "#1e40af" },
        },
        warning: {
          400: { value: "#a3470a" },
          500: { value: "#a3470a" },
          600: { value: "#92400e" },
        },
        danger: {
          400: { value: "#b91c1c" },
          500: { value: "#b91c1c" },
          600: { value: "#991b1b" },
        },
      },
      radii: {
        card: { value: "8px" },
      },
    },
    keyframes: {
      pulse: {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0.3 },
      },
    },
    semanticTokens: {
      colors: {
        "bg.canvas": { value: "{colors.bg.canvas}" },
        "bg.surface": { value: "{colors.bg.surface}" },
        "bg.inset": { value: "{colors.bg.inset}" },
        "border.subtle": { value: "{colors.border.subtle}" },
        "border.muted": { value: "{colors.border.muted}" },
        "text.primary": { value: "{colors.text.primary}" },
        "text.secondary": { value: "{colors.text.secondary}" },
        "text.tertiary": { value: "{colors.text.tertiary}" },
        "accent.solid": { value: "{colors.accent.500}" },
        "success.solid": { value: "{colors.success.500}" },
        "info.solid": { value: "{colors.info.500}" },
        "warning.solid": { value: "{colors.warning.500}" },
        "danger.solid": { value: "{colors.danger.500}" },
      },
    },
    recipes: {
      button: {
        base: {
          borderRadius: "6px",
          fontWeight: "600",
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
