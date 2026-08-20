import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// next/font ships as part of the already-installed `next` package — no new
// dependency — and self-hosts the font, so there's no external request.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LedgerOne",
  description: "LedgerOne — Cloud Native ERP SaaS",
};

// ADR-003: dark-first — `<html>` carries no class by default (dark), and
// the `light` class is the override. This inline script runs before
// Providers/ThemeProvider mount (theme.context.tsx shares its exact
// resolution logic) so the first paint already has the right class instead
// of flashing dark before hydration corrects it.
const ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("ledgerone.theme");
    var isLight = theme === "light" || (theme !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches);
    if (isLight) document.documentElement.classList.add("light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="bg-surface font-sans text-ink antialiased light:bg-light-surface light:text-light-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
