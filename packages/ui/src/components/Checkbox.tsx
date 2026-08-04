import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
}

// Native `<input type="checkbox">` styled via `accent-color` — keeps
// built-in keyboard/AT semantics (A11Y-001/002) instead of hand-rolling a
// custom widget.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="flex items-start gap-2.5">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-describedby={hintId}
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-border",
              className,
            )}
            {...rest}
          />
          <span className="text-sm text-gray-700 dark:text-ink">{label}</span>
        </label>
        {hint && (
          <p id={hintId} className="pl-6 text-xs text-gray-500 dark:text-ink-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
