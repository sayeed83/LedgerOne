import { useId } from "react";
import { cn } from "../utils/cn";

export interface RadioOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

// Native `<input type="radio">` group — keeps built-in roving/keyboard
// semantics (A11Y-001) instead of a hand-rolled `role="radiogroup"`.
export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <fieldset className={cn("flex flex-col gap-2.5", className)} aria-describedby={errorId}>
      {label && (
        <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-ink">{label}</legend>
      )}
      {options.map((option) => {
        const optionId = `${groupId}-${option.value}`;
        return (
          <label key={option.value} htmlFor={optionId} className="flex items-start gap-2.5">
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 border-gray-300 accent-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-border"
            />
            <span className="flex flex-col">
              <span className="text-sm text-gray-700 dark:text-ink">{option.label}</span>
              {option.hint && (
                <span className="text-xs text-gray-500 dark:text-ink-muted">{option.hint}</span>
              )}
            </span>
          </label>
        );
      })}
      {error && (
        <p id={errorId} className="text-xs text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}
