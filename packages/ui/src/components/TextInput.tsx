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
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-muted"
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
            className={`w-full rounded-xl border bg-surface-sunken px-4 py-3 text-[15px] text-ink shadow-sm transition-colors placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
              icon ? "pl-11" : ""
            } ${
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-surface-border focus:border-primary-500"
            } ${className}`}
            {...inputProps}
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-danger-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
