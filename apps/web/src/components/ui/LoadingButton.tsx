import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "./icons";

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

// components/ui: dumb/presentational (CMP-002).
export function LoadingButton({
  isLoading = false,
  loadingLabel,
  children,
  disabled,
  className = "",
  ...buttonProps
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...buttonProps}
    >
      {isLoading && <SpinnerIcon className="h-4 w-4" />}
      {isLoading ? loadingLabel ?? children : children}
    </button>
  );
}
