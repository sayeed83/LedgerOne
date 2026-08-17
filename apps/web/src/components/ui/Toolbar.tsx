import type { ReactNode } from "react";
import { cn } from "@ledgerone/ui";

export interface ToolbarProps {
  children?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

// dumb/presentational (CMP-002) — the platform-standard list-screen toolbar
// row: search/filter controls on the left, row-level actions on the right
// (PAGE-001). Composed above a `DataTable`, never fetches data itself.
export function Toolbar({ children, filters, actions, className }: ToolbarProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {children}
        {filters}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
