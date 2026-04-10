export const darkColors = {
  background: "#0A0A0F",
  surface: "#16161E",
  surfaceLight: "#1E1E2A",
  primary: "#E50914",
  primaryLight: "#FF2D38",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0B0",
  border: "#2A2A3A",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export const lightColors = {
  background: "#F2F2F5",
  surface: "#FFFFFF",
  surfaceLight: "#F7F7FA",
  primary: "#E50914",
  primaryLight: "#FF2D38",
  textPrimary: "#0A0A0F",
  textSecondary: "#6B6B7B",
  border: "#E0E0E6",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
} as const;

export type ThemePalette = { [K in keyof typeof darkColors]: string };
