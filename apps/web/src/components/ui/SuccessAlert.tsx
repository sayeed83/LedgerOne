import { CheckCircleIcon } from "./icons";

export interface SuccessAlertProps {
  message: string | null | undefined;
}

// components/ui: dumb/presentational (CMP-002). A11Y-003: icon is
// supplementary to the green styling, never the sole carrier of meaning.
export function SuccessAlert({ message }: SuccessAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-3 text-sm text-success-700 dark:text-success-400"
    >
      <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
