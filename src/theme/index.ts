import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Tema oscuro fijo tipo KDS (Kitchen Display System) para Danny Tacos.
// No se usa modo claro: todos los semanticTokens resuelven a un único valor.

const config = defineConfig({
  globalCss: {
    "html, body": {
      bg: "#0a0a0a",
      color: "#ffffff",
      colorScheme: "dark",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    "#root": {
      minHeight: "100vh",
    },
    "*": {
      borderColor: "#333333",
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
          canvas: { value: "#0a0a0a" },
          surface: { value: "#1a1a1a" },
          inset: { value: "#262626" },
        },
        border: {
          subtle: { value: "#333333" },
          muted: { value: "#2a2a2a" },
        },
        text: {
          primary: { value: "#ffffff" },
          secondary: { value: "#a0a0a0" },
          tertiary: { value: "#888888" },
        },
        accent: {
          50: { value: "#fff3e8" },
          100: { value: "#ffe0c2" },
          400: { value: "#fb923c" },
          500: { value: "#f97316" },
          600: { value: "#ea580c" },
          700: { value: "#c2410c" },
        },
        success: {
          400: { value: "#34d399" },
          500: { value: "#10b981" },
          600: { value: "#059669" },
        },
        info: {
          400: { value: "#3b82f6" },
          500: { value: "#2563eb" },
          600: { value: "#1d4ed8" },
        },
        warning: {
          400: { value: "#fbbf24" },
          500: { value: "#f59e0b" },
          600: { value: "#d97706" },
        },
        danger: {
          400: { value: "#f87171" },
          500: { value: "#ef4444" },
          600: { value: "#dc2626" },
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
