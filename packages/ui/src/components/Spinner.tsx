import { SpinnerIcon } from "../icons";
import { cn } from "../utils/cn";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

// A generic loading indicator, distinct from LoadingButton's inline
// spinner — for full-region loading states (LOAD-001).
export function Spinner({ size = "md", label = "Loading…", className }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite">
      <SpinnerIcon className={cn(SIZE_CLASSES[size], "text-primary-500", className)} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
