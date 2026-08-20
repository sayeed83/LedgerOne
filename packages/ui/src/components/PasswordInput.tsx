"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "../icons";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
}

// dumb/presentational (CMP-002). The show/hide toggle is local UI state
// only — not server state, so it stays a plain useState without violating
// the shared-component data-fetching prohibition.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, id, className = "", ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink light:text-light-ink">
          {label}
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-ink-muted light:text-light-ink-muted"
            aria-hidden="true"
          >
            <LockIcon className="h-[18px] w-[18px]" />
          </span>
          <input
            ref={ref}
            id={inputId}
            type={isVisible ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
            className={`w-full rounded-xl border bg-surface-sunken light:bg-light-surface-sunken pl-11 pr-11 py-3 text-[15px] text-ink light:text-light-ink shadow-sm transition-colors placeholder:text-ink-faint light:placeholder:text-light-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-surface-border light:border-light-surface-border focus:border-primary-500"
            } ${className}`}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setIsVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted light:text-light-ink-muted transition-colors hover:text-ink light:hover:text-light-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {isVisible ? (
              <EyeOffIcon className="h-[18px] w-[18px]" />
            ) : (
              <EyeIcon className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-muted light:text-light-ink-muted">
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

PasswordInput.displayName = "PasswordInput";
