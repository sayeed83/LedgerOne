import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "block" | "text" | "circle";
}

// LOAD-001/002: shape-matched skeleton loaders. Composable — a table row
// skeleton, card skeleton, etc. is built by combining these blocks in the
// consuming module, not by this package guessing every module's layout.
export function Skeleton({ variant = "block", className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-white/[0.06]",
        variant === "text" && "h-4 rounded",
        variant === "circle" && "aspect-square rounded-full",
        variant === "block" && "rounded-lg",
        className,
      )}
      {...rest}
    />
  );
}
