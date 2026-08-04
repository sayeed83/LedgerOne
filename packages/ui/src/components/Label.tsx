import type { LabelHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, required, className, ...rest }: LabelProps) {
  return (
    <label className={cn("text-sm font-medium text-gray-700 dark:text-ink", className)} {...rest}>
      {children}
      {required && <span className="ml-0.5 text-danger-500">*</span>}
    </label>
  );
}
