// 8px base spacing scale (08_FRONTEND_STANDARDS.md design-system
// guidance). Tailwind's own default scale (0.25rem/4px steps) already
// covers this at every even step, so no Tailwind theme override is
// needed — this export exists for non-Tailwind contexts (inline styles,
// canvas/chart layout) that need the same scale as a plain JS value.
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

export type SpacingToken = typeof spacing;
