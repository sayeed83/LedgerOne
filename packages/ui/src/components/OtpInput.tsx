import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface OtpInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

// dumb/presentational (CMP-002). A single 6-digit field — no client-side
// reformatting/masking beyond restricting input to digits.
export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  ({ label, error, id, className = "", ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full rounded-xl border bg-surface-sunken px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.6em] text-ink shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
              : "border-surface-border focus:border-primary-500"
          } ${className}`}
          {...inputProps}
        />
        {error && (
          <p id={errorId} className="text-xs text-danger-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

OtpInput.displayName = "OtpInput";
