import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ledgerone/ui";

export interface QuickAction {
  label: string;
  href: string;
  icon: ReactNode;
}

export interface QuickActionsPanelProps {
  actions: QuickAction[];
}

// dumb/presentational (CMP-002) — every action is a plain navigation link
// to a module screen, never a submit/mutation handler; the target screens
// themselves are placeholders until their module's frontend ships.
export function QuickActionsPanel({ actions }: QuickActionsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 pt-0 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-surface-border px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-primary-500/40 hover:bg-white/[0.04]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
              {action.icon}
            </span>
            {action.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
