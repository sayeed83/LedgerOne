import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "../icons";
import { cn } from "../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

// Native `<select>` (A11Y-001/002 for free) with `appearance-none` +
// a supplementary chevron icon — the icon never carries meaning alone,
// since the browser's own dropdown affordance still exists via the
// element's native behavior.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, hint, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700 dark:text-ink">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
            defaultValue={rest.defaultValue ?? ""}
            className={cn(
              "w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-[15px] text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/[0.03] dark:text-ink",
              error
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30"
                : "border-gray-300 focus:border-primary-500 dark:border-surface-border dark:focus:border-primary-500",
              className,
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-ink-muted" />
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

Select.displayName = "Select";
