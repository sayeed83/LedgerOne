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
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-ink">
          {label}
        </label>
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-gray-400 dark:text-ink-muted"
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
            className={`w-full rounded-xl border bg-white pl-11 pr-11 py-3 text-[15px] text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.03] dark:text-ink dark:placeholder:text-ink-muted/70 ${
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-gray-300 focus:border-primary-500 dark:border-surface-border dark:focus:border-primary-500"
            } ${className}`}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setIsVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:text-ink-muted dark:hover:text-ink"
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

PasswordInput.displayName = "PasswordInput";
