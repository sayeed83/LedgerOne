// `card` is a real custom token (not a Tailwind default) — value carried
// over unchanged from the approved Authentication surface so adopting the
// shared preset doesn't shift its shadow.
export const shadows = {
  card: "0 1px 2px 0 rgb(0 0 0 / 0.4), 0 20px 40px -12px rgb(0 0 0 / 0.45)",
  dropdown: "0 4px 6px -1px rgb(0 0 0 / 0.3), 0 10px 20px -4px rgb(0 0 0 / 0.35)",
  dialog: "0 8px 16px -4px rgb(0 0 0 / 0.4), 0 24px 48px -8px rgb(0 0 0 / 0.5)",
} as const;

export type ShadowToken = typeof shadows;
