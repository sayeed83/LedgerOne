import type { ReactNode } from "react";
import { Card, CardContent } from "@ledgerone/ui";

export interface DashboardCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
}

// dumb/presentational (CMP-002) — a single summary tile. `value` is a
// placeholder string, not a real aggregate — no module has a live count
// endpoint wired up yet (Do-Not-Do: no fabricated business data implied
// beyond what's visibly labelled as a placeholder).
export function DashboardCard({ label, value, hint, icon }: DashboardCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
