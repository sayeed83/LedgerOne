import { AlertTriangleIcon } from "./icons";

export interface ErrorAlertProps {
  message: string | null | undefined;
}

// components/ui: dumb/presentational (CMP-002). ERR-002: displays only a
// curated, human-readable message — never a raw server exception/stack.
// A11Y-003: the icon is supplementary to the red styling, never the sole
// carrier of meaning — the text itself always states the problem.
export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-400"
    >
      <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
