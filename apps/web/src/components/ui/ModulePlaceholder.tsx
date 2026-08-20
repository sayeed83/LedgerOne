import type { ReactNode } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@ledgerone/ui";

export interface ModulePlaceholderProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

// dumb/presentational (CMP-002) — shared across every not-yet-built
// module screen so each one renders a consistent "coming soon" state
// instead of twelve hand-rolled copies of the same markup. No data
// fetching, no dependency on a specific business module; each module's own
// `*Screen.tsx` supplies the copy (PAGE-003's empty-state requirement,
// applied here since there is no real content yet to be loading/erroring).
export function ModulePlaceholder({ icon, title, description }: ModulePlaceholderProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              {icon}
            </span>
          )}
          <CardTitle>{title}</CardTitle>
        </div>
        <Badge variant="default">Coming soon</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="max-w-2xl text-sm text-ink-muted light:text-light-ink-muted">{description}</p>
      </CardContent>
    </Card>
  );
}
