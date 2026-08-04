import type { Config } from "tailwindcss";

const config: Config = {
  // Class-based (not media-query-based) so the Authentication surface can
  // deliberately commit to the dark, branded look the design calls for,
  // independent of the visitor's OS preference — while shared components
  // (components/ui) keep their `dark:` variants ready (THEME-002) for
  // whenever a real light/dark toggle is built for the rest of the app.
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
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
        // Semantic surface/ink tokens (THEME-003) for the Authentication
        // module's committed-dark brand surface.
        surface: {
          DEFAULT: "#0f172a",
          card: "#111827",
          border: "#1f2937",
        },
        ink: {
          DEFAULT: "#f8fafc",
          muted: "#94a3b8",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.4), 0 20px 40px -12px rgb(0 0 0 / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
