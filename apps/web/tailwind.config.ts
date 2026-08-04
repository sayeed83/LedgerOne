import type { Config } from "tailwindcss";
import ledgerOneUiPreset from "../../packages/ui/tailwind-preset";

const config: Config = {
  presets: [ledgerOneUiPreset],
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    // The design system ships as untranspiled source (transpilePackages in
    // next.config.js), so Tailwind's class scanner needs its files listed
    // explicitly too — otherwise classes used only inside @ledgerone/ui
    // components never make it into the generated CSS.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
