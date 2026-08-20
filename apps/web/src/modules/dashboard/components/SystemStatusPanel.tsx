import { Badge, Card, CardContent, CardHeader, CardTitle, type BadgeVariant } from "@ledgerone/ui";

export interface SystemStatusItem {
  label: string;
  status: "operational" | "degraded" | "down";
}

export interface SystemStatusPanelProps {
  items: SystemStatusItem[];
}

const STATUS_VARIANT: Record<SystemStatusItem["status"], BadgeVariant> = {
  operational: "success",
  degraded: "warning",
  down: "danger",
};

const STATUS_LABEL: Record<SystemStatusItem["status"], string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

// dumb/presentational (CMP-002) — a static placeholder widget. No live
// health-check polling is wired up yet (that would be a real TanStack
// Query hook against a future monitoring endpoint); `items` is supplied
// by the caller as fixed, clearly-labelled placeholder data.
export function SystemStatusPanel({ items }: SystemStatusPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-ink light:text-light-ink">{item.label}</span>
            <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
