import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-white/[0.06] text-ink-muted",
  primary: "bg-primary-500/15 text-primary-400",
  success: "bg-success-500/15 text-success-400",
  warning: "bg-warning-500/15 text-warning-400",
  danger: "bg-danger-500/15 text-danger-400",
};

// dumb/presentational (CMP-002). Status conveyed by color AND text
// together, never color alone (A11Y-003) — the label is required content,
// not decoration.
export function Badge({ variant = "default", children, className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
