import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { SpinnerIcon } from "../icons";
import { cn } from "../utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
  secondary:
    "border border-surface-border bg-surface-card text-ink shadow-sm hover:bg-white/[0.04]",
  ghost: "bg-transparent text-ink hover:bg-white/[0.06]",
  danger: "bg-danger-600 text-white shadow-sm hover:bg-danger-700",
};

// Sizes: `md` reproduces the pre-design-system LoadingButton's padding/type
// scale exactly (freeze-safety for Authentication, which uses the default).
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm gap-1.5",
  md: "px-4 py-3.5 text-[15px] gap-2",
  lg: "px-5 py-4 text-base gap-2.5",
};

// components/ui-equivalent: dumb/presentational (CMP-002).
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingLabel,
      leadingIcon,
      trailingIcon,
      children,
      disabled,
      className,
      ...buttonProps
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:cursor-not-allowed disabled:opacity-60",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...buttonProps}
      >
        {isLoading ? (
          <SpinnerIcon className="h-4 w-4" />
        ) : (
          leadingIcon && <span className="shrink-0">{leadingIcon}</span>
        )}
        {isLoading ? loadingLabel ?? children : children}
        {!isLoading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

// Thin, prop-compatible alias so Authentication's existing call sites
// migrate by changing only the import path (`@/components/ui/LoadingButton`
// → `@ledgerone/ui`), not the component API — no redesign risk.
export const LoadingButton = Button;
