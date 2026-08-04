// LedgerOne Design System — color tokens. Single source of truth: the
// Tailwind preset (../../tailwind-preset.ts) derives its `theme.extend.colors`
// from this file, and any component needing a raw value in JS (e.g. an
// inline SVG `fill`) reads it from here instead of hardcoding a hex string.
export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  danger: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    950: "#450a0a",
  },
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    950: "#052e16",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    950: "#451a03",
  },
  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    950: "#172554",
  },
  // Dark-first neutral/surface scale — this IS the default theme (no
  // `dark:` prefix required at call sites); a `.light` ancestor class flips
  // components over to `lightSurface`/`lightInk` via the `light:` variant
  // the preset registers (see tailwind-preset.ts). `card` keeps its
  // original name (carried over from the approved Authentication surface,
  // where `bg-surface-card`/`ring-offset-surface-card` are already in use)
  // — renaming it would silently drop those classes to unstyled defaults.
  surface: {
    DEFAULT: "#0f172a",
    card: "#111827",
    sunken: "#0b1120",
    border: "#1f2937",
    borderStrong: "#334155",
  },
  ink: {
    DEFAULT: "#f8fafc",
    muted: "#94a3b8",
    faint: "#64748b",
  },
  // Light-mode counterparts — not wired into every component yet (light
  // mode is explicitly future work per the brief), but real, usable values
  // so the `light:` variant has something correct to switch to as each
  // component adopts it.
  lightSurface: {
    DEFAULT: "#f8fafc",
    card: "#ffffff",
    sunken: "#f1f5f9",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
  },
  lightInk: {
    DEFAULT: "#0f172a",
    muted: "#475569",
    faint: "#94a3b8",
  },
} as const;

export type ColorToken = typeof colors;
