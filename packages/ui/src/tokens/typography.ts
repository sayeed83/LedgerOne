// Type scale values are intentionally identical to Tailwind's own
// defaults — this documents the scale as an explicit design-system token
// (so every consumer points at one named source) without silently
// resizing any `text-*` utility class already in use anywhere in the app
// (freezing Authentication's approved visual output depends on this).
type FontSizeEntry = [string, { lineHeight: string }];

export const typography = {
  fontFamily: {
    sans: ["var(--font-inter)", "system-ui", "sans-serif"],
    mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }] as FontSizeEntry,
    sm: ["0.875rem", { lineHeight: "1.25rem" }] as FontSizeEntry,
    base: ["1rem", { lineHeight: "1.5rem" }] as FontSizeEntry,
    lg: ["1.125rem", { lineHeight: "1.75rem" }] as FontSizeEntry,
    xl: ["1.25rem", { lineHeight: "1.75rem" }] as FontSizeEntry,
    "2xl": ["1.5rem", { lineHeight: "2rem" }] as FontSizeEntry,
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }] as FontSizeEntry,
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

// No `as const` here (unlike the other token files) — Tailwind's `Config`
// type wants mutable arrays for `fontFamily`/`fontSize` entries, and a
// `readonly` tuple isn't assignable to it.
export type TypographyToken = typeof typography;
