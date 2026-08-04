// Matches Tailwind's default `rounded-*` scale exactly — documented here
// as a named token rather than overridden, for the same freeze-safety
// reason as typography.ts.
export const radius = {
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  full: "9999px",
} as const;

export type RadiusToken = typeof radius;
