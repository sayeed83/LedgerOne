import type { ReactNode } from "react";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "../icons";
import { cn } from "../utils/cn";

export type AlertVariant = "error" | "success" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  message: ReactNode;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  { icon: typeof AlertTriangleIcon; className: string }
> = {
  error: {
    icon: AlertTriangleIcon,
    className: "border-danger-500/30 bg-danger-500/10 text-danger-700 dark:text-danger-400",
  },
  success: {
    icon: CheckCircleIcon,
    className: "border-success-500/30 bg-success-500/10 text-success-700 dark:text-success-400",
  },
  warning: {
    icon: AlertTriangleIcon,
    className: "border-warning-500/30 bg-warning-500/10 text-warning-700 dark:text-warning-400",
  },
  info: {
    icon: InfoIcon,
    className: "border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-400",
  },
};

// dumb/presentational (CMP-002). ERR-002: displays only a curated,
// human-readable message — never a raw server exception/stack. A11Y-003:
// the icon is supplementary to the color, never the sole carrier of
// meaning — the text always states the point.
export function Alert({ variant = "info", message }: AlertProps) {
  if (!message) {
    return null;
  }

  const { icon: Icon, className } = VARIANT_CONFIG[variant];
  const role = variant === "error" ? "alert" : "status";

  return (
    <div role={role} className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

// Thin, prop-compatible aliases so Authentication's existing call sites
// migrate by import path only (no redesign, no prop-shape change).
export function ErrorAlert({ message }: { message: ReactNode }) {
  return <Alert variant="error" message={message} />;
}

export function SuccessAlert({ message }: { message: ReactNode }) {
  return <Alert variant="success" message={message} />;
}
