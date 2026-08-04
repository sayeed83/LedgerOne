import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

// dumb/presentational (CMP-002) — props in, JSX out, no data-fetching, no
// dependency on any business module.
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, hint, icon, id, className = "", ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-ink">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-gray-400 dark:text-ink-muted"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.03] dark:text-ink dark:placeholder:text-ink-muted/70 ${
              icon ? "pl-11" : ""
            } ${
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-gray-300 focus:border-primary-500 dark:border-surface-border dark:focus:border-primary-500"
            } ${className}`}
            {...inputProps}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500 dark:text-ink-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
