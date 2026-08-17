import type { ReactNode } from "react";
import { cn } from "@ledgerone/ui";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

// dumb/presentational (CMP-002) — the platform-standard page chrome
// (PAGE-001/PAGE-004): title + optional description on the left, page-level
// actions (New/Export/etc.) consistently placed on the right.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
