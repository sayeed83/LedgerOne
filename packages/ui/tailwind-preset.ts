import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { colors, shadows, typography } from "./src/tokens";

// Single source of truth for every consuming app's Tailwind theme
// (08_FRONTEND_STANDARDS.md THEME-001). `darkMode`/`content` are left for
// each app to set — a preset can't know an app's file layout.
//
// Every value below is either a brand-new semantic token (surface/ink,
// the `card` shadow) or verified byte-for-byte identical to Tailwind's own
// default (fontFamily aside — see typography.ts) — extending the theme
// with this preset never resizes/recolors a utility class already in use,
// which is what keeps adopting it a pure refactor for Authentication, not
// a redesign.
const ledgerOneUiPreset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      colors: {
        primary: colors.primary,
        danger: colors.danger,
        success: colors.success,
        warning: colors.warning,
        info: colors.info,
        surface: colors.surface,
        ink: colors.ink,
        "light-surface": colors.lightSurface,
        "light-ink": colors.lightInk,
      },
      boxShadow: {
        card: shadows.card,
        dropdown: shadows.dropdown,
        dialog: shadows.dialog,
      },
    },
  },
  plugins: [
    // Dark-first: components' unprefixed classes already render the dark
    // theme. This variant lets a component opt a class into a *different*
    // rule once wrapped in a `.light` ancestor — the mechanism light mode
    // needs later — without requiring every component to adopt it today.
    plugin(({ addVariant }) => {
      addVariant("light", ":is(.light &)");
    }),
  ],
};

export default ledgerOneUiPreset;
