"use client";

import { useId } from "react";
import { cn } from "../utils/cn";

export interface SwitchProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// No native HTML switch element — implemented as a `role="switch"` button
// (A11Y-001: fully keyboard-operable via native button semantics, Space/
// Enter toggle for free) rather than a `<div onClick>`.
export function Switch({ label, hint, checked, onChange, disabled, className }: SwitchProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <span className="flex flex-col">
        <span id={`${id}-label`} className="text-sm font-medium text-gray-700 dark:text-ink">
          {label}
        </span>
        {hint && (
          <span id={hintId} className="text-xs text-gray-500 dark:text-ink-muted">
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hintId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-primary-600" : "bg-gray-300 dark:bg-surface-border",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
