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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
