"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "ledgerone.theme";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// STATE-003: theme is cross-cutting client state via React Context, one of
// STATE-003's own listed examples. ADR-003: the app is dark-first — the
// `.light` class this applies (via applyTheme, shared with the
// anti-flash script in layout.tsx) is the override, not the default, so
// "dark" resolves to *no* class rather than a `.dark` one.
export const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolvesToLight(theme: Theme): boolean {
  if (theme === "light") return true;
  if (theme === "dark") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", resolvesToLight(theme));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy-init from localStorage; the inline script in layout.tsx already
  // applied the class before hydration, so this just needs to agree with
  // it rather than race it.
  const [theme, setThemeState] = useState<Theme>(
    () => (typeof window !== "undefined" && (window.localStorage.getItem(STORAGE_KEY) as Theme | null)) || "system",
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  // Keeps the resolved theme in sync if the OS-level preference changes
  // while "system" is selected (no re-render needed elsewhere — only the
  // <html> class changes).
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
