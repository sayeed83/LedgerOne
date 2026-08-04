import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// components/ui: dumb/presentational (CMP-002) — rounded corners, soft
// border, subtle shadow; reusable anywhere a surfaced panel is needed.
export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface-card shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
