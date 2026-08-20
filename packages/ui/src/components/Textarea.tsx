import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, rows = 4, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink light:text-light-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "w-full resize-y rounded-xl border bg-surface-sunken light:bg-light-surface-sunken px-4 py-3 text-[15px] text-ink light:text-light-ink shadow-sm transition-colors placeholder:text-ink-faint light:placeholder:text-light-ink-faint focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
              : "border-surface-border light:border-light-surface-border focus:border-primary-500",
            className,
          )}
          {...rest}
        />
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

Textarea.displayName = "Textarea";
